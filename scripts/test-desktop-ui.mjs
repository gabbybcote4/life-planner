import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
import ts from 'typescript';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import * as links from '../src/lib/knowledge/links.ts';
import * as appearance from '../src/lib/spaces/appearance.ts';
import * as dates from '../src/lib/calendar/dates.ts';
const require=createRequire(import.meta.url);
function load(path,deps={}){const code=ts.transpileModule(fs.readFileSync(new URL(path,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;const loaded={exports:{}};new Function('require','exports',code)(name=>name in deps?deps[name]:require(name),loaded.exports);return loaded.exports;}
const windows=load('../src/components/ui/desktop-window.tsx');
const art=load('../src/components/ui/space-artwork.tsx');
const visual=load('../src/components/ui/space-visual.tsx',{'./space-artwork':art,'@/lib/spaces/appearance':appearance});
const planning=load('../src/lib/calendar/preferences.ts');
const mini=load('../src/app/dashboard/mini-month.tsx',{'@/lib/calendar/dates':dates,'@/lib/calendar/preferences':planning,'@/app/components/planning-preferences':{usePlanning:()=>planning.DEFAULT_PLANNING},'next/link':({children,...props})=>React.createElement('a',props,children)});
const previews=load('../src/app/dashboard/workspace-previews.tsx',{'./mini-month':mini,'@/app/components/planning-preferences':{DateLabel:({date})=>date},'@/components/ui/desktop-window':windows,'@/components/ui/space-visual':visual,'@/lib/knowledge/links':links,'@/lib/calendar/dates':dates});
const render=(component,props)=>renderToStaticMarkup(React.createElement(component,props));
const id='ae66172a-f871-43b3-a610-a838d8b7c001',other='ae66172a-f871-43b3-a610-a838d8b7c002';
test('window chrome is decorative and titles are accessible escaped text',()=>{const html=render(windows.DesktopWindow,{title:'<script>Title</script>',children:'Content'});assert.match(html,/aria-label="&lt;script&gt;/);assert.doesNotMatch(html,/<script>/);assert.equal((html.match(/<i/g)||[]).length,3);});
test('space cards link to actual IDs and disclose the preview limit',()=>{const html=render(previews.SpaceCards,{spaces:[{id,title:'My own space'}],more:true,error:false});assert.match(html,new RegExp('/spaces\\?space='+id));assert.match(html,/first three spaces/);assert.doesNotMatch(html,/Personal|Study/);});
test('connection graph draws only saved edges between visible documents',()=>{const docs=[{id,kind:'note',title:'Source',space_id:null,space_title:null,body:'[[Target|note:'+other+']] [[Foreign|note:00000000-0000-0000-0000-000000000000]]'},{id:other,kind:'note',title:'Target',space_id:null,space_title:null,body:''}];const html=render(previews.ConnectionMap,{documents:docs,more:false,error:false});assert.equal((html.match(/<line /g)||[]).length,1);assert.doesNotMatch(html,/Foreign/);assert.match(html,new RegExp('/notes\\?note='+other));});
test('empty and failed graphs do not invent connections',()=>{assert.match(render(previews.ConnectionMap,{documents:[],more:false,error:false}),/insert links/);assert.match(render(previews.ConnectionMap,{documents:[],more:false,error:true}),/role="alert"/);});
test('mini calendar uses provided date and event links remain date-only',()=>{const html=render(previews.UpcomingEvents,{today:'2026-10-27',events:[{id,title:'Real event',event_date:'2026-10-31'}],more:false,error:false});assert.match(html,/October 2026/);assert.match(html,/calendar\?date=2026-10-31/);assert.match(html,/aria-current="date"/);assert.match(html,/UTC/);});

test('shared title bar composes caller headings/actions and keeps chrome decorative',()=>{
 const html=render(windows.WindowTitleBar,{className:'widget-titlebar',children:[
 React.createElement('h2',{key:'title'},'<My window>'),
 React.createElement('a',{key:'action',href:'/settings'},'Settings')]});
 assert.match(html,/<header class="window-titlebar widget-titlebar">/);
 assert.match(html,/<h2>&lt;My window&gt;<\/h2>/);
 assert.match(html,/href="\/settings"/);
 assert.match(html,/aria-hidden="true"/);
 assert.equal((html.match(/<i\b/g)||[]).length,3);
 assert.doesNotMatch(html,/<button/);
});
