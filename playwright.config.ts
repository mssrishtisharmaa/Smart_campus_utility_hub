import {defineConfig,devices} from '@playwright/test';
export default defineConfig({testDir:'tests/e2e',fullyParallel:false,workers:1,timeout:60000,expect:{timeout:20000},use:{timezoneId:'Asia/Kolkata',baseURL:process.env.E2E_BASE_URL||'http://127.0.0.1:3000',trace:'retain-on-failure'},projects:[{name:'chromium',use:{...devices['Desktop Chrome']}}],reporter:[['list'],['html',{open:'never'}]]});

