import {test,expect} from '@playwright/test';

for(const role of ['citizen','farmer','admin'])test(`${role} sign-in persists and sign-out protects the workspace`,async({page})=>{
  await page.goto('/login');await page.getByRole('button',{name:new RegExp(`${role} Demo`,'i')}).click();await page.getByRole('button',{name:'Sign in',exact:true}).click();await expect(page).toHaveURL(/dashboard/);await page.reload();await expect(page.getByRole('heading',{name:'A clearer outlook for your day.'})).toBeVisible();
  await page.goto('/login');await expect(page).toHaveURL(/dashboard/);
  await page.goto('/admin');await expect(page).toHaveURL(role==='admin'?/\/admin$/:/dashboard/);
  await page.getByRole('button',{name:'Sign out',exact:true}).click();await expect(page).toHaveURL(/login/);await page.goto('/dashboard');await expect(page).toHaveURL(/login/);
});

test('wrong credentials show an actionable error and do not authenticate',async({page})=>{
  await page.goto('/login');await page.getByRole('button',{name:/Citizen Demo/}).click();await page.locator('input[name=password]').fill('deliberately-incorrect');await page.getByRole('button',{name:'Sign in',exact:true}).click();await expect(page.getByRole('alert').filter({hasText:'Email or password is incorrect.'})).toBeVisible();await page.goto('/dashboard');await expect(page).toHaveURL(/login/);
});

test('remember me controls hosted cookie lifetime and survives refresh',async({page,context})=>{
  test.skip(process.env.E2E_HOSTED!=='true','Supabase cookie check');
  for(const remember of [false,true]){
    await page.goto('/login');await page.getByRole('button',{name:/Citizen Demo/}).click();await page.getByLabel('Remember me').setChecked(remember);await page.getByRole('button',{name:'Sign in',exact:true}).click();await expect(page).toHaveURL(/dashboard/);await page.reload();
    const cookies=(await context.cookies()).filter(c=>/^sb-.*-auth-token(?:\.\d+)?$/.test(c.name));expect(cookies.length).toBeGreaterThan(0);for(const cookie of cookies)expect(remember?cookie.expires>0:cookie.expires===-1).toBe(true);
    await page.getByRole('button',{name:'Sign out',exact:true}).click();await expect(page).toHaveURL(/login/);expect((await context.cookies()).filter(c=>/^sb-.*-auth-token(?:\.\d+)?$/.test(c.name))).toHaveLength(0);
  }
});

test('invalid email links recover safely and reset cannot run without a session',async({page})=>{
  await page.goto('/auth/callback?error=access_denied&next=https://example.com');await expect(page).toHaveURL(/\/login\?error=link/);await expect(page.getByRole('alert').filter({hasText:/invalid, expired/})).toBeVisible();
  await page.goto('/reset-password');await expect(page.getByRole('button',{name:'Save password'})).toBeDisabled();await expect(page.getByRole('link',{name:'Request a recovery link'})).toBeVisible();
  const status=await page.evaluate(async()=> (await fetch('/api/auth/update-password',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:'a new long password'})})).status);expect(status).toBe(401);
});

test('unconfigured email delivery never claims an email was sent',async({page})=>{
  test.skip(process.env.E2E_HOSTED!=='true'||process.env.E2E_EMAIL_ENABLED==='true','Dedicated demo without mail service');
  for(const route of ['/register','/forgot-password','/resend-confirmation']){
    await page.goto(route);await expect(page.getByText('Email signup and recovery are not available yet.',{exact:false})).toBeVisible();await expect(page.locator('form button[type=submit], form .btn.wide')).toBeDisabled();await expect(page.getByRole('link',{name:'Explore demo accounts'})).toBeVisible();
  }
});
