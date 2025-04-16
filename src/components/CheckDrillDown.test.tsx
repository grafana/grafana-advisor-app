import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CheckDrillDown from './CheckDrillDown';
import { CheckSummaries, Severity } from 'types';
import { getEmptyCheckSummary, getEmptyCheckTypes } from 'api/api';
import { renderWithRouter } from '../pages/Home.test';

describe('Components/CheckDrillDown', () => {
  let checkSummaries: CheckSummaries;

  beforeEach(() => {
    Element.prototype.scrollIntoView = jest.fn();
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
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should not display a check that has no issues', async () => {
    renderWithRouter(<CheckDrillDown checkSummary={checkSummaries.high} />);
    expect(screen.queryByText(/Step 1 failed for 1 plugin/im)).not.toBeInTheDocument();
  });

  test('should display a summary of the failing steps', async () => {
    renderWithRouter(<CheckDrillDown checkSummary={checkSummaries.high} />);
    expect(await screen.findByText(/Step 1 failed/im)).toBeInTheDocument();
  });

  test('should display a the resolution of a step', async () => {
    renderWithRouter(<CheckDrillDown checkSummary={checkSummaries.high} />);
    expect(await screen.findByText(checkSummaries.high.checks.datasource.steps.step1.resolution)).toBeInTheDocument();
  });

  test('should display the failing items under the step', async () => {
    renderWithRouter(<CheckDrillDown checkSummary={checkSummaries.high} />);
    // Click on the step
    const user = userEvent.setup();
    await user.click(screen.getByText(/Step 1 failed/i));
    expect(
      await screen.findByText(checkSummaries.high.checks.datasource.steps.step1.issues[0].item)
    ).toBeInTheDocument();
  });

  test('should display a button if the step issue has a link', async () => {
    renderWithRouter(<CheckDrillDown checkSummary={checkSummaries.high} />);
    // Click on the step
    const user = userEvent.setup();
    await user.click(screen.getByText(/Step 1 failed/i));
    expect(
      await screen.findByRole('button', {
        name: checkSummaries.high.checks.datasource.steps.step1.issues[0].links[0].message,
      })
    ).toBeInTheDocument();
  });

  test('should open the test section and scroll to the step when the url has a scrollToStep param', async () => {
    renderWithRouter(<CheckDrillDown checkSummary={checkSummaries.high} />, {
      route: '/?openSteps=step1&scrollToStep=Item%201',
    });

    // Verify scrollIntoView has been called
    expect(
      await screen.findByRole('button', {
        name: checkSummaries.high.checks.datasource.steps.step1.issues[0].links[0].message,
      })
    ).toBeInTheDocument();
    await waitFor(() => {
      expect(Element.prototype.scrollIntoView).toHaveBeenCalled();
    });
  });
});
