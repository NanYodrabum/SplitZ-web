import React from 'react';
import { ArrowRight } from 'lucide-react';

function BackButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="mb-6 flex items-center text-gray-600 hover:text-purple-600"
    >
      <ArrowRight className="rotate-180 mr-2" size={16} />
      <span>Back to Bills</span>
    </button>
  );
}

export default BackButton;