import React from 'react';
import { Route, Routes } from 'react-router-dom';
import { AppRootProps } from '@grafana/data';
const Home = React.lazy(() => import('../../pages/Home'));

export default function App(props: AppRootProps) {
  return (
    <Routes>
      <Route path="*" element={<Home />} />
    </Routes>
  );
}
