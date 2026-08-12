import { NavLink, Outlet } from 'react-router';
import { cn } from './lib/utils';

const NAV = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/claims', label: 'Claims', end: false },
];

export function Layout() {
  return (
    <div className="flex min-h-screen">
      <aside className="w-56 shrink-0 border-r border-border bg-muted/30 p-4">
        <div className="mb-6 px-2">
          <p className="text-lg font-bold">RCM Console</p>
          <p className="text-xs text-muted-foreground">St. Elsewhere Health System</p>
        </div>
        <nav className="space-y-1">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'block rounded-md px-2 py-1.5 text-sm font-medium',
                  isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-muted',
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="min-w-0 flex-1">
        <Outlet />
      </main>
    </div>
  );
}
