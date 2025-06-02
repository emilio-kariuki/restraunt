'use client';

import { useState } from 'react';
import { X, Users, Hash, Info, Sparkles, AlertTriangle } from 'lucide-react';
import { TableForm } from '../../types/admin';

interface TableModalProps {
  tableForm: TableForm;
  setTableForm: (form: TableForm) => void;
  onSubmit: () => void;
  onClose: () => void;
  isSubmitting?: boolean;
}

export default function TableModal({ 
  tableForm, 
  setTableForm, 
  onSubmit, 
  onClose,
  isSubmitting = false
}: TableModalProps) {
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  const validateForm = (): boolean => {
    const newErrors: {[key: string]: string} = {};

    // Validate table number
    if (!tableForm.tableNumber.trim()) {
      newErrors.tableNumber = 'Table number is required';
    } else if (tableForm.tableNumber.trim().length > 20) {
      newErrors.tableNumber = 'Table number is too long';
    }

    // Validate capacity
    const capacity = parseInt(tableForm.capacity);
    if (!tableForm.capacity || isNaN(capacity)) {
      newErrors.capacity = 'Capacity is required';
    } else if (capacity < 1) {
      newErrors.capacity = 'Capacity must be at least 1';
    } else if (capacity > 20) {
      newErrors.capacity = 'Capacity cannot exceed 20';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    onSubmit();
  };

  const handleTableNumberChange = (value: string) => {
    setTableForm({ ...tableForm, tableNumber: value });
    // Clear error when user starts typing
    if (errors.tableNumber) {
      setErrors(prev => ({ ...prev, tableNumber: '' }));
    }
  };

  const handleCapacityChange = (value: string) => {
    setTableForm({ ...tableForm, capacity: value });
    // Clear error when user starts typing
    if (errors.capacity) {
      setErrors(prev => ({ ...prev, capacity: '' }));
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 text-black">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-white/20 transform transition-all duration-300 scale-100">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-6 rounded-t-3xl">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white/20 backdrop-blur-sm rounded-xl">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Add New Table</h3>
                <p className="text-blue-100 text-sm">Create a new dining table</p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {/* Table Number Field */}
          <div className="space-y-2">
            <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700">
              <Hash className="w-4 h-4 text-blue-500" />
              <span>Table Number</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={tableForm.tableNumber}
                onChange={(e) => handleTableNumberChange(e.target.value)}
                className={`w-full p-4 pl-12 border-2 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white ${
                  errors.tableNumber ? 'border-red-300 bg-red-50' : 'border-gray-200'
                }`}
                placeholder="e.g., 1, A1, VIP-1"
                disabled={isSubmitting}
                required
              />
              <Hash className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            </div>
            {errors.tableNumber ? (
              <div className="flex items-center space-x-2 text-red-600 text-sm">
                <AlertTriangle className="w-4 h-4" />
                <span>{errors.tableNumber}</span>
              </div>
            ) : (
              <p className="text-xs text-gray-500 flex items-center space-x-1">
                <Info className="w-3 h-3" />
                <span>Use letters, numbers, or combinations</span>
              </p>
            )}
          </div>
          
          {/* Capacity Field */}
          <div className="space-y-2">
            <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700">
              <Users className="w-4 h-4 text-green-500" />
              <span>Capacity (Number of Seats)</span>
            </label>
            <div className="relative">
              <input
                type="number"
                min="1"
                max="20"
                value={tableForm.capacity}
                onChange={(e) => handleCapacityChange(e.target.value)}
                className={`w-full p-4 pl-12 border-2 rounded-2xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white ${
                  errors.capacity ? 'border-red-300 bg-red-50' : 'border-gray-200'
                }`}
                placeholder="4"
                disabled={isSubmitting}
                required
              />
              <Users className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            </div>
            {errors.capacity ? (
              <div className="flex items-center space-x-2 text-red-600 text-sm">
                <AlertTriangle className="w-4 h-4" />
                <span>{errors.capacity}</span>
              </div>
            ) : (
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Minimum: 1 person</span>
                <span>Maximum: 20 people</span>
              </div>
            )}
          </div>
          
          {/* Info Box */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute top-2 right-2 opacity-20">
              <Sparkles className="w-8 h-8 text-blue-500" />
            </div>
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-blue-100 rounded-xl flex-shrink-0">
                <Info className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="font-semibold text-blue-900 mb-2">Automatic QR Code Generation</p>
                <p className="text-blue-800 text-sm leading-relaxed">
                  A unique QR code will be automatically generated for this table after creation. 
                  Customers can scan it to access your menu and place orders directly.
                </p>
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex space-x-4 pt-6">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 bg-gray-100 text-gray-700 py-4 rounded-2xl hover:bg-gray-200 transition-all duration-200 font-semibold transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white py-4 rounded-2xl hover:from-green-700 hover:to-emerald-700 transition-all duration-200 font-semibold transform hover:scale-[1.02] shadow-lg flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  <span>Adding Table...</span>
                </>
              ) : (
                <>
                  <Users className="w-5 h-5" />
                  <span>Add Table</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}