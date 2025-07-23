import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CheckDrillDown, { CheckDrillDownProps } from './CheckDrillDown';
import { CheckSummaries, Severity } from 'types';
import { getEmptyCheckSummary, getEmptyCheckTypes } from 'api/api';
import { renderWithRouter } from '../test/utils';

describe('Components/CheckDrillDown', () => {
  let checkSummaries: CheckSummaries;
  let defaultProps: CheckDrillDownProps;

  beforeEach(() => {
    Element.prototype.scrollIntoView = jest.fn();
    checkSummaries = getEmptyCheckSummary(getEmptyCheckTypes());

    // Datasources
    checkSummaries.high.checks.datasource.issueCount = 1;
    checkSummaries.high.checks.datasource.canRetry = true;
    checkSummaries.high.checks.datasource.name = 'datasource';
    checkSummaries.high.checks.datasource.steps.step1.issues = [
      {
        severity: Severity.High,
        stepID: 'step1',
        item: 'Item 1',
        links: [{ url: 'http://example.com', message: 'More info' }],
        itemID: 'item1',
        isRetrying: false,
        isHidden: false,
      },
    ];

    // Plugins
    checkSummaries.high.checks.plugin.issueCount = 0;
    checkSummaries.high.checks.plugin.steps.step1.issues = [];
    defaultProps = {
      checkSummary: checkSummaries.high,
      retryCheck: jest.fn(),
      isCompleted: true,
      handleHideIssue: jest.fn(),
      showHiddenIssues: false,
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should not display a check that has no issues', async () => {
    renderWithRouter(<CheckDrillDown {...defaultProps} />);
    expect(screen.queryByText(/Step 1 failed for 1 plugin/im)).not.toBeInTheDocument();
  });

  test('should display a summary of the failing steps', async () => {
    renderWithRouter(<CheckDrillDown {...defaultProps} />);
    expect(await screen.findByText(/Step 1 failed/im)).toBeInTheDocument();
  });

  test('should display a the resolution of a step', async () => {
    renderWithRouter(<CheckDrillDown {...defaultProps} />);
    expect(await screen.findByText(checkSummaries.high.checks.datasource.steps.step1.resolution)).toBeInTheDocument();
  });

  test('should display the failing items under the step', async () => {
    renderWithRouter(<CheckDrillDown {...defaultProps} />);
    // Click on the step
    const user = userEvent.setup();
    await user.click(screen.getByText(/Step 1 failed/i));
    expect(
      await screen.findByText(checkSummaries.high.checks.datasource.steps.step1.issues[0].item)
    ).toBeInTheDocument();
  });

  test('should display a button if the step issue has a link', async () => {
    renderWithRouter(<CheckDrillDown {...defaultProps} />);
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
    renderWithRouter(<CheckDrillDown {...defaultProps} />, {
      route: '/?openSteps=step1&scrollToStep=Item%201',
    });

    expect(
      await screen.findByRole('button', {
        name: checkSummaries.high.checks.datasource.steps.step1.issues[0].links[0].message,
      })
    ).toBeInTheDocument();
    // Verify scrollIntoView has been called
    await waitFor(() => {
      expect(Element.prototype.scrollIntoView).toHaveBeenCalled();
    });
  });

  test('should display a retry button if the step issue has a retry annotation', async () => {
    renderWithRouter(<CheckDrillDown {...defaultProps} />);
    // Click on the step
    const user = userEvent.setup();
    await user.click(screen.getByText(/Step 1 failed/i));
    expect(screen.getByRole('button', { name: 'Retry check' })).toBeInTheDocument();
    // Click on the retry button
    await user.click(screen.getByRole('button', { name: 'Retry check' }));
    expect(defaultProps.retryCheck).toHaveBeenCalledWith('datasource', 'item1');
  });

  test('should disable the retry button if the check is not completed', async () => {
    defaultProps.isCompleted = false;
    renderWithRouter(<CheckDrillDown {...defaultProps} />);
    // Click on the step
    const user = userEvent.setup();
    await user.click(screen.getByText(/Step 1 failed/i));

    expect(screen.getByRole('button', { name: 'Retry check' })).toBeDisabled();
  });

  test('should call the handleHideIssue function when the hide button is clicked', async () => {
    const handleHideIssue = jest.fn();
    renderWithRouter(<CheckDrillDown {...defaultProps} handleHideIssue={handleHideIssue} />);
    // Click on the step
    const user = userEvent.setup();
    await user.click(screen.getByText(/Step 1 failed/i));
    // Click on the hide button
    await user.click(screen.getByRole('button', { name: 'Hide issue' }));
    expect(handleHideIssue).toHaveBeenCalledWith('step1', 'item1', true);
  });

  test('should hide a hidden issue', async () => {
    checkSummaries.high.checks.datasource.steps.step1.issues[0].isHidden = true;
    renderWithRouter(<CheckDrillDown {...defaultProps} checkSummary={checkSummaries.high} />);
    expect(screen.queryByText(/Step 1 failed for 1 datasource/im)).not.toBeInTheDocument();
  });

  test('should show a hidden issue if the showHiddenIssues prop is true', async () => {
    checkSummaries.high.checks.datasource.steps.step1.issues[0].isHidden = true;
    renderWithRouter(<CheckDrillDown {...defaultProps} checkSummary={checkSummaries.high} showHiddenIssues={true} />);
    expect(screen.getByText(/Step 1 failed for 1 datasource/im)).toBeInTheDocument();
  });

  test('should not trigger onToggle when clicking on a link in the resolution', async () => {
    // Set up test data with a resolution containing an HTML link
    checkSummaries.high.checks.datasource.steps.step1.resolution =
      'Please check the <a href="https://example.com" target="_blank">documentation</a> for more information.';

    // Render the component
    await renderWithRouter(<CheckDrillDown {...defaultProps} />);

    const user = userEvent.setup();

    // Find the collapse component by its label text
    const collapseHeader = screen.getByText(/Step 1 failed/i);
    expect(collapseHeader).toBeInTheDocument();

    // Find the link in the resolution
    const resolutionLink = screen.getByRole('link', { name: 'documentation' });
    expect(resolutionLink).toBeInTheDocument();

    // Track initial state - collapse should be closed
    expect(screen.queryByRole('button', { name: 'More info' })).not.toBeInTheDocument();

    // Click on the resolution link
    await user.click(resolutionLink);

    // Verify that the collapse did not toggle (the content inside should still not be visible)
    expect(screen.queryByRole('button', { name: 'More info' })).not.toBeInTheDocument();

    // Additional verification: click on the collapse header to ensure it still works normally
    await user.click(collapseHeader);

    // Now the collapse should be open with content visible
    expect(screen.getByRole('button', { name: 'More info' })).toBeInTheDocument();

    // Click on the resolution link again when the collapse is open
    await user.click(resolutionLink);

    // The collapse should still remain open (not toggled by the link click)
    expect(screen.getByRole('button', { name: 'More info' })).toBeInTheDocument();
  });
});
