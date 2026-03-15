import { createRoute } from '@tanstack/react-router';
import { rootRoute } from './__root';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';

export const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: LoginPage,
});

function LoginPage() {
  const { loginDemo, isAuthenticated, user } = useAuth();

  return (
    <div className="mx-auto max-w-md rounded-2xl border bg-card p-8 shadow-sm">
      <div className="mb-6 space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
        <p className="text-sm text-muted-foreground">
          Replace this demo action with hosted Cognito login for your client project.
        </p>
      </div>

      <div className="space-y-4">
        <label className="block space-y-2 text-sm">
          <span>Email</span>
          <input
            data-testid="email"
            className="w-full rounded-md border border-input bg-background px-3 py-2 outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
            placeholder="founder@client.com"
            defaultValue="demo@{{PROJECT_NAME}}.local"
          />
        </label>
        <label className="block space-y-2 text-sm">
          <span>Password</span>
          <input
            data-testid="password"
            type="password"
            className="w-full rounded-md border border-input bg-background px-3 py-2 outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
            placeholder="••••••••••••"
            defaultValue="demo-password"
          />
        </label>
        <Button data-testid="submit" className="w-full" onClick={loginDemo}>
          Continue with demo session
        </Button>
        {isAuthenticated ? (
          <p className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
            Signed in as {user?.email}
          </p>
        ) : null}
      </div>
    </div>
  );
}
