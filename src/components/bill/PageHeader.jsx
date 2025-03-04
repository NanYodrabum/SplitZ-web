import React from 'react';
import { ArrowRight, Save } from 'lucide-react';

function PageHeader({ title, onCancel, onSave, isSaving, showActions = false }) {
  if (showActions) {
    return (
      <div className="bg-white border-b mb-6">
        <div className="max-w-5xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <button
              onClick={onCancel}
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowRight className="rotate-180" size={20} />
            </button>
            <h1 className="text-xl font-semibold">{title}</h1>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              onClick={onSave}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : (
                <>
                  <Save size={16} />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white border-b mb-6">
      <div className="max-w-5xl mx-auto px-6 py-4">
        <h1 className="text-xl font-semibold">{title}</h1>
      </div>
    </div>
  );
}

export default PageHeader;