/** Campaign growth is separate from the copy-merging economy in endless mode. */
export const campaignStarAttack=(star:number)=>1+.24*Math.max(0,star-1);
export const campaignStarHealth=(star:number)=>1+.32*Math.max(0,star-1);
// Thirty-second single-target audits exposed self-reaction outliers in dual-element SR units.
export const campaignHeroOutput:Record<string,number>={arden:.62,solara:.66,aurora:.78};
export const campaignVanguardHealth=[1,1.08,1.18,1.28,1.4,1.75,2.0,2.25,2.0,2.2,2.45,2.7] as const;
export const campaignRegionBalance=[
 {hp:5.0,attack:.45,speed:.85,stars:1},
 {hp:5.5,attack:.53,speed:.85,stars:1},
 {hp:6.2,attack:.63,speed:.85,stars:2},
 {hp:5.2,attack:.64,speed:.85,stars:2},
 {hp:5.5,attack:.72,speed:.85,stars:3},
 {hp:14.0,attack:1.25,speed:.85,stars:3},
 {hp:18.0,attack:1.55,speed:.85,stars:4},
 {hp:23.0,attack:1.90,speed:.85,stars:5},
 {hp:7.0,attack:1.40,speed:.86,stars:5},
 {hp:8.5,attack:1.70,speed:.87,stars:5},
 {hp:10.0,attack:2.05,speed:.88,stars:5},
 {hp:12.0,attack:2.50,speed:.90,stars:5},
] as const;
