import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../store';

/** Trả về false và chuyển tới /auth nếu chưa đăng nhập */
export function useRequireAuth() {
  const navigate = useNavigate();
  const isAuthenticated = useSelector((s: RootState) => s.auth.isAuthenticated);

  const requireAuth = (returnPath: string): boolean => {
    if (isAuthenticated) return true;
    navigate('/auth', { state: { from: returnPath } });
    return false;
  };

  return { isAuthenticated, requireAuth };
}
