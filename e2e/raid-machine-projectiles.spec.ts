import {test} from '@playwright/test';
import {checkBossStates} from './raid-visual-check';
test('machine-god states decode and play once',async({page})=>{await checkBossStates(page,'machine-god');});
