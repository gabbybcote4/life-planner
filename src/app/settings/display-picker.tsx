"use client";
import {useActionState,useId,useState} from "react";
import {Button} from "@/components/ui/button";
import {Select} from "@/components/ui/fields";
import {FormFeedback} from "@/components/ui/feedback";
import {runAction,UNCONFIRMED_SAVE} from "@/lib/shared/client-actions";
import {FONT_PRESETS,FONT_STACKS,type DisplayPreferences,type DisplayGroup,type DisplayState} from "@/lib/themes/display";
import {saveDisplay} from "./display-actions";
export function DisplayPicker({group,saved,revision,ready}:{group:DisplayGroup;saved:DisplayPreferences;revision:number;ready:boolean}){
 const field=useId(),[draft,setDraft]=useState(saved),[confirmed,setConfirmed]=useState(saved),[baseline,setBaseline]=useState(revision);
 const keys=group==="text"?["font_preset","text_size"] as const:group==="zoom"?["app_zoom"] as const:["reduce_motion","strong_focus","simple_background"] as const;
 const changed=keys.some(k=>draft[k]!==confirmed[k]);
 const [state,action,pending]=useActionState<DisplayState,FormData>(async(previous,form)=>{const result=await runAction(()=>saveDisplay(previous,form),UNCONFIRMED_SAVE);if(!result.error&&result.revision){setConfirmed({...draft});setBaseline(result.revision);}return result;},{});
 return <form action={action} className="display-form" aria-busy={pending}><input type="hidden" name="group" value={group}/><input type="hidden" name="revision" value={baseline}/>
 {!ready&&<p role="status" className="muted">Preview available. Apply the display settings setup to enable saving.</p>}
 <fieldset key={baseline} disabled={pending}><legend>{group==="text"?"Fonts & text":group==="zoom"?"App zoom":"Accessibility"}</legend>
 {group==="text"&&<><label htmlFor={field+"-font"}>Font</label><Select id={field+"-font"} name="font_preset" value={draft.font_preset} onChange={e=>setDraft({...draft,font_preset:e.target.value as DisplayPreferences["font_preset"]})}>{Object.entries(FONT_PRESETS).map(([key,label])=><option key={key} value={key}>{label}</option>)}</Select><label htmlFor={field+"-size"}>Text size</label><Select id={field+"-size"} name="text_size" value={draft.text_size} onChange={e=>setDraft({...draft,text_size:Number(e.target.value) as DisplayPreferences["text_size"]})}><option value="14">Compact · 14px</option><option value="16">Comfortable · 16px</option><option value="18">Large · 18px</option></Select><p className="muted">Text & fields · use Zoom to scale the whole interface.</p></>}
 {group==="zoom"&&<><label htmlFor={field+"-zoom"}>App zoom</label><Select id={field+"-zoom"} name="app_zoom" value={draft.app_zoom} onChange={e=>setDraft({...draft,app_zoom:Number(e.target.value) as DisplayPreferences["app_zoom"]})}>{[90,100,110,125].map(n=><option key={n} value={n}>{n}%{n===100?" · default":""}</option>)}</Select><p className="muted">Scales the planner, including panels and controls. Your browser zoom stays separate.</p></>}
 {group==="accessibility"&&([['reduce_motion','Reduce motion'],['strong_focus','Stronger keyboard focus'],['simple_background','Simpler backgrounds & shadows']] as const).map(([key,label])=><label className="display-check" key={key}><input type="hidden" name={key} value={String(draft[key])}/><input type="checkbox" checked={draft[key]} onChange={e=>setDraft({...draft,[key]:e.target.checked})}/>{label}</label>)}
 </fieldset>
 <section className="display-preview" aria-label="Display preview" style={{fontFamily:FONT_STACKS[draft.font_preset].ui,fontSize:draft.text_size,zoom:group==="zoom"?draft.app_zoom/100:1}} data-strong-focus={draft.strong_focus} data-simple-background={draft.simple_background}><strong>My day</strong><p>✓ Plan the week</p><p>Ideas · tasks · a little progress</p><Button type="button" variant="secondary">Preview focus</Button></section>
 <p className="muted">{!ready?"Default preview · saving needs setup":changed?"Preview only · Save to apply":"Your saved options"}</p><div className="form-actions"><Button type="submit" variant="primary" pending={pending} disabled={!changed||pending||!ready}>Save {group==="text"?"text settings":group==="zoom"?"zoom":"accessibility"}</Button><Button variant="text" disabled={!changed||pending} onClick={()=>setDraft({...confirmed})}>Cancel changes</Button></div><FormFeedback error={state.error} message={!changed?state.message:undefined}/>
 </form>;
}
