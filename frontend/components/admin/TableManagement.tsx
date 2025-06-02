'use client';

import { useState } from 'react';
import { Plus, QrCode, Download, Users, Eye, Settings, MapPin, Star, Sparkles, Edit3, Trash2 } from 'lucide-react';
import { Restaurant } from '../../types/admin';
import { getTableStatusColor } from '../../utils/adminUtils';
import TableView from './TableView';
import TableEditModal from './TableEditModal';

interface TableManagementProps {
  restaurant: Restaurant | null;
  isLoading: boolean;
  onAddTable: () => void;
  onGenerateQR: (tableNumber: string) => void;
  onDownloadQR: () => void;
  onUpdateTable: (tableNumber: string, updates: any) => void;
  onDeleteTable: (tableNumber: string) => void;
}

export default function TableManagement({ 
  restaurant, 
  isLoading, 
  onAddTable, 
  onGenerateQR, 
  onDownloadQR,
  onUpdateTable,
  onDeleteTable
}: TableManagementProps) {
  const [selectedTable, setSelectedTable] = useState<any>(null);
  const [showTableView, setShowTableView] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [tableToDelete, setTableToDelete] = useState<string | null>(null);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'occupied':
        return '🔴';
      case 'available':
        return '🟢';
      case 'reserved':
        return '🟡';
      case 'cleaning':
        return '🧽';
      default:
        return '⚫';
    }
  };

  const getCapacityIcon = (capacity: number) => {
    if (capacity <= 2) return '👫';
    if (capacity <= 4) return '👨‍👩‍👧‍👦';
    if (capacity <= 6) return '👥';
    return '🏢';
  };

  const handleViewTable = (table: any) => {
    setSelectedTable(table);
    setShowTableView(true);
  };

  const handleEditTable = (table?: any) => {
    if (table) {
      setSelectedTable(table);
    }
    setShowTableView(false);
    setShowEditModal(true);
  };

  const handleDeleteConfirm = (tableNumber: string) => {
    setTableToDelete(tableNumber);
  };

  const confirmDelete = () => {
    if (tableToDelete) {
      onDeleteTable(tableToDelete);
      setTableToDelete(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-6 lg:space-y-0">
          <div className="flex items-start space-x-4">
            <div className="p-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl shadow-lg">
              <Users className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                Table Management
              </h2>
              <p className="text-gray-600 mt-2 text-lg">
                Manage restaurant tables, QR codes, and seating arrangements
              </p>
              {restaurant?.tables.length ? (
                <div className="flex items-center space-x-4 mt-3">
                  <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                    {restaurant.tables.length} Tables
                  </span>
                  <span className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                    {restaurant.tables.reduce((sum, table) => sum + Number(table.capacity), 0)} Total Seats
                  </span>
                </div>
              ) : null}
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
            <button 
              onClick={onAddTable}
              className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-4 rounded-2xl hover:from-green-700 hover:to-emerald-700 transition-all duration-300 shadow-lg transform hover:scale-[1.02] flex items-center space-x-2 font-semibold"
            >
              <Plus className="w-5 h-5" />
              <span>Add Table</span>
            </button>
            
            {restaurant?.tables.length ? (
              <button 
                onClick={onDownloadQR}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-4 rounded-2xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg transform hover:scale-[1.02] flex items-center space-x-2 font-semibold"
              >
                <Download className="w-5 h-5" />
                <span>Download All QR</span>
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {/* Content Section */}
      {isLoading ? (
        <div className="bg-white rounded-3xl shadow-xl p-16">
          <div className="text-center">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-6"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <p className="text-gray-600 text-xl font-medium">Loading tables...</p>
            <p className="text-gray-400 mt-2">Setting up your dining space</p>
          </div>
        </div>
      ) : !restaurant?.tables.length ? (
        <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-3xl shadow-xl p-16 text-center relative overflow-hidden">
          <div className="absolute top-4 right-4 opacity-20">
            <Sparkles className="w-16 h-16 text-blue-500" />
          </div>
          <div className="absolute bottom-4 left-4 opacity-20">
            <Star className="w-12 h-12 text-purple-500" />
          </div>
          
          <div className="relative">
            <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg">
              <Users className="w-12 h-12 text-white" />
            </div>
            
            <h3 className="text-2xl font-bold text-gray-900 mb-4">No Tables Yet</h3>
            <p className="text-gray-600 text-lg mb-2">Start setting up your restaurant</p>
            <p className="text-gray-500 mb-8 max-w-md mx-auto">
              Add tables to manage seating, generate QR codes, and enable customer ordering
            </p>
            
            <div className="space-y-4 mb-8">
              <div className="flex items-center justify-center space-x-3 text-gray-600">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <QrCode className="w-4 h-4 text-blue-600" />
                </div>
                <span>Automatic QR code generation</span>
              </div>
              <div className="flex items-center justify-center space-x-3 text-gray-600">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-green-600" />
                </div>
                <span>Easy table management</span>
              </div>
              <div className="flex items-center justify-center space-x-3 text-gray-600">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <Star className="w-4 h-4 text-purple-600" />
                </div>
                <span>Seamless customer experience</span>
              </div>
            </div>
            
            <button 
              onClick={onAddTable}
              className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-8 py-4 rounded-2xl hover:from-green-700 hover:to-emerald-700 transition-all duration-300 transform hover:scale-105 shadow-xl font-semibold text-lg flex items-center space-x-3 mx-auto"
            >
              <Plus className="w-6 h-6" />
              <span>Add Your First Table</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {restaurant.tables.map((table, index) => (
            <div 
              key={table.tableNumber} 
              className="bg-white rounded-3xl shadow-lg hover:shadow-xl border border-gray-100 p-6 transition-all duration-300 transform hover:scale-[1.02] group"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Table Header */}
              <div className="text-center mb-6">
                <div className="relative">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-500 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:shadow-xl transition-all duration-300">
                    <Users className="w-10 h-10 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 text-2xl">
                    {getStatusIcon(table.status)}
                  </div>
                </div>
                
                <h3 className="font-bold text-2xl text-gray-900 mb-2">
                  Table {table.tableNumber}
                </h3>
                
                <div className="flex items-center justify-center space-x-2 mb-3">
                  <span className="text-2xl">{getCapacityIcon(Number(table.capacity))}</span>
                  <span className="text-gray-600 font-medium">
                    {table.capacity} {Number(table.capacity) === 1 ? 'person' : 'people'}
                  </span>
                </div>
                
                <span className={`inline-block px-4 py-2 rounded-full text-sm font-bold border-2 ${getTableStatusColor(table.status)} transition-all duration-200`}>
                  {table.status.toUpperCase()}
                </span>
              </div>

              {/* Table Actions */}
              <div className="space-y-3">
                <button
                  onClick={() => onGenerateQR(table.tableNumber)}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-2xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-semibold flex items-center justify-center space-x-2 shadow-lg transform hover:scale-[1.02]"
                >
                  <QrCode className="w-5 h-5" />
                  <span>Generate QR Code</span>
                </button>
                
                <div className="grid grid-cols-3 gap-2">
                  <button 
                    onClick={() => handleViewTable(table)}
                    className="bg-gray-50 text-gray-700 py-3 rounded-2xl hover:bg-gray-100 transition-all duration-200 font-medium flex items-center justify-center"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleEditTable(table)}
                    className="bg-blue-50 text-blue-700 py-3 rounded-2xl hover:bg-blue-100 transition-all duration-200 font-medium flex items-center justify-center"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleDeleteConfirm(table.tableNumber)}
                    className="bg-red-50 text-red-700 py-3 rounded-2xl hover:bg-red-100 transition-all duration-200 font-medium flex items-center justify-center"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                
                {table.qrCode && (
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-4 text-center">
                    <div className="flex items-center justify-center space-x-2 mb-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <p className="text-green-800 font-semibold text-sm">QR Code Active</p>
                    </div>
                    <div className="w-16 h-16 bg-white rounded-xl mx-auto flex items-center justify-center border-2 border-green-200 shadow-sm">
                      <QrCode className="w-8 h-8 text-green-600" />
                    </div>
                    <p className="text-green-700 text-xs mt-2 font-medium">Ready for customers</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Table View Modal */}
      {showTableView && selectedTable && (
        <TableView
          table={selectedTable}
          restrauntId={restaurant?._id || ''}
          onClose={() => {
            setShowTableView(false);
            setSelectedTable(null);
          }}
          onEdit={() => handleEditTable()}
          onDelete={() => handleDeleteConfirm(selectedTable.tableNumber)}
          onGenerateQR={() => onGenerateQR(selectedTable.tableNumber)}
          onDownloadQR={onDownloadQR}
        />
      )}

      {/* Edit Modal */}
      {showEditModal && selectedTable && (
        <TableEditModal
          table={selectedTable}
          onClose={() => {
            setShowEditModal(false);
            setSelectedTable(null);
          }}
          onUpdate={(updates) => {
            onUpdateTable(selectedTable.tableNumber, updates);
            setShowEditModal(false);
            setSelectedTable(null);
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {tableToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-white/20 p-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trash2 className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Delete Table</h3>
              <p className="text-gray-600 mb-8">
                Are you sure you want to delete Table {tableToDelete}? This action cannot be undone.
              </p>
              <div className="flex space-x-4">
                <button
                  onClick={() => setTableToDelete(null)}
                  className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-2xl hover:bg-gray-200 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 bg-red-600 text-white py-3 rounded-2xl hover:bg-red-700 transition-colors font-medium"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}