import React from 'react';
import { render, screen } from '@testing-library/react';
import { CheckSummary } from './CheckSummary';
import userEvent from '@testing-library/user-event';
import { Severity, type CheckSummary as CheckSummaryType } from 'types';

export function getMockCheckSummary(): CheckSummaryType {
  return {
    name: 'Test Check',
    description: 'Test description',
    created: new Date('2023-01-01'),
    severity: Severity.High,
    checks: {
      testCheck: {
        name: 'Test Check Item',
        description: 'Test check description',
        totalCheckCount: 5,
        issueCount: 2,
        steps: {
          step1: {
            name: 'Step 1',
            description: 'Test step description',
            resolution: 'Test resolution',
            stepID: 'step1',
            issueCount: 2,
            issues: [
              {
                item: 'Issue 1',
                links: [],
                severity: Severity.High,
                stepID: 'step1',
              },
              {
                item: 'Issue 2',
                links: [],
                severity: Severity.High,
                stepID: 'step1',
              },
            ],
          },
        },
      },
    },
  };
}

describe('CheckSummary', () => {
  const mockCheckSummary = getMockCheckSummary();

  it('renders check summary title with correct count', () => {
    render(<CheckSummary checkSummary={mockCheckSummary} />);
    expect(screen.getByText(/2 items needs to be fixed/i)).toBeInTheDocument();
  });

  it('shows drilldown content when expanded', async () => {
    const user = userEvent.setup();

    render(<CheckSummary checkSummary={mockCheckSummary} />);

    // Click to expand
    await user.click(screen.getByText(/Test Check/i));

    // Check if drilldown content is visible
    expect(screen.getByText('Step 1 failed for 2 Test Check Items.')).toBeInTheDocument();
    expect(screen.getByText('Issue 1')).toBeInTheDocument();
    expect(screen.getByText('Issue 2')).toBeInTheDocument();
  });

  it('does not render when there are no issues', () => {
    const noIssuesCheckSummary = {
      ...mockCheckSummary,
      checks: {
        testCheck: {
          ...mockCheckSummary.checks.testCheck,
          issueCount: 0,
          steps: {
            step1: {
              ...mockCheckSummary.checks.testCheck.steps.step1,
              issues: [],
            },
          },
        },
      },
    };

    const { container } = render(<CheckSummary checkSummary={noIssuesCheckSummary} />);
    expect(container.firstChild).toBeNull();
  });
});
