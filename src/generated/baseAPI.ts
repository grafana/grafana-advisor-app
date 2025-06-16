/**
 * This file is copied from grafana/grafana.
 * https://github.com/grafana/grafana/blob/main/public/app/api/clients/advisor/baseAPI.ts
 */
import { createApi } from '@reduxjs/toolkit/query/react';

import { createBaseQuery } from './createBaseQuery';
import { getAPIBaseURL } from './utils';

export const BASE_URL = getAPIBaseURL('advisor.grafana.app', 'v0alpha1');

function createAdvisorApi() {
  try {
    return createApi({
      reducerPath: 'advisorAPIv0alpha1',
      baseQuery: createBaseQuery({
        baseURL: BASE_URL,
      }),
      endpoints: () => ({}),
    });
  } catch (error) {
    // Previous to Grafana 12.1
    return createApi({
      reducerPath: 'advisorAPI',
      baseQuery: createBaseQuery({
        baseURL: BASE_URL,
      }),
      endpoints: () => ({}),
    });
  }
}

export const api = createAdvisorApi();
