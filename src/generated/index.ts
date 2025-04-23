/**
 * This file is copied from grafana/grafana and has been auto-generated.
 * https://github.com/grafana/grafana/blob/main/public/app/api/clients/advisor/index.ts
 */
import { generatedAPI } from './endpoints.gen';

export const advisorAPI = generatedAPI.enhanceEndpoints({
  endpoints: {
    // Need to mutate the generated query to set the Content-Type header correctly
    updateCheck: (endpointDefinition) => {
      const originalQuery = endpointDefinition.query;
      if (originalQuery) {
        endpointDefinition.query = (requestOptions) => ({
          ...originalQuery(requestOptions),
          headers: {
            'Content-Type': 'application/json-patch+json',
          },
          body: JSON.stringify(requestOptions.patch),
        });
      }
    },
  },
});
export const {
  useGetCheckQuery,
  useListCheckQuery,
  useCreateCheckMutation,
  useDeleteCheckMutation,
  useUpdateCheckMutation,
  useListCheckTypeQuery,
} = advisorAPI;
export { type Check, type CheckType } from './endpoints.gen';
