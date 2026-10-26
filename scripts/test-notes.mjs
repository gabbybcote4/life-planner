import test from "node:test";
import assert from "node:assert/strict";
import { parseNote, parseRevision, parseNotesPage } from "../src/lib/notes/types.ts";

test("notes require a bounded text title and preserve the body exactly", () => {
  const body = "  Line one\n\n<script>literal text</script>\n ";
  assert.deepEqual(parseNote("  A note  ", body), { title: "A note", body });
  assert.deepEqual(parseNote("Empty body is fine", ""), { title: "Empty body is fine", body: "" });
  for (const title of [null, "", "\n\t", "a".repeat(201), new File(["title"], "title.txt")]) assert.equal(parseNote(title, "body"), null);
  assert.equal(parseNote("Title", new File(["body"], "body.txt")), null);
});

test("note size limits count Unicode code points, matching Postgres", () => {
  assert.notEqual(parseNote("🌿".repeat(200), "🌿".repeat(20000)), null);
  assert.equal(parseNote("🌿".repeat(201), "body"), null);
  assert.equal(parseNote("Title", "🌿".repeat(20001)), null);
});

test("revisions and page selectors reject malformed, negative, or excessive values", () => {
  assert.equal(parseRevision("1"), 1);
  assert.equal(parseRevision("999999999"), 999999999);
  for (const value of [null, "0", "-1", "1.5", "1x", "1 OR true", "1000000000"]) assert.equal(parseRevision(value), null);
  assert.equal(parseNotesPage("2"), 2);
  for (const value of [undefined, ["2"], "0", "-1", "10000", "1e2"]) assert.equal(parseNotesPage(value), 1);
});
