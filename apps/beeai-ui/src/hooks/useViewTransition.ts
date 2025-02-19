import { useLocation, useNavigate } from 'react-router';

export function useViewTransition() {
  const location = useLocation();
  const navigate = useNavigate();

  const transitionTo = (path: string) => {
    if (!document.startViewTransition) {
      navigate(path); // Fallback for unsupported browsers
      return;
    }

    document.startViewTransition(() => navigate(path));
  };

  return { transitionTo, location };
}
