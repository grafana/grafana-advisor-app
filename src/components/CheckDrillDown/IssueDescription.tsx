import React, { useState, useCallback } from 'react';
import { css } from '@emotion/css';
import { Button, useStyles2 } from '@grafana/ui';
import { GrafanaTheme2, IconName } from '@grafana/data';
import { useNavigate } from 'react-router-dom';
import { testIds } from 'components/testIds';
import { useLLMSuggestion } from 'api/api';
import { usePluginContext } from 'contexts/Context';
import { LLMSuggestionContent } from './LLMSuggestionContent';
import { useInteractionTracker, CheckInteractionType } from '../../api/useInteractionTracker';

interface IssueDescriptionProps {
  item: string;
  isHidden: boolean;
  isRetrying?: boolean;
  canRetry?: boolean;
  isCompleted?: boolean;
  checkType: string;
  checkName: string;
  itemID: string;
  stepID: string;
  links: Array<{ url: string; message: string }>;
  onHideIssue: (isHidden: boolean) => void;
  onRetryCheck: () => void;
}

export function IssueDescription({
  item,
  isHidden,
  isRetrying,
  canRetry,
  isCompleted,
  checkType,
  checkName,
  itemID,
  stepID,
  links,
  onHideIssue,
  onRetryCheck,
}: IssueDescriptionProps) {
  const styles = useStyles2(getStyles);
  const navigate = useNavigate();
  const { isLLMEnabled } = usePluginContext();
  const [llmSectionOpen, setLlmSectionOpen] = useState(false);
  const { getSuggestion, response, isLoading } = useLLMSuggestion();
  const { trackCheckInteraction } = useInteractionTracker();
  const [localIsRetrying, setLocalIsRetrying] = useState(isRetrying);

  const handleStepClick = useCallback(
    (item: string) => {
      const params = new URLSearchParams(location.search);
      params.set('scrollToStep', item);
      navigate({ search: params.toString() }, { replace: true });
    },
    [navigate]
  );

  const handleAISuggestionClick = useCallback(() => {
    if (!llmSectionOpen) {
      getSuggestion(checkName, stepID, itemID);
    }
    setLlmSectionOpen(!llmSectionOpen);
    trackCheckInteraction(CheckInteractionType.AI_SUGGESTION_CLICKED, checkType, stepID);
  }, [llmSectionOpen, getSuggestion, checkName, stepID, itemID, trackCheckInteraction, checkType]);

  const handleSilenceClick = useCallback(() => {
    onHideIssue(!isHidden);
    trackCheckInteraction(CheckInteractionType.SILENCE_CLICKED, checkType, stepID, {
      silenced: !isHidden,
    });
  }, [onHideIssue, isHidden, trackCheckInteraction, checkType, stepID]);

  const handleRetryClick = () => {
    onRetryCheck();
    trackCheckInteraction(CheckInteractionType.REFRESH_CLICKED, checkType, stepID);
  };

  const handleResolutionClick = useCallback(() => {
    handleStepClick(item);
    trackCheckInteraction(CheckInteractionType.RESOLUTION_CLICKED, checkType, stepID);
  }, [handleStepClick, item, trackCheckInteraction, checkType, stepID]);

  return (
    <div className={isHidden ? styles.issueHidden : styles.issue}>
      <div className={styles.issueReason}>
        {item}
        {isLLMEnabled && (
          <Button
            size="sm"
            className={styles.issueLink}
            icon="ai"
            variant={llmSectionOpen ? 'primary' : 'secondary'}
            title={llmSectionOpen ? 'Hide AI suggestion' : 'Generate AI suggestion'}
            onClick={handleAISuggestionClick}
            aria-label={llmSectionOpen ? 'Hide AI suggestion' : 'Generate AI suggestion'}
          />
        )}
        <Button
          size="sm"
          className={styles.issueLink}
          icon={isHidden ? 'bell' : 'bell-slash'}
          variant="secondary"
          title={isHidden ? 'Show issue' : 'Hide issue'}
          data-testid={testIds.CheckDrillDown.hideButton(item)}
          onClick={handleSilenceClick}
          aria-label={isHidden ? 'Show issue' : 'Hide issue'}
        />
        {canRetry && (
          <Button
            size="sm"
            className={styles.issueLink}
            icon={isRetrying || localIsRetrying ? 'spinner' : 'sync'}
            variant="secondary"
            title="Retry check"
            disabled={isRetrying || localIsRetrying || !isCompleted}
            data-testid={testIds.CheckDrillDown.retryButton(item)}
            onClick={() => {
              setLocalIsRetrying(true);
              handleRetryClick();
              setTimeout(() => {
                // isRetrying and isCompleted can be either instantly true or take some time to change value
                // so this ensures that the user is getting instant visual feedback that the check is being retried
                setLocalIsRetrying(false);
              }, 1000);
            }}
            aria-label="Retry check"
          />
        )}
        {links.map((link) => {
          const extraProps = link.url.startsWith('http') ? { target: 'blank', rel: 'noopener noreferrer' } : {};
          return (
            <a key={link.url} href={link.url} onClick={handleResolutionClick} {...extraProps}>
              <Button
                size="sm"
                className={styles.issueLink}
                icon={getIcon(link.message)}
                variant="secondary"
                data-testid={testIds.CheckDrillDown.actionLink(item, link.message)}
              >
                {link.message}
              </Button>
            </a>
          );
        })}
        {llmSectionOpen && <LLMSuggestionContent isLoading={isLoading} response={response} />}
      </div>
    </div>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  issue: css({
    color: theme.colors.text.secondary,
    backgroundColor: theme.colors.background.secondary,
    padding: theme.spacing(2),
    marginBottom: theme.spacing(1),
    borderColor: 'transparent',
    borderStyle: 'solid',
    ':hover': {
      borderColor: theme.colors.border.strong,
      borderStyle: 'solid',
    },
  }),
  issueHidden: css({
    color: theme.colors.text.secondary,
    backgroundColor: theme.colors.background.secondary,
    padding: theme.spacing(2),
    marginBottom: theme.spacing(1),
    borderColor: 'transparent',
    borderStyle: 'solid',
    ':hover': {
      borderColor: theme.colors.border.strong,
      borderStyle: 'solid',
    },
    opacity: 0.6,
  }),
  issueReason: css({
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeightMedium,
  }),
  issueLink: css({
    float: 'right',
    marginLeft: theme.spacing(1),
  }),
});

const getIcon = (message: string): IconName => {
  message = message.toLowerCase();
  if (message.includes('fix')) {
    return 'wrench';
  } else if (message.includes('info')) {
    return 'document-info';
  } else if (message.includes('upgrade')) {
    return 'arrow-up';
  } else if (message.includes('delete')) {
    return 'trash-alt';
  } else if (message.includes('admin') || message.includes('settings') || message.includes('config')) {
    return 'cog';
  }
  return 'info-circle';
};
