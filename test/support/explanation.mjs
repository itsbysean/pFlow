export async function revealExplanation(page, section) {
  if (section === 'documentation') { await page.locator('#view-documentation').scrollIntoViewIfNeeded(); return; }
  const id = {source:'evidence',details:'technical',summary:'summary'}[section];
  const disclosure = page.locator(`#${id}-disclosure`);
  if (!await disclosure.evaluate(el => el.open)) await disclosure.locator(':scope > summary').click();
}
