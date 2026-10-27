export const SPACE_ICONS={folder:"Folder",home:"Home",briefcase:"Work",book:"Book",star:"Star",leaf:"Leaf"};
export const SPACE_COVERS={auto:"Automatic",cozy:"Cozy corner",desk:"Computer desk",study:"Study shelf",none:"No cover"};
export const SPACE_ACCENTS={auto:"Theme default",pink:"Pink",mint:"Mint",blue:"Blue",yellow:"Butter",lilac:"Lilac"};
export type SpaceIcon=keyof typeof SPACE_ICONS;
export type SpaceCover=keyof typeof SPACE_COVERS;
export type SpaceAccent=keyof typeof SPACE_ACCENTS;
export type SpaceAppearance={icon:SpaceIcon;cover:SpaceCover;accent:SpaceAccent};
export const DEFAULT_SPACE_APPEARANCE:SpaceAppearance={icon:"folder",cover:"auto",accent:"auto"};
function known<T extends object>(map:T,value:unknown):value is keyof T{return typeof value==="string"&&Object.hasOwn(map,value);}
export function parseSpaceAppearance(icon:unknown,cover:unknown,accent:unknown):SpaceAppearance|null {
 return known(SPACE_ICONS,icon)&&known(SPACE_COVERS,cover)&&known(SPACE_ACCENTS,accent)?{icon,cover,accent}:null;
}
export function spaceAppearance(value:Partial<SpaceAppearance>):SpaceAppearance {
 return parseSpaceAppearance(value.icon,value.cover,value.accent)??DEFAULT_SPACE_APPEARANCE;
}
export function resolvedSpaceCover(id:string,cover:SpaceCover):"cozy"|"desk"|"study"|"none" {
 if(cover!=="auto")return cover;
 const index=Array.from(id).reduce((sum,char)=>sum+char.charCodeAt(0),0)%3;
 return (["cozy","desk","study"] as const)[index];
}
export const SPACE_SELECT="id,title,revision,icon,cover,accent";
