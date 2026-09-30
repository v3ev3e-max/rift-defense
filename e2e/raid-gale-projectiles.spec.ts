import {test} from '@playwright/test';
import {checkBossStates} from './raid-visual-check';
test('gale-colossus states decode and play once',async({page})=>{await checkBossStates(page,'gale-colossus');});
