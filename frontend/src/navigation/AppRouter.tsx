import { createBrowserRouter, Navigate, RouterProvider, useLocation } from 'react-router-dom';
import { HomeScreen } from '@/features/dashboard/screens/HomeScreen';
import { LoginScreen } from '@/features/auth/screens/LoginScreen';
import { DemoScreen } from '@/features/auth/screens/DemoScreen';
import { WorkspaceLayout } from '@/features/dashboard/components/WorkspaceLayout';
import { lazy, Suspense } from 'react';
import { Loader } from '@/components/Loader/Loader';
const TodayScreen = lazy(() =>
  import('@/features/standup/screens/TodayScreen').then((module) => ({
    default: module.TodayScreen,
  })),
);
const EditStandupScreen = lazy(() =>
  import('@/features/standup/screens/EditStandupScreen').then((module) => ({
    default: module.EditStandupScreen,
  })),
);
const ActivityScreen = lazy(() =>
  import('@/features/dashboard/screens/ActivityScreen').then((module) => ({
    default: module.ActivityScreen,
  })),
);
const ConnectGithubScreen = lazy(() =>
  import('@/features/github/screens/ConnectGithubScreen').then((module) => ({
    default: module.ConnectGithubScreen,
  })),
);
const WeeklyScreen = lazy(() =>
  import('@/features/weekly/screens/WeeklyScreen').then((module) => ({
    default: module.WeeklyScreen,
  })),
);
const SettingsScreen = lazy(() =>
  import('@/features/settings/screens/SettingsScreen').then((module) => ({
    default: module.SettingsScreen,
  })),
);
import { ProtectedRoute } from './ProtectedRoute';
function LegacyRoute() {
  const location = useLocation();
  return (
    <Navigate
      replace
      to={
        new URLSearchParams(location.search).get('demo') === '1'
          ? '/demo'
          : location.hash.replace(/^#/, '') || '/today'
      }
    />
  );
}
const router = createBrowserRouter([
  { path: '/', element: <HomeScreen /> },
  { path: '/login', element: <LoginScreen /> },
  { path: '/demo', element: <DemoScreen /> },
  { path: '/app', element: <LegacyRoute /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <WorkspaceLayout />,
        children: [
          { path: '/today', element: <TodayScreen /> },
          { path: '/standup/:date/edit', element: <EditStandupScreen /> },
          { path: '/activity', element: <ActivityScreen /> },
          { path: '/connect', element: <ConnectGithubScreen /> },
          { path: '/repositories', element: <ConnectGithubScreen /> },
          { path: '/weekly', element: <WeeklyScreen /> },
          { path: '/settings', element: <SettingsScreen /> },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);
export function AppRouter() {
  return (
    <Suspense fallback={<Loader />}>
      <RouterProvider router={router} />
    </Suspense>
  );
}
