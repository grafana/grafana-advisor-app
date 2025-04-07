/**
 * This file is copied from grafana/grafana and has been auto-generated.
 * https://github.com/grafana/grafana/blob/main/public/app/api/clients/advisor/index.ts
 */
import { generatedAPI } from './endpoints.gen';

export const advisorAPI = generatedAPI;
export const {
  useGetCheckQuery,
  useListCheckQuery,
  useCreateCheckMutation,
  useDeleteCheckMutation,
  useUpdateCheckMutation,
  useListCheckTypeQuery,
} = advisorAPI;

export { type Check, type CheckType } from './endpoints.gen';
