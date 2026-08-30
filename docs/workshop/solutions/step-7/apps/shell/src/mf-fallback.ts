// Module Federation runtime plugin: makes remote failures graceful instead of fatal.
//
// Two failure points, two hooks into one lifecycle callback:
//  - 'afterResolve': a remote's mf-manifest.json couldn't be fetched (host down /
//    CDN unreachable). Without this, the failure can take out the whole page at boot.
//    We hand back an empty stub manifest so the runtime keeps going; the exposes
//    then fail individually and fall into the case below.
//  - 'onLoad': a specific exposed module couldn't load. We hand back a tiny
//    placeholder component so the slot renders a notice instead of crashing.
//
// Registered via `runtimePlugins` in rsbuild.config.ts. Every consumer owns its own
// resilience: this covers the shell's loads (worklist's uikit loads are its own job).
const resiliencePlugin = () => ({
  name: 'resilience-plugin',
  async errorLoadRemote(args: { id: string; lifecycle: string; error?: unknown }) {
    console.warn(`[mf] failed to load '${args.id}' during '${args.lifecycle}'`, args.error);

    if (args.lifecycle === 'afterResolve') {
      // Stub manifest: shaped like a real one, but its remoteEntry points nowhere.
      // Boot survives; the individual module loads then fail into 'onLoad' below.
      return {
        id: args.id,
        name: args.id,
        metaData: {
          name: args.id,
          type: 'app',
          buildInfo: { buildVersion: '0.0.0', buildName: args.id },
          remoteEntry: { name: 'remoteEntry.js', path: '', type: 'global' },
          types: { path: '', name: '', zip: '', api: '' },
          globalName: args.id,
          pluginVersion: '',
          publicPath: 'https://unreachable.invalid/',
        },
        shared: [],
        remotes: [],
        exposes: [],
      };
    }

    if (args.lifecycle === 'onLoad') {
      // React is a shared singleton; import it lazily so the plugin never races it.
      const React = await import('react');
      const RemoteUnavailable = () =>
        React.createElement(
          'div',
          {
            style: {
              padding: '14px 16px',
              border: '1px dashed #d9899c',
              borderRadius: '10px',
              color: '#8c97a8',
              fontSize: '13px',
            },
          },
          `"${args.id}" is unavailable right now.`,
        );
      return () => ({ __esModule: true, default: RemoteUnavailable });
    }

    return args;
  },
});

export default resiliencePlugin;
