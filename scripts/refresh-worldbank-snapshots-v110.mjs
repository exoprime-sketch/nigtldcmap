import fs from "node:fs";
import path from "node:path";
import https from "node:https";

const root = process.cwd();
const outDir = path.join(root, "public/data/worldbank");
const tempDir = path.join(outDir, ".v110-refresh-tmp");
const indicators = [
  ["population-total", "SP.POP.TOTL"],
  ["urbanization-share", "SP.URB.TOTL.IN.ZS"],
  ["population-growth", "SP.POP.GROW"],
  ["gdp-current", "NY.GDP.MKTP.CD"],
  ["gdp-growth", "NY.GDP.MKTP.KD.ZG"],
  ["gdp-per-capita", "NY.GDP.PCAP.CD"],
  ["electricity-access", "EG.ELC.ACCS.ZS"],
  ["clean-cooking-access", "EG.CFT.ACCS.ZS"],
  ["renewable-electricity-share", "EG.ELC.RNEW.ZS"],
  ["grid-losses", "EG.ELC.LOSS.ZS"],
  ["poverty-national", "SI.POV.NAHC"],
  ["poverty-extreme", "SI.POV.DDAY"],
  ["sector-agriculture-share", "NV.AGR.TOTL.ZS"],
  ["sector-industry-share", "NV.IND.TOTL.ZS"],
  ["sector-manufacturing-share", "NV.IND.MANF.ZS"],
  ["sector-services-share", "NV.SRV.TOTL.ZS"],
  ["unemployment-total", "SL.UEM.TOTL.ZS"],
  ["unemployment-youth", "SL.UEM.1524.ZS"],
  ["gini-index", "SI.POV.GINI"],
];

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getJsonOnce(url) {
  return new Promise((resolve, reject) => {
    const request = https.get(
      url,
      {
        headers: {
          Accept: "application/json",
          "User-Agent": "NIGT-LDC-platform-snapshot/1.0",
        },
      },
      (response) => {
        if (
          response.statusCode &&
          response.statusCode >= 300 &&
          response.statusCode < 400 &&
          response.headers.location
        ) {
          response.resume();
          resolve(
            getJsonOnce(new URL(response.headers.location, url).toString())
          );
          return;
        }
        if (response.statusCode !== 200) {
          response.resume();
          reject(new Error(`HTTP ${response.statusCode} ${url}`));
          return;
        }
        let body = "";
        response.setEncoding("utf8");
        response.on("data", (chunk) => {
          body += chunk;
        });
        response.on("end", () => {
          try {
            resolve(JSON.parse(body));
          } catch (error) {
            reject(error);
          }
        });
      }
    );
    request.setTimeout(30000, () =>
      request.destroy(new Error("World Bank API timeout"))
    );
    request.on("error", reject);
  });
}

async function getJsonWithRetry(url, attempts = 3) {
  let lastError = null;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await getJsonOnce(url);
    } catch (error) {
      lastError = error;
      if (attempt < attempts) await sleep(800 * attempt);
    }
  }
  throw lastError ?? new Error(`World Bank API 요청 실패: ${url}`);
}

fs.mkdirSync(outDir, { recursive: true });
fs.rmSync(tempDir, { recursive: true, force: true });
fs.mkdirSync(tempDir, { recursive: true });

const fetchedAt = new Date().toISOString();
const manifest = {
  schemaVersion: "v110",
  fetchedAt,
  source: "World Bank Indicators API V2",
  indicatorCount: indicators.length,
  snapshots: [],
};

try {
  for (const [indicatorId, worldBankCode] of indicators) {
    const url = `https://api.worldbank.org/v2/country/all/indicator/${encodeURIComponent(
      worldBankCode
    )}?format=json&per_page=20000&mrv=10`;
    process.stdout.write(`refresh ${indicatorId} (${worldBankCode}) ... `);

    const response = await getJsonWithRetry(url);
    const metadata = Array.isArray(response) ? response[0] ?? {} : {};
    const records = Array.isArray(response) ? response[1] ?? [] : [];
    const observations = records
      .filter(
        (item) =>
          typeof item?.countryiso3code === "string" &&
          item.countryiso3code.length === 3 &&
          typeof item.value === "number" &&
          Number.isFinite(item.value)
      )
      .map((item) => ({
        indicatorId,
        iso3: item.countryiso3code,
        year: Number(item.date),
        value: item.value,
      }))
      .filter((item) => Number.isFinite(item.year));

    if (observations.length === 0) {
      throw new Error(`${indicatorId}: observation 0건`);
    }

    const payload = {
      schemaVersion: "v110",
      indicatorId,
      worldBankCode,
      fetchedAt,
      lastUpdated: metadata.lastupdated ?? null,
      sourceUrl: url,
      observations,
    };

    fs.writeFileSync(
      path.join(tempDir, `${indicatorId}.json`),
      `${JSON.stringify(payload, null, 2)}\n`,
      "utf8"
    );
    manifest.snapshots.push({
      indicatorId,
      worldBankCode,
      file: `/data/worldbank/${indicatorId}.json`,
      observations: observations.length,
      lastUpdated: payload.lastUpdated,
    });
    console.log(`${observations.length} rows`);
  }

  fs.writeFileSync(
    path.join(tempDir, "snapshot-manifest-v110.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
    "utf8"
  );

  // 모든 19개 요청이 성공한 뒤에만 기존 검증본을 교체한다.
  for (const [indicatorId] of indicators) {
    fs.renameSync(
      path.join(tempDir, `${indicatorId}.json`),
      path.join(outDir, `${indicatorId}.json`)
    );
  }
  fs.renameSync(
    path.join(tempDir, "snapshot-manifest-v110.json"),
    path.join(outDir, "snapshot-manifest-v110.json")
  );
  fs.rmSync(tempDir, { recursive: true, force: true });
  console.log(
    `WORLD_BANK_SNAPSHOTS_READY ${manifest.snapshots.length}/${indicators.length}`
  );
} catch (error) {
  fs.rmSync(tempDir, { recursive: true, force: true });
  console.error(
    "WORLD_BANK_SNAPSHOT_REFRESH_FAILED · 기존 snapshot은 변경하지 않았습니다"
  );
  throw error;
}
