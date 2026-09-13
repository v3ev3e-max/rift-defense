import {heroes} from '../data/heroes';
import type {Hero,HeroGrade,SaveData} from '../data/types';

export const RECRUIT_COST={one:100,ten:900};
export const RECRUIT_RATES={B:55,A:30,S:12,SR:3} as const;
export const RECRUIT_S_PITY=30;
export const recruitDisplayGrade=(grade:HeroGrade)=>grade==='SR'?'SSR':grade;
export interface RecruitResult{hero:Hero;grade:HeroGrade;displayGrade:string;newHero:boolean;fragments:number;}
const gradeFromRoll=(roll:number):HeroGrade=>roll<.03?'SR':roll<.15?'S':roll<.45?'A':'B';
export function recruit(save:SaveData,count:1|10,rng=Math.random,forced?:HeroGrade):RecruitResult[]{
 const results:RecruitResult[]=[];
 for(let i=0;i<count;i++){
  let grade=forced??gradeFromRoll(rng());
  if(!forced&&save.recruitPity>=RECRUIT_S_PITY-1)grade=rng()<.2?'SR':'S';
  if(!forced&&count===10&&i===9&&!results.some(v=>v.grade!=='B')&&grade==='B')grade='A';
  const pool=heroes.filter(h=>h.grade===grade),hero=pool[Math.floor(rng()*pool.length)]??heroes[0],progress=save.heroes[hero.id],newHero=!progress.owned,fragments=newHero?0:({B:1,A:2,S:5,SR:12}[grade]);
  progress.owned=true;if(fragments&&save.campaign)save.campaign.fragments[hero.id]=Math.min(999,(save.campaign.fragments[hero.id]??0)+fragments);
  save.recruitPity=grade==='S'||grade==='SR'?0:save.recruitPity+1;save.recruitCount++;
  results.push({hero,grade,displayGrade:recruitDisplayGrade(grade),newHero,fragments});
 }
 return results;
}
