"use client";
import {useId,useState,type ReactNode} from "react";
const tabs=[['appearance','Appearance'],['workspace','Workspace'],['accessibility','Accessibility'],['account','Account'],['privacy','Data & privacy'],['about','About']] as const;
export function SettingsTabs({panels}:{panels:Record<typeof tabs[number][0],ReactNode>}){const [active,setActive]=useState<string>("appearance"),id=useId();
 return <div className="settings-workspace"><div role="tablist" aria-label="Settings categories" className="settings-tabs" onKeyDown={e=>{if(!["ArrowRight","ArrowLeft","Home","End"].includes(e.key))return;e.preventDefault();const current=tabs.findIndex(t=>t[0]===active),next=e.key==="Home"?0:e.key==="End"?tabs.length-1:(current+(e.key==="ArrowRight"?1:-1)+tabs.length)%tabs.length;setActive(tabs[next][0]);e.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next]?.focus();}}>{tabs.map(([key,label])=><button type="button" role="tab" key={key} id={id+key+"-tab"} aria-controls={id+key} aria-selected={active===key} tabIndex={active===key?0:-1} onClick={()=>setActive(key)}>{label}</button>)}</div>
 {tabs.map(([key])=><section role="tabpanel" key={key} id={id+key} aria-labelledby={id+key+"-tab"} hidden={active!==key} tabIndex={0} className="settings-panel">{panels[key]}</section>)}</div>;
}
