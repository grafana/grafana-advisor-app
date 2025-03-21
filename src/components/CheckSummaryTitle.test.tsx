import React from 'react';
import { render, screen } from '@testing-library/react';
import { CheckSummaryTitle } from './CheckSummaryTitle';
import { Severity, type CheckSummary as CheckSummaryType } from 'types';
import { getMockCheckSummary } from './CheckSummary.test';
describe('CheckSummaryTitle', () => {
  const mockCheckSummary: CheckSummaryType = getMockCheckSummary();

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
