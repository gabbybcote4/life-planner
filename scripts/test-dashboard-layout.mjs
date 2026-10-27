import fs from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_LAYOUT, LEGACY_LAYOUT,addWorkspaceWidgets, parseLayout, parseLayoutRevision, moveWidget } from "../src/lib/dashboard/layout.ts";

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
  const before = JSON.stringify(LEGACY_LAYOUT);
  const moved = moveWidget(LEGACY_LAYOUT, "recent", -1);
  assert.deepEqual(moved.map((widget) => widget.id), ["overview", "capture", "recent", "progress"]);
  assert.deepEqual([...moved].sort((a, b) => a.id.localeCompare(b.id)), [...LEGACY_LAYOUT].sort((a, b) => a.id.localeCompare(b.id)));
  assert.equal(JSON.stringify(LEGACY_LAYOUT), before);
  assert.deepEqual(moveWidget(LEGACY_LAYOUT, "overview", -1), LEGACY_LAYOUT);
  assert.deepEqual(moveWidget(LEGACY_LAYOUT, "recent", 1), LEGACY_LAYOUT);
});

test("layout revision accepts zero only as the initial-row marker", () => {
  assert.equal(parseLayoutRevision("0"), 0);
  assert.equal(parseLayoutRevision("12"), 12);
  for (const value of [null, "", "-1", "01", "1.2", "1x", "1000000000"]) assert.equal(parseLayoutRevision(value), null);
});


test("legacy layouts stay unchanged and new defaults contain all seven identities",()=>{
 assert.deepEqual(parseLayout(LEGACY_LAYOUT),LEGACY_LAYOUT);
 assert.equal(DEFAULT_LAYOUT.length,7);
 assert.equal(new Set(DEFAULT_LAYOUT.map(widget=>widget.id)).size,7);
 for(const id of ["spaces","calendar","connections"])for(const width of ["half","full"])assert.deepEqual(parseLayout([{id,width}]),[{id,width}]);
});
test("adding workspace widgets preserves existing order and width without duplicates",()=>{
 const saved=[{id:"calendar",width:"full"},{id:"recent",width:"half"}];const before=JSON.stringify(saved);
 const next=addWorkspaceWidgets(saved);
 assert.deepEqual(next,[...saved,{id:"spaces",width:"full"},{id:"connections",width:"full"}]);
 assert.equal(JSON.stringify(saved),before);assert.deepEqual(addWorkspaceWidgets(next),next);
});
test("workspace maps and calendars can be moved while preserving saved sizes",()=>{
 const layout=[{id:"spaces",width:"half"},{id:"calendar",width:"full"},{id:"connections",width:"half"}];
 assert.deepEqual(moveWidget(layout,"connections",-1),[layout[0],layout[2],layout[1]]);
 assert.deepEqual(parseLayout(layout),layout);
});

test("database default and widget allowlist match the app without rewriting saved layouts",()=>{
 const sql=fs.readFileSync(new URL("../supabase/migrations/20261027001100_workspace_widgets.sql",import.meta.url),"utf8");
 const match=sql.match(/set default '([^']+)'::jsonb/);
 assert.deepEqual(JSON.parse(match[1]),DEFAULT_LAYOUT);
 assert.doesNotMatch(sql,/update public\.dashboard_layouts/i);
 for(const widget of DEFAULT_LAYOUT)assert.ok(sql.includes("'"+widget.id+"'"));
});
