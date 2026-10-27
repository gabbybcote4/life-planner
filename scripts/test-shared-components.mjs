import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { createRequire } from "node:module";
import ts from "typescript";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { PLANNER_ROUTES } from "../src/lib/navigation.ts";

const require = createRequire(import.meta.url);
// Compile the actual dependency-free TSX primitives with the already-installed
// TypeScript package. No component implementation is copied into these tests.
require.extensions[".tsx"] = (module, filename) => {
  const output = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText;
  module._compile(output, filename);
};
const { Button } = require("../src/components/ui/button.tsx");
const { TextInput, TextArea, Select } = require("../src/components/ui/fields.tsx");
const { FormFeedback } = require("../src/components/ui/feedback.tsx");
const { EmptyState } = require("../src/components/ui/empty-state.tsx");
const render = (component, props) => renderToStaticMarkup(React.createElement(component, props));

test("shared buttons default to non-submit and pending buttons disable submission", () => {
  const normal = render(Button, { children: "Cancel", variant: "text" });
  assert.match(normal, /type="button"/);
  assert.doesNotMatch(normal, /disabled=/);
  const pending = render(Button, { type: "submit", variant: "primary", pending: true, pendingLabel: "Saving note...", children: "Save note" });
  assert.match(pending, /type="submit"/);
  assert.match(pending, /disabled=""/);
  assert.match(pending, /aria-busy="true"/);
  assert.match(pending, /Saving note\.\.\./);
  assert.doesNotMatch(pending, />Save note</);
});

test("shared inputs forward validation, read-only, labeling, and escaped text", () => {
  const input = render(TextInput, { id: "title", name: "title", required: true, readOnly: true,
    maxLength: 200, value: '<script>literal</script>', "aria-describedby": "hint" });
  assert.match(input, /id="title"/);
  assert.match(input, /name="title"/);
  assert.match(input, /required=""/);
  assert.match(input, /readOnly=""/i);
  assert.match(input, /maxLength="200"/i);
  assert.match(input, /aria-describedby="hint"/);
  assert.match(input, /&lt;script&gt;/);
  const area = render(TextArea, { name: "body", readOnly: true, value: "Line one\n<script>literal</script>" });
  assert.match(area, /Line one\n/);
  assert.match(area, /&lt;script&gt;/);
  assert.doesNotMatch(area, /<script>/);
});

test("feedback announces pending or errors without a stale success message", () => {
  const pending = render(FormFeedback, { pending: true, error: "Old error", message: "Saved" });
  assert.match(pending, /aria-live="polite"/);
  assert.match(pending, /Saving\.\.\./);
  assert.doesNotMatch(pending, /Old error|Saved/);
  const failure = render(FormFeedback, { error: "Save failed", message: "Saved" });
  assert.match(failure, /role="alert"/);
  assert.match(failure, /Save failed/);
  assert.doesNotMatch(failure, />Saved</);
});

test("empty-state content remains escaped reusable text", () => {
  const html = render(EmptyState, { title: "No tasks", children: "<script>literal</script>" });
  assert.match(html, /No tasks/);
  assert.match(html, /&lt;script&gt;/);
  assert.doesNotMatch(html, /<script>/);
});

const loadAccount = (createClient) => {
  const source = fs.readFileSync(new URL("../src/lib/auth/account.ts", import.meta.url), "utf8");
  const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const testModule = { exports: {} };
  const localRequire = (id) => {
    if (id === "@/lib/supabase/server") return { createClient };
    if (id === "next/navigation") return { redirect: (path) => { throw Object.assign(new Error("redirect"), { path }); } };
    throw new Error(`Unexpected account helper dependency: ${id}`);
  };
  new Function("require", "module", "exports", output)(localRequire, testModule, testModule.exports);
  return testModule.exports;
};

test("account context uses verified claims separately for each request", async () => {
  let calls = 0;
  const accounts = ["account-a", "account-b"];
  const clients = [];
  const helper = loadAccount(async () => {
    const id = accounts[calls++];
    const client = { auth: {
      getClaims: async () => ({ data: { claims: { sub: id, email: `${id}@example.invalid` } }, error: null }),
      getSession: () => { throw new Error("Unverified session access"); },
    } };
    clients.push(client);
    return client;
  });
  const first = await helper.getAccountContext();
  const second = await helper.getAccountContext();
  assert.equal(first.userId, "account-a");
  assert.equal(second.userId, "account-b");
  assert.equal(first.supabase, clients[0]);
  assert.equal(second.supabase, clients[1]);
  assert.equal(calls, 2);
});

test("invalid or missing verified identity cannot produce an account context", async () => {
  for (const result of [
    { data: { claims: { sub: "untrusted" } }, error: { message: "invalid signature" } },
    { data: null, error: null }, { data: { claims: {} }, error: null },
    { data: { claims: { sub: 12 } }, error: null },
  ]) {
    const helper = loadAccount(async () => ({ auth: { getClaims: async () => result } }));
    assert.equal(await helper.getAccountContext(), null);
    await assert.rejects(helper.requireAccount(), (error) => error.path === "/login");
  }
});

test("navigation is unique and each planner route has static proxy coverage", () => {
  assert.equal(new Set(PLANNER_ROUTES.map((route) => route.id)).size, PLANNER_ROUTES.length);
  assert.equal(new Set(PLANNER_ROUTES.map((route) => route.href)).size, PLANNER_ROUTES.length);
  const proxy = fs.readFileSync(new URL("../src/proxy.ts", import.meta.url), "utf8");
  for (const route of PLANNER_ROUTES) assert.ok(proxy.includes(JSON.stringify(route.href)), `Missing proxy matcher: ${route.href}`);
});

test("shared dropdown preserves native selection, labels, disabled state, and escaped options", () => {
  const html = render(Select, { id: "appearance", name: "appearance", value: "grid", disabled: true,
    "aria-describedby": "hint", className: "custom-select", onChange() {},
    children: [React.createElement("option", { key: "dots", value: "dots" }, "Dots"),
      React.createElement("option", { key: "grid", value: "grid" }, "<Grid>")] });
  assert.match(html, /class="form-control custom-select"/);
  assert.match(html, /name="appearance"/);
  assert.match(html, /aria-describedby="hint"/);
  assert.match(html, /disabled=""/);
  assert.match(html, /value="grid" selected=""/);
  assert.match(html, /&lt;Grid&gt;/);
});
