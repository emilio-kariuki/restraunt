'use client';

import { Plus, Edit, Trash2 } from 'lucide-react';
import { MenuItem } from '../../types/admin';

interface MenuManagementProps {
  menuItems: MenuItem[];
  isLoading: boolean;
  onAddItem: () => void;
  onEditItem: (item: MenuItem) => void;
  onDeleteItem: (id: string) => void;
}

export default function MenuManagement({ 
  menuItems, 
  isLoading, 
  onAddItem, 
  onEditItem, 
  onDeleteItem 
}: MenuManagementProps) {
  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Menu Management</h2>
          <p className="text-gray-600 mt-1">Manage your restaurant menu items</p>
        </div>
        <button 
          onClick={onAddItem}
          className="bg-green-600 text-white px-6 py-3 rounded-xl hover:bg-green-700 transition-all shadow-lg"
        >
          <Plus className="w-5 h-5 inline mr-2" />
          Add Item
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading menu...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {menuItems.map(item => (
            <div key={item._id} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-all">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-gray-900 mb-2">{item.name}</h3>
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">{item.description}</p>
                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-medium">
                      {item.category}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      item.available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {item.available ? 'Available' : 'Unavailable'}
                    </span>
                  </div>
                  {item.allergens && item.allergens.length > 0 && (
                    <p className="text-xs text-orange-600">
                      Allergens: {item.allergens.join(', ')}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <p className="font-bold text-2xl text-gray-900">${item.price.toFixed(2)}</p>
                <div className="flex space-x-2">
                  <button 
                    onClick={() => onEditItem(item)}
                    className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-all"
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => onDeleteItem(item._id)}
                    className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-all"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}