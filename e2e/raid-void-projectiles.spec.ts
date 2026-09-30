import {test} from '@playwright/test';
import {checkBossStates} from './raid-visual-check';
test('void-observer states decode and play once',async({page})=>{await checkBossStates(page,'void-observer');});
