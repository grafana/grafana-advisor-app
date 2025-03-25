// Types used by the frontend part of the Grafana Advisor.
// (These are on purpose structured a bit differently than the backend generated ones.)

import { ReportFailure } from 'generated/check/v0alpha1/types.status.gen';

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
  description: string;
  totalCheckCount: number;
  issueCount: number;
  steps: Record<string, CheckStep>;
};

// A check step is a single validation step that can have multiple issues (one issue per item - e.g. a datasource or a plugin)
export type CheckStep = {
  name: string;
  description: string;
  resolution: string;
  stepID: string;
  issueCount: number;
  issues: ReportFailure[];
};
