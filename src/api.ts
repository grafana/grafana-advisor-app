import { getBackendSrv, isFetchError } from '@grafana/runtime';
import { Check } from 'types';

// TODO: should we always fetch the preffered version from the API?
export const API_VERSION = 'v0alpha1';
export const API_BASE_URL = `/apis/advisor.grafana.app`;

export async function getChecks(): Promise<Check[]> {
  try {
    const response = await getBackendSrv().get(`${API_BASE_URL}/${API_VERSION}/checks`);
    console.log(response.items);
    return response.items;
  } catch (error) {
    if (isFetchError(error)) {
      error.isHandled = true;
      throw new Error(`${error.status} - ${error.statusText}`);
    }

    throw error;
  }
}

export async function getChecksForType() {}

export async function getLastCheckForType() {}

export async function getAvailableChecks() {}

export async function getAvailableVersions(): Promise<string[]> {
  const response = await getBackendSrv().get(API_BASE_URL);

  return response.versions?.map((versionMeta: { version: string }) => versionMeta.version);
}

export async function getPreferredVersion() {
  const response = await getBackendSrv().get(API_BASE_URL);

  return response?.preferredVersion?.version;
}

// Temporary (should be called only from the backend in the future)
export async function createCheck() {}

// Temporary (should be called only from the backend in the future)
export async function deleteCheck() {}
