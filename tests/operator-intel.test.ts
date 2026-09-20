import {expect,it} from 'vitest';
import {campaignStages} from '../src/data/campaign';
import {BattleModel} from '../src/systems/BattleModel';
import {defaultSave} from '../src/systems/SaveSystem';
import {campaignPrepEquipment,campaignUnit} from '../src/ui/CampaignUI';

(globalThis as unknown as {window:unknown}).window={};

it('shows full skill, unique ability and star effects during deployment',()=>{
 const save=defaultSave();save.heroes.rhea.owned=true;
 const m=new BattleModel(save);m.configureCampaign(campaignStages[0],['rhea'],true);m.selected=m.units[0].uid;
 const html=campaignPrepEquipment(m);
 expect(html).toContain('스킬·고유 능력');
 expect(html).toContain('LIFELINE BLOOM');
 expect(html).toContain('범위 즉시 회복 · 지속 회복 · 보호막');
 expect(html).toContain('고유 능력');
 expect(html).toContain('★5');
});

it('shows live skill charge and remaining effect in combat',()=>{
 const save=defaultSave();save.heroes.rhea.owned=true;
 const m=new BattleModel(save);m.configureCampaign(campaignStages[0],['rhea'],true);const unit=m.units[0];m.selected=unit.uid;m.started=true;unit.skillCharge=72;unit.skillEffectUntil=m.time+3.2;
 const html=campaignUnit(m);
 expect(html).toContain('충전 72%');
 expect(html).toContain('효과 3.2초');
 expect(html).toContain('수류 의료 파동');
});
