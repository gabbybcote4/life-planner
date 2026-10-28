import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
import {createRequire} from "node:module";
import React from "react";
import {renderToStaticMarkup} from "react-dom/server";
const require=createRequire(import.meta.url);
function load(path,deps={}){const code=ts.transpileModule(fs.readFileSync(new URL(path,import.meta.url),"utf8"),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText,m={exports:{}};new Function("require","exports",code)(name=>Object.hasOwn(deps,name)?deps[name]:require(name),m.exports);return m.exports;}
const display=load("../src/lib/themes/display.ts");
function form(values={}){const f=new FormData();for(const[k,v]of Object.entries({group:"text",revision:"1",font_preset:"system",text_size:"16",...values}))f.set(k,v);return f;}
function harness(responses=[{data:{text_revision:2}}],signed=true){const queue=[...responses],calls=[],invalidations=[];const client={from(table){calls.push(["from",table]);return {update(v){calls.push(["update",v]);return this;},insert(v){calls.push(["insert",v]);return this;},eq(...v){calls.push(["eq",...v]);return this;},select(v){calls.push(["select",v]);return this;},maybeSingle:async()=>queue.shift(),single:async()=>queue.shift()};}};return {...load("../src/app/settings/display-actions.ts",{"@/lib/themes/display":display,"@/lib/auth/account":{getAccountContext:async()=>signed?{userId:"verified",supabase:client}:null},"next/cache":{revalidatePath:(...v)=>invalidations.push(v)}}),calls,invalidations};}
test("display options validate exact font, size, zoom and boolean allowlists",()=>{
 assert.ok(display.validDisplay(display.DEFAULT_DISPLAY));
 for(const value of [{...display.DEFAULT_DISPLAY,font_preset:"constructor"},{...display.DEFAULT_DISPLAY,text_size:9},{...display.DEFAULT_DISPLAY,app_zoom:500},{...display.DEFAULT_DISPLAY,reduce_motion:"true"}])assert.equal(display.validDisplay(value),false);
 for(const values of [{font_preset:"url(evil)"},{text_size:"16.0"},{group:"unknown"},{revision:"01"},{group:"zoom",app_zoom:"500"},{group:"accessibility",reduce_motion:"true"}])assert.equal(display.parseDisplayForm(form(values)),null);
 assert.equal(display.parseDisplayForm(form({group:"zoom",app_zoom:"125"})).values.app_zoom,125);
 assert.ok(display.displayVariables(display.DEFAULT_DISPLAY)["--font-desktop-ui"].includes("Tahoma"));
});
test("display writes only its own group with verified owner and independent revision",async()=>{
 const h=harness();assert.equal((await h.saveDisplay({},form({user_id:"foreign"}))).revision,2);assert.deepEqual(h.calls.find(c=>c[0]==="update")[1],{font_preset:"system",text_size:16});assert.ok(h.calls.some(c=>c[0]==="eq"&&c[1]==="user_id"&&c[2]==="verified"));assert.ok(h.calls.some(c=>c[0]==="eq"&&c[1]==="text_revision"&&c[2]===1));assert.deepEqual(h.invalidations,[["/","layout"]]);
 const z=harness([{data:{zoom_revision:3}}]);assert.equal((await z.saveDisplay({},form({group:"zoom",app_zoom:"110"}))).revision,3);assert.deepEqual(z.calls.find(c=>c[0]==="update")[1],{app_zoom:110});
 const a=harness([{data:{accessibility_revision:2}}]);assert.equal((await a.saveDisplay({},form({group:"accessibility",reduce_motion:"true",strong_focus:"false",simple_background:"true"}))).revision,2);assert.deepEqual(a.calls.find(c=>c[0]==="update")[1],{reduce_motion:true,strong_focus:false,simple_background:true});
});
test("invalid/session/conflict/unconfirmed saves never claim success",async()=>{
 const anon=harness([],false);assert.ok((await anon.saveDisplay({},form())).error);assert.equal(anon.calls.length,0);
 const invalid=harness();assert.ok((await invalid.saveDisplay({},form({group:"anything"}))).error);assert.equal(invalid.calls.length,0);
 for(const results of [[{error:{}}],[{data:null},{data:{text_revision:3}}],[{data:{text_revision:0}}],[{data:{}}]]){const h=harness(results);assert.ok((await h.saveDisplay({},form())).error);assert.equal(h.invalidations.length,0);}
});
test("first save and insert races retain narrow group ownership",async()=>{
 const h=harness([{data:null},{data:null},{data:{text_revision:2}}]);assert.equal((await h.saveDisplay({},form())).revision,2);assert.deepEqual(h.calls.find(c=>c[0]==="insert")[1],{user_id:"verified",font_preset:"system",text_size:16});
 const race=harness([{data:null},{data:null},{error:{code:"23505"}},{data:{text_revision:2}}]);assert.equal((await race.saveDisplay({},form())).revision,2);assert.equal(race.calls.filter(c=>c[0]==="update").length,2);
});
test("settings tabs expose six labeled panels and keep draft content mounted",()=>{
 const {SettingsTabs}=load("../src/app/settings/settings-tabs.tsx");const panels=Object.fromEntries(["appearance","workspace","accessibility","account","privacy","about"].map(k=>[k,React.createElement("input",{defaultValue:"Draft "+k})]));const html=renderToStaticMarkup(React.createElement(SettingsTabs,{panels}));assert.equal((html.match(/role="tab"/g)||[]).length,6);assert.equal((html.match(/role="tabpanel"/g)||[]).length,6);assert.equal((html.match(/ hidden=""/g)||[]).length,5);assert.match(html,/aria-selected="true"/);assert.match(html,/Draft accessibility/);assert.match(html,/Data &amp; privacy/);assert.match(html,/Workspace/);
});
test("display form previews but disables saving before setup and retains explicit save/cancel",()=>{
 const {DisplayPicker}=load("../src/app/settings/display-picker.tsx",{"@/components/ui/button":load("../src/components/ui/button.tsx"),"@/components/ui/fields":load("../src/components/ui/fields.tsx"),"@/components/ui/feedback":load("../src/components/ui/feedback.tsx"),"@/lib/shared/client-actions":{},"@/lib/themes/display":display,"./display-actions":{}});
 const html=renderToStaticMarkup(React.createElement(DisplayPicker,{group:"text",saved:display.DEFAULT_DISPLAY,revision:1,ready:false}));assert.match(html,/Apply the display settings setup/);assert.match(html,/Classic desktop/);assert.match(html,/Monospace/);assert.match(html,/18px/);assert.match(html,/Display preview/);assert.match(html,/Cancel changes/);assert.match(html,/disabled=""[^>]*>Save text settings/);
});
test("migration preserves existing RLS and uses independent narrow revision groups",()=>{
 const sql=fs.readFileSync(new URL("../supabase/migrations/20261028002500_display_preferences.sql",import.meta.url),"utf8");assert.doesNotMatch(sql,/create policy|security definer|update public\.planner_preferences|grant.*revision/i);assert.match(sql,/old.text_revision\+1/);assert.match(sql,/old.zoom_revision\+1/);assert.match(sql,/old.accessibility_revision\+1/);assert.match(sql,/app_zoom in \(90,100,110,125\)/);assert.match(sql,/font_preset in \('retro','system','rounded','mono'\)/);
});

test("font presets map reading, heading and chrome roles consistently without raw legacy overrides",()=>{
 for(const font of ["system","rounded","mono"]){const vars=display.displayVariables({...display.DEFAULT_DISPLAY,font_preset:font});assert.equal(vars["--font-desktop-ui"],display.FONT_STACKS[font].ui);assert.equal(vars["--font-desktop-display"],display.FONT_STACKS[font].display);assert.equal(vars["--font-desktop-mono"],display.FONT_STACKS[font].ui);}
 const css=fs.readFileSync(new URL("../src/app/globals.css",import.meta.url),"utf8");assert.doesNotMatch(css,/font-family:\s*(?:Georgia|Arial)/);assert.match(css,/theme-form legend \{ font-family: var\(--font-desktop-display/);assert.match(css,/progress-value span \{ font-family: var\(--font-desktop-ui/);
});
