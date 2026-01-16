import type { Configuration } from 'webpack';
import { merge } from 'webpack-merge';
import grafanaConfig, { Env } from './.config/webpack/webpack.config';

const config = async (env: Env): Promise<Configuration> => {
  const baseConfig = await grafanaConfig(env);

  // Manually merge externals to ensure we append to the existing array
  const existingExternals = Array.isArray(baseConfig.externals)
    ? baseConfig.externals
    : baseConfig.externals
      ? [baseConfig.externals]
      : [];

  return merge(baseConfig, {
    // Externalize react/jsx-runtime and react/jsx-dev-runtime to align with runtime version of react.
    // This is required for React 19 compatibility and makes major react updates easier to manage.
    externals: [...existingExternals, 'react/jsx-runtime', 'react/jsx-dev-runtime'],
  });
};

export default config;
