import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import { pluginTailwindcss } from '@rsbuild/plugin-tailwindcss';
import { pluginModuleFederation } from '@module-federation/rsbuild-plugin';

// Where do remote files live? Default: each team's own host (localhost ports).
// With ARTIFACT_STORE set (e.g. http://localhost:4400), the build targets a central
// artifact store instead — the S3/Azure-Blob pattern. See docs/workshop/step-6.md.
const STORE = process.env.ARTIFACT_STORE;

export default defineConfig({
  plugins: [
    pluginReact(),
    pluginTailwindcss(),
    pluginModuleFederation({
      name: 'uikit',
      exposes: {
        './ClaimStatusBadge': './src/components/claim-status-badge.tsx',
        './MetricCard': './src/components/metric-card.tsx',
        './AgingBadge': './src/components/aging-badge.tsx',
        './CurrencyText': './src/components/currency-text.tsx',
      },
      shared: {
        react: { singleton: true },
        'react-dom': { singleton: true },
      },
    }),
  ],
  html: { title: 'RCM UI Kit' },
  server: { port: 3101, cors: true },
  // A remote must know its own public URL so chunks/manifest resolve cross-origin.
  dev: { assetPrefix: 'http://localhost:3101' },
  output: { assetPrefix: STORE ? `${STORE}/uikit` : 'http://localhost:3101' },
});
