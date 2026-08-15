import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import { pluginTailwindcss } from '@rsbuild/plugin-tailwindcss';
import { pluginModuleFederation } from '@module-federation/rsbuild-plugin';

export default defineConfig({
  plugins: [
    pluginReact(),
    pluginTailwindcss(),
    pluginModuleFederation({
      name: 'shell',
      remotes: {
        uikit: 'uikit@http://localhost:3101/mf-manifest.json',
        claims: 'claims@http://localhost:3102/mf-manifest.json',
        worklist: 'worklist@http://localhost:3103/mf-manifest.json',
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
  html: { title: 'RCM Console' },
  server: { port: 3100 },
});
