import React from 'react';
import dynamic from 'next/dynamic';
import type { AppProps } from 'next/app';
import { Grommet } from 'grommet';
import { config } from '@fortawesome/fontawesome-svg-core';

import { createErrorBoundary } from 'lib/bugsnag';
import { DebugContext } from 'contexts/DebugContext';

import '@fortawesome/fontawesome-svg-core/styles.css';
import 'styles/globals.css';

import ErrorView from './_error';

config.autoAddCss = false;

const ErrorBoundary = createErrorBoundary();

const ReportIssueModal = dynamic(
  () =>
    import('components/ReportIssueModal').then(
      (mod) => mod.ReportIssueModal as any
    ),
  { ssr: false }
);

function MyApp({ Component, pageProps }: AppProps) {
  const [debugState, setDebugState] = React.useState(null);

  const App = (
    <Grommet full plain style={{ position: 'relative' }}>
      <DebugContext.Provider value={[debugState, setDebugState]}>
        <Component {...pageProps} />
        <ReportIssueModal></ReportIssueModal>
      </DebugContext.Provider>
    </Grommet>
  );

  if (ErrorBoundary) {
    return <ErrorBoundary FallbackComponent={ErrorView}>{App}</ErrorBoundary>;
  }

  return App;
}

export default MyApp;
