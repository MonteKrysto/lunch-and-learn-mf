import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import { pluginTailwindcss } from '@rsbuild/plugin-tailwindcss';
import { pluginModuleFederation } from '@module-federation/rsbuild-plugin';

export default defineConfig({
  plugins: [
    pluginReact(),
    pluginTailwindcss(),
    pluginModuleFederation({
      name: 'worklist',
      exposes: {
        './WorklistWidget': './src/WorklistWidget.tsx',
      },
      remotes: {
        uikit: 'uikit@http://localhost:3101/mf-manifest.json',
      },
      shared: {
        react: { singleton: true },
        'react-dom': { singleton: true },
        // Singleton so host and remote share ONE module instance -> ONE React context
        // -> the widget picks up the shell's QueryClient (and its cache) automatically.
        '@tanstack/react-query': { singleton: true },
      },
    }),
  ],
  html: { title: 'Denials Worklist' },
  server: { port: 3103, cors: true },
  dev: { assetPrefix: 'http://localhost:3103' },
  output: { assetPrefix: 'http://localhost:3103' },
});
