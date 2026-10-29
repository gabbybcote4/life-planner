import {validPlanning} from "../calendar/preferences";
export const FONT_PRESETS={retro:"Classic desktop",system:"System",rounded:"Rounded",mono:"Monospace"} as const;
export const FONT_STACKS={retro:{ui:"Tahoma, Verdana, Arial, sans-serif",display:'"Trebuchet MS", Tahoma, sans-serif'},system:{ui:"system-ui, sans-serif",display:"system-ui, sans-serif"},rounded:{ui:'"Trebuchet MS", Verdana, sans-serif',display:'"Trebuchet MS", Verdana, sans-serif'},mono:{ui:'"Lucida Console", "Courier New", monospace',display:'"Lucida Console", "Courier New", monospace'}};
export type DisplayPreferences={font_preset:keyof typeof FONT_PRESETS;text_size:14|16|18;app_zoom:90|100|110|125;reduce_motion:boolean;strong_focus:boolean;simple_background:boolean};
export const DEFAULT_DISPLAY:DisplayPreferences={font_preset:"retro",text_size:14,app_zoom:100,reduce_motion:false,strong_focus:false,simple_background:false};
export type DisplayGroup="text"|"zoom"|"accessibility";
export type DisplayState={error?:string;message?:string;revision?:number};
export function validDisplay(v:unknown):v is DisplayPreferences{if(!v||typeof v!=="object")return false;const d=v as DisplayPreferences;return Object.hasOwn(FONT_PRESETS,d.font_preset)&&[14,16,18].includes(d.text_size)&&[90,100,110,125].includes(d.app_zoom)&&[d.reduce_motion,d.strong_focus,d.simple_background].every(v=>typeof v==="boolean");}
export function parseDisplayForm(form:FormData){const group=form.get("group"),raw=form.get("revision");if(typeof raw!=="string"||!/^[1-9]\d{0,8}$/.test(raw))return null;const revision=Number(raw);
 if(group==="planning"){const values={week_start:form.get("week_start"),date_format:form.get("date_format")};if(!validPlanning(values))return null;return {group,revision,values};}
 if(group==="text"){const font=form.get("font_preset"),size=form.get("text_size");if(typeof font!=="string"||!Object.hasOwn(FONT_PRESETS,font)||!["14","16","18"].includes(String(size)))return null;return {group,revision,values:{font_preset:font,text_size:Number(size)}};}
 if(group==="zoom"){const zoom=form.get("app_zoom");if(!["90","100","110","125"].includes(String(zoom)))return null;return {group,revision,values:{app_zoom:Number(zoom)}};}
 if(group==="accessibility"){const values={reduce_motion:form.get("reduce_motion"),strong_focus:form.get("strong_focus"),simple_background:form.get("simple_background")};if(!Object.values(values).every(v=>v==="true"||v==="false"))return null;return {group,revision,values:{reduce_motion:values.reduce_motion==="true",strong_focus:values.strong_focus==="true",simple_background:values.simple_background==="true"}};}
 return null;
}
export function displayVariables(d:DisplayPreferences){return {"--font-desktop-ui":FONT_STACKS[d.font_preset].ui,"--font-desktop-display":FONT_STACKS[d.font_preset].display,"--font-desktop-mono":d.font_preset==="retro"?FONT_STACKS.mono.ui:FONT_STACKS[d.font_preset].ui,"--reading-size":d.text_size+"px","--app-zoom":String(d.app_zoom/100)};}
