export type SpaceTemplate = {key:string;title:string;description:string;pages:{title:string;body:string}[]};
export type SpaceCreationState = {id?:string;pageId?:string;revision?:number;error?:string;message?:string};
export function isTemplateKey(value:unknown):value is string {
 return typeof value==='string' && ['blank','personal','work','study'].includes(value);
}
