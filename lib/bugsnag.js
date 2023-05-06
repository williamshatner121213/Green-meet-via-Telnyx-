import Bugsnag from '@bugsnag/js';
import BugsnagPluginReact from '@bugsnag/plugin-react';
import React from 'react';

import packageJson from '../package.json';

if (!Bugsnag._client && process.env.NEXT_PUBLIC_BUGSNAG_API_KEY) {
  Bugsnag.start({
    appVersion: packageJson.version,
    apiKey: process.env.NEXT_PUBLIC_BUGSNAG_API_KEY,
    plugins: [new BugsnagPluginReact()],
    collectUserIp: false,
  });
}

export const notify = (...args) => {
  if (!Bugsnag._client) {
    return;
  }

  Bugsnag.notify(...args);
};

export const createErrorBoundary = () => {
  if (!Bugsnag._client || !Bugsnag.getPlugin('react')) {
    return null;
  }

  return Bugsnag.getPlugin('react').createErrorBoundary(React);
};
