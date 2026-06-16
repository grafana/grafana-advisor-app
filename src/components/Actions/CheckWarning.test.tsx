import React from 'react';
import { render, screen } from '@testing-library/react';
import CheckWarning from './CheckWarning';

describe('CheckWarning', () => {
  it('renders warning message for checks older than 5 seconds', () => {
    const twentyMinutesAgo = new Date(Date.now() - 20 * 60 * 1000);
    render(<CheckWarning checkLastUpdate={twentyMinutesAgo} />);

    expect(screen.getByText(/Check is taking longer than expected \(updated 20 minutes ago\)/)).toBeInTheDocument();
  });
});
