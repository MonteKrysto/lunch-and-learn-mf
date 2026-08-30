import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import { pluginTailwindcss } from '@rsbuild/plugin-tailwindcss';
import { pluginModuleFederation } from '@module-federation/rsbuild-plugin';

// Where do remote files live? Default: each team's own host (localhost ports).
// With ARTIFACT_STORE set (e.g. http://localhost:4400), the build targets a central
// artifact store instead — the S3/Azure-Blob pattern. See docs/workshop/step-6.md.
const STORE = process.env.ARTIFACT_STORE;
const remote = (name: string, port: number) =>
  `${name}@${STORE ? `${STORE}/${name}` : `http://localhost:${port}`}/mf-manifest.json`;

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
        uikit: remote('uikit', 3101),
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
  // A remote's files must resolve to wherever they are actually hosted:
  // its own server by default, or its folder in the artifact store.
  output: { assetPrefix: STORE ? `${STORE}/worklist` : 'http://localhost:3103' },
});
