import { AppPage } from '@grafana/plugin-e2e';
import { test, expect } from './fixtures';
import { Page } from '@playwright/test';
import { testIds } from '../src/components/testIds';

async function isEmptyReport(page: Page) {
  return await page.getByText('No checks run yet').isVisible();
}

async function expectEmptyReport(gotoPage: (path?: string) => Promise<AppPage>, page: Page) {
  await gotoPage(`/`);
  await expect(page.getByText('Run checks and get suggested action items to fix identified issues')).toBeVisible();

  // Check if page is already empty
  const isAlreadyEmpty = await isEmptyReport(page);

  if (!isAlreadyEmpty) {
    // Delete the report if it exists
    await page.getByRole('button', { name: 'Delete reports' }).click();
    await page.getByRole('button', { name: 'Confirm' }).click();
  }

  // Page should be empty
  await expect(page.getByText('No checks run yet')).toBeVisible();
}

async function runChecks(gotoPage: (path?: string) => Promise<AppPage>, page: Page) {
  await gotoPage(`/`);
  await expect(page.getByText('Run checks and get suggested action items to fix identified issues')).toBeVisible();
  const isEmpty = await isEmptyReport(page);
  if (isEmpty) {
    await page.getByRole('button', { name: 'Generate report' }).click();
  } else {
    await page.getByRole('button', { name: 'Refresh' }).click();
  }
  await expect(page.getByText('Running checks...')).toBeVisible();
  await expect(page.getByText('Running checks...')).not.toBeVisible();
}

async function createEmptyDatasource(page: Page): Promise<string> {
  // Navigate to datasources page
  await page.goto('/connections/datasources');
  // Wait for the page to load
  await expect(page.getByText(/Add( new)? data source/)).toBeVisible();
  await page.getByText(/Add( new)? data source/).click();
  // Select the "Prometheus" option
  await page.getByRole('button', { name: 'Add new data source Prometheus' }).click();
  // Get the name of the datasource
  const dsName = await page.locator('#basic-settings-name').inputValue();
  return dsName;
}

test.describe('navigating app', () => {
  test('home page should render successfully', async ({ gotoPage, page }) => {
    await expectEmptyReport(gotoPage, page);
    // Click on the "Refresh" button
    await runChecks(gotoPage, page);
    // Click on the "More Info"
    await page.getByText('More Info').click();
    // Page should now show a report
    await expect(page.getByText(/(datasource|data source|Data Source)\(s\) analyzed/)).toBeVisible();
    await expect(page.getByText(/(plugin|Plugin)\(s\) analyzed/)).toBeVisible();
  });

  test('it should detect an issue and fix it', async ({ gotoPage, page, grafanaVersion }) => {
    await expectEmptyReport(gotoPage, page);
    const dsName = await createEmptyDatasource(page);
    // Now go back to the advisor page and regenerate the report
    await runChecks(gotoPage, page);

    // Page should now show a report
    await page.getByText('Action needed').click();
    await page.getByText('Health check failed').click();
    // Click on the "Fix me" button
    await page.getByTestId(testIds.CheckDrillDown.actionLink(dsName, 'fix me')).click();
    // Now delete the datasource
    await expect(page.getByText('Loading')).not.toBeVisible();
    await page.getByText('Delete').click();
    await page.getByTestId('data-testid Confirm Modal Danger Button').click();

    // Now retrigger the report only for the prometheus datasource
    await gotoPage(`/`);
    await page.getByText('Action needed').click();
    await page.getByText('Health check failed').click();
    if (grafanaVersion.startsWith('12.0')) {
      // "Retry" button is not available in Grafana 12.0
      await page.getByRole('button', { name: 'Refresh' }).click();
      await expect(page.getByText('Running checks...')).toBeVisible();
      await expect(page.getByText('Running checks...')).not.toBeVisible();
    } else {
      await page.getByTestId(testIds.CheckDrillDown.retryButton(dsName)).click();
    }
    // The issue should be fixed
    await expect(page.getByTestId(testIds.CheckDrillDown.actionLink(dsName, 'fix me'))).not.toBeVisible();
  });

  test('should configure and skip a check step', async ({ gotoPage, page, grafanaVersion }) => {
    if (grafanaVersion.startsWith('12.0')) {
      // This feature is not available in Grafana 12.0
      return;
    }

    await expectEmptyReport(gotoPage, page);
    await createEmptyDatasource(page);
    await runChecks(gotoPage, page);

    // Page should now show a report
    await page.getByText('Action needed').click();
    await expect(page.getByText('Health check failed')).toBeVisible();

    // Click on the "Configuration" button
    await page.getByRole('link', { name: 'Configuration' }).click();
    // Click on the "Ignore" button
    await page.getByTestId(testIds.AppConfig.ignoreSwitch('health-check')).dispatchEvent('click'); // using .click() fails with <label…>…</label> intercepts pointer events
    // Run checks again
    await runChecks(gotoPage, page);
    // After ignoring the health check, either we see "No issues found" or we need to click through to verify the health check is hidden
    const noIssues = await page.getByText('No issues found').isVisible();
    if (!noIssues) {
      await page.getByText('Action needed').click();
      await expect(page.getByText('Health check failed')).not.toBeVisible();
    }

    // Restore the ignore behavior
    await page.getByRole('link', { name: 'Configuration' }).click();
    await page.getByTestId(testIds.AppConfig.ignoreSwitch('health-check')).dispatchEvent('click'); // using .click() fails with <label…>…</label> intercepts pointer events
    await runChecks(gotoPage, page);
    await page.getByText('Action needed').click();
    await expect(page.getByText('Health check failed')).toBeVisible();
  });

  test('it should silence a check', async ({ gotoPage, page }) => {
    await expectEmptyReport(gotoPage, page);
    const dsName = await createEmptyDatasource(page);
    await runChecks(gotoPage, page);

    // Page should now show a report
    await page.getByText('Action needed').click();
    await page.getByText('Health check failed').click();
    await expect(page.getByTestId(testIds.CheckDrillDown.actionLink(dsName, 'fix me'))).toBeVisible();
    // Click on the hide button
    await page.getByTestId(testIds.CheckDrillDown.hideButton(dsName)).click();
    await expect(page.getByTestId(testIds.CheckDrillDown.actionLink(dsName, 'fix me'))).not.toBeVisible();

    // Now enable hidden checks, the issue should be visible again
    await page.getByText('More Info').click();
    await page.getByRole('button', { name: 'Show silenced issues' }).click();
    await expect(page.getByTestId(testIds.CheckDrillDown.actionLink(dsName, 'fix me'))).toBeVisible();
  });
});
