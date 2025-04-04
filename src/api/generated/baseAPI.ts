import { createApi } from '@reduxjs/toolkit/query/react';

import { createBaseQuery } from './createBaseQuery';
import { getAPIBaseURL } from './utils';

export const BASE_URL = getAPIBaseURL('advisor.grafana.app', 'v0alpha1');

export const api = createApi({
  reducerPath: 'advisorAPI',
  baseQuery: createBaseQuery({
    baseURL: BASE_URL,
  }),
  endpoints: () => ({}),
});
