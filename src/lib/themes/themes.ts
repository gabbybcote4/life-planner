const sage = {
  "accent-pink":"#f5dedc", "accent-mint":"#dcebdc", "accent-blue":"#dce7f4", "accent-yellow":"#f9edca", "accent-lilac":"#e7def1",
  background: "#f4efe5", foreground: "#343b35", surface: "#fffcf7", input: "#fffefa",
  panel: "#f5f2e8", tint: "#edf0e4", selected: "#dfe8d2", muted: "#596057",
  primary: "#42583e", "on-primary": "#fffdf7", "primary-hover": "#32442e",
  focus: "#6d7b51", border: "#c7cebb", "input-border": "#87927e",
  error: "#852e23", "error-surface": "#f9ebe5", "error-border": "#c48a7a",
  success: "#344d31", "success-surface": "#edf1e5", shadow: "#343b351f", pattern: "#64745b18",
};
const rose: typeof sage = {
  "accent-pink":"#fbddec", "accent-mint":"#d9f1e6", "accent-blue":"#dce8ff", "accent-yellow":"#fff0ce", "accent-lilac":"#e6dcfc",
  background: "#f2edff", foreground: "#48333b", surface: "#fff9f5", input: "#fffcfb",
  panel: "#f5ecee", tint: "#f2e4e8", selected: "#ead0da", muted: "#70535e",
  primary: "#7e4b60", "on-primary": "#fff9f8", "primary-hover": "#65394c",
  focus: "#98637a", border: "#756580", "input-border": "#a17c8b",
  error: "#8d302b", "error-surface": "#fce9e6", "error-border": "#c88c83",
  success: "#405638", "success-surface": "#eaf0e4", shadow: "#48333b1f", pattern: "#8b596d18",
};
const midnight: typeof sage = {
  "accent-pink":"#44303d", "accent-mint":"#243e36", "accent-blue":"#29384d", "accent-yellow":"#413a27", "accent-lilac":"#383049",
  background: "#171e24", foreground: "#eeeae0", surface: "#222c33", input: "#1b252c",
  panel: "#29343b", tint: "#2d3c3c", selected: "#3c5044", muted: "#c2c7bd",
  primary: "#b4c6a0", "on-primary": "#182219", "primary-hover": "#ceddbc",
  focus: "#d7c18c", border: "#59675f", "input-border": "#94a28f",
  error: "#ffc2b6", "error-surface": "#492c2c", "error-border": "#be8276",
  success: "#c9ddba", "success-surface": "#2c4030", shadow: "#00000040", pattern: "#d5dbce12",
};


const classic:typeof sage={...sage,background:"#bed0cc",foreground:"#203b39",surface:"#f2f2eb",input:"#fffffc",panel:"#e6e9e2",tint:"#dfe8e5",selected:"#cbded8",muted:"#465c58",primary:"#225b60","on-primary":"#ffffff","primary-hover":"#174549",focus:"#356d68",border:"#708b84","input-border":"#708b84","accent-blue":"#d5e4eb","accent-lilac":"#e0dcf0"};
const cloud:typeof sage={...sage,background:"#e9f1fc",foreground:"#253a52",surface:"#f8fbff",input:"#ffffff",panel:"#edf3fb",tint:"#e4edf9",selected:"#d6e5f9",muted:"#4d6075",primary:"#365c8b","on-primary":"#ffffff","primary-hover":"#27466e",focus:"#4a6f9b",border:"#8196af","input-border":"#7187a0","accent-pink":"#f5e1ed","accent-mint":"#dcefe8","accent-blue":"#dceaff","accent-lilac":"#e8e0f7"};
const peach:typeof sage={...sage,background:"#f9eee2",foreground:"#44362f",surface:"#fffbf5",input:"#fffdfa",panel:"#f8efe5",tint:"#f7e6d8",selected:"#f0d9c5",muted:"#6d5548",primary:"#844d36","on-primary":"#fffdf7","primary-hover":"#663724",focus:"#a56b4c",border:"#ad8b73","input-border":"#99775f","accent-pink":"#f8ded8","accent-mint":"#e3eddd","accent-blue":"#e0e8f0","accent-yellow":"#faedc8","accent-lilac":"#ede1f1"};
const lavender:typeof sage={...sage,background:"#eee8f7",foreground:"#3a3156",surface:"#faf8ff",input:"#fefcff",panel:"#f0ecf8",tint:"#e8e2f4",selected:"#e1d7f0",muted:"#65577c",primary:"#695189","on-primary":"#ffffff","primary-hover":"#503969",focus:"#886cad",border:"#9986b2","input-border":"#8f80a6","accent-pink":"#f4dfe9","accent-mint":"#deece5","accent-blue":"#dde6f7","accent-yellow":"#f5edcf","accent-lilac":"#e6dcf7"};
const plum:typeof sage={...midnight,background:"#211b2a",foreground:"#f5ecfb",surface:"#2b2436",input:"#241e30",panel:"#332a40",tint:"#3a3048",selected:"#493b5c",muted:"#d0c0dc",primary:"#d1b3f0","on-primary":"#271c35","primary-hover":"#e5cdf9",focus:"#f2c0df",border:"#88719e","input-border":"#a590b7","accent-pink":"#493044","accent-mint":"#2b423e","accent-blue":"#303c53","accent-yellow":"#49402d","accent-lilac":"#453651"};
const ocean:typeof sage={...midnight,background:"#101e2b",foreground:"#edf4f8",surface:"#182a39",input:"#132432",panel:"#203447",tint:"#263e50",selected:"#2d4a60",muted:"#c0d1df",primary:"#99d5e9","on-primary":"#102631","primary-hover":"#b7e9f5",focus:"#f3d88b",border:"#5f849c","input-border":"#8eafc4","accent-pink":"#413147","accent-mint":"#23433f","accent-blue":"#253e56","accent-yellow":"#413b2b","accent-lilac":"#34334d"};
const forest:typeof sage={...midnight,background:"#14231e",foreground:"#eff4e9",surface:"#1c3028",input:"#17271f",panel:"#253c31",tint:"#2c4538",selected:"#355343",muted:"#c4d4c3",primary:"#b0d7aa","on-primary":"#1b2b1c","primary-hover":"#d0ebc4",focus:"#ebd68e",border:"#6e9277","input-border":"#90af96","accent-pink":"#42343a","accent-mint":"#2d4738","accent-blue":"#293d47","accent-yellow":"#443e2b","accent-lilac":"#3b354a"};
const espresso:typeof sage={...midnight,background:"#241c18",foreground:"#f6eee5",surface:"#30251f",input:"#291f1a",panel:"#3a2c25",tint:"#42342b",selected:"#4d3c31",muted:"#dac9b7",primary:"#e8bc8b","on-primary":"#342316","primary-hover":"#f6d6ac",focus:"#f1cb96",border:"#967d68","input-border":"#b39c86","accent-pink":"#493137","accent-mint":"#303f32","accent-blue":"#303b48","accent-yellow":"#493c29","accent-lilac":"#403447"};
const graphite:typeof sage={...midnight,background:"#181a1f",foreground:"#eff1f6",surface:"#24272e",input:"#1e2127",panel:"#2c3039",tint:"#343944",selected:"#3c4350",muted:"#c4c9d5",primary:"#b4c7f1","on-primary":"#202a40","primary-hover":"#d1ddf9",focus:"#dfc78d",border:"#747d90","input-border":"#969eaf","accent-pink":"#42323f","accent-mint":"#2d403b","accent-blue":"#303c53","accent-yellow":"#423d30","accent-lilac":"#39354c"};
export const THEMES = {
 sage:{label:"Sage Desktop",mode:"light",description:"Warm paper, sage windows, and peach accents.",colors:sage},
 rose:{label:"Pastel Desktop",mode:"light",description:"Lavender, pink, and mint: the original playful desktop.",colors:rose},
 classic:{label:"Classic Desktop",mode:"light",description:"Soft silver and teal, inspired by the family computer.",colors:classic},
 cloud:{label:"Cloud Desktop",mode:"light",description:"Airy blue windows with cool paper and gentle color.",colors:cloud},
 peach:{label:"Peach Desktop",mode:"light",description:"Apricot, cream, and warm copper for a softer day.",colors:peach},
 lavender:{label:"Lavender Desktop",mode:"light",description:"Quiet lilac windows with violet ink and pastel details.",colors:lavender},
 midnight:{label:"Midnight Desktop",mode:"dark",description:"Charcoal windows with muted blue, violet, and mint.",colors:midnight},
 plum:{label:"Plum Desktop",mode:"dark",description:"Deep purple panels with soft orchid and rose accents.",colors:plum},
 ocean:{label:"Ocean Desktop",mode:"dark",description:"Inky blue with sea-glass highlights and warm stars.",colors:ocean},
 forest:{label:"Forest Desktop",mode:"dark",description:"Evergreen windows with moss and pale leaf accents.",colors:forest},
 espresso:{label:"Espresso Desktop",mode:"dark",description:"Coffee-colored panels with amber and cream highlights.",colors:espresso},
 graphite:{label:"Graphite Desktop",mode:"dark",description:"Cool charcoal with periwinkle and muted pastels.",colors:graphite},
} satisfies Record<string,{label:string;mode:"light"|"dark";description:string;colors:typeof sage}>;
export type Theme = keyof typeof THEMES;
export type ThemeState = { error?: string; message?: string };
export const DEFAULT_THEME: Theme = "sage";
export function parseTheme(value: unknown): Theme | null {
 return typeof value === "string" && Object.hasOwn(THEMES,value) ? value as Theme : null;
}
export function themeVariables(theme: Theme): Record<string,string> {
 return {...Object.fromEntries(Object.entries(THEMES[theme].colors).map(([name,color])=>["--"+name,color])),colorScheme:THEMES[theme].mode};
}
