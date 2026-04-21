import { chromium } from '@playwright/test';

const SITE = 'https://aile-karti.netlify.app/';
const OUTPUT = '/data/.openclaw/workspace/projects/aile-karti/screenshots';

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 375, height: 812 } });
  const page = await context.newPage();

  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  // 1. Login page
  console.log('📸 Login page...');
  await page.goto(SITE, { waitUntil: 'networkidle', timeout: 30000 });
  await page.screenshot({ path: `${OUTPUT}/login.png`, fullPage: true });

  // 2. Dashboard (after PIN entry - simulate by going directly)
  // First set a PIN in localStorage to bypass login
  await page.evaluate(() => {
    localStorage.setItem('ak_pin', '123456');
    localStorage.setItem('ak_pin_set', 'true');
  });

  console.log('📸 Dashboard...');
  await page.goto(`${SITE}/dashboard`, { waitUntil: 'networkidle' });
  await page.screenshot({ path: `${OUTPUT}/dashboard.png`, fullPage: true });

  // Check tab bar
  const tabBar = await page.$('.tab-bar');
  const tabBtns = await page.$$('.tab-btn');
  console.log(`  Tab bar: ${tabBar ? '✅ Found' : '❌ Missing'}`);
  console.log(`  Tab buttons: ${tabBtns.length}`);

  // 3. Persons page
  console.log('📸 Persons page...');
  await page.goto(`${SITE}/persons`, { waitUntil: 'networkidle' });
  await page.screenshot({ path: `${OUTPUT}/persons.png`, fullPage: true });

  // Check tab bar on persons
  const tabBarPersons = await page.$('.tab-bar');
  console.log(`  Tab bar: ${tabBarPersons ? '✅ Found' : '❌ Missing'}`);

  // 4. Settings page
  console.log('📸 Settings page...');
  await page.goto(`${SITE}/settings`, { waitUntil: 'networkidle' });
  await page.screenshot({ path: `${OUTPUT}/settings.png`, fullPage: true });

  // Check tab bar on settings
  const tabBarSettings = await page.$('.tab-bar');
  console.log(`  Tab bar: ${tabBarSettings ? '✅ Found' : '❌ Missing'}`);

  // 5. Check theme toggle on settings
  console.log('📸 Testing theme toggle...');
  const toggle = await page.$('.toggle-switch');
  if (toggle) {
    const isOn = await toggle.evaluate(el => el.classList.contains('on'));
    console.log(`  Toggle state before: ${isOn ? 'ON (dark)' : 'OFF (light)'}`);
    await toggle.click();
    await page.waitForTimeout(500);
    const isOnAfter = await toggle.evaluate(el => el.classList.contains('on'));
    console.log(`  Toggle state after: ${isOnAfter ? 'ON (dark)' : 'OFF (light)'}`);
    await page.screenshot({ path: `${OUTPUT}/settings-dark.png`, fullPage: true });
  }

  // 6. Navigate away and check if theme persists
  console.log('📸 Checking theme persistence...');
  await page.goto(`${SITE}/dashboard`, { waitUntil: 'networkidle' });
  const bodyBg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  console.log(`  Body BG on dashboard: ${bodyBg}`);
  await page.screenshot({ path: `${OUTPUT}/dashboard-after-theme.png`, fullPage: true });

  // 7. Reload and check theme
  console.log('📸 Reload and check theme...');
  await page.reload({ waitUntil: 'networkidle' });
  const bodyBgReload = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  console.log(`  Body BG after reload: ${bodyBgReload}`);

  // Check localStorage
  const storedTheme = await page.evaluate(() => localStorage.getItem('ak_theme'));
  console.log(`  Stored theme: ${storedTheme}`);

  console.log('\n🚨 Console Errors:');
  if (consoleErrors.length === 0) {
    console.log('  ✅ No console errors');
  } else {
    consoleErrors.forEach(e => console.log(`  ❌ ${e}`));
  }

  await browser.close();
  console.log('\n✅ Inspection complete!');
}

run().catch(console.error);
