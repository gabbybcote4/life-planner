"use client";
import {useActionState,useState} from "react";
import {BACKGROUNDS,INTENSITIES,DEFAULT_BACKGROUND,backgroundAttributes,type Background} from "@/lib/themes/background";
import {Button} from "@/components/ui/button";
import {FormFeedback} from "@/components/ui/feedback";
import {runAction,UNCONFIRMED_SAVE} from "@/lib/shared/client-actions";
import {saveBackground,type BackgroundState} from "./background-actions";
export function BackgroundPicker({saved,revision}:{saved:Background;revision:number}){
 const [choice,setChoice]=useState(saved),[confirmed,setConfirmed]=useState(saved),[baseline,setBaseline]=useState(revision);
 const changed=choice.pattern!==confirmed.pattern||choice.intensity!==confirmed.intensity;
 const [state,action,pending]=useActionState<BackgroundState,FormData>(async(previous,data)=>{
 const result=await runAction(()=>saveBackground(previous,data),UNCONFIRMED_SAVE);
 if(!result.error&&result.revision){setConfirmed(choice);setBaseline(result.revision);}return result;
 },{});
 return <form action={action} className="background-form" aria-busy={pending}>
 <h2>Desktop background</h2><p className="muted">A little texture around your windows. Your palette supplies the colours.</p>
 <div className="background-preview desktop-texture" {...backgroundAttributes(choice)} aria-label={BACKGROUNDS[choice.pattern]+" background, "+INTENSITIES[choice.intensity]+" intensity"}><div className="background-preview-window"><strong>My desktop</strong><p>A little room for your day.</p></div></div>
 <input type="hidden" name="revision" value={baseline}/>
 <fieldset disabled={pending}><legend>Choose a background</legend><div className="background-options">{(Object.keys(BACKGROUNDS) as Background["pattern"][]).map(pattern=><label key={pattern}><input type="radio" name="pattern" value={pattern} checked={choice.pattern===pattern} onChange={()=>setChoice({...choice,pattern})}/>{BACKGROUNDS[pattern]}</label>)}</div>
 <label htmlFor="background-intensity">Pattern intensity {choice.pattern==="solid"?"(used for dots and grid)":""}</label><select className="form-control" id="background-intensity" name="intensity" value={choice.intensity} onChange={event=>setChoice({...choice,intensity:event.target.value as Background["intensity"]})}>{Object.entries(INTENSITIES).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select>
 <div className="form-actions"><Button variant="secondary" onClick={()=>setChoice(DEFAULT_BACKGROUND)}>Preview default</Button><Button variant="text" onClick={()=>setChoice(confirmed)} disabled={!changed}>Cancel changes</Button></div></fieldset>
 <p className="muted">{changed?"Preview only — save to apply across your planner.":"Your saved background."}</p>
 <Button variant="primary" type="submit" disabled={!changed||pending} pending={pending} pendingLabel="Saving...">Save background</Button><FormFeedback error={state.error} message={!changed?state.message:undefined}/>
 </form>;
}

