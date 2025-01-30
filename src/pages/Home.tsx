import React, { useState } from 'react';
import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2, Drawer, Button } from '@grafana/ui';
import { DevPanel } from '../components/DevPanel';
import { testIds } from '../components/testIds';
import { PluginPage } from '@grafana/runtime';

export default function Home() {
  const s = useStyles2(getStyles);
  const [isDevPanelOpen, setIsDevPanelOpen] = useState(false);

  return (
    <PluginPage>
      <div data-testid={testIds.pageOne.container}>
        This is page one.
        <div className={s.marginTop}>
          <Button data-testid={testIds.pageOne.navigateToFour} onClick={() => setIsDevPanelOpen(true)}>
            Open Dev Panel
          </Button>
        </div>
      </div>

      {/* Dev Panel */}
      {isDevPanelOpen && (
        <Drawer title="Advisor (dev panel)" size="md" onClose={() => setIsDevPanelOpen(false)}>
          <DevPanel />
        </Drawer>
      )}
    </PluginPage>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  marginTop: css`
    margin-top: ${theme.spacing(2)};
  `,
});
