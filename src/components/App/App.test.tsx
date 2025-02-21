import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AppRootProps, PluginType } from '@grafana/data';
import { render, screen } from '@testing-library/react';
import App from './App';

describe('Components/App', () => {
  let props: AppRootProps;

  beforeEach(() => {
    jest.resetAllMocks();

    props = {
      meta: {
        id: 'sample-app',
        name: 'Sample App',
        type: PluginType.app,
        enabled: true,
        jsonData: {},
      },
      query: {},
      path: '',
      onNavChanged: jest.fn(),
    } as unknown as AppRootProps;
  });

  xtest('renders without an error"', async () => {
    render(
      <BrowserRouter>
        <App {...props} />
      </BrowserRouter>
    );

    // Checks if the temporary "Refresh" button is rendered
    expect(await screen.findByText(/Refresh/i)).toBeInTheDocument();
  });
});
