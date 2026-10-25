import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './services/api/queryClient';
import { AppRouter } from './navigation/AppRouter';
import { ThemeProvider } from './theme/ThemeProvider';
import { ToastProvider } from './hooks/useToast';
export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <ToastProvider>
          <a className="skip" href="#main">
            Skip to content
          </a>
          <AppRouter />
        </ToastProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
