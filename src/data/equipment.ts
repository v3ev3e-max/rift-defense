import type {Element,HeroGrade,SaveData} from './types';

export type EquipmentSlot='weapon'|'armor'|'necklace';
export type WeaponGroup='rifle'|'machinegun'|'sniper'|'pistol'|'railgun'|'shotgun'|'blade'|'polearm'|'grimoire'|'catalyst'|'drone'|'guardian';
export interface EquipmentItem {id:string;templateId:string;name:string;slot:EquipmentSlot;weaponGroup?:WeaponGroup;rarity:HeroGrade;enhance:number;attack:number;hp:number;speed:number;crit:number;skill:number;element?:Element;elementDamage:number;effect:string;equippedBy?:string;locked:boolean;order:number;}

export const EQUIPMENT_MAX_ENHANCE=5;
export const rarityMax:Record<HeroGrade,number>={B:EQUIPMENT_MAX_ENHANCE,A:EQUIPMENT_MAX_ENHANCE,S:EQUIPMENT_MAX_ENHANCE,SR:EQUIPMENT_MAX_ENHANCE};
export const rarityScale:Record<HeroGrade,number>={B:1,A:1.35,S:1.75,SR:2.25};
export const equipmentShopPrice:Record<HeroGrade,number>={B:40,A:120,S:360,SR:1000};
export const equipmentCraftCost:Record<HeroGrade,{material:number;gold:number}>={B:{material:8,gold:20},A:{material:24,gold:70},S:{material:65,gold:210},SR:{material:150,gold:620}};
export function equipmentSalvageValue(item:EquipmentItem){return ({B:4,A:11,S:28,SR:70}[item.rarity])+item.enhance*3;}
export const weaponGroupNames:Record<WeaponGroup,string>={rifle:'돌격소총',machinegun:'기관총',sniper:'저격총',pistol:'권총·쌍권총',railgun:'레일건',shotgun:'산탄총',blade:'검·대검',polearm:'창·낫',grimoire:'마도서·지팡이',catalyst:'마력구·촉매',drone:'드론 제어기',guardian:'방패·수호 장치'};
export const heroWeaponGroup:Record<string,WeaponGroup>={
 yuria:'guardian',reina:'rifle',arin:'sniper',karin:'blade',sera:'machinegun',noel:'sniper',luna:'grimoire',ian:'drone',mia:'guardian',leon:'guardian',adela:'railgun',neris:'guardian',belka:'rifle',serin:'catalyst',kyle:'drone',livia:'guardian',kairon:'shotgun',theria:'railgun',noxia:'polearm',aurora:'catalyst',arden:'pistol',hana:'guardian',zion:'sniper',gaia:'guardian',elise:'sniper',vera:'sniper',astra:'guardian',solara:'catalyst',celestia:'sniper',rhea:'catalyst',echo:'drone',meriel:'grimoire',selene:'catalyst',ophilia:'grimoire'
};
const weaponStyles=['표준형','정밀형','속사형','특수형'];
export const weaponCatalog=Object.entries(weaponGroupNames).flatMap(([group,label])=>weaponStyles.map((style,i)=>({id:`${group}-${i}`,name:`${style} ${label}`,slot:'weapon' as const,weaponGroup:group as WeaponGroup,effect:i===0?'안정적인 기본 출력':i===1?'치명타와 정밀 타격':i===2?'공격 속도 강화':'공격 방식 고유 효과'})));
export const armorCatalog=[
 {id:'armor-field',name:'전술 방호복',effect:'기본 체력 강화'},
 {id:'armor-barrier',name:'에너지 방벽복',effect:'보호막 효율 강화'},
 {id:'armor-ranged',name:'탄도 요격복',effect:'원거리 피해 감소'},
 {id:'armor-guardian',name:'중장 수호복',effect:'저지 중 피해 감소'},
].map(v=>({...v,slot:'armor' as const}));
export const necklaceCatalog=(['water','fire','electric','dark'] as Element[]).map(element=>({id:`necklace-${element}`,name:{water:'수류',fire:'화염',electric:'전격',dark:'암흑'}[element]+' 공명 목걸이',slot:'necklace' as const,element,effect:'기본 공격에 추가 속성 피해'}));

export function makeEquipment(templateId:string,rarity:HeroGrade,order=Date.now(),id=`eq-${order}-${Math.random().toString(36).slice(2,8)}`):EquipmentItem{
 const w=weaponCatalog.find(v=>v.id===templateId),a=armorCatalog.find(v=>v.id===templateId),n=necklaceCatalog.find(v=>v.id===templateId),t=w??a??n;
 if(!t)throw Error('unknown equipment '+templateId);
 const scale=rarityScale[rarity],variant=w?Number(w.id.at(-1)):0;
 const armorHp=a?(a.id==='armor-field'?135:a.id==='armor-guardian'?125:105):0;
 return {id,templateId,name:t.name,slot:t.slot,weaponGroup:w?.weaponGroup,rarity,enhance:0,attack:w?Math.round((18+variant*2)*scale):0,hp:Math.round(armorHp*scale),speed:w&&variant===2?.04*scale:0,crit:w&&variant===1?.035*scale:0,skill:w&&variant===3?.07*scale:0,element:n?.element,elementDamage:n?({B:.05,A:.08,S:.11,SR:.15}[rarity]):0,effect:t.effect,equippedBy:undefined,locked:false,order};
}
export function equipped(save:SaveData,heroId:string){const ids=save.heroes[heroId]?.equipment??[];return ids.map(id=>save.equipmentInventory.find(v=>v.id===id)).filter((v):v is EquipmentItem=>!!v);}
export function equipmentBonus(save:SaveData,heroId:string){const items=equipped(save,heroId);return items.reduce((b,v)=>{const mul=1+v.enhance*.05;b.attack+=v.attack*mul;b.hp+=v.hp*mul;b.speed+=v.speed;b.crit+=v.crit;b.skill+=v.skill;if(v.element){b.element=v.element;b.elementDamage+=v.elementDamage;}return b;},{attack:0,hp:0,speed:0,crit:0,skill:0,element:undefined as Element|undefined,elementDamage:0});}
export function hasEquipmentTemplate(save:SaveData,heroId:string,templateId:string){return equipped(save,heroId).some(v=>v.templateId===templateId);}
export function skillEquipmentMultiplier(save:SaveData,heroId:string){return 1+equipmentBonus(save,heroId).skill;}
export function equipItem(save:SaveData,heroId:string,itemId:string){const item=save.equipmentInventory.find(v=>v.id===itemId),hero=save.heroes[heroId];if(!item||!hero||item.slot==='weapon'&&item.weaponGroup!==heroWeaponGroup[heroId])return false;if(item.equippedBy&&save.heroes[item.equippedBy])save.heroes[item.equippedBy].equipment=save.heroes[item.equippedBy].equipment.filter(id=>id!==item.id);const old=equipped(save,heroId).find(v=>v.slot===item.slot);if(old)old.equippedBy=undefined;hero.equipment=hero.equipment.filter(id=>id!==old?.id);hero.equipment.push(item.id);item.equippedBy=heroId;return true;}
export function enhanceCost(item:EquipmentItem){return {gold:40*(item.enhance+1)*rarityScale[item.rarity],material:2+item.enhance};}
export function enhanceLabel(item:EquipmentItem){return item.enhance>=EQUIPMENT_MAX_ENHANCE?'MAX':`+${item.enhance+1} 강화`;}
/** Equipment is an occasional campaign reward; boss operations remain the best source. */
export function campaignEquipmentDropChance(boss:boolean){return boss?.45:.22;}
export function campaignEquipmentRarity(stageIndex:number,boss:boolean,roll:number,pity:number):HeroGrade{
 if(stageIndex<=0)return roll<.18?'A':'B';
 if(stageIndex===1)return roll<.28?'A':'B';
 if(stageIndex===2)return roll<.2?'S':'A';
 if(stageIndex===3)return boss||roll<.35?'S':'A';
 if(stageIndex===4)return roll<.55?'S':'A';
 if(stageIndex===5)return roll<.2?'SR':'S';
 if(stageIndex===6)return pity>=19||roll<.35?'SR':'S';
 return boss||pity>=19||roll<.55?'SR':'S';
}
