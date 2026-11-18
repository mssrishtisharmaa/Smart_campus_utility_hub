import {test,expect,Page} from '@playwright/test';
async function login(page:Page,role='citizen'){await page.goto('/login');await page.getByRole('button',{name:new RegExp(`${role} Demo`,'i')}).click();await page.getByRole('button',{name:'Sign in',exact:true}).click();await expect(page).toHaveURL(/dashboard/);}

test('theme persists from landing through workspace and map controls work',async({page})=>{
  await page.goto('/');await page.getByRole('button',{name:'Toggle light and dark theme'}).click();await expect(page.locator('html')).toHaveClass(/dark/);await page.reload();await expect(page.locator('html')).toHaveClass(/dark/);
  await login(page,'farmer');await expect(page.locator('html')).toHaveClass(/dark/);await page.goto('/map');await expect(page.getByRole('complementary',{name:'Selected location weather'})).toBeVisible();
  await page.getByLabel('Map layer').selectOption('Wind');await expect(page.locator('.leaflet-popup-content').filter({hasText:'km/h'}).first()).toBeVisible();await page.getByRole('button',{name:'Recenter',exact:true}).click();await page.getByLabel('Map layer').selectOption('Community reports');
  await page.getByRole('button',{name:'Toggle light and dark theme'}).click();await expect(page.locator('html')).not.toHaveClass(/dark/);await page.setViewportSize({width:390,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test('report review reaches the citizen notification screen without reload',async({browser,page})=>{
  test.skip(process.env.E2E_HOSTED!=='true','Requires Supabase realtime.');
  const description=`Live verification ${Date.now()}: no actual weather event.`,note=`Review delivered live ${Date.now()}`;
  await login(page);await page.goto('/reports');await expect(page.getByRole('button',{name:'Submit observation'})).toBeEnabled();await expect(page.locator('.sync-pill.connected')).toBeVisible();await page.getByLabel('Description').fill(description);await page.getByText('I consent to storing').click();await page.getByRole('button',{name:'Submit observation'}).click();await expect(page.getByText('Report submitted for review. Thank you.')).toBeVisible();await page.goto('/notifications');await expect(page.locator('.sync-pill.connected')).toBeVisible();
  const context=await browser.newContext({baseURL:process.env.E2E_BASE_URL||'http://127.0.0.1:3000',timezoneId:'Asia/Kolkata'});const admin=await context.newPage();
  try{await login(admin,'admin');await admin.goto('/admin/community-reports');admin.on('dialog',dialog=>dialog.accept(note));await admin.locator('article').filter({hasText:description}).getByRole('button',{name:'Verify',exact:true}).click();await expect(page.getByText(new RegExp(note))).toBeVisible({timeout:15000});}finally{await context.close();}
});
