export type Severity = 'high' | 'low';

export type Check = {
  created: Date;
  updated: Date;
  type: string; // e.g. "datasource" or "plugin"
  numberOfItemsChecked: number;
  errors: Array<{
    severity: Severity;
    reason: string;
    action: string;
  }>;
};
