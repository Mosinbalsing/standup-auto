import { NavLink } from 'react-router-dom';
import { House, Activity, CalendarDays, FolderGit2, Settings } from 'lucide-react';
export const navigation = [
  { path: '/today', name: 'Today', Icon: House },
  { path: '/activity', name: 'Activity', Icon: Activity },
  { path: '/weekly', name: 'Weekly recap', Icon: CalendarDays },
  { path: '/repositories', name: 'Repositories', Icon: FolderGit2 },
  { path: '/settings', name: 'Settings', Icon: Settings },
];
export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="workspace-nav" aria-label="Workspace navigation">
      {navigation.map(({ path, name, Icon }) => (
        <NavLink key={path} to={path} onClick={onNavigate}>
          <Icon size={18} />
          {name}
        </NavLink>
      ))}
    </nav>
  );
}
