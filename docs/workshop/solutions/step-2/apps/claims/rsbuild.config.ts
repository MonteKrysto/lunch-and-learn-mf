import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import { pluginTailwindcss } from '@rsbuild/plugin-tailwindcss';
import { pluginModuleFederation } from '@module-federation/rsbuild-plugin';

export default defineConfig({
  plugins: [
    pluginReact(),
    pluginTailwindcss(),
    pluginModuleFederation({
      name: 'claims',
      exposes: {
        './ClaimsApp': './src/ClaimsApp.tsx',
      },
      shared: {
        react: { singleton: true },
        'react-dom': { singleton: true },
      },
    }),
  ],
  html: { title: 'Claims Management' },
  server: { port: 3102, cors: true },
  dev: { assetPrefix: 'http://localhost:3102' },
  output: { assetPrefix: 'http://localhost:3102' },
});
