import React from 'react';
import { css } from '@emotion/css';
import { Button, Card, useStyles2 } from '@grafana/ui';
import { GrafanaTheme2 } from '@grafana/data';
import Markdown from 'react-markdown';

interface LLMSuggestionContentProps {
  isLoading: boolean;
  response: string | null;
}

export function LLMSuggestionContent({ isLoading, response }: LLMSuggestionContentProps) {
  const styles = useStyles2(getStyles);

  return (
    <Card>
      <div className={styles.llmSuggestionContainer}>
        {isLoading ? (
          <div className={styles.loadingContainer}>
            <Button icon="spinner" variant="secondary" size="sm" disabled>
              Generating AI suggestion...
            </Button>
          </div>
        ) : (
          <div className={styles.llmMarkdownWrapper}>
            <div className={styles.aiLabel}>
              <Button icon="ai" size="xs" variant="secondary" fill="text" disabled>
                AI Generated
              </Button>
            </div>
            <Markdown>{response ?? ''}</Markdown>
          </div>
        )}
      </div>
    </Card>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  llmSuggestionContainer: css({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1),
  }),
  llmMarkdownWrapper: css({
    width: '100%',
    '& ul, & ol': {
      paddingLeft: theme.spacing(3),
      marginBottom: theme.spacing(1),
    },
    '& li': {
      listStylePosition: 'inside',
      marginBottom: theme.spacing(0.5),
    },
  }),
  loadingContainer: css({
    width: '100%',
  }),
  aiLabel: css({
    marginBottom: theme.spacing(1),
    display: 'flex',
    justifyContent: 'flex-end',
  }),
});
