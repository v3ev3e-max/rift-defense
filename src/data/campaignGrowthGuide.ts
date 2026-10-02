import {campaignRegionBalance} from './campaignBalance';
import type {HeroGrade} from './types';
/** Tested examples, not a minimum required SR count or a guaranteed victory. */
export function campaignGrowthGuide(region:number){
 const stars=campaignRegionBalance[region-1].stars;
 const rarity:HeroGrade=region<=2?'B':region<=4?'A':region<=7?'S':'SR';
 const enhance=region<=2?0:region<=4?2:region<=7?3:5;
 const research=Math.min(10,Math.max(0,region-2));
 const squad=region<=2?['yuria','reina','sera','noel','arin']:region<=4?['yuria','neris','sera','arin','rhea']:region<=11?['gaia','livia','theria','elise','meriel']:['astra','livia','theria','elise','meriel'];
 return {stars,rarity,enhance,research,squad,fullEquipment:region>=3};
}
