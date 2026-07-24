import { render, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';
import { ContextProvider } from 'contexts/Context';

// Helper function to render with router and LLM context
export const renderWithRouter = (ui: React.ReactElement, { route = '/' } = {}) => {
  return waitFor(() =>
    render(
      <ContextProvider>
        <MemoryRouter initialEntries={[route]}>
          {ui}
        </MemoryRouter>
      </ContextProvider>
    )
  );
};
