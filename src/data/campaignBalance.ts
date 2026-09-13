/** Campaign growth is separate from the copy-merging economy in endless mode. */
export const campaignStarAttack=(star:number)=>1+.24*Math.max(0,star-1);
export const campaignStarHealth=(star:number)=>1+.32*Math.max(0,star-1);
// Thirty-second single-target audits exposed self-reaction outliers in dual-element SR units.
export const campaignHeroOutput:Record<string,number>={arden:.62,solara:.66,aurora:.78};
export const campaignVanguardHealth=[1,1,1.2,1.35,1.5,2.4,4,6] as const;
export const campaignRegionBalance=[
 {hp:4.2,attack:.42,speed:.85,stars:1},
 {hp:4.4,attack:.47,speed:.85,stars:1},
 {hp:4.6,attack:.53,speed:.85,stars:2},
 {hp:4.85,attack:.60,speed:.85,stars:2},
 {hp:5.1,attack:.68,speed:.85,stars:3},
 {hp:6.5,attack:1.25,speed:.85,stars:3},
 {hp:8.5,attack:1.8,speed:.85,stars:4},
 {hp:11,attack:2.5,speed:.85,stars:5},
] as const;
