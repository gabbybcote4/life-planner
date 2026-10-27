import type {ReactNode} from "react";
export function WindowDots(){return <span className="window-dots" aria-hidden="true"><i/><i/><i/></span>;}
export function DesktopWindow({title,children,className="",action,embedded=false}:{title:string;children:ReactNode;className?:string;action?:ReactNode;embedded?:boolean}) {
 return <section className={(embedded?"embedded-window ":"desktop-window ")+className} aria-label={title}><header className={embedded?"embedded-panel-heading":"window-titlebar"}>{!embedded&&<WindowDots/>}<h2>{title}</h2>{action}</header><div className="window-content">{children}</div></section>;
}
