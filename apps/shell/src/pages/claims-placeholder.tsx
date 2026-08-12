export function ClaimsPlaceholder() {
  return (
    <div className="p-6">
      <h1 className="text-xl font-bold">Claims</h1>
      <p className="mt-2 max-w-prose text-sm text-muted-foreground">
        The claims team ships their own app on port 3102. In step 2 of the session, their entire
        app — routing and all — gets mounted right here via module federation.
      </p>
    </div>
  );
}
