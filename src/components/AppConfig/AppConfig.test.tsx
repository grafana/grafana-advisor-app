import React from 'react';
import { render, screen } from '@testing-library/react';
import { AppConfig } from './AppConfig';
import { IGNORE_STEPS_ANNOTATION, IGNORE_STEPS_ANNOTATION_LIST } from 'api/api';
import { CheckType } from 'generated/endpoints.gen';
import userEvent from '@testing-library/user-event';

const mockUseCheckTypes = jest.fn().mockReturnValue({
  checkTypes: [],
  isLoading: false,
  isError: false,
  refetch: jest.fn(),
});
const mockUseSkipCheckTypeStep = jest.fn();

// Mock the hooks used in the component
jest.mock('api/api', () => ({
  ...jest.requireActual('api/api'),
  useCheckTypes: () => mockUseCheckTypes(),
  useSkipCheckTypeStep: () => mockUseSkipCheckTypeStep(),
}));

describe('AppConfig', () => {
  const mockCheckTypes: CheckType[] = [
    {
      apiVersion: 'advisor.grafana.app/v0alpha1',
      kind: 'CheckType',
      metadata: {
        name: 'check-type-1',
        annotations: {
          [IGNORE_STEPS_ANNOTATION]: '1',
        },
      },
      spec: {
        name: 'Check Type 1',
        steps: [
          {
            stepID: 'step1',
            title: 'Step 1',
            description: 'First step description',
            resolution: 'Step 1 resolution',
          },
          {
            stepID: 'step2',
            title: 'Step 2',
            description: 'Second step description',
            resolution: 'Step 2 resolution',
          },
        ],
      },
      status: {},
    },
    {
      apiVersion: 'advisor.grafana.app/v0alpha1',
      kind: 'CheckType',
      metadata: {
        name: 'check-type-2',
        annotations: {
          [IGNORE_STEPS_ANNOTATION]: '1',
          [IGNORE_STEPS_ANNOTATION_LIST]: 'step1',
        },
      },
      spec: {
        name: 'Check Type 2',
        steps: [
          {
            stepID: 'step1',
            title: 'Step 1',
            description: 'First step description',
            resolution: 'Step 1 resolution',
          },
          {
            stepID: 'step2',
            title: 'Step 2',
            description: 'Second step description',
            resolution: 'Step 2 resolution',
          },
        ],
      },
      status: {},
    },
  ];

  const mockUpdateIgnoreStepsAnnotation = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseCheckTypes.mockReturnValue({
      checkTypes: [],
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    });
    mockUseSkipCheckTypeStep.mockReturnValue({
      updateIgnoreStepsAnnotation: mockUpdateIgnoreStepsAnnotation,
      updateCheckTypeState: { isLoading: false },
    });
  });

  it('should display loading when fetching check types', () => {
    mockUseCheckTypes.mockReturnValue({
      checkTypes: [],
      isLoading: true,
      isError: false,
      refetch: jest.fn(),
    });

    render(<AppConfig />);

    expect(screen.getByText('Loading check types...')).toBeInTheDocument();
  });

  it('should display error message when fetching check types fails', () => {
    mockUseCheckTypes.mockReturnValue({
      checkTypes: [],
      isLoading: false,
      isError: true,
      refetch: jest.fn(),
    });

    render(<AppConfig />);

    expect(screen.getByText('Error loading check types')).toBeInTheDocument();
  });

  it('should display message when no check types are available', () => {
    mockUseCheckTypes.mockReturnValue({
      checkTypes: [],
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    });

    render(<AppConfig />);

    expect(screen.getByText('No check types available')).toBeInTheDocument();
  });

  it('should render check types and their steps', () => {
    mockUseCheckTypes.mockReturnValue({
      checkTypes: mockCheckTypes,
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    });

    render(<AppConfig />);

    // Check type headings should be present
    expect(screen.getByText('Check type: Check Type 1')).toBeInTheDocument();
    expect(screen.getByText('Check type: Check Type 2')).toBeInTheDocument();

    // Steps should be present
    expect(screen.getAllByText('Step 1').length).toBe(2);
    expect(screen.getAllByText('Step 2').length).toBe(2);
    expect(screen.getAllByText(/First step description/).length).toBe(2);
    expect(screen.getAllByText(/Second step description/).length).toBe(2);
  });

  it('should set switch states correctly based on ignored steps', () => {
    mockUseCheckTypes.mockReturnValue({
      checkTypes: mockCheckTypes,
      isLoading: false,
      isError: false,
    });

    render(<AppConfig />);

    // Get all switches - there should be 4 (2 per check type)
    const switches = screen.getAllByRole('switch');
    expect(switches.length).toBe(4);

    // For check-type-1, both steps should be enabled (checked)
    expect(switches[0]).toBeChecked();
    expect(switches[1]).toBeChecked();

    // For check-type-2, step1 is in the ignore list, so it should be disabled (unchecked)
    expect(switches[2]).not.toBeChecked();
    expect(switches[3]).toBeChecked();
  });

  it('should call updateIgnoreStepsAnnotation when switch is toggled', async () => {
    mockUseCheckTypes.mockReturnValue({
      checkTypes: mockCheckTypes,
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    });

    render(<AppConfig />);

    const switches = screen.getAllByRole('switch');

    // Toggle the first switch (from enabled to disabled)
    const user = userEvent.setup();
    await user.click(switches[0]);

    // Should call updateIgnoreStepsAnnotation with correct params
    expect(mockUpdateIgnoreStepsAnnotation).toHaveBeenCalledWith(mockCheckTypes[0].metadata.name, ['step1']);

    // Toggle the third switch (already disabled, now enabling)
    await user.click(switches[2]);

    // Should call updateIgnoreStepsAnnotation with correct params
    expect(mockUpdateIgnoreStepsAnnotation).toHaveBeenCalledWith(mockCheckTypes[1].metadata.name, []);
  });

  it('should show message when ignoring steps is not supported', () => {
    const checkTypesWithoutAnnotation = [
      {
        ...mockCheckTypes[0],
        metadata: {
          name: 'check-type-1',
          annotations: {
            [IGNORE_STEPS_ANNOTATION]: '',
          },
        },
      },
    ];

    mockUseCheckTypes.mockReturnValue({
      checkTypes: checkTypesWithoutAnnotation,
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    });

    render(<AppConfig />);

    expect(screen.getByText('Your current version of Grafana does not support ignoring steps')).toBeInTheDocument();

    // Switches should be disabled
    const switches = screen.getAllByRole('switch');
    switches.forEach((switchEl) => {
      expect(switchEl).toBeDisabled();
    });
  });

  it('should disable switches when update is in progress', () => {
    mockUseCheckTypes.mockReturnValue({
      checkTypes: mockCheckTypes,
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    });

    mockUseSkipCheckTypeStep.mockReturnValue({
      updateIgnoreStepsAnnotation: mockUpdateIgnoreStepsAnnotation,
      updateCheckTypeState: { isLoading: true },
    });

    render(<AppConfig />);

    // All switches should be disabled during update
    const switches = screen.getAllByRole('switch');
    switches.forEach((switchEl) => {
      expect(switchEl).toBeDisabled();
    });
  });
});
