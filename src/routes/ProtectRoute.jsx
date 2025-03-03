import React from 'react';
import { Navigate } from 'react-router';
import useUserStore from '../stores/userStore';

const ProtectRoute = ({ el }) => {
  const token = useUserStore((state) => state.token);
  
  // If no token, redirect to login
  if (!token) {
    return <Navigate to="/login" />;
  }
  
  // If token exists, render the protected component
  return el;
};

export default ProtectRoute;