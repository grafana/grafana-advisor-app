import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AppRootProps, PluginType } from '@grafana/data';
import { render, screen } from '@testing-library/react';
import App from './App';

jest.mock('../../pages/Home', () => ({
  __esModule: true,
  default: () => <div>Home page</div>,
}));

jest.mock('contexts/Context', () => ({
  ContextProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

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

  test('renders without an error"', async () => {
    render(
      <BrowserRouter basename="/" future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <App {...props} />
      </BrowserRouter>
    );

    expect(await screen.findByText('Home page')).toBeInTheDocument();
  });
});
