import { useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { loginDemo } from '../api/auth.api';
import { useSession } from '../hooks/useSession';
import { Loader } from '@/components/Loader/Loader';
import { Button } from '@/components/ui/button';
export function DemoScreen() {
  const session = useSession(),
    client = useQueryClient(),
    navigate = useNavigate();
  const login = useMutation({
    mutationFn: loginDemo,
    onSuccess: async () => {
      await client.invalidateQueries({ queryKey: ['session'] });
      navigate('/repositories', { replace: true });
    },
  });
  useEffect(() => {
    if (!session.data) return;
    if (session.data.user) {
      navigate('/repositories', { replace: true });
      return;
    }
    if (login.isIdle) login.mutate();
  }, [session.data, login.isIdle, navigate]);
  if (login.error || session.error)
    return (
      <main className="loading-screen">
        <h1>Unable to open demo</h1>
        <p role="alert">{(login.error || session.error)?.message}</p>
        <Button onClick={() => login.mutate()}>Retry</Button>
      </main>
    );
  return <Loader />;
}
