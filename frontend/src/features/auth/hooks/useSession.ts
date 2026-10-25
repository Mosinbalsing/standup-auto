import { useQuery } from '@tanstack/react-query';
import { getSession } from '../api/auth.api';
export const useSession = () => useQuery({ queryKey: ['session'], queryFn: getSession });
