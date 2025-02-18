import React from 'react';
import { css, cx } from '@emotion/css';
import { Button, useStyles2 } from '@grafana/ui';
import { GrafanaTheme2, IconName } from '@grafana/data';
import { Severity, type CheckSummary as CheckSummaryType } from 'types';
import { formatCheckName } from 'utils';
import { useNavigate } from 'react-router-dom';

export default function CheckDrillDown({
  severity,
  checkSummary,
}: {
  severity: Severity;
  checkSummary: CheckSummaryType;
}) {
  const styles = useStyles2(getStyles(severity));
  const navigate = useNavigate();

  return (
    <div className={styles.container}>
      {Object.values(checkSummary.checks).map((check) => (
        <div key={check.name} className={styles.spacingTopLg}>
          {/* Check header */}
          <div>
            <h4 className={cx(styles.highlightColor, styles.checkHeader)}>
              {formatCheckName(check.name)} - {check.issueCount}
            </h4>
            {check.description && <p>{check.description}</p>}
          </div>

          {/* Check steps */}
          <div>
            {Object.values(check.steps).map((step) => (
              <div key={step.stepID} className={styles.spacingTopMd}>
                <div>
                  <h5 className={cx(styles.highlightColor, styles.stepHeader)}>
                    {step.name} - <span className={styles.bold}>{step.issueCount}</span>
                  </h5>
                  <p className={styles.description}>
                    {step.description}
                    <br />
                    {step.name} failed for:
                  </p>
                </div>

                {/* Step issues */}
                <div>
                  {step.issues.map((issue) => (
                    <div key={issue.item} className={styles.issue}>
                      <div className={styles.issueReason}>
                        {issue.item}
                        {issue.links.map((link) => {
                          const b = (
                            <Button
                              className={styles.issueLink}
                              key={link.url}
                              onClick={() => (link.url.startsWith('http') ? null : navigate(link.url))}
                              size="sm"
                              icon={link.icon as IconName}
                              variant={link.variant || 'secondary'}
                            >
                              {link.message}
                            </Button>
                          );
                          if (link.url.startsWith('http')) {
                            return (
                              <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer">
                                {b}
                              </a>
                            );
                          }
                          return b;
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

const getStyles = (severity: Severity) => (theme: GrafanaTheme2) => {
  const severityColor: Record<Severity, string> = {
    [Severity.High]: theme.colors.error.text,
    [Severity.Low]: theme.colors.warning.text,
    [Severity.Success]: theme.colors.success.text,
  };

  return {
    container: css({
      marginTop: theme.spacing(2),
    }),
    spacingTopLg: css({
      marginTop: theme.spacing(5),
    }),
    spacingTopMd: css({
      marginTop: theme.spacing(2),
    }),
    highlightColor: css({
      color: severityColor[severity],
    }),
    checkHeader: css({
      fontSize: theme.typography.h4.fontSize,
      fontWeight: theme.typography.fontWeightMedium,
    }),
    stepHeader: css({
      opacity: 0.8,
      marginBottom: 0,
    }),
    description: css({
      color: theme.colors.text.secondary,
    }),
    issue: css({
      color: theme.colors.text.secondary,
      backgroundColor: theme.colors.background.secondary,
      padding: theme.spacing(2),
      a: {
        color: theme.colors.text.link,
        cursor: 'pointer',
        ':hover': {
          textDecoration: 'underline',
        },
      },
    }),
    issueReason: css({
      color: theme.colors.text.primary,
      fontWeight: theme.typography.fontWeightMedium,
    }),
    issueLink: css({
      marginLeft: theme.spacing(1),
    }),
    bold: css({
      fontWeight: theme.typography.fontWeightBold,
    }),
  };
};
