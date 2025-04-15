import React from 'react';
import { css } from '@emotion/css';
import { Button, Collapse, useStyles2 } from '@grafana/ui';
import { GrafanaTheme2, IconName } from '@grafana/data';
import { Severity, type CheckSummary as CheckSummaryType } from 'types';

export default function CheckDrillDown({ checkSummary }: { checkSummary: CheckSummaryType }) {
  const styles = useStyles2(getStyles(checkSummary.severity));
  const [isOpen, setIsOpen] = React.useState<Record<string, boolean>>({});

  return (
    <div className={styles.container}>
      {Object.values(checkSummary.checks).map((check) => {
        // Dont' display a drilldown for empty checks
        if (check.issueCount === 0) {
          return null;
        }

        return Object.values(check.steps).map((step) => {
          const stepIsOpen = isOpen[step.stepID] ?? false;
          return (
            <div key={step.stepID} className={styles.spacingTopMd}>
              {step.issues.length > 0 && (
                <Collapse
                  label={
                    <div className={styles.description}>
                      <div>
                        {step.name} failed for {step.issues.length} {check.name}
                        {step.issues.length > 1 ? 's' : ''}.
                      </div>
                      <div className={styles.resolution} dangerouslySetInnerHTML={{ __html: step.resolution }}></div>
                    </div>
                  }
                  isOpen={stepIsOpen}
                  collapsible={true}
                  onToggle={() => setIsOpen({ ...isOpen, [step.stepID]: !stepIsOpen })}
                >
                  {step.issues.map((issue) => (
                    <div key={issue.item} className={styles.issue}>
                      <div className={styles.issueReason}>
                        {issue.item}
                        {issue.links.map((link) => {
                          const extraProps = link.url.startsWith('http')
                            ? { target: '_self', rel: 'noopener noreferrer' }
                            : {};

                          return (
                            <a key={link.url} href={link.url} {...extraProps}>
                              <Button
                                size="sm"
                                className={styles.issueLink}
                                icon={getIcon(link.message)}
                                variant="secondary"
                              >
                                {link.message}
                              </Button>
                            </a>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </Collapse>
              )}
            </div>
          );
        });
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
      textAlign: 'left',
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
      marginLeft: theme.spacing(1),
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
