import { test, expect } from './fixtures';

test.describe('navigating app', () => {
  test('home page should render successfully', async ({ gotoPage, page }) => {
    await gotoPage(`/`);
    await expect(page.getByText('Keep Grafana running smoothly and securely')).toBeVisible();
    // It should delete the report
    await page.getByRole('button', { name: 'Delete reports' }).click();
    await page.getByRole('button', { name: 'Confirm' }).click();
    // Page should be empty
    await expect(page.getByText('No report found')).toBeVisible();
    // Click on the "Refresh" button
    await page.getByRole('button', { name: 'Refresh' }).click();
    // Page should now show a report
    await expect(page.getByText('More Info')).toBeVisible();
    await expect(page.getByText('Running checks...')).not.toBeVisible();
    // Click on the "More Info"
    await page.getByText('More Info').click();
    // Page should now show a report
    await expect(page.getByText('datasource(s) analyzed')).toBeVisible();
    await expect(page.getByText('plugin(s) analyzed')).toBeVisible();
  });
});
