import {defineConfig} from '@playwright/test';
import base from './playwright.config';

// Keep the actual runtime and source-import fixtures, without HMR resetting battles.
export default defineConfig({
 ...base,
 outputDir:'artifacts/monster-actions-v2/browser-results',
 use:{...base.use,baseURL:'http://127.0.0.1:5174'},
 webServer:{command:'npm run dev -- --config vite.monster-v2.config.ts --port 5174',url:'http://127.0.0.1:5174',reuseExistingServer:false},
});
