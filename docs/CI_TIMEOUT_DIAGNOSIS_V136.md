# CI #30: unbounded browser wait

## Evidence

- Run: https://github.com/exoprime-sketch/nigtldcmap/actions/runs/34795923296
- Commit: `4b8a078a0b2cc0549e73ba0aaf21f9e81044e29f`.
- Map layer distinction completed at 2026-09-14 01:29:13 UTC.
- Cancellation occurred at 04:26:44 UTC; cleanup explicitly terminated
  `npm run audit:glossary:v134` and its Chrome process.
- No subsequent gate completed. This is not evidence that the complete suite
  normally requires 180 minutes.
- Local reproduction of the glossary audit completed all 157 routes and all
  15 checks in approximately one minute. The original Chrome stall itself has
  not been reproduced; its exact renderer/route trigger remains unknown.

## Confirmed defect and fix

`waitForValue` checked a deadline only between awaited evaluations. The CDP
`send` promise had no timeout, so an unresponsive browser could suspend even
a nominal 25-second wait indefinitely. Browser shutdown could hang too.

- CDP requests have a 30-second default timeout, release pending entries, and
  reject on socket close/error. Condition polling uses its remaining deadline.
- Browser close has a 3-second bound. Startup HTTP and WebSocket waits are bounded.
- Glossary output identifies each route start/completion and stops on a dead
  browser rather than repeating the same timeout on all remaining routes.
- The release runner streams stdout/stderr immediately and prints a heartbeat
  every 30 seconds. Each command records elapsed time and timeout outcome in
  `reports/v136/ci-command-timings.json` after completion.
- A command watchdog terminates the npm/shell process tree: 10 minutes per
  audit, 15 minutes for the production build. Timeout is a failure (exit 124).
- The CI release step is bounded at 30 minutes and the complete job at 45,
  allowing room for installation, deployment-path tests and report uploads.
  These are protective ceilings, not target durations or promised runtimes.

## Wait-time assessment

The supplied history shows successful CI runs around 7-20 minutes. Treat this
as historical context, not a like-for-like benchmark: the current data is larger.
Compare the new timing artifact on the same SHA/runner class before declaring
a performance improvement. The local measurement is not a GitHub Linux timing.

Do not retry the same timed-out revision blindly or extend the timeout alone.
Read the named command, its latest route, stderr and timing artifact. Keep all
functional checks blocking. A PASS emitted by one audit is not a complete CI PASS.

## Parallelization and repeated work

Several audits revisit the same 152 pages but assert different properties.
They also read/write shared reports. Running these concurrently in a shared
directory risks stale reports and false passes; this fix deliberately retains
the existing sequence and assertions. Future sharding needs isolated build/report
directories and an aggregate gate that requires every shard. Use measured timing
to decide whether that complexity is justified.

The initial root build, subpath deployment test build, and final root artifact
build have distinct verification/output roles. They are not removed as an
unmeasured optimization. Screenshot capture remains outside the blocking suite.

## Regression tests

`node --test scripts/ci/browser-timeout.test.mjs` checks unanswered CDP requests,
timer cleanup, socket closure, polling deadlines, nonzero exit propagation and
process watchdog termination. It is included in `finalize:v136`.

No production data, map geometry, or acceptance assertions are removed.

## Local measurement (2026-09-14)

Windows / Node 22 / production browser audits: all original 38 release commands
passed, including the production build; the aggregate had 77 passing checks and
zero failures. Summed command time was 804,943 ms (13 minutes 25 seconds).
The six process-guard tests passed separately; the updated release command list
also runs them first (39 commands on the next CI run).

Longest commands: generic detail/720 selector states 98.2 s, public text 69.5 s,
duplicate copy 65.5 s, screen usability 62.9 s, and human-review audit 60.4 s.
The previously stuck glossary audit took 58.4 s. These measurements exclude
dependency installation and the later CI deployment/security/artifact stages.
They establish that three hours is not a necessary local release-suite duration;
GitHub runner duration must still be measured independently.

## CI #31: memory-intensive closed source tables

The first patched GitHub run (34807344417) failed instead of hanging indefinitely.
Build and guard tests passed. Entity-card coverage was 45/56; the first stalled
route was B-006, followed by timed-out navigation/evaluation commands. The audit
now logs route progress and reports route failures with browser stderr.

Inspection found that closed `details` tables still rendered every source row.
An actual Chrome probe on the prior build measured B-005 at 31,688 closed table
rows / 308,725 DOM nodes / about 1.37 GB JS heap. After navigation to B-006 the
same probe measured 32,608 closed rows / 317,497 nodes / about 2.04 GB JS heap.
This is concrete rendering/memory pressure, not merely a slow test assertion.
It does not prove the exact internal Chromium failure mechanism.

Tables over 500 rows now create rows only while expanded, with 200-row pages,
previous/next controls and direct page selection. Totals, source order, every
record and the existing safe downloads are preserved. Small tables keep their
existing complete representation. No data files are modified.

Chrome production probes after this change found B-005/B-006/B-007 closed DOM
sizes of 343/379/339 nodes, zero closed table rows, correct first-page counts,
correct final-page counts (88/8/170) and all 31,688/32,608/32,370 source rows
accounted for by the pagination. A unit test reconciles all 501 fixture rows
across the page boundary without duplicates or omissions.

The source pack shared by these elements expands to 446,713,428 bytes. Its
remaining parsing/memory cost should not be confused with the removed DOM cost;
browser memory readings fluctuate with garbage collection. No browser feature
is disabled to make the checks pass. A production large-table regression probe
is included as an additional release command.

The second complete local run used Chrome: 39 commands / 78 aggregate checks
passed in 644,102 ms (10 minutes 44 seconds). All 29 React unit tests passed.
The new large-table production probe passed separately and is also included in
the next CI command list (40 commands). The first local run used Edge, so the
two local durations are not a controlled browser-to-browser speed comparison.

## CI #35: isolate the public-text screen sweep

Run 34811051163 built successfully and passed the large-table probe, generated
data checks and preceding audits. `audit:public-text:v136` stopped after 45
recorded routes with `Runtime.evaluate` unanswered for 29,159 ms. The report
therefore correctly failed route coverage (45 instead of at least 157). This
is not an upload-artifact failure. E2E on the same commit passed 214 tests.

The public-text sweep now starts a fresh Chromium process for each detail
screen. This bounds retained renderer/decoded-pack state across visits without
relaxing timeouts, retrying failed routes, skipping data or changing the app.
It retains console/network errors across all processes and logs each route's
start, completion and duration. A failure identifies the active element.
Browser non-response is proven by the log; an OS-level OOM cause is not proven.
Fresh-process text coverage is not a substitute for E2E navigation tests, which
remain enabled separately.
