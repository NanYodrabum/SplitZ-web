import React from 'react';

function WelcomeHeader({ userName }) {
  return (
    <div className="mb-8">
      <h1 className="text-2xl font-semibold mb-2">Welcome back, {userName || 'Friend'}</h1>
      <p className="text-gray-600">Here's your expense overview</p>
    </div>
  );
}

export default WelcomeHeader;