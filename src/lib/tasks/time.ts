// A task's clock time is stored with its own named zone, not converted on each device.
export function parseTaskTime(value:unknown):string|null{
 if(typeof value!=="string"||!/^([01]\d|2[0-3]):[0-5]\d(?::00)?$/.test(value))return null;
 return value.slice(0,5);
}
export function validTaskZone(value:unknown):value is string{
 if(typeof value!=="string"||value.length>100||!(value==="UTC"||/^[A-Za-z_]+\/[A-Za-z0-9_+/-]+$/.test(value)))return false;
 try{new Intl.DateTimeFormat("en-US",{timeZone:value});return true;}catch{return false;}
}
export function formatTaskTime(value:unknown){
 const time=parseTaskTime(value);if(!time)return "";
 const hour=Number(time.slice(0,2));return `${hour%12||12}:${time.slice(3)} ${hour<12?"AM":"PM"}`;
}
