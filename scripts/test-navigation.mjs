import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";
import {createRequire} from "node:module";
import React from "react";
import {renderToStaticMarkup} from "react-dom/server";
import * as nav from "../src/lib/navigation.ts";
import * as layout from "../src/lib/dashboard/layout.ts";
const require=createRequire(import.meta.url);
function load(path,deps={}){
 const code=ts.transpileModule(fs.readFileSync(new URL(path,import.meta.url),"utf8"),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText,loaded={exports:{}};
 new Function("require","exports",code)(name=>Object.hasOwn(deps,name)?deps[name]:require(name),loaded.exports);return loaded.exports;
}
function harness(results,authenticated=true){
 const calls=[],invalidations=[],queue=[...results];
 const client={from(table){calls.push(["from",table]);return {update(value){calls.push(["update",value]);return this;},insert(value){calls.push(["insert",value]);return this;},eq(k,v){calls.push(["eq",k,v]);return this;},select(){return this;},maybeSingle:async()=>queue.shift(),single:async()=>queue.shift()};}};
 const actions=load("../src/app/settings/navigation-actions.ts",{"next/cache":{revalidatePath:(...args)=>invalidations.push(args)},"@/lib/auth/account":{getAccountContext:async()=>authenticated?{supabase:client,userId:"owner-a"}:null},"@/lib/navigation":nav});
 return {...actions,calls,invalidations};
}
function form(extra={}){const f=new FormData();for(const[k,v]of Object.entries({position:"right",revision:"1",...extra}))f.set(k,v);return f;}
test("navigation accepts exactly four preset positions and keeps every route reachable",()=>{
 assert.deepEqual(Object.keys(nav.NAV_POSITIONS),["left","right","top","bottom"]);
 for(const key of Object.keys(nav.NAV_POSITIONS))assert.equal(nav.parseNavPosition(key),key);
 for(const value of [null,{},["left"],"constructor","__proto__","left;display:none","LEFT"])assert.equal(nav.parseNavPosition(value),null);
 assert.equal(nav.DEFAULT_NAV_POSITION,"left");
 assert.deepEqual(nav.MOBILE_PRIMARY_ROUTES.map(r=>r.id),["dashboard","tasks","calendar"]);
});
test("navigation save changes only position with fresh account/revision guards",async()=>{
 const h=harness([{data:{nav_revision:2}}]);assert.equal((await h.saveNavigation({},form())).revision,2);
 assert.deepEqual(h.calls.find(c=>c[0]==="update")[1],{nav_position:"right"});
 assert.ok(h.calls.some(c=>c[1]==="user_id"&&c[2]==="owner-a"));assert.ok(h.calls.some(c=>c[1]==="nav_revision"&&c[2]===1));
 assert.deepEqual(h.invalidations,[["/","layout"]]);
});
test("stale navigation retains choice with conflict and no write confirmation",async()=>{
 const h=harness([{data:null},{data:{nav_revision:3}}]);assert.match((await h.saveNavigation({},form())).error,/another tab/);
 assert.equal(h.invalidations.length,0);assert.ok(!h.calls.some(c=>c[0]==="insert"));
});
test("first preference save and duplicate-row race use narrow owner-safe operations",async()=>{
 const first=harness([{data:null},{data:null},{data:{nav_revision:2}}]);assert.equal((await first.saveNavigation({},form())).revision,2);
 assert.deepEqual(first.calls.find(c=>c[0]==="insert")[1],{user_id:"owner-a",nav_position:"right"});
 const race=harness([{data:null},{data:null},{error:{code:"23505"}},{data:null}]);assert.ok((await race.saveNavigation({},form())).error);
 assert.equal(race.calls.filter(c=>c[0]==="update").length,2);assert.equal(race.invalidations.length,0);
});
test("invalid values, expired sessions and failed writes cannot appear saved",async()=>{
 const invalid=harness([]);assert.ok((await invalid.saveNavigation({},form({position:"url(evil)"}))).error);assert.equal(invalid.calls.length,0);
 const revision=harness([]);assert.ok((await revision.saveNavigation({},form({revision:"1e2"}))).error);
 const signedOut=harness([],false);assert.ok((await signedOut.saveNavigation({},form())).error);assert.equal(signedOut.calls.length,0);
 const failure=harness([{error:{code:"offline"}}]);assert.ok((await failure.saveNavigation({},form())).error);assert.equal(failure.invalidations.length,0);
});
const buttons=load("../src/components/ui/button.tsx"),windows=load("../src/components/ui/desktop-window.tsx");
const render=(component,props)=>renderToStaticMarkup(React.createElement(component,props));
test("shared navigation preserves all destinations, active state, and accessible disclosure",()=>{
 const {PlannerNavigation}=load("../src/app/components/planner-navigation.tsx",{"next/link":({children,...props})=>React.createElement("a",props,children),"@/lib/navigation":nav,"@/components/ui/desk-icon":load("../src/components/ui/desk-icon.tsx"),"@/components/ui/button":buttons});
 const html=render(PlannerNavigation,{active:"notes"});
 for(const route of nav.PLANNER_ROUTES)assert.ok(html.includes('href="'+route.href+'"'));
 assert.match(html,/aria-expanded="false"/);assert.match(html,/aria-controls=/);assert.match(html,/current section Notes/);assert.match(html,/aria-current="page"/);
});
test("phone section keeps its actual draft content mounted with a labeled toggle",()=>{
 const {MobileSection}=load("../src/components/ui/mobile-section.tsx",{"./button":buttons});
 const html=render(MobileSection,{title:"Browse notes",children:React.createElement("input",{defaultValue:"Unsaved draft"})});
 assert.match(html,/aria-expanded="false"/);assert.match(html,/aria-controls=/);assert.match(html,/data-collapsed="true"/);assert.match(html,/Unsaved draft/);assert.match(html,/Browse notes/);
});
test("phone widget disclosures preserve the saved layout and real content slots",()=>{
 const deps={"@/components/ui/edit-dialog":editDialogs,"@/lib/shared/client-actions":{},"@/components/ui/desktop-window":windows,"@/components/ui/empty-state":load("../src/components/ui/empty-state.tsx"),"@/components/ui/feedback":load("../src/components/ui/feedback.tsx"),"@/components/ui/button":buttons,"./actions":{saveDashboardLayout:async()=>({})},"@/lib/dashboard/layout":layout};
 const {DashboardWidgets}=load("../src/app/dashboard/dashboard-widgets.tsx",deps);
 const saved=[{id:"capture",width:"half"},{id:"progress",width:"full",accent:"mint"}],before=JSON.stringify(saved);
 const slots=Object.fromEntries(Object.keys(layout.WIDGETS).map(id=>[id,React.createElement("p",null,"Actual "+id)]));
 const html=render(DashboardWidgets,{savedLayout:saved,savedRevision:4,canCustomize:true,slots});
 assert.equal(JSON.stringify(saved),before);assert.match(html,/widget-full widget-type-progress/);assert.match(html,/data-accent="mint"/);
 assert.match(html,/id="widget-body-progress" data-mobile-collapsed="true"/);assert.match(html,/id="widget-body-capture" data-mobile-collapsed="false"/);
 assert.match(html,/Actual progress/);assert.ok(html.indexOf('widget-body-capture')<html.indexOf('widget-body-progress'));
});
test("database position allowlist matches app and no existing preference rows are rewritten",()=>{
 const sql=fs.readFileSync(new URL("../supabase/migrations/20261027001600_navigation_position.sql",import.meta.url),"utf8");
 const list=sql.match(/nav_position in \(([^)]+)\)/)[1];
 assert.deepEqual([...list.matchAll(/'([^']+)'/g)].map(m=>m[1]).sort(),Object.keys(nav.NAV_POSITIONS).sort());
 assert.doesNotMatch(sql,/update public\.planner_preferences/);assert.match(sql,/new.nav_revision=2/);
});

const editDialogs=load("../src/components/ui/edit-dialog.tsx",{"./button":load("../src/components/ui/button.tsx"),"./desktop-window":load("../src/components/ui/desktop-window.tsx")});
