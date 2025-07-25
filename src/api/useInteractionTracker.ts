import { usePluginInteractionReporter } from '@grafana/runtime';
import { useCallback } from 'react';

// Enums for interaction types
export enum CheckInteractionType {
  RESOLUTION_CLICKED = 'resolution_clicked',
  REFRESH_CLICKED = 'refresh_clicked',
  SILENCE_CLICKED = 'silence_clicked',
  AI_SUGGESTION_CLICKED = 'aisuggestion_clicked',
}

export enum GlobalActionType {
  REFRESH_CLICKED = 'refresh_clicked',
  PURGE_CLICKED = 'purge_clicked',
  CONFIGURE_CLICKED = 'configure_clicked',
  TOGGLE_HIDDEN_ISSUES = 'toggle_hidden_issues',
}

// Utility function to normalize names for event properties
function normalizeEventName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '');
}

// Custom hook for tracking user interactions
export function useInteractionTracker() {
  const report = usePluginInteractionReporter();

  // Group toggle tracking
  const trackGroupToggle = useCallback(
    (groupName: string, open: boolean) => {
      const normalizedGroupName = normalizeEventName(groupName);
      report('grafana_plugin_advisor_group_toggled', {
        group: normalizedGroupName,
        open,
      });
    },
    [report]
  );

  // Check interaction tracking
  const trackCheckInteraction = useCallback(
    (
      interactionType: CheckInteractionType,
      checkType: string,
      stepID: string,
      otherProperties?: Record<string, unknown>
    ) => {
      report(`grafana_plugin_advisor_check_interaction`, {
        interaction_type: interactionType,
        check_type: checkType,
        step_id: stepID,
        ...otherProperties,
      });
    },
    [report]
  );

  // Global actions tracking
  const trackGlobalAction = useCallback(
    (actionType: GlobalActionType, otherProperties?: Record<string, unknown>) => {
      report(`grafana_plugin_advisor_global_actions_interaction`, {
        action_type: actionType,
        ...otherProperties,
      });
    },
    [report]
  );

  return {
    trackGroupToggle,
    trackCheckInteraction,
    trackGlobalAction,
  };
}
