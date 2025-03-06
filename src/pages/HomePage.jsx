import React, { useEffect } from 'react';
import { useNavigate } from 'react-router';
import useUserStore from '../stores/userStore';

function HomePage() {
  const navigate = useNavigate();
  const user = useUserStore((state) => state.user);
  const token = useUserStore((state) => state.token);

  useEffect(() => {
    // If user is logged in, redirect to dashboard
    if (token) {
      navigate('/dashboard', { replace: true });
    } else {
      // If not logged in, redirect to login
      navigate('/login', { replace: true });
    }
  }, [user, token, navigate]);

  // Return a loading state while redirecting
  return <div className="p-8 text-center">Redirecting...</div>;
}

export default HomePage;

