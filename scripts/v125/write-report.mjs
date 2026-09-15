import { writeFileSync } from "node:fs";

/**
 * Write a report file, retrying a transient lock.
 *
 * Every audit ends by writing its own JSON or CSV under reports/. On Windows
 * that write intermittently throws `UNKNOWN` (errno -4094) or EBUSY/EPERM when
 * a scanner or sync client holds the file it is replacing. The audit has
 * already finished by then: map-focus:v133 passed all thirteen of its checks
 * and still exited 1, which the release gate reported as a failing content
 * audit and a remaining blocker.
 *
 * Retrying a handful of times over a few hundred milliseconds clears it. This
 * changes no audit's verdict - a write that keeps failing still throws, and a
 * failing check still fails.
 */
const TRANSIENT = new Set(["UNKNOWN", "EBUSY", "EPERM", "EACCES"]);

/** Roughly 15s of waiting, spread over widening gaps. */
const BACKOFF_MS = [50, 100, 200, 400, 800, 1200, 1600, 2000, 2000, 2000, 2000, 2000];

export function writeReportFileV138(path, contents) {
  for (let attempt = 0; ; attempt += 1) {
    try {
      writeFileSync(path, contents, "utf8");
      return;
    } catch (error) {
      if (attempt >= BACKOFF_MS.length || !TRANSIENT.has(error?.code)) throw error;
      // Synchronous: these helpers are called from synchronous audit teardown.
      Atomics.wait(
        new Int32Array(new SharedArrayBuffer(4)),
        0,
        0,
        BACKOFF_MS[attempt]
      );
    }
  }
}
