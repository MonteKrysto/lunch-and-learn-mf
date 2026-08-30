import { Component, type ReactNode } from 'react';

// A remote is a runtime dependency — it can fail like one. Without a boundary,
// one crashing remote unmounts the ENTIRE React tree. With one, failure is
// contained to the slot the remote was going to fill.
export class RemoteBoundary extends Component<
  { name: string; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.error(`[remote boundary: ${this.props.name}]`, error);
  }

  render() {
    if (this.state.failed) {
      return (
        <div className="rounded-xl border border-dashed border-destructive/50 bg-destructive/5 p-6 text-sm">
          <p className="font-medium text-destructive">
            The {this.props.name} area couldn&rsquo;t load.
          </p>
          <p className="mt-1 text-muted-foreground">
            The rest of the page is unaffected. Reloading may help.
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}
