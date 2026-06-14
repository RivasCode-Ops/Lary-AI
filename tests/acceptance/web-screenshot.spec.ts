import { test, expect } from '@playwright/test';

test('Capturar screenshot da tela de login no navegador', async ({ page }) => {
  await page.goto('http://localhost:8081', { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'D:\\PROJETOS\\02_APPS\\lary-ai\\docs\\screenshot-login.png', fullPage: true });
  const title = await page.title();
  expect(title).toBe('LARY AI');
});
