import React from 'react';
import { render, screen } from '@testing-library/react';
import { CheckTypeList } from './CheckTypeList';
import { CheckType } from 'generated/endpoints.gen';
import { IGNORE_STEPS_ANNOTATION } from 'api/api';

describe('CheckTypeList', () => {
  const mockUpdateIgnoreStepsAnnotation = jest.fn();
  const mockUpdateCheckTypeState = { isLoading: false };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render nothing when checkTypes is empty', () => {
    const { container } = render(
      <CheckTypeList
        checkTypes={[]}
        updateIgnoreStepsAnnotation={mockUpdateIgnoreStepsAnnotation}
        updateCheckTypeState={mockUpdateCheckTypeState}
      />
    );

    // The container div should be rendered but empty
    expect(container.firstChild).toBeInTheDocument();
    expect(screen.queryByText(/Check type:/)).not.toBeInTheDocument();
  });

  it('should render check type items when checkTypes has items with steps', () => {
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
          ],
        },
        status: {},
      },
    ];

    render(
      <CheckTypeList
        checkTypes={mockCheckTypes}
        updateIgnoreStepsAnnotation={mockUpdateIgnoreStepsAnnotation}
        updateCheckTypeState={mockUpdateCheckTypeState}
      />
    );

    expect(screen.getByText('Check type: Check Type 1')).toBeInTheDocument();
  });

  it('should not render check type items when they have no steps', () => {
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
          steps: [],
        },
        status: {},
      },
    ];

    render(
      <CheckTypeList
        checkTypes={mockCheckTypes}
        updateIgnoreStepsAnnotation={mockUpdateIgnoreStepsAnnotation}
        updateCheckTypeState={mockUpdateCheckTypeState}
      />
    );

    expect(screen.queryByText('Check type: Check Type 1')).not.toBeInTheDocument();
  });
});
