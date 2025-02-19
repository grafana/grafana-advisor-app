import React from 'react';
import { css } from '@emotion/css';
import { Button, ButtonVariant, useStyles2 } from '@grafana/ui';
import { GrafanaTheme2, IconName } from '@grafana/data';
import { Severity, type CheckSummary as CheckSummaryType } from 'types';
import { useNavigate } from 'react-router-dom';

export default function CheckDrillDown({ checkSummary }: { checkSummary: CheckSummaryType }) {
  const styles = useStyles2(getStyles(checkSummary.severity));
  const navigate = useNavigate();

  return (
    <div className={styles.container}>
      {Object.values(checkSummary.checks).map((check) => {
        // Dont' display a drilldown for empty checks
        if (check.issueCount === 0) {
          return null;
        }

        return Object.values(check.steps).map((step) => (
          <div key={step.name} className={styles.spacingTopMd}>
            {step.issues.length > 0 && (
              <div className={styles.description}>
                <div>
                  {step.name} failed for {step.issues.length} {check.name}
                  {step.issues.length > 1 ? 's' : ''}.
                </div>
                <div className={styles.resolution} dangerouslySetInnerHTML={{ __html: step.resolution }}></div>
              </div>
            )}
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
                        icon={getIcon(link.message)}
                        variant={getVariant(link.message)}
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
        ));
      })}
    </div>
  );
}

const getStyles = (severity: Severity) => (theme: GrafanaTheme2) => {
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
    description: css({
      a: {
        color: theme.colors.text.link,
        cursor: 'pointer',
        ':hover': {
          textDecoration: 'underline',
        },
      },
      marginBottom: theme.spacing(1),
    }),
    resolution: css({
      color: theme.colors.text.secondary,
    }),
    issue: css({
      color: theme.colors.text.secondary,
      backgroundColor: theme.colors.background.secondary,
      padding: theme.spacing(2),
      marginBottom: theme.spacing(1),
    }),
    issueReason: css({
      color: theme.colors.text.primary,
      fontWeight: theme.typography.fontWeightMedium,
    }),
    issueLink: css({
      float: 'right',
    }),
    bold: css({
      fontWeight: theme.typography.fontWeightBold,
    }),
  };
};

const getIcon = (message: string) => {
  message = message.toLowerCase();
  let icon: IconName = 'info-circle';
  if (message.includes('fix')) {
    icon = 'wrench';
  } else if (message.includes('info')) {
    icon = 'document-info';
  } else if (message.includes('upgrade')) {
    icon = 'arrow-up';
  } else if (message.includes('delete')) {
    icon = 'trash-alt';
  } else if (message.includes('admin') || message.includes('settings') || message.includes('config')) {
    icon = 'cog';
  }
  return icon;
};

const getVariant = (message: string) => {
  message = message.toLowerCase();
  let variant: ButtonVariant = 'secondary';
  if (message.includes('fix') || message.includes('upgrade')) {
    variant = 'primary';
  } else if (message.includes('info')) {
    variant = 'secondary';
  } else if (message.includes('delete')) {
    variant = 'destructive';
  }
  return variant;
};
