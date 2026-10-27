import type {ReactNode} from "react";
export function WindowDots(){return <span className="window-dots" aria-hidden="true"><i/><i/><i/></span>;}
export function DesktopWindow({title,children,className="",action}:{title:string;children:ReactNode;className?:string;action?:ReactNode}) {
 return <section className={"desktop-window "+className} aria-label={title}><header className="window-titlebar"><WindowDots/><h2>{title}</h2>{action}</header><div className="window-content">{children}</div></section>;
}
