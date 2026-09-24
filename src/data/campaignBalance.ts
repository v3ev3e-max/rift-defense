/** Campaign growth is separate from the copy-merging economy in endless mode. */
export const campaignStarAttack=(star:number)=>1+.24*Math.max(0,star-1);
export const campaignGradeStarAttack=(grade:'B'|'A'|'S'|'SR',star:number)=>campaignStarAttack(star)*(star===4?(grade==='B'?.95:grade==='A'?1.05:1):star>=5?(grade==='B'?.9:grade==='A'?1.12:1):1);
export const campaignStarHealth=(star:number)=>1+.32*Math.max(0,star-1);
// Thirty-second single-target audits exposed self-reaction outliers in dual-element SR units.
export const campaignHeroOutput:Record<string,number>={arden:.62,solara:.66,aurora:.78};
export const campaignVanguardHealth=[1,1.08,1.18,1.28,1.4,1.75,2.0,2.25,2.0,2.2,2.45,2.7] as const;
export const campaignRegionBalance=[
 {hp:5.0,attack:.45,speed:.85,stars:1},
 {hp:6.3,attack:.55,speed:.86,stars:1},
 {hp:7.0,attack:.68,speed:.87,stars:2},
 {hp:7.2,attack:.72,speed:.88,stars:2},
 {hp:8.4,attack:.86,speed:.89,stars:3},
 {hp:10.5,attack:1.05,speed:.90,stars:3},
 {hp:13.0,attack:1.30,speed:.91,stars:4},
 {hp:16.0,attack:1.55,speed:.92,stars:5},
 // The third worldline uses tougher base archetypes, so these multipliers are
 // normalized against effective enemy HP to keep every region boundary rising.
 {hp:22.0,attack:1.95,speed:.93,stars:5},
 {hp:22.0,attack:2.00,speed:.94,stars:5},
 {hp:22.0,attack:2.20,speed:.95,stars:5},
 {hp:22.5,attack:2.55,speed:.96,stars:5},
 {hp:35.0,attack:2.75,speed:.97,stars:5},
 {hp:36.0,attack:3.00,speed:.98,stars:5},
 {hp:48.0,attack:3.28,speed:.99,stars:5},
 {hp:62.0,attack:3.60,speed:1.00,stars:5},
] as const;
