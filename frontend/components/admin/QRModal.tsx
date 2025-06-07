'use client';

import { X, Download, Copy, Share, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Restaurant } from '../../types/admin';
import { apiService } from '../../lib/api';

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
  const [qrCode, setQrCode] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  
  const tableUrl = `${window.location.origin}/table/${restaurant._id}/${selectedTable}`;
  
  useEffect(() => {
    const fetchQRCode = async () => {
      try {
        setLoading(true);
        const response = await apiService.restaurants.getTableQR(selectedTable, restaurant._id);
        setQrCode(response.qrCode);
      } catch (error: any) {
        console.error('Failed to fetch QR code:', error);
        setError('Failed to generate QR code');
      } finally {
        setLoading(false);
      }
    };

    fetchQRCode();
  }, [selectedTable, restaurant._id]);
  
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
    if (!qrCode) {
      alert('QR code not available for download');
      return;
    }
    
    // Create a download link for the QR code
    const link = document.createElement('a');
    link.href = qrCode;
    link.download = `table-${selectedTable}-qr.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
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
          {/* QR Code Display */}
          <div className="w-64 h-64 bg-gray-100 border-2 border-gray-300 rounded-2xl mx-auto mb-6 flex items-center justify-center">
            {loading ? (
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-sm text-gray-600">Generating QR Code...</p>
              </div>
            ) : error ? (
              <div className="text-center">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <p className="text-sm text-red-600">{error}</p>
                <button 
                  onClick={() => window.location.reload()}
                  className="mt-2 text-blue-600 text-sm hover:underline"
                >
                  Try Again
                </button>
              </div>
            ) : qrCode ? (
              <div className="text-center">
                <img 
                  src={qrCode} 
                  alt={`QR Code for Table ${selectedTable}`}
                  className="w-56 h-56 mx-auto rounded-lg border border-gray-200 bg-white p-4"
                />
                <p className="text-sm text-gray-600 mt-3">Scan to access menu</p>
              </div>
            ) : (
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
            )}
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
                disabled={!qrCode || loading}
                className={`py-3 px-4 rounded-xl transition-all font-semibold flex items-center justify-center ${
                  qrCode && !loading
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
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