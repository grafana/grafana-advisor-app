// Types used by the frontend part of the Grafana Advisor.
// (These are on purpose structured a bit differently than the backend generated ones.)

export type Severity = 'high' | 'low' | 'success';

export type CheckSummary = {
  name: string;
  description: string;
  severity: Severity;
  checks: Record<string, Check>;
};

// A check is a group of related validation steps (e.g. for datasources or plugins)
export type Check = {
  name: string;
  description: string;
  issueCount: number;
  steps: Record<string, CheckStep>;
};

// A check step is a single validation step that can have multiple issues (one issue per item - e.g. a datasource or a plugin)
export type CheckStep = {
  name: string;
  description: string;
  stepID: string;
  issueCount: number;
  issues: CheckStepIssue[];
};

export type CheckStepIssue = {
  severity: Severity;
  reason: string;
  action: string;
  itemID: string;
};
