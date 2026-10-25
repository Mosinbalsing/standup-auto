import { Navigate, Outlet } from 'react-router-dom';
import { useSession } from '@/features/auth/hooks/useSession';
import { Loader } from '@/components/Loader/Loader';
import { Button } from '@/components/ui/button';
export function ProtectedRoute() {
  const session = useSession();
  if (session.isPending) return <Loader />;
  if (session.isError)
    return (
      <main className="loading-screen">
        <h1>Unable to sign in</h1>
        <p role="alert">{session.error.message}</p>
        <Button onClick={() => session.refetch()}>Retry</Button>
      </main>
    );
  return session.data.user ? <Outlet /> : <Navigate to="/login" replace />;
}
