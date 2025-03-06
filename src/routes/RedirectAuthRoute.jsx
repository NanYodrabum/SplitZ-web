import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router';
import useUserStore from '../stores/userStore';

const RedirectAuthRoute = ({ element }) => {
  const token = useUserStore((state) => state.token);
  const navigate = useNavigate();
  const location = useLocation();
  
  useEffect(() => {
    // If user is logged in (has a token), redirect to dashboard
    if (token) {
      navigate('/dashboard', { replace: true });
    }
  }, [token, navigate, location.pathname]);
  
  // If no token (not logged in), render the auth component (login/register)
  if (token) {
    return null; // Render nothing while redirecting
  }
  
  return element;
};

export default RedirectAuthRoute;