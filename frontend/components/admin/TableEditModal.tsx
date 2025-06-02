'use client';

import { useState } from 'react';
import { X, Users, Hash, Info, Sparkles, Edit3, AlertTriangle } from 'lucide-react';

interface Table {
  tableNumber: string;
  capacity: number;
  status: 'available' | 'occupied' | 'reserved' | 'cleaning';
}

interface TableEditModalProps {
  table: Table;
  onClose: () => void;
  onUpdate: (updates: Partial<Table>) => void;
}

export default function TableEditModal({ table, onClose, onUpdate }: TableEditModalProps) {
  const [formData, setFormData] = useState({
    tableNumber: table.tableNumber,
    capacity: table.capacity.toString(),
    status: table.status
  });
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: {[key: string]: string} = {};

    // Validate table number
    if (!formData.tableNumber.trim()) {
      newErrors.tableNumber = 'Table number is required';
    }

    // Validate capacity
    const capacity = parseInt(formData.capacity);
    if (!capacity || capacity < 1) {
      newErrors.capacity = 'Capacity must be at least 1';
    } else if (capacity > 20) {
      newErrors.capacity = 'Capacity cannot exceed 20';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      await onUpdate({
        tableNumber: formData.tableNumber,
        capacity: parseInt(formData.capacity),
        status: formData.status as any
      });
    } catch (error) {
      console.error('Error updating table:', error);
    } finally {
      setIsSubmitting(false);
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
                <Edit3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Edit Table</h3>
                <p className="text-blue-100 text-sm">Update table information</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-xl transition-all duration-200"
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
                value={formData.tableNumber}
                onChange={(e) => setFormData({ ...formData, tableNumber: e.target.value })}
                className={`w-full p-4 pl-12 border-2 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white ${
                  errors.tableNumber ? 'border-red-300 bg-red-50' : 'border-gray-200'
                }`}
                placeholder="e.g., 1, A1, VIP-1"
                required
              />
              <Hash className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            </div>
            {errors.tableNumber && (
              <div className="flex items-center space-x-2 text-red-600 text-sm">
                <AlertTriangle className="w-4 h-4" />
                <span>{errors.tableNumber}</span>
              </div>
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
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                className={`w-full p-4 pl-12 border-2 rounded-2xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white ${
                  errors.capacity ? 'border-red-300 bg-red-50' : 'border-gray-200'
                }`}
                required
              />
              <Users className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            </div>
            {errors.capacity && (
              <div className="flex items-center space-x-2 text-red-600 text-sm">
                <AlertTriangle className="w-4 h-4" />
                <span>{errors.capacity}</span>
              </div>
            )}
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>Minimum: 1 person</span>
              <span>Maximum: 20 people</span>
            </div>
          </div>

          {/* Status Field */}
          <div className="space-y-2">
            <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700">
              <Sparkles className="w-4 h-4 text-purple-500" />
              <span>Status</span>
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as Table['status'] })}
              className="w-full p-4 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white"
            >
              <option value="available">🟢 Available</option>
              <option value="occupied">🔴 Occupied</option>
              <option value="reserved">🟡 Reserved</option>
              <option value="cleaning">🧽 Cleaning</option>
            </select>
            <p className="text-xs text-gray-500 flex items-center space-x-1">
              <Info className="w-3 h-3" />
              <span>Update the current status of this table</span>
            </p>
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
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-2xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-semibold transform hover:scale-[1.02] shadow-lg flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  <span>Updating...</span>
                </>
              ) : (
                <>
                  <Edit3 className="w-5 h-5" />
                  <span>Update Table</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}