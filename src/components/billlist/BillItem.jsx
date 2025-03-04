import React from 'react';
import { Clock, User, Tag, ArrowLeftRight, Receipt, Trash2, Edit } from 'lucide-react';

function BillItem({ bill, userId, onViewBill, onEditBill, onDeleteBill }) {
  const isCreator = bill.creator?.id === userId || bill.userId === userId;

  const getCategoryIcon = (category) => {
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

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="bg-white rounded-xl border p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div className="flex items-start gap-3 cursor-pointer" onClick={() => onViewBill(bill.id)}>
          <div className="p-2 bg-purple-100 rounded-lg">
            {getCategoryIcon(bill.category)}
          </div>
          <div>
            <h2 className="font-semibold text-lg">{bill.name}</h2>
            {bill.description && (
              <p className="text-gray-600 text-sm mb-2 line-clamp-1">{bill.description}</p>
            )}
            <div className="flex items-center gap-3 text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <Clock size={14} />
                <span>{formatDate(bill.date || bill.createdAt)}</span>
              </div>
              <div className="flex items-center gap-1">
                <User size={14} />
                <span>{bill.participants?.length || 0} participants</span>
              </div>
            </div>
          </div>
        </div>
        <div className="text-right">
          <p className="font-bold text-lg">${bill.totalAmount || '0'}</p>
          
          {/* Action buttons - Only show if user is creator */}
          {isCreator && (
            <div className="flex gap-2 mt-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEditBill(bill.id);
                }}
                className="flex items-center gap-1 p-2 bg-blue-100 text-blue-700 rounded-xl hover:bg-blue-200"
                title="Edit Bill"
              >
                <Edit size={14} />
                <span>Edit</span>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteBill(bill.id);
                }}
                className="flex items-center gap-1 p-2 bg-red-100 text-red-700 rounded-xl hover:bg-red-200"
                title="Delete Bill"
              >
                <Trash2 size={14} />
                <span>Delete</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default BillItem;