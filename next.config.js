const withSourceMaps = require('@zeit/next-source-maps')();
const { BugsnagSourceMapUploaderPlugin } = require('webpack-bugsnag-plugins');

const bugsnagConfig = withSourceMaps({
  // productionBrowserSourceMaps: true,
  serverRuntimeConfig: {
    // Will only be available on the server side
    BUGSNAG_API_KEY: process.env.NEXT_PUBLIC_BUGSNAG_API_KEY,
  },
  publicRuntimeConfig: {
    // Will be available on both server and client
    BUGSNAG_API_KEY: process.env.NEXT_PUBLIC_BUGSNAG_API_KEY, // Pass through env variables
  },
  webpack: (config, options) => {
    if (process.env.NEXT_PUBLIC_BUGSNAG_API_KEY) {
      config.devtool = 'source-map';
      config.plugins.push(
        new BugsnagSourceMapUploaderPlugin({
          apiKey: process.env.NEXT_PUBLIC_BUGSNAG_API_KEY,
          appVersion: require('./package.json').version,
          publicPath: `${process.env.HOSTNAME}/_next/`,
          overwrite: true,
          uploadSource: true,
        })
      );
    }

    return config;
  },
});

module.exports = {
  ...bugsnagConfig,
  eslint: {
    dirs: ['pages', 'components', 'lib', 'hooks', 'contexts', 'utils'],
  },
};
