// The dev-panel is mostly only used for the PoC, it should probably go away once we reach a more stable state.
// It's mostly used to interact with the backend easily, and create / delete / refresh checks.
import React, { useState } from 'react';
import { css } from '@emotion/css';

import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2, Collapse } from '@grafana/ui';

interface Props {
  title: string;
  children: React.ReactNode;
  openByDefault?: boolean;
}

export function DevPanelSection({ title, children, openByDefault = false }: Props) {
  const styles = useStyles2(getStyles);
  const [isOpen, setIsOpen] = useState(openByDefault);

  return (
    <Collapse label={title} isOpen={isOpen} onToggle={() => setIsOpen(!isOpen)}>
      <div className={styles.content}>{children}</div>
    </Collapse>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  content: css({
    color: theme.colors.text.secondary,
    fontSize: theme.typography.bodySmall.fontSize,
    fontFamily: theme.typography.fontFamilyMonospace,
    padding: theme.spacing(1),
  }),
});
