import assert from 'node:assert/strict';
import { test } from 'node:test';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright-core';
import { parseHTML } from 'linkedom';

const homepage=fileURLToPath(new URL('../website/index.html',import.meta.url));
const languages=['en','ko','ja','zh'];
const htmlLang={en:'en',ko:'ko',ja:'ja',zh:'zh-CN'};
const prompts=['repo','process','overview','update','bugs'];

test('homepage provides every localized text, label and prompt in all four languages',()=>{
 const {document}=parseHTML(readFileSync(homepage,'utf8'));
 const parents=new Set([...document.querySelectorAll('[data-lang]')].map(element=>element.parentElement));
 for(const parent of parents){
  const counts=Object.fromEntries(languages.map(language=>[language,0]));
  for(const child of parent.children)if(child.hasAttribute('data-lang'))counts[child.getAttribute('data-lang')]=(counts[child.getAttribute('data-lang')]??0)+1;
  assert.deepEqual(Object.keys(counts).sort(),[...languages].sort(),`unknown language: ${parent.outerHTML.slice(0,120)}`);
  assert.ok(counts.en>0&&languages.every(language=>counts[language]===counts.en),`missing translation: ${JSON.stringify(counts)} ${parent.outerHTML.slice(0,120)}`);
 }
 for(const element of document.querySelectorAll('[data-lang]:not([data-lang="en"])'))assert.ok(element.hasAttribute('hidden'),element.outerHTML.slice(0,120));
 for(const element of document.querySelectorAll('[data-en-aria]'))for(const language of languages)assert.ok(element.getAttribute(`data-${language}-aria`),`${language} label: ${element.outerHTML.slice(0,120)}`);
 for(const frame of document.querySelectorAll('iframe[data-title-en]'))for(const language of languages)assert.ok(frame.getAttribute(`data-title-${language}`));
 for(const key of prompts)for(const language of languages)assert.ok(document.getElementById(`${key}-prompt-${language}`)?.textContent.trim(),`${key}-prompt-${language}`);
 assert.equal(document.getElementById('install-command').textContent,'npx skills add itsbysean/pFlow --skill pflow');
});

test('homepage switches among four languages and copies the visible prompt and install command',async t=>{
 const executablePath=[process.env.PFLOW_BROWSER_PATH,'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome','/usr/bin/chromium','/usr/bin/google-chrome'].filter(Boolean).find(existsSync);
 const browser=await chromium.launch({headless:true,...(executablePath?{executablePath}:{})});t.after(()=>browser.close());const page=await browser.newPage();
 await page.route(/^https?:/,route=>route.abort());
 await page.addInitScript(()=>Object.defineProperty(navigator,'clipboard',{value:{writeText:async text=>{globalThis.copied=text;}}}));
 await page.goto(pathToFileURL(homepage).href);
 const expected={repo:'Use pFlow to document the order creation flow in this repository.',overview:'Use pFlow to document this project’s main entry points and processing flows.',process:'Use pFlow to document our onboarding process. A new employee requests an account, their manager approves it, and IT creates the account. If rejected, the employee is asked to revise the request.',update:'Use pFlow to review code changes since the previous analysis and update the affected documentation and HTML.',bugs:'Use pFlow to analyze the order creation flow for potential bugs and mark them on the diagram.'};
 for(const [key,text] of Object.entries(expected)){
  assert.equal(await page.locator(`#${key}-prompt-en`).innerText(),text);
  await page.locator(`[data-copy-target="${key}-prompt-en"]`).click();assert.equal(await page.evaluate(()=>globalThis.copied),text);
 }
 await page.locator('[data-copy-target="install-command"]').click();
 assert.equal(await page.evaluate(()=>globalThis.copied),'npx skills add itsbysean/pFlow --skill pflow');
 for(const language of languages){
  await page.locator(`[data-language="${language}"]`).click();
  assert.equal(await page.locator('html').getAttribute('lang'),htmlLang[language]);
  assert.equal(await page.locator(`[data-language="${language}"]`).getAttribute('aria-pressed'),'true');
  for(const other of languages)assert.equal(await page.locator(`#bugs-prompt-${other}`).isVisible(),other===language,`${other} in ${language}`);
  const visible=await page.locator(`#bugs-prompt-${language}`).innerText();
  await page.locator(`[data-copy-target="bugs-prompt-${language}"]`).click();
  assert.equal(await page.evaluate(()=>globalThis.copied),visible);
  assert.ok((await page.locator(`[data-copy-target="bugs-prompt-${language}"] ~ .copy-status`).innerText()).length>0);
 }
 await page.reload();
 assert.equal(await page.locator('html').getAttribute('lang'),'zh-CN');
 assert.equal(await page.locator('#bugs-prompt-zh').isVisible(),true);
});
