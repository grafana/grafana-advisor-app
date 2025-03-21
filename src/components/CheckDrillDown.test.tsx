import React from 'react';
import { render, screen } from '@testing-library/react';
import CheckDrillDown from './CheckDrillDown';
import { CheckSummaries, Severity } from 'types';
import { getEmptyCheckSummary, getEmptyCheckTypes } from 'api/api';

describe('Components/CheckDrillDown', () => {
  let checkSummaries: CheckSummaries;

  beforeEach(() => {
    jest.resetAllMocks();

    checkSummaries = getEmptyCheckSummary(getEmptyCheckTypes());

    // Datasources
    checkSummaries.high.checks.datasource.issueCount = 1;
    checkSummaries.high.checks.datasource.steps.step1.issues = [
      {
        severity: Severity.High,
        stepID: 'step1',
        item: 'Item 1',
        links: [{ url: 'http://example.com', message: 'More info' }],
      },
    ];

    // Plugins
    checkSummaries.high.checks.plugin.issueCount = 0;
    checkSummaries.high.checks.plugin.steps.step1.issues = [];

    render(<CheckDrillDown checkSummary={checkSummaries.high} />);
  });

  test('should not display a check that has no issues', async () => {
    expect(screen.queryByText(/Step 1 failed for 1 plugin/im)).not.toBeInTheDocument();
  });

  test('should display a summary of the failing steps', async () => {
    expect(await screen.findByText(/Step 1 failed for 1 datasource/im)).toBeInTheDocument();
  });

  test('should display a the resolution of a step', async () => {
    expect(await screen.findByText(checkSummaries.high.checks.datasource.steps.step1.resolution)).toBeInTheDocument();
  });

  test('should display the failing items under the step', async () => {
    expect(
      await screen.findByText(checkSummaries.high.checks.datasource.steps.step1.issues[0].item)
    ).toBeInTheDocument();
  });

  test('should display a button if the step issue has a link', async () => {
    expect(
      await screen.findByRole('button', {
        name: checkSummaries.high.checks.datasource.steps.step1.issues[0].links[0].message,
      })
    ).toBeInTheDocument();
  });
});
