import { test, expect } from './fixtures';

test('describes available plugin updates without reporting a failed check', async ({ gotoPage, page }) => {
  test.skip(process.env.ADVISOR_UPDATE_FIXTURE !== '1', 'Requires the isolated outdated-plugin fixture');
  test.setTimeout(120000);

  await gotoPage('/?summaryOpenlow=true');
  await page.getByRole('button', { name: /^(Refresh|Generate report)$/ }).click();

  const heading = page.getByText(/^Updates available for \d+ plugins?$/);
  await expect(heading).toBeVisible({ timeout: 90000 });
  await heading.click();
  await expect(page.getByText('Clock', { exact: true })).toBeVisible();
  await expect(page.getByText('JSON API', { exact: true })).toBeVisible();
  await expect(page.getByText(/Update check failed for/)).toHaveCount(0);
});
