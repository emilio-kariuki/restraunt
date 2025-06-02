'use client';

import { useState, useEffect } from 'react';
import { 
  ArrowLeft, Users, QrCode, Download, Edit3, Trash2, 
  Calendar, Clock, MapPin, Star, Sparkles, Eye,
  Settings, Copy, Share, ExternalLink, CheckCircle2,
  AlertTriangle, RefreshCw, MoreVertical, Activity
} from 'lucide-react';

interface Table {
  tableNumber: string;
  capacity: number;
  status: 'available' | 'occupied' | 'reserved' | 'cleaning';
  qrCode?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface TableViewProps {
  table: Table;
    restrauntId: string;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onGenerateQR: () => void;
  onDownloadQR: () => void;
}

export default function TableView({ 
  table, 
  restrauntId,
  onClose, 
  onEdit, 
  onDelete, 
  onGenerateQR, 
  onDownloadQR 
}: TableViewProps) {
  const [showQRCode, setShowQRCode] = useState(false);
  const [copied, setCopied] = useState(false);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'occupied':
        return { icon: '🔴', color: 'text-red-600 bg-red-50 border-red-200' };
      case 'available':
        return { icon: '🟢', color: 'text-green-600 bg-green-50 border-green-200' };
      case 'reserved':
        return { icon: '🟡', color: 'text-yellow-600 bg-yellow-50 border-yellow-200' };
      case 'cleaning':
        return { icon: '🧽', color: 'text-blue-600 bg-blue-50 border-blue-200' };
      default:
        return { icon: '⚫', color: 'text-gray-600 bg-gray-50 border-gray-200' };
    }
  };

  const getCapacityIcon = (capacity: number) => {
    if (capacity <= 2) return '👫';
    if (capacity <= 4) return '👨‍👩‍👧‍👦';
    if (capacity <= 6) return '👥';
    return '🏢';
  };

  const copyTableUrl = () => {
    const tableUrl = `${window.location.origin}/table/${restrauntId}/${table.tableNumber}`;
    navigator.clipboard.writeText(tableUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const statusConfig = getStatusIcon(table.status);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-white/20">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 px-8 py-6 rounded-t-3xl relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative flex justify-between items-start">
            <div className="flex items-start space-x-4">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl">
                <Users className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-white mb-2">
                  Table {table.tableNumber}
                </h2>
                <div className="flex items-center space-x-4 text-white/90">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">{getCapacityIcon(table.capacity)}</span>
                    <span className="font-medium">
                      {table.capacity} {table.capacity === 1 ? 'person' : 'people'}
                    </span>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-bold border-2 ${statusConfig.color}`}>
                    {statusConfig.icon} {table.status.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-xl transition-all duration-200"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
          </div>
          <div className="absolute top-4 right-16 opacity-20">
            <Sparkles className="w-12 h-12 text-white" />
          </div>
        </div>

        <div className="p-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Table Information */}
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-200">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  <span>Table Information</span>
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 font-medium">Table Number:</span>
                    <span className="font-bold text-gray-900 text-lg">{table.tableNumber}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 font-medium">Capacity:</span>
                    <span className="font-bold text-gray-900 text-lg">
                      {table.capacity} {table.capacity === 1 ? 'person' : 'people'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 font-medium">Status:</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-bold border-2 ${statusConfig.color}`}>
                      {statusConfig.icon} {table.status.toUpperCase()}
                    </span>
                  </div>
                  {table.createdAt && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 font-medium">Created:</span>
                      <span className="text-gray-900">
                        {new Date(table.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* QR Code Section */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
                  <QrCode className="w-5 h-5 text-green-600" />
                  <span>QR Code Access</span>
                </h3>
                
                {table.qrCode ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-center space-x-2 mb-4">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <p className="text-green-800 font-semibold">QR Code Active</p>
                    </div>
                    
                    {showQRCode ? (
                      <div className="text-center">
                        <div className="w-48 h-48 bg-white rounded-2xl mx-auto flex items-center justify-center border-2 border-green-200 shadow-lg mb-4">
                          <QrCode className="w-24 h-24 text-green-600" />
                        </div>
                        <p className="text-green-700 text-sm font-medium mb-4">
                          Customers can scan this QR code to access your menu
                        </p>
                      </div>
                    ) : (
                      <div className="text-center">
                        <button
                          onClick={() => setShowQRCode(true)}
                          className="w-32 h-32 bg-white rounded-2xl mx-auto flex items-center justify-center border-2 border-green-200 shadow-lg hover:shadow-xl transition-all duration-200 group mb-4"
                        >
                          <Eye className="w-8 h-8 text-green-600 group-hover:scale-110 transition-transform" />
                        </button>
                        <p className="text-green-700 text-sm font-medium">
                          Click to view QR code
                        </p>
                      </div>
                    )}

                    <div className="flex space-x-2">
                      <button
                        onClick={copyTableUrl}
                        className="flex-1 bg-green-100 text-green-700 py-3 rounded-xl hover:bg-green-200 transition-colors font-medium flex items-center justify-center space-x-2"
                      >
                        {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        <span>{copied ? 'Copied!' : 'Copy URL'}</span>
                      </button>
                      <button
                        onClick={onDownloadQR}
                        className="flex-1 bg-green-600 text-white py-3 rounded-xl hover:bg-green-700 transition-colors font-medium flex items-center justify-center space-x-2"
                      >
                        <Download className="w-4 h-4" />
                        <span>Download</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-24 h-24 bg-gray-100 rounded-2xl mx-auto flex items-center justify-center mb-4">
                      <QrCode className="w-12 h-12 text-gray-400" />
                    </div>
                    <p className="text-gray-600 mb-4">No QR code generated yet</p>
                    <button
                      onClick={onGenerateQR}
                      className="bg-green-600 text-white px-6 py-3 rounded-xl hover:bg-green-700 transition-colors font-medium flex items-center space-x-2 mx-auto"
                    >
                      <QrCode className="w-4 h-4" />
                      <span>Generate QR Code</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-lg">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
                  <Settings className="w-5 h-5 text-purple-600" />
                  <span>Quick Actions</span>
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={onEdit}
                    className="bg-blue-50 text-blue-700 py-3 rounded-xl hover:bg-blue-100 transition-colors font-medium flex items-center justify-center space-x-2 border border-blue-200"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>Edit Table</span>
                  </button>
                  <button
                    onClick={() => {/* Handle status change */}}
                    className="bg-yellow-50 text-yellow-700 py-3 rounded-xl hover:bg-yellow-100 transition-colors font-medium flex items-center justify-center space-x-2 border border-yellow-200"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Change Status</span>
                  </button>
                  <button
                    onClick={() => {/* Handle share */}}
                    className="bg-green-50 text-green-700 py-3 rounded-xl hover:bg-green-100 transition-colors font-medium flex items-center justify-center space-x-2 border border-green-200"
                  >
                    <Share className="w-4 h-4" />
                    <span>Share</span>
                  </button>
                  <button
                    onClick={onDelete}
                    className="bg-red-50 text-red-700 py-3 rounded-xl hover:bg-red-100 transition-colors font-medium flex items-center justify-center space-x-2 border border-red-200"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column - Activity & Tips */}
            <div className="space-y-6">
              {/* Activity Status */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-200">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
                  <Activity className="w-5 h-5 text-purple-600" />
                  <span>Current Activity</span>
                </h3>
                <div className="space-y-4">
                  <div className="bg-white rounded-xl p-4 border border-purple-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-700">Status</span>
                      <span className={`px-2 py-1 rounded-lg text-xs font-bold ${statusConfig.color}`}>
                        {table.status.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-gray-600 text-sm">
                      {table.status === 'available' && 'Table is ready for new customers'}
                      {table.status === 'occupied' && 'Customers are currently dining'}
                      {table.status === 'reserved' && 'Table is reserved for upcoming guests'}
                      {table.status === 'cleaning' && 'Table is being cleaned and prepared'}
                    </p>
                  </div>
                  
                  <div className="bg-white rounded-xl p-4 border border-purple-100">
                    <div className="flex items-center space-x-2 mb-2">
                      <Clock className="w-4 h-4 text-purple-600" />
                      <span className="font-medium text-gray-700">Last Updated</span>
                    </div>
                    <p className="text-gray-600 text-sm">
                      {table.updatedAt 
                        ? new Date(table.updatedAt).toLocaleString()
                        : 'Recently created'
                      }
                    </p>
                  </div>
                </div>
              </div>

              {/* Usage Tips */}
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-6 border border-amber-200">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
                  <Star className="w-5 h-5 text-amber-600" />
                  <span>Usage Tips</span>
                </h3>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <QrCode className="w-3 h-3 text-amber-600" />
                    </div>
                    <p className="text-gray-700 text-sm">
                      Print the QR code and place it on the table for easy customer access
                    </p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Share className="w-3 h-3 text-amber-600" />
                    </div>
                    <p className="text-gray-700 text-sm">
                      Share the table URL directly with customers via messaging apps
                    </p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <RefreshCw className="w-3 h-3 text-amber-600" />
                    </div>
                    <p className="text-gray-700 text-sm">
                      Update table status regularly to keep track of availability
                    </p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Users className="w-3 h-3 text-amber-600" />
                    </div>
                    <p className="text-gray-700 text-sm">
                      Adjust capacity as needed based on your restaurant layout
                    </p>
                  </div>
                </div>
              </div>

              {/* Table URL */}
              <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-lg">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
                  <ExternalLink className="w-5 h-5 text-blue-600" />
                  <span>Table URL</span>
                </h3>
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <p className="text-gray-600 text-sm mb-2">Direct link to this table:</p>
                  <div className="flex items-center space-x-2">
                    <code className="flex-1 bg-white px-3 py-2 rounded-lg text-sm text-gray-800 border border-gray-200 truncate">
                      {`${typeof window !== 'undefined' ? window.location.origin : ''}/table/${table.tableNumber}`}
                    </code>
                    <button
                      onClick={copyTableUrl}
                      className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                      {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Close Button */}
          <div className="flex justify-center pt-8 border-t border-gray-200 mt-8">
            <button
              onClick={onClose}
              className="bg-gradient-to-r from-gray-600 to-gray-700 text-white px-8 py-3 rounded-2xl hover:from-gray-700 hover:to-gray-800 transition-all duration-200 font-semibold flex items-center space-x-2 shadow-lg"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Tables</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}