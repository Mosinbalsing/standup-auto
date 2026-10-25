import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { TodayScreen } from './TodayScreen';
import { useWorkspaceContext } from '@/features/dashboard/components/WorkspaceLayout';
export function EditStandupScreen() {
  const { date } = useParams(),
    { setDate } = useWorkspaceContext();
  useEffect(() => {
    if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) setDate(date);
  }, [date, setDate]);
  return <TodayScreen />;
}
