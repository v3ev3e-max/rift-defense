import {test} from '@playwright/test';
import {checkBossStates} from './raid-visual-check';
for(const id of ['solar-sphinx','aeon-sovereign'])test(id+' legacy states play once',async({page})=>{await checkBossStates(page,id);});
