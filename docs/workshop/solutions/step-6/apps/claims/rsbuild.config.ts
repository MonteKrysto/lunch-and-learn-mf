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
  dev: { assetPrefix: 'http://localhost:3102' },  // used by pnpm dev for local development
  // baked into the production build by pnpm build: own server, or store folder
  output: { assetPrefix: STORE ? `${STORE}/claims` : 'http://localhost:3102' },
});
