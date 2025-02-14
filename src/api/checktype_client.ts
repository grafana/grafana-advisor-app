import { BackendSrvRequest, getBackendSrv, FetchResponse, config } from '@grafana/runtime';
import { lastValueFrom } from 'rxjs';
import { CheckType } from 'generated/checktype/v0alpha1/checktype_object_gen';

export interface ListResponse<T> {
  items: T[];
}

export class CheckTypeClient {
  apiEndpoint: string;

  constructor() {
    this.apiEndpoint = `/apis/advisor.grafana.app/v0alpha1/namespaces/${config.namespace}/checktypes`;
  }

  async get(name: string): Promise<FetchResponse<CheckType>> {
    const options: BackendSrvRequest = {
      headers: {},
      url: this.apiEndpoint + '/' + name,
      showErrorAlert: false,
    };
    return lastValueFrom(getBackendSrv().fetch<CheckType>(options));
  }

  async list(filters?: string[]): Promise<FetchResponse<ListResponse<CheckType>>> {
    const options: BackendSrvRequest = {
      headers: {},
      url: this.apiEndpoint,
      showErrorAlert: false,
    };
    if (filters !== undefined && filters !== null && filters.length > 0) {
      options.params = {
        filters: filters.join(','),
      };
    }
    return lastValueFrom(getBackendSrv().fetch<ListResponse<CheckType>>(options));
  }
}
