// Types used by the frontend part of the Grafana Advisor.
// (These are on purpose structured a bit differently than the backend generated ones.)

import { CheckReportFailure } from 'generated/endpoints.gen';

export enum Severity {
  High = 'high',
  Low = 'low',
}

export type CheckSummaries = Record<Severity, CheckSummary>;

export type CheckSummary = {
  name: string;
  description: string;
  severity: Severity;
  checks: Record<string, Check>;
  created: Date;
};

// A check is a group of related validation steps (e.g. for datasources or plugins)
export type Check = {
  name: string;
  type: string;
  typeName: string;
  description: string;
  totalCheckCount: number;
  issueCount: number;
  canRetry: boolean;
  steps: Record<string, CheckStep>;
};

// A check step is a single validation step that can have multiple issues (one issue per item - e.g. a datasource or a plugin)
export type CheckStep = {
  name: string;
  description: string;
  resolution: string;
  stepID: string;
  issueCount: number;
  issues: CheckReportFailureExtended[];
};

export type CheckReportFailureExtended = CheckReportFailure & {
  isRetrying: boolean;
  isHidden: boolean;
};

export interface CheckStatus {
  name: string;
  incomplete: boolean;
  hasError: boolean;
  lastUpdate: Date;
}
