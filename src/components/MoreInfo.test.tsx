import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { MoreInfo } from './MoreInfo';
import { CheckSummaries } from 'types';
import { getEmptyCheckSummary, getEmptyCheckTypes } from 'utils';

describe('Components/MoreInfo', () => {
  const totalDatasourceCheckCount = 20;
  const totalPluginCheckCount = 60;
  let checkSummaries: CheckSummaries;

  beforeEach(() => {
    jest.resetAllMocks();

    checkSummaries = getEmptyCheckSummary(getEmptyCheckTypes());
    checkSummaries.high.checks.datasource.totalCheckCount = totalDatasourceCheckCount;
    checkSummaries.high.checks.plugin.totalCheckCount = totalPluginCheckCount;

    render(<MoreInfo checkSummaries={checkSummaries} />);
  });

  test('should visualise summaries of all the checks', async () => {
    expect(await screen.findByText('More info')).toBeInTheDocument();

    // Should not be open by default
    expect(screen.queryByText(`${totalDatasourceCheckCount} datasource(s) analyzed`)).not.toBeInTheDocument();

    // Open "More info section"
    act(() => {
      screen.getByText('More info').click();
    });

    expect(await screen.findByText(`${totalDatasourceCheckCount} datasource(s) analyzed`)).toBeInTheDocument();
    expect(await screen.findByText(`${totalPluginCheckCount} plugin(s) analyzed`)).toBeInTheDocument();
  });
});
