import React from 'react';
import { render, screen } from '@testing-library/react';
import CheckError from './CheckError';

describe('CheckError', () => {
  it('renders error message', () => {
    render(<CheckError />);

    expect(screen.getByText('Check failed to complete. See server logs for details or try again.')).toBeInTheDocument();
  });
});
