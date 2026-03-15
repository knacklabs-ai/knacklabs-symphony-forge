import { createRoute, Link } from '@tanstack/react-router';
import { rootRoute } from './__root';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';

export const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: HomePage,
});

function HomePage() {
  const { isAuthenticated, user, loginDemo, logout } = useAuth();

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border bg-card p-8 shadow-sm">
        <div className="max-w-3xl space-y-4">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary">
            Symphony Forge
          </p>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Ship validated client software with a harness the agents can actually use.
          </h1>
          <p className="text-lg text-muted-foreground">
            This starter gives you a NestJS API, a React app, structural linters, worktree isolation,
            and a Symphony workflow that is opinionated enough to stop chaos before it starts.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link to="/login">Open login flow</Link>
            </Button>
            {isAuthenticated ? (
              <Button variant="outline" onClick={logout}>Sign out {user?.email}</Button>
            ) : (
              <Button variant="secondary" onClick={loginDemo}>Use demo auth</Button>
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          ['Discovery first', 'Push the project through fuzzy idea, domain clarity, validation, and only then scaffold build work.'],
          ['Parallel-safe', 'Each worktree gets isolated ports, containers, and env so multiple agents can build in parallel without stomping each other.'],
          ['Typed end to end', 'Swagger to orval to React hooks. One source of truth beats three drifting copies of the same contract.'],
        ].map(([title, body]) => (
          <article key={title} className="rounded-xl border bg-card p-6">
            <h2 className="mb-2 text-lg font-semibold">{title}</h2>
            <p className="text-sm leading-6 text-muted-foreground">{body}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
