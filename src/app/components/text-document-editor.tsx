import type { ComponentProps } from "react";
import { PlainTextEditor } from "./plain-text-editor";
import { resolveLinkPreview } from "@/app/knowledge/actions";
export async function TextDocumentEditor(props: Omit<ComponentProps<typeof PlainTextEditor>,"initialPreview">) {
 const form = new FormData();form.set("body",props.note?.body ?? "");
 const initialPreview = props.note ? await resolveLinkPreview(form) : {items:[]};
 return <PlainTextEditor {...props} initialPreview={initialPreview}/>;
}
