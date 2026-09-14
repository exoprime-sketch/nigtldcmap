import test from "node:test";
import assert from "node:assert/strict";
import { CdpConnection, waitForValue } from "../v125/browser-runtime.mjs";
import { runAuditCommand } from "./run-audit-command.mjs";

class Socket extends EventTarget {
  send(value) { this.last = JSON.parse(value); }
  reply(value) { this.dispatchEvent(new MessageEvent("message", { data: JSON.stringify(value) })); }
  close() { this.dispatchEvent(new Event("close")); }
}
test("unanswered CDP command rejects and removes pending request", async () => {
  const socket = new Socket(); const cdp = new CdpConnection(socket);
  await assert.rejects(cdp.send("Runtime.evaluate", {}, { timeoutMs: 20 }), /DevTools command timeout/);
  assert.equal(cdp.pending.size, 0);
  socket.reply({ id: 1, result: {} });
  cdp.close();
});
test("successful reply clears the timer", async () => {
  const socket = new Socket(); const cdp = new CdpConnection(socket);
  const response = cdp.send("Page.enable", {}, { timeoutMs: 20 });
  socket.reply({ id: socket.last.id, result: { ok: true } });
  assert.deepEqual(await response, { ok: true });
  assert.equal(cdp.pending.size, 0); cdp.close();
});
test("socket closure rejects outstanding commands", async () => {
  const socket = new Socket(); const cdp = new CdpConnection(socket);
  const response = cdp.send("Page.enable"); socket.close();
  await assert.rejects(response, /socket closed/); assert.equal(cdp.pending.size, 0);
});
test("condition deadline also bounds a stalled Runtime.evaluate", async () => {
  const socket = new Socket(); const cdp = new CdpConnection(socket);
  const start = Date.now();
  await assert.rejects(waitForValue(cdp, "true", { timeoutMs: 30, intervalMs: 1 }), /condition timeout/);
  assert.ok(Date.now() - start < 1000); cdp.close();
});
test("release command failure is not converted to success", async () => {
  const result = await runAuditCommand('node -e "process.exit(7)"', { onProgress() {} });
  assert.equal(result.status, 7);
});
test("release command watchdog stops a stalled process", async () => {
  const result = await runAuditCommand('node -e "setInterval(()=>{},1000)"', { timeoutMs: 250, onProgress() {} });
  assert.equal(result.status, 124); assert.equal(result.timedOut, true);
  assert.ok(result.elapsedMs < 5000);
});
