import {isRecordId} from "../shared/validation";
import {parseCalendarDate} from "./dates";
import {parseTaskTime,validTaskZone} from "../tasks/time";
export type MoveSource={id:string;title:string;revision:number;index:number;scheduledDate:string;date:string;time:string|null;timezone:string|null;repeating:boolean};
export type MoveProposal={source:MoveSource;date:string;time:string;timezone:string};
export type MoveState={error?:string;message?:string;id?:string};
export function parseMoveForm(form:FormData){
 const request=form.get("request_id"),source=form.get("source_id"),revision=form.get("revision"),index=form.get("index"),scheduled=parseCalendarDate(form.get("scheduled_date")),date=parseCalendarDate(form.get("date")),rawTime=form.get("time"),zone=form.get("timezone"),scope=form.get("scope");
 const time=rawTime===""?null:parseTaskTime(rawTime);
 if(!isRecordId(request)||!isRecordId(source)||typeof revision!=="string"||!/^[1-9]\d{0,8}$/.test(revision)||typeof index!=="string"||!/^(0|[1-9]\d{0,6})$/.test(index)||Number(index)>1000000||!scheduled||!date||typeof rawTime!=="string"||(rawTime!==""&&(!time||!validTaskZone(zone)))||(scope!=="one"&&scope!=="future"))return null;
 return {p_request:request,p_source:source,p_revision:Number(revision),p_index:Number(index),p_scheduled:scheduled,p_date:date,p_time:time,p_zone:time?String(zone):null,p_scope:scope};
}
export function dropProposal(source:MoveSource,date:string,hour:string):MoveProposal{
 const time=hour==="all"?"":hour+":"+(source.time?.slice(3,5)??"00");
 return {source,date,time,timezone:time?source.timezone??Intl.DateTimeFormat().resolvedOptions().timeZone??"UTC":""};
}
