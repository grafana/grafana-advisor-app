/*
 * This file was generated by grafana-app-sdk. DO NOT EDIT.
 */
import { Spec } from './types.spec.gen';
import { Status } from './types.status.gen';

export interface Metadata {
    name: string;
    namespace: string;
    generateName?: string;
    selfLink?: string;
    uid?: string;
    resourceVersion?: string;
    generation?: number;
    creationTimestamp?: string;
    deletionTimestamp?: string;
    deletionGracePeriodSeconds?: number;
    labels?: Record<string, string>;
    annotations?: Record<string, string>;
    ownerReferences?: OwnerReference[];
    finalizers?: string[];
    managedFields?: ManagedFieldsEntry[];
}

export interface OwnerReference {
    apiVersion: string;
    kind: string;
    name: string;
    uid: string;
    controller?: boolean;
    blockOwnerDeletion?: boolean;
}

export interface ManagedFieldsEntry {
    manager?: string;
    operation?: string;
    apiVersion?: string;
    time?: string;
    fieldsType?: string;
    subresource?: string;
}

export interface Check {
    kind: string;
    apiVersion: string;
    metadata: Metadata;
    spec: Spec;
    status: Status;
}
