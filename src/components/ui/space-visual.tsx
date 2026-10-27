import {SpaceArtwork} from "./space-artwork";
import {spaceAppearance,resolvedSpaceCover,type SpaceAppearance} from "@/lib/spaces/appearance";
export function SpaceMark({icon}:{icon:string}){
 const paths:Record<string,string>={folder:"M2 6h8l2 3h10v12H2zM2 6V3h8l3 3",home:"m2 11 10-9 10 9M5 9v13h5v-8h4v8h5V9",briefcase:"M3 7h18v14H3zM8 7V3h8v4M3 12c5 4 13 4 18 0M10 14h4",book:"M12 5C7 2 3 3 2 4v17c3-2 6-2 10 0 4-2 7-2 10 0V4c-3-2-7-1-10 1Zm0 0v16",star:"m12 2 3 7 8 1-6 5 2 8-7-4-7 4 2-8-6-5 8-1z",leaf:"M4 20C-1 8 10 4 21 2c-1 13-5 21-15 17M4 22 17 7"};
 return <svg width="22" height="24" viewBox="0 0 24 26" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" aria-hidden="true"><path d={paths[icon]??paths.folder}/></svg>;
}
export function SpaceVisual({space,description="Open your pages & tasks ↗"}:{space:{id:string;title:string}&Partial<SpaceAppearance>;description?:string}) {
 const appearance=spaceAppearance(space),cover=resolvedSpaceCover(space.id,appearance.cover);
 return <div className="space-visual" data-space-accent={appearance.accent} data-cover={cover}>
 {cover!=="none"&&<SpaceArtwork variant={cover==="cozy"?0:cover==="desk"?1:2} followAccent/>}
 <div className="space-card-caption"><h3><SpaceMark icon={appearance.icon}/><span>{space.title}</span></h3><p className="muted">{description}</p></div></div>;
}
