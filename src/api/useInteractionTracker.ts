import { usePluginInteractionReporter } from '@grafana/runtime';
import { useCallback } from 'react';

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
      interactionType: 'resolution_clicked' | 'refresh_clicked' | 'silence_clicked' | 'aisuggestion_clicked',
      checkType: string,
      stepID: string,
      otherProperties?: Record<string, any>
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
    (actionType: 'refresh_clicked' | 'purge_clicked' | 'configure_clicked') => {
      report(`grafana_plugin_advisor_global_actions_interaction`, {
        action_type: actionType,
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
