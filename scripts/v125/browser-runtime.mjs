import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { extname, join, relative, resolve } from "node:path";

const MIME_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".csv": "text/csv; charset=utf-8",
  ".geojson": "application/geo+json; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".webp": "image/webp",
};

function isInside(root, target) {
  const relation = relative(root, target);
  return relation === "" || (!relation.startsWith("..") && !resolve(relation).startsWith("\\"));
}

function normalizedBasePath(value) {
  const trimmed = String(value || "").trim();
  if (!trimmed || trimmed === "/") return "";
  return `/${trimmed.replace(/^\/+|\/+$/gu, "")}`;
}

export async function startStaticBuildServer(buildRoot, options = {}) {
  const safeRoot = resolve(buildRoot);
  const indexPath = resolve(safeRoot, "index.html");
  const basePath = normalizedBasePath(options.basePath);
  if (!existsSync(indexPath)) throw new Error(`production build missing: ${indexPath}`);

  const server = createServer((request, response) => {
    try {
      const requestUrl = new URL(request.url || "/", "http://127.0.0.1");
      let publicPath = decodeURIComponent(requestUrl.pathname);
      if (basePath) {
        if (publicPath === basePath) publicPath = `${basePath}/`;
        if (!publicPath.startsWith(`${basePath}/`)) {
          response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
          response.end("Not Found");
          return;
        }
        publicPath = publicPath.slice(basePath.length);
      }
      const decodedPath = publicPath.replace(/^\/+/, "");
      const candidate = resolve(safeRoot, decodedPath || "index.html");
      let filePath = candidate;
      if (!isInside(safeRoot, candidate)) {
        response.writeHead(403, { "content-type": "text/plain; charset=utf-8" });
        response.end("Forbidden");
        return;
      }
      if (!existsSync(filePath) || !statSync(filePath).isFile()) filePath = indexPath;
      const contentType = MIME_TYPES[extname(filePath).toLowerCase()] || "application/octet-stream";
      const body = readFileSync(filePath);
      response.writeHead(200, {
        "content-type": contentType,
        "cache-control": "no-store",
        "x-content-type-options": "nosniff",
      });
      response.end(body);
    } catch (error) {
      if (response.headersSent) {
        response.destroy();
        return;
      }
      response.writeHead(500, { "content-type": "text/plain; charset=utf-8" });
      response.end(error instanceof Error ? error.message : String(error));
    }
  });
  await new Promise((resolveListen, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolveListen);
  });
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("static server address unavailable");
  return {
    url: `http://127.0.0.1:${address.port}${basePath}`,
    origin: `http://127.0.0.1:${address.port}`,
    basePath,
    close: () => new Promise((resolveClose) => server.close(resolveClose)),
  };
}

async function reservePort() {
  const server = createServer();
  await new Promise((resolveListen, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolveListen);
  });
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("port unavailable");
  const port = address.port;
  await new Promise((resolveClose) => server.close(resolveClose));
  return port;
}

async function pollJson(url, timeoutMs = 15_000) {
  const deadline = Date.now() + timeoutMs;
  let lastError = null;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url, { cache: "no-store" });
      if (response.ok) return await response.json();
      lastError = new Error(`HTTP ${response.status}`);
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolveWait) => setTimeout(resolveWait, 100));
  }
  throw new Error(
    `DevTools endpoint timeout: ${lastError instanceof Error ? lastError.message : lastError}`
  );
}

class CdpConnection {
  constructor(socket) {
    this.socket = socket;
    this.nextId = 1;
    this.pending = new Map();
    this.listeners = new Map();
    socket.addEventListener("message", (event) => {
      const message = JSON.parse(String(event.data));
      if (message.id) {
        const pending = this.pending.get(message.id);
        if (!pending) return;
        this.pending.delete(message.id);
        if (message.error) pending.reject(new Error(message.error.message));
        else pending.resolve(message.result || {});
        return;
      }
      const listeners = this.listeners.get(message.method) || [];
      for (const listener of listeners) listener(message.params || {});
    });
    socket.addEventListener("close", () => {
      for (const pending of this.pending.values()) {
        pending.reject(new Error("DevTools socket closed"));
      }
      this.pending.clear();
    });
  }

  send(method, params = {}) {
    const id = this.nextId++;
    return new Promise((resolveCommand, reject) => {
      this.pending.set(id, { resolve: resolveCommand, reject });
      this.socket.send(JSON.stringify({ id, method, params }));
    });
  }

  on(method, listener) {
    const listeners = this.listeners.get(method) || [];
    listeners.push(listener);
    this.listeners.set(method, listeners);
  }

  close() {
    this.socket.close();
  }
}

function edgeExecutable() {
  const candidates = [
    process.env.V125_BROWSER_EXECUTABLE,
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
  ].filter(Boolean);
  return candidates.find((path) => existsSync(path)) || null;
}

export async function launchHeadlessBrowser() {
  const executable = edgeExecutable();
  if (!executable) throw new Error("Edge/Chrome executable not found");
  const port = await reservePort();
  const profileRoot = mkdtempSync(join(tmpdir(), "v125-browser-"));
  const browser = spawn(
    executable,
    [
      "--headless=new",
      "--disable-gpu",
      "--disable-extensions",
      "--disable-background-networking",
      "--no-first-run",
      "--no-default-browser-check",
      `--remote-debugging-port=${port}`,
      `--user-data-dir=${profileRoot}`,
      "--window-size=1440,1200",
      "about:blank",
    ],
    { stdio: ["ignore", "ignore", "pipe"], windowsHide: true }
  );
  let stderr = "";
  browser.stderr?.on("data", (chunk) => {
    stderr += String(chunk);
    if (stderr.length > 20_000) stderr = stderr.slice(-20_000);
  });
  try {
    const targets = await pollJson(`http://127.0.0.1:${port}/json/list`);
    const target = targets.find((item) => item.type === "page" && item.webSocketDebuggerUrl);
    if (!target) throw new Error("page DevTools target missing");
    const socket = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise((resolveOpen, reject) => {
      socket.addEventListener("open", resolveOpen, { once: true });
      socket.addEventListener("error", reject, { once: true });
    });
    const cdp = new CdpConnection(socket);
    const runtimeErrors = [];
    cdp.on("Runtime.exceptionThrown", (params) => {
      runtimeErrors.push({
        type: "exception",
        text:
          params.exceptionDetails?.exception?.description ||
          params.exceptionDetails?.text ||
          "Runtime exception",
      });
    });
    cdp.on("Log.entryAdded", (params) => {
      if (params.entry?.level === "error") {
        runtimeErrors.push({ type: "log", text: params.entry.text || "Console error" });
      }
    });
    cdp.on("Runtime.consoleAPICalled", (params) => {
      if (params.type === "error") {
        runtimeErrors.push({
          type: "console",
          text: (params.args || [])
            .map((argument) => argument.value ?? argument.description ?? "")
            .join(" "),
        });
      }
    });
    await Promise.all([
      cdp.send("Page.enable"),
      cdp.send("Runtime.enable"),
      cdp.send("Log.enable"),
    ]);

    // Opt-in reproduction of a slower CI runner. Several release audits have
    // failed only on GitHub because a wait was satisfied before the thing it
    // was really waiting for existed; throttling makes those windows wide
    // enough to observe locally. Unset by default, so normal runs are unchanged.
    const cpuThrottle = Number(process.env.V135_THROTTLE_CPU || 0);
    const netLatency = Number(process.env.V135_THROTTLE_LATENCY_MS || 0);
    if (cpuThrottle > 1) {
      await cdp.send("Emulation.setCPUThrottlingRate", { rate: cpuThrottle });
    }
    if (netLatency > 0) {
      await cdp.send("Network.enable");
      await cdp.send("Network.emulateNetworkConditions", {
        offline: false,
        latency: netLatency,
        downloadThroughput: (1.5 * 1024 * 1024) / 8,
        uploadThroughput: (750 * 1024) / 8,
      });
    }
    return {
      cdp,
      runtimeErrors,
      executable,
      async close() {
        try {
          await cdp.send("Browser.close");
        } catch {
          browser.kill();
        }
        cdp.close();
        if (!browser.killed) browser.kill();
        const safeTempRoot = resolve(tmpdir());
        const safeProfile = resolve(profileRoot);
        if (isInside(safeTempRoot, safeProfile) && safeProfile !== safeTempRoot) {
          try {
            rmSync(safeProfile, { recursive: true, force: true });
          } catch {
            // Browser shutdown can briefly retain profile locks; the OS temp cleanup handles it.
          }
        }
      },
      stderr: () => stderr,
    };
  } catch (error) {
    browser.kill();
    throw new Error(
      `${error instanceof Error ? error.message : String(error)}${stderr ? `; ${stderr.slice(-500)}` : ""}`
    );
  }
}

export async function evaluateValue(cdp, expression) {
  const result = await cdp.send("Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true,
    userGesture: true,
  });
  if (result.exceptionDetails) {
    throw new Error(
      result.exceptionDetails.exception?.description || result.exceptionDetails.text || "evaluation failed"
    );
  }
  return result.result?.value;
}

export async function waitForValue(cdp, expression, options = {}) {
  const timeoutMs = options.timeoutMs ?? 15_000;
  const intervalMs = options.intervalMs ?? 100;
  const deadline = Date.now() + timeoutMs;
  let lastValue;
  let lastError = null;
  while (Date.now() < deadline) {
    try {
      lastValue = await evaluateValue(cdp, expression);
      lastError = null;
      if (lastValue) return lastValue;
    } catch (error) {
      // A document swapping under us destroys the execution context. That is a
      // transient state on the way to the condition, not a verdict, so keep
      // polling and only report it if the deadline is reached.
      lastError = error instanceof Error ? error.message : String(error);
      lastValue = undefined;
    }
    await new Promise((resolveWait) => setTimeout(resolveWait, intervalMs));
  }
  throw new Error(
    `condition timeout; last value: ${JSON.stringify(lastValue)}${
      lastError ? `; last error: ${lastError}` : ""
    }`
  );
}

export async function setViewport(cdp, width, height = 1000) {
  await cdp.send("Emulation.setDeviceMetricsOverride", {
    width,
    height,
    deviceScaleFactor: 1,
    mobile: false,
  });
}

export async function navigate(cdp, url) {
  await cdp.send("Page.navigate", { url });
  await waitForValue(cdp, "document.readyState === 'complete'", { timeoutMs: 20_000 });
}

export async function captureElementPng(cdp, selector, path) {
  const rect = await evaluateValue(
    cdp,
    `(() => {
      const node = document.querySelector(${JSON.stringify(selector)});
      if (!node) return null;
      const rect = node.getBoundingClientRect();
      return {
        x: Math.max(0, rect.left + window.scrollX),
        y: Math.max(0, rect.top + window.scrollY),
        width: Math.max(1, rect.width),
        height: Math.max(1, rect.height)
      };
    })()`
  );
  if (!rect) throw new Error(`screenshot target missing: ${selector}`);
  const result = await cdp.send("Page.captureScreenshot", {
    format: "png",
    fromSurface: true,
    captureBeyondViewport: true,
    clip: { ...rect, scale: 1 },
  });
  mkdirSync(resolve(path, ".."), { recursive: true });
  const { writeFileSync } = await import("node:fs");
  writeFileSync(path, Buffer.from(result.data, "base64"));
  return rect;
}
