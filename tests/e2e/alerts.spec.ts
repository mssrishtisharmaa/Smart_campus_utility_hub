import {test,expect} from '@playwright/test';

test('demo accounts get labelled current and upcoming alerts with manual refresh',async({page})=>{
  await page.goto('/login');await page.getByRole('button',{name:/Citizen Demo/}).click();await page.getByRole('button',{name:'Sign in',exact:true}).click();await expect(page).toHaveURL(/dashboard/);await page.goto('/alerts');
  await expect(page.getByText('Demo alert feed',{exact:true})).toBeVisible();await expect(page.locator('article').first()).toContainText('This does not describe current weather.');
  const response=page.waitForResponse(r=>r.url().endsWith('/api/alerts')&&r.request().method()==='POST');await page.getByRole('button',{name:'Check alerts now'}).click();const feed=await(await response).json();expect(feed.audience).toBe('demo');expect(feed.alerts.length).toBeGreaterThan(0);expect(feed.alerts.every((a:{is_demo:boolean})=>a.is_demo)).toBe(true);
  await page.getByRole('button',{name:'Upcoming',exact:true}).click();await expect(page.locator('article').first()).toContainText('Simulated scenario only.');
  await page.setViewportSize({width:390,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test('the alert API does not trust a caller-provided audience',async({page})=>{
  await page.goto('/login');await page.getByRole('button',{name:/Farmer Demo/}).click();await page.getByRole('button',{name:'Sign in',exact:true}).click();await expect(page).toHaveURL(/dashboard/);
  const result=await page.evaluate(async()=>{const response=await fetch('/api/alerts',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:'delhi',name:'New Delhi',state:'Delhi',latitude:28.6139,longitude:77.209,timezone:'Asia/Kolkata',audience:'personal',demoAccount:false})});return {status:response.status,feed:await response.json()};});expect(result.status).toBe(200);expect(result.feed.audience).toBe('demo');expect(result.feed.alerts.every((a:{is_demo:boolean})=>a.is_demo)).toBe(true);
});
