export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="text-6xl mb-6">🍽️</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Restaurant QR System
          </h1>
          <p className="text-gray-600 mb-8 leading-relaxed">
            Scan the QR code at your table to view the menu and place your order directly from your phone.
          </p>
          
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <h2 className="font-semibold text-gray-900 mb-3">How it works:</h2>
            <div className="space-y-3 text-sm text-gray-600 text-left">
              <div className="flex items-start">
                <span className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-3 mt-0.5">1</span>
                <span>Scan the QR code at your table</span>
              </div>
              <div className="flex items-start">
                <span className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-3 mt-0.5">2</span>
                <span>Browse the menu and add items to cart</span>
              </div>
              <div className="flex items-start">
                <span className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-3 mt-0.5">3</span>
                <span>Pay securely with your card</span>
              </div>
              <div className="flex items-start">
                <span className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-3 mt-0.5">4</span>
                <span>Track your order status in real-time</span>
              </div>
            </div>
          </div>

          <div className="text-sm text-gray-500">
            <p>Demo: Visit <code className="bg-gray-100 px-2 py-1 rounded">/table/demo/T001</code></p>
          </div>
        </div>
      </div>
    </div>
  );
}