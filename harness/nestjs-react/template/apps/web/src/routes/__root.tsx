import { Outlet, createRootRoute, Link } from '@tanstack/react-router';
import { QueryClientDevtools } from '@tanstack/react-query-devtools';

export const rootRoute = createRootRoute({
  component: RootLayout,
});

function RootLayout() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b bg-card">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="text-lg font-semibold tracking-tight">
            {{PROJECT_PASCAL}}
          </Link>
          <nav className="flex items-center gap-4 text-sm text-muted-foreground">
            <Link to="/">Home</Link>
            <Link to="/login">Login</Link>
          </nav>
        </div>
      </header>
      <main className="container py-8">
        <Outlet />
      </main>
      <QueryClientDevtools initialIsOpen={false} />
    </div>
  );
}
