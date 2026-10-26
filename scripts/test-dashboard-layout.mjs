import test from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_LAYOUT, parseLayout, parseLayoutRevision, moveWidget } from "../src/lib/dashboard/layout.ts";

test("layouts support the default, subsets, an empty dashboard, and both widths", () => {
  assert.deepEqual(parseLayout(DEFAULT_LAYOUT), DEFAULT_LAYOUT);
  assert.deepEqual(parseLayout([]), []);
  assert.deepEqual(parseLayout([{ id: "recent", width: "half" }, { id: "capture", width: "full" }]),
    [{ id: "recent", width: "half" }, { id: "capture", width: "full" }]);
});

test("layout validation rejects unknown/duplicate widgets and extra stored content", () => {
  for (const value of [null, {}, "[]", [null], [[]], [{ id: "overview" }],
    [{ id: "overview", width: "giant" }], [{ id: "constructor", width: "full" }],
    [{ id: "overview", width: "full", body: "Do not store task data here" }],
    [{ id: "recent", width: "full" }, { id: "recent", width: "half" }],
    [...DEFAULT_LAYOUT, { id: "overview", width: "half" }]]) assert.equal(parseLayout(value), null);
});

test("moving widgets preserves identity/size and never mutates the saved array", () => {
  const before = JSON.stringify(DEFAULT_LAYOUT);
  const moved = moveWidget(DEFAULT_LAYOUT, "recent", -1);
  assert.deepEqual(moved.map((widget) => widget.id), ["overview", "capture", "recent", "progress"]);
  assert.deepEqual([...moved].sort((a, b) => a.id.localeCompare(b.id)), [...DEFAULT_LAYOUT].sort((a, b) => a.id.localeCompare(b.id)));
  assert.equal(JSON.stringify(DEFAULT_LAYOUT), before);
  assert.deepEqual(moveWidget(DEFAULT_LAYOUT, "overview", -1), DEFAULT_LAYOUT);
  assert.deepEqual(moveWidget(DEFAULT_LAYOUT, "recent", 1), DEFAULT_LAYOUT);
});

test("layout revision accepts zero only as the initial-row marker", () => {
  assert.equal(parseLayoutRevision("0"), 0);
  assert.equal(parseLayoutRevision("12"), 12);
  for (const value of [null, "", "-1", "01", "1.2", "1x", "1000000000"]) assert.equal(parseLayoutRevision(value), null);
});
