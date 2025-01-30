import { BackendSrvRequest, getBackendSrv, FetchResponse, config } from '@grafana/runtime';
import { lastValueFrom } from 'rxjs';
import { Check } from 'types/check_object_gen';
import { Spec } from 'types/types.spec.gen';

export interface ListResponse<T> {
  items: T[];
}

export class CheckClient {
  apiEndpoint: string;

  constructor() {
    this.apiEndpoint = `/apis/advisor.grafana.app/v0alpha1/namespaces/${config.namespace}/checks`;
  }

  async create(type: 'datasource' | 'plugin', spec?: Spec): Promise<FetchResponse<Check>> {
    const check = {
      kind: 'Check',
      apiVersion: 'advisor.grafana.app/v0alpha1',
      spec: spec ?? { data: {} },
      metadata: {
        name: 'check-' + makeid(10),
        labels: {
          'advisor.grafana.app/type': type,
        },
        namespace: config.namespace,
      },
    };
    const options: BackendSrvRequest = {
      headers: {
        'content-type': 'application/json',
      },
      method: 'POST',
      url: this.apiEndpoint,
      data: JSON.stringify(check),
      showErrorAlert: false,
    };
    return lastValueFrom(getBackendSrv().fetch<Check>(options));
  }

  async get(name: string): Promise<FetchResponse<Check>> {
    const options: BackendSrvRequest = {
      headers: {},
      url: this.apiEndpoint + '/' + name,
      showErrorAlert: false,
    };
    return lastValueFrom(getBackendSrv().fetch<Check>(options));
  }

  async list(filters?: string[]): Promise<FetchResponse<ListResponse<Check>>> {
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
    return lastValueFrom(getBackendSrv().fetch<ListResponse<Check>>(options));
  }

  async delete(name: string): Promise<FetchResponse<void>> {
    const options: BackendSrvRequest = {
      headers: {},
      method: 'DELETE',
      url: this.apiEndpoint + '/' + name,
      showErrorAlert: false,
    };
    return lastValueFrom(getBackendSrv().fetch<void>(options));
  }

  async update(name: string, updated: Check): Promise<FetchResponse<Check>> {
    const options: BackendSrvRequest = {
      headers: {
        'content-type': 'application/json',
      },
      method: 'PUT',
      url: this.apiEndpoint + '/' + name,
      data: JSON.stringify(updated),
      showErrorAlert: false,
    };
    return lastValueFrom(getBackendSrv().fetch<Check>(options));
  }
}

function makeid(length: number) {
  let result = '';
  const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  let counter = 0;
  while (counter < length) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
    counter += 1;
  }
  return result;
}
