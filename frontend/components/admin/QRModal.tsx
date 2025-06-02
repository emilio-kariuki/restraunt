'use client';

import { X, Download, Copy, Share } from 'lucide-react';
import { useState } from 'react';
import { Restaurant } from '../../types/admin';

interface QRModalProps {
  selectedTable: string;
  restaurant: Restaurant;
  onClose: () => void;
  onDownload: () => void;
}

export default function QRModal({ 
  selectedTable, 
  restaurant, 
  onClose, 
  onDownload 
}: QRModalProps) {
  const [copied, setCopied] = useState(false);
  
  const tableUrl = `${window.location.origin}/table/${restaurant._id}/${selectedTable}`;
  
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(tableUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy URL');
    }
  };

  const downloadQR = () => {
    // In a real implementation, you would generate and download the QR code
    // For now, we'll just call the parent's onDownload function
    onDownload();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h3 className="text-xl font-bold text-gray-900">
            QR Code for Table {selectedTable}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-6 text-center">
          {/* QR Code Placeholder */}
          <div className="w-64 h-64 bg-gray-100 border-2 border-dashed border-gray-300 rounded-2xl mx-auto mb-6 flex items-center justify-center">
            <div className="text-center">
              <div className="w-32 h-32 bg-white border border-gray-300 rounded-lg mb-4 mx-auto flex items-center justify-center">
                <div className="grid grid-cols-8 gap-1">
                  {[...Array(64)].map((_, i) => (
                    <div
                      key={i}
                      className={`w-1 h-1 ${Math.random() > 0.5 ? 'bg-black' : 'bg-white'}`}
                    />
                  ))}
                </div>
              </div>
              <p className="text-sm text-gray-600">QR Code Preview</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-sm font-semibold text-gray-700 mb-2">Table URL:</p>
              <div className="flex items-center space-x-2">
                <code className="flex-1 text-xs bg-white border border-gray-300 rounded-lg p-3 text-left font-mono">
                  {tableUrl}
                </code>
                <button
                  onClick={copyToClipboard}
                  className={`p-3 rounded-lg transition-all ${
                    copied 
                      ? 'bg-green-100 text-green-600' 
                      : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                  }`}
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
              {copied && (
                <p className="text-green-600 text-sm mt-2">✓ URL copied to clipboard!</p>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={downloadQR}
                className="bg-blue-600 text-white py-3 px-4 rounded-xl hover:bg-blue-700 transition-all font-semibold flex items-center justify-center"
              >
                <Download className="w-5 h-5 mr-2" />
                Download QR
              </button>
              <button
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: `Table ${selectedTable} - ${restaurant.name}`,
                      url: tableUrl
                    });
                  } else {
                    copyToClipboard();
                  }
                }}
                className="bg-green-600 text-white py-3 px-4 rounded-xl hover:bg-green-700 transition-all font-semibold flex items-center justify-center"
              >
                <Share className="w-5 h-5 mr-2" />
                Share
              </button>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-50 p-6 rounded-b-2xl">
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-900">Instructions:</h4>
            <ul className="text-sm text-gray-600 space-y-2">
              <li>• Print this QR code and place it on Table {selectedTable}</li>
              <li>• Customers can scan to access the digital menu</li>
              <li>• Orders will appear in your admin panel automatically</li>
              <li>• The QR code links directly to this table</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}