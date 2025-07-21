import { renderHook } from '@testing-library/react';
import { useInteractionTracker } from './useInteractionTracker';
import { usePluginInteractionReporter } from '@grafana/runtime';

// Mock @grafana/runtime
jest.mock('@grafana/runtime', () => ({
  usePluginInteractionReporter: jest.fn(),
}));

const mockUsePluginInteractionReporter = usePluginInteractionReporter as jest.MockedFunction<
  typeof usePluginInteractionReporter
>;

describe('useInteractionTracker', () => {
  let mockReport: jest.Mock;

  beforeEach(() => {
    mockReport = jest.fn();
    mockUsePluginInteractionReporter.mockReturnValue(mockReport);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('trackGroupToggle', () => {
    it('should track group toggle with normalized group name and open state', () => {
      const { result } = renderHook(() => useInteractionTracker());

      result.current.trackGroupToggle('Test Group Name', true);

      expect(mockReport).toHaveBeenCalledWith('grafana_plugin_advisor_group_toggled', {
        group: 'test_group_name',
        open: true,
      });
    });

    it('should track group toggle with closed state', () => {
      const { result } = renderHook(() => useInteractionTracker());

      result.current.trackGroupToggle('Another Group', false);

      expect(mockReport).toHaveBeenCalledWith('grafana_plugin_advisor_group_toggled', {
        group: 'another_group',
        open: false,
      });
    });

    it('should normalize group names with special characters', () => {
      const { result } = renderHook(() => useInteractionTracker());

      result.current.trackGroupToggle('Group With @#$% Special Characters!', true);

      expect(mockReport).toHaveBeenCalledWith('grafana_plugin_advisor_group_toggled', {
        group: 'group_with__special_characters',
        open: true,
      });
    });

    it('should handle group names with multiple spaces', () => {
      const { result } = renderHook(() => useInteractionTracker());

      result.current.trackGroupToggle('Group   With    Multiple     Spaces', true);

      expect(mockReport).toHaveBeenCalledWith('grafana_plugin_advisor_group_toggled', {
        group: 'group_with_multiple_spaces',
        open: true,
      });
    });
  });

  describe('trackCheckInteraction', () => {
    it('should track resolution clicked interaction', () => {
      const { result } = renderHook(() => useInteractionTracker());

      result.current.trackCheckInteraction('resolution_clicked', 'performance', 'step_123');

      expect(mockReport).toHaveBeenCalledWith('grafana_plugin_advisor_check_interaction', {
        interaction_type: 'resolution_clicked',
        check_type: 'performance',
        step_id: 'step_123',
      });
    });

    it('should track refresh clicked interaction', () => {
      const { result } = renderHook(() => useInteractionTracker());

      result.current.trackCheckInteraction('refresh_clicked', 'security', 'step_456');

      expect(mockReport).toHaveBeenCalledWith('grafana_plugin_advisor_check_interaction', {
        interaction_type: 'refresh_clicked',
        check_type: 'security',
        step_id: 'step_456',
      });
    });

    it('should track silence clicked interaction', () => {
      const { result } = renderHook(() => useInteractionTracker());

      result.current.trackCheckInteraction('silence_clicked', 'config', 'step_789', {
        silenced: true,
      });

      expect(mockReport).toHaveBeenCalledWith('grafana_plugin_advisor_check_interaction', {
        interaction_type: 'silence_clicked',
        check_type: 'config',
        step_id: 'step_789',
        silenced: true,
      });
    });

    it('should track aisuggestion clicked interaction', () => {
      const { result } = renderHook(() => useInteractionTracker());

      result.current.trackCheckInteraction('aisuggestion_clicked', 'monitoring', 'step_101');

      expect(mockReport).toHaveBeenCalledWith('grafana_plugin_advisor_check_interaction', {
        interaction_type: 'aisuggestion_clicked',
        check_type: 'monitoring',
        step_id: 'step_101',
      });
    });
  });

  describe('trackGlobalAction', () => {
    it('should track refresh clicked global action', () => {
      const { result } = renderHook(() => useInteractionTracker());

      result.current.trackGlobalAction('refresh_clicked');

      expect(mockReport).toHaveBeenCalledWith('grafana_plugin_advisor_global_actions_interaction', {
        action_type: 'refresh_clicked',
      });
    });

    it('should track purge clicked global action', () => {
      const { result } = renderHook(() => useInteractionTracker());

      result.current.trackGlobalAction('purge_clicked');

      expect(mockReport).toHaveBeenCalledWith('grafana_plugin_advisor_global_actions_interaction', {
        action_type: 'purge_clicked',
      });
    });

    it('should track configure clicked global action', () => {
      const { result } = renderHook(() => useInteractionTracker());

      result.current.trackGlobalAction('configure_clicked');

      expect(mockReport).toHaveBeenCalledWith('grafana_plugin_advisor_global_actions_interaction', {
        action_type: 'configure_clicked',
      });
    });
  });

  describe('multiple calls', () => {
    it('should track multiple interactions correctly', () => {
      const { result } = renderHook(() => useInteractionTracker());

      // Make multiple calls
      result.current.trackGroupToggle('Group 1', true);
      result.current.trackCheckInteraction('resolution_clicked', 'type1', 'step1');
      result.current.trackGlobalAction('refresh_clicked');
      result.current.trackGroupToggle('Group 2', false);

      expect(mockReport).toHaveBeenCalledTimes(4);
      expect(mockReport).toHaveBeenNthCalledWith(1, 'grafana_plugin_advisor_group_toggled', {
        group: 'group_1',
        open: true,
      });
      expect(mockReport).toHaveBeenNthCalledWith(2, 'grafana_plugin_advisor_check_interaction', {
        interaction_type: 'resolution_clicked',
        check_type: 'type1',
        step_id: 'step1',
      });
      expect(mockReport).toHaveBeenNthCalledWith(3, 'grafana_plugin_advisor_global_actions_interaction', {
        action_type: 'refresh_clicked',
      });
      expect(mockReport).toHaveBeenNthCalledWith(4, 'grafana_plugin_advisor_group_toggled', {
        group: 'group_2',
        open: false,
      });
    });
  });
});
