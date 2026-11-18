import {test,expect} from '@playwright/test';
import path from 'node:path';

test.describe('Hosted integrations',()=>{
  test.skip(process.env.E2E_HOSTED!=='true','Enable E2E_HOSTED for a dedicated Supabase demo deployment.');
  test('forecast and historical climate are real sourced data',async({page})=>{
    await page.goto('/login');await page.getByRole('button',{name:/Farmer Demo/}).click();await page.getByRole('button',{name:'Sign in',exact:true}).click();await expect(page).toHaveURL(/dashboard/);
    const location={id:'new-delhi',name:'New Delhi',state:'Delhi',latitude:28.6139,longitude:77.209,timezone:'Asia/Kolkata'};
    const forecast=await page.evaluate(async location=>{const r=await fetch('/api/weather',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(location)});return {status:r.status,body:await r.json()};},location);expect(forecast.status).toBe(200);expect(forecast.body.weather.isDemo).toBe(false);expect(forecast.body.weather.provider).toBe('Open-Meteo');expect(forecast.body.weather.hourly.length).toBeGreaterThan(24);
    const series=await page.evaluate(async location=>{const r=await fetch('/api/climate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location,year:2025,mode:'reanalysis'})});return {status:r.status,body:await r.json()};},location);expect(series.status).toBe(200);expect(series.body.isDemo).toBe(false);expect(series.body.points).toHaveLength(12);expect(series.body.source).toContain('ERA5');
  });
  test('private report photo opens for owner and is hidden from another account',async({page})=>{
    await page.goto('/login');await page.getByRole('button',{name:/Citizen Demo/}).click();await page.getByRole('button',{name:'Sign in',exact:true}).click();await expect(page).toHaveURL(/dashboard/);
    await page.goto('/reports');await expect(page.getByRole('button',{name:'Submit observation'})).toBeEnabled();const description=`E2E photo fixture ${Date.now()}: app icon uploaded for verification, not a weather observation.`;
    await page.getByLabel('Description').fill(description);await page.getByLabel('Photo (optional, maximum 5 MB)').setInputFiles(path.join(process.cwd(),'public/icon-192.png'));await page.getByText('I consent to storing').click();await page.getByRole('button',{name:'Submit observation'}).click();await expect(page.getByText('Report submitted for review. Thank you.')).toBeVisible();
    const photo=page.locator('article').filter({hasText:description}).getByRole('link',{name:'View attached photo'});await expect(photo).toBeVisible();const href=(await photo.getAttribute('href'))!;
    const opened=page.context().waitForEvent('page');await photo.click();const image=await opened;await expect(image).toHaveURL(/storage\/v1\/object\/sign\/report-images\//);await expect(image.locator('img')).toBeVisible();await image.close();
    await page.getByRole('button',{name:'Sign out',exact:true}).click();await expect(page).toHaveURL(/login/);await page.getByRole('button',{name:/Farmer Demo/}).click();await page.getByRole('button',{name:'Sign in',exact:true}).click();await expect(page).toHaveURL(/dashboard/);
    expect(await page.evaluate(async href=>(await fetch(href)).status,href)).toBe(404);
  });
});

