import {chromium,expect} from '@playwright/test';
const browser=await chromium.launch();
try {
  const context=await browser.newContext({baseURL:process.env.E2E_BASE_URL||'http://127.0.0.1:3000',viewport:{width:1440,height:1000},timezoneId:'Asia/Kolkata',reducedMotion:'reduce'});
  const page=await context.newPage();await page.goto('/login');await page.getByRole('button',{name:/Citizen Demo/}).click();await page.getByRole('button',{name:'Sign in',exact:true}).click();await expect(page).toHaveURL(/dashboard/,{timeout:30000});await page.goto('/alerts');await expect(page.getByText('Demo alert feed',{exact:true})).toBeVisible({timeout:30000});await expect(page.locator('article').first()).toBeVisible();await page.screenshot({path:'docs/demo-alert-feed.png',fullPage:true});await page.setViewportSize({width:390,height:844});await page.screenshot({path:'docs/demo-alert-feed-mobile.png',fullPage:true});console.log('Published alert feed captured.');
} finally {await browser.close();}
