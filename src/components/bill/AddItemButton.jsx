import React from 'react';
import { Plus } from 'lucide-react';

function AddItemButton({ onAddItem }) {
  return (
    <button
      className="w-full p-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-blue-300 hover:text-blue-500 flex items-center justify-center gap-2"
      onClick={onAddItem}
    >
      <Plus size={20} />
      Add Another Item
    </button>
  );
}

export default AddItemButton;
