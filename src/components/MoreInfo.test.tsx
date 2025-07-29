import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MoreInfo } from './MoreInfo';
import { CheckSummaries } from 'types';
import { getEmptyCheckSummary, getEmptyCheckTypes } from 'api/api';

describe('Components/MoreInfo', () => {
  const totalDatasourceCheckCount = 20;
  const totalPluginCheckCount = 60;
  let checkSummaries: CheckSummaries;

  beforeEach(() => {
    checkSummaries = getEmptyCheckSummary(getEmptyCheckTypes());
    checkSummaries.high.checks.datasource.totalCheckCount = totalDatasourceCheckCount;
    checkSummaries.high.checks.plugin.totalCheckCount = totalPluginCheckCount;

    render(<MoreInfo checkSummaries={checkSummaries} />);
  });

  test('should visualise summaries of all the checks', async () => {
    const user = userEvent.setup();
    expect(await screen.findByText('More Info')).toBeInTheDocument();

    // Should not be open by default
    expect(screen.queryByText(`${totalDatasourceCheckCount} datasource(s) analyzed`)).not.toBeInTheDocument();

    // Open "More info section"
    await user.click(screen.getByText('More Info'));

    expect(await screen.findByText(`${totalDatasourceCheckCount} datasource(s) analyzed`)).toBeInTheDocument();
    expect(await screen.findByText(`${totalPluginCheckCount} plugin(s) analyzed`)).toBeInTheDocument();
  });
});
