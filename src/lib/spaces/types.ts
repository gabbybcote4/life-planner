export function parseSpaceTitle(value: FormDataEntryValue | null) {
  if (typeof value !== "string") return null;
  const title = value.trim();
  return title && Array.from(title).length <= 100 ? title : null;
}
export type Space = {id:string; title:string; revision:number};
