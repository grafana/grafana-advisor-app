import React, { useEffect, useState } from 'react';
import { Alert } from '@grafana/ui';
import { usePluginUserStorage } from '@grafana/runtime';

interface InfoNotificationProps {
  id: string;
  title: string;
  text: string;
}

export function InfoNotification({ id, title, text }: InfoNotificationProps) {
  const userStorage = usePluginUserStorage();
  const [showInfoNotification, setShowInfoNotification] = useState(false);

  useEffect(() => {
    userStorage.getItem(id).then((value) => {
      if (!value || value === 'true') {
        setShowInfoNotification(true);
      }
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleClose = () => {
    userStorage.setItem(id, 'false');
    setShowInfoNotification(false);
  };

  return (
    showInfoNotification && (
      <Alert severity="info" title={title} onRemove={handleClose}>
        {text}
      </Alert>
    )
  );
}

export default InfoNotification;
