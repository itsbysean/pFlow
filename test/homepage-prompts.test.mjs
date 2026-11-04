import assert from 'node:assert/strict';
import { test } from 'node:test';
import { existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright-core';

test('homepage presents and copies all four requested examples in the selected language',async t=>{
 const executablePath=[process.env.PFLOW_BROWSER_PATH,'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome','/usr/bin/chromium','/usr/bin/google-chrome'].filter(Boolean).find(existsSync);
 const browser=await chromium.launch({headless:true,...(executablePath?{executablePath}:{})});t.after(()=>browser.close());const page=await browser.newPage();
 await page.route(/^https?:/,route=>route.abort());
 await page.addInitScript(()=>Object.defineProperty(navigator,'clipboard',{value:{writeText:async text=>{globalThis.copiedPrompt=text;}}}));
 await page.goto(pathToFileURL(fileURLToPath(new URL('../website/index.html',import.meta.url))).href);
 const expected={repo:'Use pFlow to document the order creation flow in this repository.',overview:'Use pFlow to document this project’s main entry points and processing flows.',process:'Use pFlow to document our onboarding process. A new employee requests an account, their manager approves it, and IT creates the account. If rejected, the employee is asked to revise the request.',update:'Use pFlow to review code changes since the previous analysis and update the affected documentation and HTML.'};
 for(const [key,text] of Object.entries(expected)) {
  assert.equal(await page.locator(`#${key}-prompt-en`).innerText(),text);
  await page.locator(`[data-copy-target="${key}-prompt-en"]`).click();assert.equal(await page.evaluate(()=>globalThis.copiedPrompt),text);
 }
 await page.locator('[data-language="ko"]').click();assert.equal(await page.locator('#update-prompt-en').isVisible(),false);const korean=await page.locator('#update-prompt-ko').innerText();await page.locator('[data-copy-target="update-prompt-ko"]').click();assert.equal(await page.evaluate(()=>globalThis.copiedPrompt),korean);assert.ok(korean.includes('업데이트'));
});
