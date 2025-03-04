import React from 'react';
import { Receipt, User, Tag, ArrowLeftRight } from 'lucide-react';

// Format date for display
export const formatDate = (dateString) => {
  if (!dateString) return '';

  const date = new Date(dateString);
  return `${date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`;
};

// Get the appropriate icon for a bill category
export const getCategoryIcon = (category) => {
  switch (category) {
    case 'dining':
      return <Receipt className="text-orange-500" />;
    case 'traveling':
      return <ArrowLeftRight className="text-blue-500" />;
    case 'shopping':
      return <Tag className="text-green-500" />;
    case 'hangout':
      return <User className="text-purple-500" />;
    default:
      return <Receipt className="text-gray-500" />;
  }
};

// This is a utility component file, so we don't need to export a default component
// But we'll create a simple null component to make it a valid .jsx file
const PaymentUtils = () => {
  return null;
};

export default PaymentUtils;