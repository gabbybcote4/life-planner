export const BACKGROUNDS = { solid: "Solid", dots: "Dots", grid: "Grid" } as const;
export const INTENSITIES = { subtle: "Subtle", medium: "Medium", strong: "Strong" } as const;
export type Background = { pattern: keyof typeof BACKGROUNDS; intensity: keyof typeof INTENSITIES };
export const DEFAULT_BACKGROUND: Background = { pattern: "dots", intensity: "medium" };
export function parseBackground(pattern: unknown, intensity: unknown): Background | null {
 if(typeof pattern!=="string" || !Object.hasOwn(BACKGROUNDS,pattern) || typeof intensity!=="string" || !Object.hasOwn(INTENSITIES,intensity))return null;
 return {pattern,intensity} as Background;
}
export function backgroundAttributes(background:Background){return {"data-background":background.pattern,"data-intensity":background.intensity};}

