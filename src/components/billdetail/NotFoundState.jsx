function NotFoundState({ onGoBack }) {
    return (
      <div className="p-6 bg-gray-50 rounded-lg border text-center">
        <h2 className="text-xl font-semibold mb-2">Bill Not Found</h2>
        <p className="text-gray-600">The bill you're looking for doesn't exist or you may not have access to it.</p>
        <button onClick={onGoBack} className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg">Go Back</button>
      </div>
    );
  }
  
  export default NotFoundState;