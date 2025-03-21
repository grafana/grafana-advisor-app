import React from 'react';
import { render, screen } from '@testing-library/react';
import { CheckSummaryTitle } from './CheckSummaryTitle';
import { Severity, type CheckSummary as CheckSummaryType } from 'types';

describe('CheckSummaryTitle', () => {
  const mockCheckSummary: CheckSummaryType = {
    name: 'Test Check',
    description: 'Test description',
    updated: new Date('2023-01-01'),
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

  it('renders check name', () => {
    render(<CheckSummaryTitle checkSummary={mockCheckSummary} />);
    expect(screen.getByText('Test Check')).toBeInTheDocument();
  });

  it('renders correct icon for high severity', () => {
    render(<CheckSummaryTitle checkSummary={mockCheckSummary} />);
    expect(screen.getByTestId('exclamation-circle')).toBeInTheDocument();
  });

  it('renders correct message for high severity issues', () => {
    render(<CheckSummaryTitle checkSummary={mockCheckSummary} />);
    expect(screen.getByText(/2 items needs to be fixed/i)).toBeInTheDocument();
  });

  it('renders correct message and icon for low severity issues', () => {
    const lowSeverityCheck = {
      ...mockCheckSummary,
      severity: Severity.Low,
    };
    render(<CheckSummaryTitle checkSummary={lowSeverityCheck} />);
    expect(screen.getByTestId('exclamation-triangle')).toBeInTheDocument();
    expect(screen.getByText(/2 items may need your attention/i)).toBeInTheDocument();
  });
});
