import test from "node:test";
import assert from "node:assert/strict";
import { parseTaskTitle } from "../src/lib/tasks/types.ts";
import { isRecordId as isTaskId } from "../src/lib/shared/validation.ts";

test("rejects empty, whitespace-only, missing, and non-text titles", () => {
  for (const value of [null, "", "  ", "\t\n", "\u00a0", new File(["task"], "task.txt")]) {
    assert.equal(parseTaskTitle(value), null);
  }
});

test("trims input and enforces the same code-point length limit as Postgres", () => {
  assert.equal(parseTaskTitle("  A little task  "), "A little task");
  assert.equal(parseTaskTitle("a".repeat(200)), "a".repeat(200));
  assert.equal(parseTaskTitle("a".repeat(201)), null);
  assert.equal(parseTaskTitle("🌿".repeat(200)), "🌿".repeat(200));
  assert.equal(parseTaskTitle("🌿".repeat(201)), null);
});

test("accepts UUID references and rejects malformed or injected identifiers", () => {
  assert.equal(isTaskId("cf22172a-f871-43b3-a610-a838d8b7b001"), true);
  for (const value of [null, "", "not-a-task", "cf22172a-f871-43b3-a610-a838d8b7b001' or true", "../tasks"]) {
    assert.equal(isTaskId(value), false);
  }
});
