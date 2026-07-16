// Extends the scaffolded Grafana webpack config (`.config/webpack/webpack.config.ts`).
//
// The base config only copies the logo and screenshot images referenced in plugin.json. This
// panel also loads several SVG icons at runtime by absolute path
// (e.g. `public/plugins/esnet-arcdiagram-panel/img/area_zoom_out.svg`), so we copy the whole
// `src/img` directory into `dist/img` to keep those assets available.
import type { Configuration } from 'webpack';
import { merge } from 'webpack-merge';
import CopyWebpackPlugin from 'copy-webpack-plugin';
import grafanaConfig, { type Env } from './.config/webpack/webpack.config';

const config = async (env: Env): Promise<Configuration> => {
  const baseConfig = await grafanaConfig(env);

  return merge(baseConfig, {
    plugins: [
      new CopyWebpackPlugin({
        patterns: [{ from: 'img', to: 'img', force: true }],
      }),
    ],
  });
};

export default config;
