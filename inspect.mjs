import { chromium } from '@playwright/test';

const SITE = 'https://aile-karti.netlify.app/';
const OUTPUT = '/data/.openclaw/workspace/projects/aile-karti/screenshots';

const issues = [];

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  page.on('pageerror', err => {
    issues.push(`PAGE ERROR: ${err.message}`);
  });

  // 1. Homepage
  console.log('📸 Testing homepage...');
  await page.goto(SITE, { waitUntil: 'networkidle', timeout: 30000 });
  await page.screenshot({ path: `${OUTPUT}/01-homepage.png`, fullPage: true });

  // Check for basic elements
  const title = await page.title();
  const h1 = await page.$('h1');
  const nav = await page.$('nav');
  const footer = await page.$('footer');

  console.log(`  Title: ${title}`);
  console.log(`  H1: ${h1 ? '✅ Found' : '❌ Missing'}`);
  console.log(`  Nav: ${nav ? '✅ Found' : '❌ Missing'}`);
  console.log(`  Footer: ${footer ? '✅ Found' : '❌ Missing'}`);

  if (!h1) issues.push('Homepage: H1 tag is missing');
  if (!nav) issues.push('Homepage: Navigation is missing');
  if (!footer) issues.push('Homepage: Footer is missing');

  // 2. Features/Benefits page
  console.log('\n📸 Testing features...');
  const featuresLink = await page.$('a[href*="features"], a[href*="ozellik"]');
  if (featuresLink) {
    await featuresLink.click();
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: `${OUTPUT}/02-features.png`, fullPage: true });
  } else {
    await page.goto(`${SITE}#features`, { waitUntil: 'networkidle' });
    await page.screenshot({ path: `${OUTPUT}/02-features.png`, fullPage: true });
  }

  // 3. Pricing/Plans page
  console.log('\n📸 Testing pricing...');
  const pricingLink = await page.$('a[href*="pricing"], a[href*="fiyat"]');
  if (pricingLink) {
    await pricingLink.click();
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: `${OUTPUT}/03-pricing.png`, fullPage: true });
  } else {
    await page.goto(`${SITE}#pricing`, { waitUntil: 'networkidle' });
    await page.screenshot({ path: `${OUTPUT}/03-pricing.png`, fullPage: true });
  }

  // 4. About/Hakkımızda page
  console.log('\n📸 Testing about...');
  const aboutLink = await page.$('a[href*="about"], a[href*="hakkimizda"], a[href*="about-us"]');
  if (aboutLink) {
    await aboutLink.click();
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: `${OUTPUT}/04-about.png`, fullPage: true });
  }

  // 5. Contact/Iletisim page
  console.log('\n📸 Testing contact...');
  const contactLink = await page.$('a[href*="contact"], a[href*="iletisim"], a[href*="contact-us"]');
  if (contactLink) {
    await contactLink.click();
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: `${OUTPUT}/05-contact.png`, fullPage: true });
  }

  // 6. Mobile responsiveness test
  console.log('\n📱 Testing mobile view...');
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto(SITE, { waitUntil: 'networkidle' });
  await page.screenshot({ path: `${OUTPUT}/06-mobile-home.png`, fullPage: true });

  // 7. Tablet responsiveness test
  console.log('\n📱 Testing tablet view...');
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.goto(SITE, { waitUntil: 'networkidle' });
  await page.screenshot({ path: `${OUTPUT}/07-tablet-home.png`, fullPage: true });

  // 8. Check accessibility - contrast
  console.log('\n♿ Checking accessibility...');
  const colors = await page.evaluate(() => {
    const style = getComputedStyle(document.body);
    return {
      bg: style.backgroundColor,
      text: style.color
    };
  });
  console.log(`  Body BG: ${colors.bg}, Text: ${colors.text}`);

  // 9. Interactive elements check
  console.log('\n🔘 Checking interactive elements...');
  const buttons = await page.$$('button');
  const links = await page.$$('a');
  const inputs = await page.$$('input');
  console.log(`  Buttons: ${buttons.length}`);
  console.log(`  Links: ${links.length}`);
  console.log(`  Inputs: ${inputs.length}`);

  // Report console errors
  console.log('\n🚨 Console Errors:');
  if (consoleErrors.length === 0) {
    console.log('  ✅ No console errors');
  } else {
    consoleErrors.forEach(e => console.log(`  ❌ ${e}`));
  }

  // Report all issues
  console.log('\n📋 ISSUES FOUND:');
  if (issues.length === 0) {
    console.log('  ✅ No critical issues found');
  } else {
    issues.forEach((issue, i) => console.log(`  ${i + 1}. ${issue}`));
  }

  await browser.close();
  console.log('\n✅ Inspection complete!');
}

run().catch(console.error);
