export function SpaceArtwork({variant=0,followAccent=false}:{variant?:number;followAccent?:boolean}) {
 return <svg className="space-artwork" viewBox="0 0 320 150" aria-hidden="true" fill="none">
 <rect width="320" height="150" fill={followAccent?"var(--space-card-color)":variant%3===0?"var(--accent-pink)":variant%3===1?"var(--accent-blue)":"var(--accent-mint)"}/>
 <g stroke="var(--foreground)" strokeWidth="1.6" strokeLinejoin="round">
 <rect x="146" y="15" width="145" height="92" rx="3" fill="var(--surface)"/><path d="M219 15v92M146 60h145"/>
 <path d="m147 92 30-23 23 15 38-39 52 47" fill="var(--accent-lilac)"/><circle cx="262" cy="38" r="12" fill="var(--accent-yellow)" stroke="none"/>
 <path d="M0 121h320v29H0z" fill="var(--surface)"/>
 <path d="M31 122V83m0 21C8 103 9 80 16 80c14 0 15 24 15 24Zm0-9c0-27 18-35 22-28 7 16-13 28-22 28Z" fill="var(--accent-mint)"/>
 <path d="M15 103h33l-5 25H20z" fill="var(--accent-lilac)"/>
 {variant%3===1?<><rect x="100" y="68" width="81" height="53" rx="4" fill="var(--accent-blue)"/><rect x="107" y="75" width="67" height="39" fill="var(--tint)"/><path d="m94 122-9 8h109l-10-8" fill="var(--accent-lilac)"/><path d="m132 87-8 7 8 7m18-14 8 7-8 7"/></>:<><path d="M92 111h85v12H92z" fill="var(--accent-lilac)"/><path d="M100 99h79v12h-79z" fill="var(--accent-yellow)"/><path d="M96 88h77v11H96z" fill="var(--accent-blue)"/>{variant%3===0?<><path d="M108 87V67l9 7 10-8 10 8 8-7v20" fill="var(--surface)"/><path d="M117 81h1m16 0h1m-10 4h2"/></>:<><path d="m119 85 7-41 19 4-7 37" fill="var(--accent-pink)"/><path d="m130 48 7 2m-9 5 7 2"/></>}</>}
 <path d="M226 106h27v22h-27z" fill="var(--accent-yellow)"/><path d="M253 111h8v11h-8m-22-27 4-8m8 10 4-8"/>
 <path d="m69 27 3 7 7 3-7 3-3 7-3-7-7-3 7-3Zm35 7 2 4 4 2-4 2-2 4-2-4-4-2 4-2Z" fill="var(--accent-yellow)"/>
 </g></svg>;
}
