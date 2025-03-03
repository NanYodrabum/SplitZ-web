import React, { useEffect } from 'react';
import { useNavigate } from 'react-router';
import useUserStore from '../stores/userStore';

function HomePage() {
  const navigate = useNavigate();
  const user = useUserStore((state) => state.user);

  useEffect(() => {
    // If user is logged in, redirect to dashboard
    if (user) {
      navigate('/dashboard');
    } else {
      // If not logged in, redirect to login
      navigate('/login');
    }
  }, [user, navigate]);

  // Return a loading state or null while redirecting
  return <div className="p-8 text-center">Redirecting...</div>;
}

export default HomePage;

