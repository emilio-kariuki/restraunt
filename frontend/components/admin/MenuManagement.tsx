'use client';

import { useState } from 'react';
import { ChefHat, Plus, Edit, Trash2, DollarSign, Clock, Star, Eye, EyeOff } from 'lucide-react';
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
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Get unique categories
  const categories = ['all', ...new Set(menuItems.map(item => item.category))];

  // Filter items
  const filteredItems = menuItems.filter(item => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getCategoryIcon = (category: string) => {
    const icons: { [key: string]: string } = {
      appetizers: '🥗',
      mains: '🍽️',
      pizza: '🍕',
      burgers: '🍔',
      desserts: '🍰',
      beverages: '🥤',
      salads: '🥙',
      soups: '🍲'
    };
    return icons[category] || '🍴';
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 flex items-center space-x-3">
            <ChefHat className="w-8 h-8 text-blue-600" />
            <span>Menu Management</span>
          </h2>
          <p className="text-gray-600 mt-2">Manage your restaurant's menu items and pricing</p>
        </div>
        <button
          onClick={onAddItem}
          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-2xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg flex items-center space-x-2 transform hover:scale-105"
        >
          <Plus className="w-5 h-5" />
          <span>Add Menu Item</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
        <div className="flex flex-col lg:flex-row space-y-4 lg:space-y-0 lg:space-x-6">
          {/* Search */}
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search menu items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full p-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Category Filter */}
          <div className="lg:w-64">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full p-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Categories</option>
              {categories.filter(cat => cat !== 'all').map(category => (
                <option key={category} value={category}>
                  {getCategoryIcon(category)} {category.charAt(0).toUpperCase() + category.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Menu Items Grid */}
      {isLoading ? (
        <div className="text-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading menu items...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl shadow-lg border border-gray-200">
          <ChefHat className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            {menuItems.length === 0 ? 'No menu items yet' : 'No items match your search'}
          </h3>
          <p className="text-gray-500 mb-6">
            {menuItems.length === 0 
              ? 'Start building your menu by adding your first item'
              : 'Try adjusting your search or category filter'
            }
          </p>
          {menuItems.length === 0 && (
            <button
              onClick={onAddItem}
              className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-all duration-200"
            >
              Add First Menu Item
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredItems.map(item => (
            <div key={item._id} className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]">
              {/* Item Header */}
              <div className="p-6 border-b border-gray-100">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{getCategoryIcon(item.category)}</span>
                    <div>
                      <h3 className="font-bold text-gray-900 text-lg leading-tight">{item.name}</h3>
                      <span className="text-sm text-gray-500 capitalize bg-gray-100 px-2 py-1 rounded-lg">
                        {item.category}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {item.available ? (
                      <Eye className="w-5 h-5 text-green-500"  />
                    ) : (
                      <EyeOff className="w-5 h-5 text-red-500" />
                    )}
                  </div>
                </div>
                
                <p className="text-gray-600 text-sm line-clamp-2 leading-relaxed">{item.description}</p>
              </div>

              {/* Item Details */}
              <div className="p-6">
                {/* Price */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="w-5 h-5 text-green-600" />
                    <span className="text-2xl font-bold text-green-600">{formatPrice(item.price)}</span>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    item.available 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {item.available ? 'Available' : 'Unavailable'}
                  </div>
                </div>

                {/* Dietary Info */}
                {item.dietaryInfo && item.dietaryInfo.length > 0 && (
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-1">
                      {item.dietaryInfo.slice(0, 3).map(info => (
                        <span key={info} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-lg">
                          {info}
                        </span>
                      ))}
                      {item.dietaryInfo.length > 3 && (
                        <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-lg">
                          +{item.dietaryInfo.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Allergens */}
                {item.allergens && item.allergens.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs text-red-600 font-medium mb-1">Allergens:</p>
                    <div className="flex flex-wrap gap-1">
                      {(Array.isArray(item.allergens) ? item.allergens : [item.allergens]).slice(0, 2).map(allergen => (
                        <span key={allergen} className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-lg">
                          {allergen}
                        </span>
                      ))}
                      {(Array.isArray(item.allergens) ? item.allergens : [item.allergens]).length > 2 && (
                        <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-lg">
                          +{(Array.isArray(item.allergens) ? item.allergens : [item.allergens]).length - 2} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Customizations */}
                {item.customizations && item.customizations.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs text-purple-600 font-medium mb-1">Customizations:</p>
                    <div className="flex flex-wrap gap-1">
                      {item.customizations.slice(0, 2).map(custom => (
                        <span key={custom.id} className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-lg">
                          {custom.name}
                        </span>
                      ))}
                      {item.customizations.length > 2 && (
                        <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-lg">
                          +{item.customizations.length - 2} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex space-x-3 pt-4 border-t border-gray-100">
                  <button
                    onClick={() => onEditItem(item)}
                    className="flex-1 bg-blue-50 text-blue-700 py-2 px-4 rounded-xl hover:bg-blue-100 transition-all duration-200 flex items-center justify-center space-x-2 font-medium"
                  >
                    <Edit className="w-4 h-4" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => onDeleteItem(item._id)}
                    className="flex-1 bg-red-50 text-red-700 py-2 px-4 rounded-xl hover:bg-red-100 transition-all duration-200 flex items-center justify-center space-x-2 font-medium"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary Stats */}
      {menuItems.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Menu Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{menuItems.length}</div>
              <div className="text-sm text-gray-600">Total Items</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {menuItems.filter(item => item.available).length}
              </div>
              <div className="text-sm text-gray-600">Available</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {menuItems.filter(item => !item.available).length}
              </div>
              <div className="text-sm text-gray-600">Unavailable</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{categories.length - 1}</div>
              <div className="text-sm text-gray-600">Categories</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}