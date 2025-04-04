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
