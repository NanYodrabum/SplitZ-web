import React from 'react';

function ErrorState({ errorMessage, onGoBack, onTryAgain }) {
  return (
    <div className="p-6 bg-red-50 rounded-lg border border-red-200 text-center">
      <h2 className="text-xl font-semibold text-red-600 mb-2">Error</h2>
      <p className="text-red-600">{errorMessage}</p>
      <div className="mt-4 flex justify-center gap-3">
        <button onClick={onGoBack} className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">
          Go Back
        </button>
        <button onClick={onTryAgain} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          Try Again
        </button>
      </div>
    </div>
  );
}

export default ErrorState;