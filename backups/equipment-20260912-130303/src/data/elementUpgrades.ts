import type {Element} from './types';

export const elementUpgradeMax=5;
export const elementUpgradeCosts=[80,140,220,340,500] as const;
export const elementUpgradeInfo:Record<Element,{name:string;summary:string;stages:string[]}>= {
 water:{name:'물',summary:'제어와 안정성',stages:['공격력 +5%','감속 지속 +10%','감속 대상 피해 +12%','보스 감속 효율 +8%','빙결 반응 피해 +25%']},
 fire:{name:'불',summary:'연소와 폭발',stages:['공격력 +7%','연소 피해 +18%','화상 폭발 개방','정예·보스 피해 +15%','연소 반응 피해 +30%']},
 electric:{name:'전기',summary:'공속과 전이',stages:['공격 속도 +4%','전이 피해 +15%','전이 대상 +1','과부하 피해 +20%','첫 전이 피해 +35%']},
 dark:{name:'어둠',summary:'치명타와 관통',stages:['치명타 +4%','공격력 +6%','방어 관통 +12%','약화 대상 피해 +18%','처형 기준 HP 35%']},
};
export const elementUpgradeCost=(level:number)=>elementUpgradeCosts[Math.max(0,Math.min(elementUpgradeMax-1,level))];
