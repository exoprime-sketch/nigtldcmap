import { spawn } from "node:child_process";

// Keep every gate, but expose its output while it runs and bound the entire
// process tree (not just the npm/shell parent). No silent retries or skips.
export function runAuditCommand(command, { cwd, timeoutMs = 600_000, heartbeatMs = 30_000, onProgress = console.log } = {}) {
  const startedAt = Date.now();
  onProgress(JSON.stringify({ type: "command-start", command, timeoutMs, time: new Date().toISOString() }));
  return new Promise((resolve) => {
    const child = spawn(command, {
      cwd, shell: true, windowsHide: true,
      detached: process.platform !== "win32",
      stdio: ["ignore", "inherit", "inherit"],
    });
    let timedOut = false;
    let completed = false;
    const stopTree = () => {
      if (!child.pid) return;
      if (process.platform === "win32") {
        spawn("taskkill", ["/PID", String(child.pid), "/T", "/F"], { windowsHide: true, stdio: "ignore" });
      } else {
        try { process.kill(-child.pid, "SIGKILL"); } catch (error) {
          if (error.code !== "ESRCH") child.kill("SIGKILL");
        }
      }
    };
    const heartbeat = setInterval(() => onProgress(JSON.stringify({ type: "command-running", command, elapsedMs: Date.now() - startedAt })), heartbeatMs);
    const timer = setTimeout(() => { timedOut = true; stopTree(); }, timeoutMs);
    const finish = (status, signal, error) => {
      if (completed) return;
      completed = true;
      clearTimeout(timer);
      clearInterval(heartbeat);
      const result = { status: timedOut ? 124 : status, signal, timedOut, elapsedMs: Date.now() - startedAt, error: error || (timedOut ? new Error(`Command exceeded ${timeoutMs}ms: ${command}`) : null) };
      onProgress(JSON.stringify({ type: "command-end", command, exitCode: result.status, timedOut, elapsedMs: result.elapsedMs }));
      resolve(result);
    };
    child.once("error", (error) => finish(null, null, error));
    child.once("close", (status, signal) => finish(status, signal, null));
  });
}
