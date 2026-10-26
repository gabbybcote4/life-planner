export type LinkKind = "note" | "page";
export type LinkTarget = { kind: LinkKind; id: string; title: string; space_id: string | null; space_title: string | null };
export type LinkResults = { items: LinkTarget[]; more: boolean; offset: number; query?: string; error?: string };
export const LINK_PAGE_SIZE = 20;
export const EMPTY_LINK_RESULTS: LinkResults = { items: [], more: false, offset: 0 };
const UUID = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";
export function isLinkKind(value: unknown): value is LinkKind { return value === "note" || value === "page"; }
export function parseLinkOffset(value: unknown) {
  return typeof value === "string" && /^(0|[1-9]\d{0,5})$/.test(value) ? Number(value) : 0;
}
export type LinkedTextPart = { text: string } | { kind: LinkKind; id: string; label: string };
export type LinkPreview = { items: LinkTarget[]; error?: string };
export function splitLinkedText(body: string): LinkedTextPart[] {
  const matches = body.matchAll(new RegExp("\\[\\[([^\\[\\]\\r\\n|]{1,200})\\|(note|page):(" + UUID + ")\\]\\]", "giu"));
  const parts: LinkedTextPart[] = [];
  let cursor = 0;
  for (const match of matches) {
    if (match.index > cursor) parts.push({text:body.slice(cursor,match.index)});
    parts.push({kind:match[2].toLowerCase() as LinkKind,id:match[3].toLowerCase(),label:match[1]});
    cursor = match.index + match[0].length;
  }
  if (cursor < body.length) parts.push({text:body.slice(cursor)});
  return parts;
}
export function extractLinks(body: string): { kind: LinkKind; id: string }[] {
  const seen = new Set<string>();
  return splitLinkedText(body).flatMap(part => {
    if ("text" in part) return [];
    const key = part.kind + ":" + part.id;
    if (seen.has(key)) return [];
    seen.add(key); return [{kind:part.kind,id:part.id}];
  });
}
export function linkMarker(target: LinkTarget) {
  const label = target.title.replace(/[\[\]|\r\n]/g, " ").trim() || "Untitled";
  return "[[" + label + "|" + target.kind + ":" + target.id.toLowerCase() + "]]";
}
export function targetHref(target: LinkTarget) {
  return target.kind === "note" ? "/notes?note=" + target.id : "/spaces?space=" + target.space_id + "&entry=" + target.id;
}
export function insertLink(body: string, marker: string, start: number, end: number, limit = 20000) {
  const before = body.slice(0,start), after = body.slice(end);
  const text = before + marker + after;
  return Array.from(text).length <= limit ? { text, caret: before.length + marker.length } : null;
}
