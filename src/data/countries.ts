import { fetchWorldBankCountries } from "../services/worldBankApi";
import type { Country, CountryDataResult } from "../types/country";
import { publicAssetUrlV128 } from "../utils/publicAssetUrlV128";

export const FALLBACK_COUNTRIES: Country[] = [
  {
    iso2: "VN",
    iso3: "VNM",
    nameKo: "베트남",
    nameEn: "Viet Nam",
    regionCode: "EAS",
    region: "동아시아·태평양",
    incomeLevelCode: "LMC",
    incomeLevel: "중저소득",
    capitalCity: "Hanoi",
    longitude: 105.825,
    latitude: 21.0069,
  },
  {
    iso2: "ID",
    iso3: "IDN",
    nameKo: "인도네시아",
    nameEn: "Indonesia",
    regionCode: "EAS",
    region: "동아시아·태평양",
    incomeLevelCode: "UMC",
    incomeLevel: "중고소득",
    capitalCity: "Jakarta",
    longitude: 106.83,
    latitude: -6.19752,
  },
  {
    iso2: "PH",
    iso3: "PHL",
    nameKo: "필리핀",
    nameEn: "Philippines",
    regionCode: "EAS",
    region: "동아시아·태평양",
    incomeLevelCode: "LMC",
    incomeLevel: "중저소득",
    capitalCity: "Manila",
    longitude: 121.035,
    latitude: 14.5515,
  },
  {
    iso2: "KH",
    iso3: "KHM",
    nameKo: "캄보디아",
    nameEn: "Cambodia",
    regionCode: "EAS",
    region: "동아시아·태평양",
    incomeLevelCode: "LMC",
    incomeLevel: "중저소득",
    capitalCity: "Phnom Penh",
    longitude: 104.874,
    latitude: 11.5556,
  },
  {
    iso2: "LA",
    iso3: "LAO",
    nameKo: "라오스",
    nameEn: "Lao PDR",
    regionCode: "EAS",
    region: "동아시아·태평양",
    incomeLevelCode: "LMC",
    incomeLevel: "중저소득",
    capitalCity: "Vientiane",
    longitude: 102.177,
    latitude: 18.5826,
  },
  {
    iso2: "BD",
    iso3: "BGD",
    nameKo: "방글라데시",
    nameEn: "Bangladesh",
    regionCode: "SAS",
    region: "남아시아",
    incomeLevelCode: "LMC",
    incomeLevel: "중저소득",
    capitalCity: "Dhaka",
    longitude: 90.4113,
    latitude: 23.7055,
  },
  {
    iso2: "LK",
    iso3: "LKA",
    nameKo: "스리랑카",
    nameEn: "Sri Lanka",
    regionCode: "SAS",
    region: "남아시아",
    incomeLevelCode: "LMC",
    incomeLevel: "중저소득",
    capitalCity: "Colombo",
    longitude: 79.8612,
    latitude: 6.9271,
  },
  {
    iso2: "IN",
    iso3: "IND",
    nameKo: "인도",
    nameEn: "India",
    regionCode: "SAS",
    region: "남아시아",
    incomeLevelCode: "LMC",
    incomeLevel: "중저소득",
    capitalCity: "New Delhi",
    longitude: 77.209,
    latitude: 28.6139,
  },
  {
    iso2: "MY",
    iso3: "MYS",
    nameKo: "말레이시아",
    nameEn: "Malaysia",
    regionCode: "EAS",
    region: "동아시아·태평양",
    incomeLevelCode: "UMC",
    incomeLevel: "중고소득",
    capitalCity: "Kuala Lumpur",
    longitude: 101.6869,
    latitude: 3.139,
  },
  {
    iso2: "EG",
    iso3: "EGY",
    nameKo: "이집트",
    nameEn: "Egypt, Arab Rep.",
    regionCode: "MEA",
    region: "중동·북아프리카·아프가니스탄·파키스탄",
    incomeLevelCode: "LMC",
    incomeLevel: "중저소득",
    capitalCity: "Cairo",
    longitude: 31.2357,
    latitude: 30.0444,
  },
  {
    iso2: "MN",
    iso3: "MNG",
    nameKo: "몽골",
    nameEn: "Mongolia",
    regionCode: "EAS",
    region: "동아시아·태평양",
    incomeLevelCode: "UMC",
    incomeLevel: "중고소득",
    capitalCity: "Ulaanbaatar",
    longitude: 106.937,
    latitude: 47.9129,
  },
];

const REGION_NAMES_KO: Record<string, string> = {
  EAS: "동아시아·태평양",
  ECS: "유럽·중앙아시아",
  LCN: "중남미·카리브",
  MEA: "중동·북아프리카·아프가니스탄·파키스탄",
  NAC: "북미",
  SAS: "남아시아",
  SSF: "사하라 이남 아프리카",
};

const INCOME_NAMES_KO: Record<string, string> = {
  LIC: "저소득",
  LMC: "중저소득",
  UMC: "중고소득",
  HIC: "고소득",
  INX: "미분류",
};

interface CountrySnapshotFile {
  fetchedAt?: string;
  countries: Array<Omit<Country, "nameKo"> & { nameKo?: string }>;
}

function localizeCountryName(iso2: string, fallback: string): string {
  try {
    const displayNames = new Intl.DisplayNames(["ko"], { type: "region" });
    return displayNames.of(iso2) ?? fallback;
  } catch {
    return fallback;
  }
}

async function loadCountrySnapshot(): Promise<Country[] | null> {
  try {
    const response = await fetch(publicAssetUrlV128("data/worldbank/countries.json"), {
      headers: { Accept: "application/json" },
    });
    if (!response.ok) return null;
    const snapshot = (await response.json()) as CountrySnapshotFile;
    if (!Array.isArray(snapshot.countries)) return null;
    return snapshot.countries
      .map((country) => ({
        ...country,
        nameKo:
          country.nameKo || localizeCountryName(country.iso2, country.nameEn),
        region: REGION_NAMES_KO[country.regionCode] ?? country.region,
        incomeLevel:
          INCOME_NAMES_KO[country.incomeLevelCode] ?? country.incomeLevel,
      }))
      .sort((a, b) => a.nameKo.localeCompare(b.nameKo, "ko"));
  } catch {
    return null;
  }
}

export async function loadCountries(force = false): Promise<CountryDataResult> {
  try {
    const countries = await fetchWorldBankCountries(force);
    return { countries, isFallback: false };
  } catch {
    const snapshotCountries = await loadCountrySnapshot();
    if (snapshotCountries && snapshotCountries.length > 0) {
      return {
        countries: snapshotCountries,
        isFallback: true,
        warning:
          "국가 목록 원천 연결이 원활하지 않아 최근 저장된 국가 스냅샷을 표시합니다.",
      };
    }
    return {
      countries: FALLBACK_COUNTRIES,
      isFallback: true,
      warning:
        "국가 목록 원천 연결이 원활하지 않아 코드에 포함된 최소 국가 목록을 표시합니다.",
    };
  }
}
