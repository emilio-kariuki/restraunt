'use client';

import { useState } from 'react';
import { X, Plus, Trash2, ChefHat, Leaf, AlertTriangle, Settings } from 'lucide-react';
import { MenuItemForm } from '../../types/admin';

interface MenuItemModalProps {
  editingMenuItem: any;
  menuItemForm: MenuItemForm;
  setMenuItemForm: (form: MenuItemForm) => void;
  onSubmit: () => void;
  onClose: () => void;
  isSubmitting?: boolean;
}

interface Customization {
  id: string;
  name: string;
  type: 'radio' | 'checkbox' | 'select';
  options: Array<{
    name: string;
    price: number;
  }>;
  required: boolean;
  maxSelections?: number;
}

export default function MenuItemModal({ 
  editingMenuItem, 
  menuItemForm, 
  setMenuItemForm, 
  onSubmit, 
  onClose,
  isSubmitting = false
}: MenuItemModalProps) {
  const [activeTab, setActiveTab] = useState<'basic' | 'allergens' | 'customizations'>('basic');
  const [customizations, setCustomizations] = useState<Customization[]>(
    editingMenuItem?.customizations || []
  );

  // Common allergens and dietary restrictions
  const commonAllergens = [
    'Contains Nuts', 'Contains Gluten', 'Contains Dairy', 'Contains Eggs', 
    'Contains Soy', 'Contains Fish', 'Contains Shellfish', 'Contains Sesame'
  ];

  const dietaryOptions = [
    'Vegetarian', 'Vegan', 'Non-Vegetarian', 'Gluten-Free', 'Dairy-Free', 
    'Keto-Friendly', 'Low-Carb', 'High-Protein', 'Organic'
  ];

  // Pizza-specific customizations
  const pizzaCustomizations: Customization[] = [
    {
      id: 'crust',
      name: 'Crust Type',
      type: 'radio',
      options: [
        { name: 'Thin Crust', price: 0 },
        { name: 'Regular Crust', price: 0 },
        { name: 'Thick Crust', price: 2.00 },
        { name: 'Gluten-Free Crust', price: 3.50 }
      ],
      required: true
    },
    {
      id: 'cooking',
      name: 'Cooking Preference',
      type: 'radio',
      options: [
        { name: 'Regular', price: 0 },
        { name: 'Well Done', price: 0 },
        { name: 'Light Cook', price: 0 }
      ],
      required: false
    },
    {
      id: 'toppings',
      name: 'Additional Toppings',
      type: 'checkbox',
      options: [
        { name: 'Extra Cheese', price: 2.50 },
        { name: 'Pepperoni', price: 3.00 },
        { name: 'Mushrooms', price: 2.00 },
        { name: 'Bell Peppers', price: 2.00 },
        { name: 'Olives', price: 2.50 },
        { name: 'Bacon', price: 3.50 },
        { name: 'Pineapple', price: 2.00 },
        { name: 'Jalapeños', price: 1.50 }
      ],
      required: false,
      maxSelections: 5
    }
  ];

  // Burger-specific customizations
  const burgerCustomizations: Customization[] = [
    {
      id: 'patty',
      name: 'Patty Type',
      type: 'radio',
      options: [
        { name: 'Beef Patty', price: 0 },
        { name: 'Chicken Patty', price: 0 },
        { name: 'Turkey Patty', price: 1.00 },
        { name: 'Plant-Based Patty', price: 2.50 },
        { name: 'Double Beef', price: 4.00 }
      ],
      required: true
    },
    {
      id: 'cooking',
      name: 'Cooking Level',
      type: 'radio',
      options: [
        { name: 'Rare', price: 0 },
        { name: 'Medium Rare', price: 0 },
        { name: 'Medium', price: 0 },
        { name: 'Medium Well', price: 0 },
        { name: 'Well Done', price: 0 }
      ],
      required: false
    },
    {
      id: 'extras',
      name: 'Add-ons',
      type: 'checkbox',
      options: [
        { name: 'Extra Cheese', price: 1.50 },
        { name: 'Bacon', price: 2.50 },
        { name: 'Avocado', price: 2.00 },
        { name: 'Pickles', price: 0.50 },
        { name: 'Onion Rings', price: 2.00 },
        { name: 'Mushrooms', price: 1.50 }
      ],
      required: false,
      maxSelections: 5
    }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Combine form data with customizations
    const enhancedForm = {
      ...menuItemForm,
      customizations,
      allergens: (menuItemForm.allergens?.split(',').map(a => a.trim()).filter(Boolean) || []).join(', '),
      dietaryInfo: menuItemForm.dietaryInfo || []
    };
    
    // Update the form with enhanced data before calling onSubmit
    setMenuItemForm(enhancedForm);
    
    // Call onSubmit after a brief delay to ensure state is updated
    setTimeout(() => {
      onSubmit();
    }, 0);
  };

  const addCustomCustomization = () => {
    const newCustomization: Customization = {
      id: `custom_${Date.now()}`,
      name: '',
      type: 'radio',
      options: [{ name: '', price: 0 }],
      required: false
    };
    setCustomizations([...customizations, newCustomization]);
  };

  const updateCustomization = (index: number, updates: Partial<Customization>) => {
    const updated = [...customizations];
    updated[index] = { ...updated[index], ...updates };
    setCustomizations(updated);
  };

  const removeCustomization = (index: number) => {
    setCustomizations(customizations.filter((_, i) => i !== index));
  };

  const loadTemplateCustomizations = (type: 'pizza' | 'burger') => {
    const templates = type === 'pizza' ? pizzaCustomizations : burgerCustomizations;
    setCustomizations(templates);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 text-black">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white/20 backdrop-blur-sm rounded-xl">
                <ChefHat className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">
                  {editingMenuItem ? 'Edit Menu Item' : 'Add New Menu Item'}
                </h3>
                <p className="text-blue-100 text-sm">Configure your menu item with customizations</p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-xl transition-all duration-200 disabled:opacity-50"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 bg-gray-50">
          {[
            { id: 'basic', label: 'Basic Info', icon: ChefHat },
            { id: 'allergens', label: 'Allergens & Diet', icon: AlertTriangle },
            { id: 'customizations', label: 'Customizations', icon: Settings }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 px-6 py-4 flex items-center justify-center space-x-2 font-semibold transition-all ${
                activeTab === tab.id
                  ? 'bg-white text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
        
        <form onSubmit={handleSubmit} className="flex flex-col h-[calc(90vh-200px)]">
          <div className="flex-1 overflow-y-auto p-8">
            {/* Basic Info Tab */}
            {activeTab === 'basic' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Item Name *
                    </label>
                    <input
                      type="text"
                      value={menuItemForm.name}
                      onChange={(e) => setMenuItemForm({ ...menuItemForm, name: e.target.value })}
                      className="w-full p-4 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="Enter item name"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Price ($) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={menuItemForm.price}
                      onChange={(e) => setMenuItemForm({ ...menuItemForm, price: e.target.value })}
                      className="w-full p-4 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="0.00"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Description *
                  </label>
                  <textarea
                    value={menuItemForm.description}
                    onChange={(e) => setMenuItemForm({ ...menuItemForm, description: e.target.value })}
                    className="w-full p-4 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent h-32 resize-none transition-all"
                    placeholder="Describe your delicious item..."
                    required
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Category *
                    </label>
                    <select
                      value={menuItemForm.category}
                      onChange={(e) => setMenuItemForm({ ...menuItemForm, category: e.target.value })}
                      className="w-full p-4 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      required
                    >
                      <option value="">Select category</option>
                      <option value="appetizers">🥗 Appetizers</option>
                      <option value="mains">🍽️ Main Courses</option>
                      <option value="pizza">🍕 Pizza</option>
                      <option value="burgers">🍔 Burgers</option>
                      <option value="desserts">🍰 Desserts</option>
                      <option value="beverages">🥤 Beverages</option>
                      <option value="salads">🥙 Salads</option>
                      <option value="soups">🍲 Soups</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Availability
                    </label>
                    <select
                      value={menuItemForm.available ? 'true' : 'false'}
                      onChange={(e) => setMenuItemForm({ ...menuItemForm, available: e.target.value === 'true' })}
                      className="w-full p-4 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    >
                      <option value="true">✅ Available</option>
                      <option value="false">❌ Not Available</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Allergens & Dietary Tab */}
            {activeTab === 'allergens' && (
              <div className="space-y-8">
                <div>
                  <div className="flex items-center space-x-2 mb-4">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                    <h4 className="text-lg font-semibold text-gray-900">Allergen Information</h4>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {commonAllergens.map(allergen => (
                      <label key={allergen} className="flex items-center space-x-2 p-3 border-2 border-gray-200 rounded-xl hover:border-red-300 cursor-pointer transition-all">
                        <input
                          type="checkbox"
                          checked={menuItemForm.allergens?.includes(allergen) || false}
                          onChange={(e) => {
                            const current = menuItemForm.allergens?.split(',').map(a => a.trim()).filter(Boolean) || [];
                            if (e.target.checked) {
                              setMenuItemForm({ 
                                ...menuItemForm, 
                                allergens: [...current, allergen].join(', ')
                              });
                            } else {
                              setMenuItemForm({ 
                                ...menuItemForm, 
                                allergens: current.filter(a => a !== allergen).join(', ')
                              });
                            }
                          }}
                          className="rounded border-red-300 text-red-600 focus:ring-red-500"
                        />
                        <span className="text-sm font-medium text-gray-700">{allergen}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center space-x-2 mb-4">
                    <Leaf className="w-5 h-5 text-green-500" />
                    <h4 className="text-lg font-semibold text-gray-900">Dietary Information</h4>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {dietaryOptions.map(option => (
                      <label key={option} className="flex items-center space-x-2 p-3 border-2 border-gray-200 rounded-xl hover:border-green-300 cursor-pointer transition-all">
                        <input
                          type="checkbox"
                          checked={menuItemForm.dietaryInfo?.includes(option) || false}
                          onChange={(e) => {
                            const current = menuItemForm.dietaryInfo || [];
                            if (e.target.checked) {
                              setMenuItemForm({ 
                                ...menuItemForm, 
                                dietaryInfo: [...current, option]
                              });
                            } else {
                              setMenuItemForm({ 
                                ...menuItemForm, 
                                dietaryInfo: current.filter(d => d !== option)
                              });
                            }
                          }}
                          className="rounded border-green-300 text-green-600 focus:ring-green-500"
                        />
                        <span className="text-sm font-medium text-gray-700">{option}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Additional Allergen Notes
                  </label>
                  <input
                    type="text"
                    value={menuItemForm.allergenNotes || ''}
                    onChange={(e) => setMenuItemForm({ ...menuItemForm, allergenNotes: e.target.value })}
                    className="w-full p-4 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                    placeholder="e.g., Prepared in a facility that also processes nuts"
                  />
                </div>
              </div>
            )}

            {/* Customizations Tab */}
            {activeTab === 'customizations' && (
              <div className="space-y-6">
                <div className="flex flex-wrap gap-4 mb-6">
                  <button
                    type="button"
                    onClick={() => loadTemplateCustomizations('pizza')}
                    className="px-4 py-2 bg-orange-100 text-orange-800 rounded-xl hover:bg-orange-200 transition-all font-medium"
                  >
                    🍕 Load Pizza Template
                  </button>
                  <button
                    type="button"
                    onClick={() => loadTemplateCustomizations('burger')}
                    className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded-xl hover:bg-yellow-200 transition-all font-medium"
                  >
                    🍔 Load Burger Template
                  </button>
                  <button
                    type="button"
                    onClick={addCustomCustomization}
                    className="px-4 py-2 bg-blue-100 text-blue-800 rounded-xl hover:bg-blue-200 transition-all font-medium flex items-center space-x-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Custom Option</span>
                  </button>
                </div>

                {customizations.map((customization, index) => (
                  <div key={customization.id} className="border-2 border-gray-200 rounded-2xl p-6 space-y-4">
                    <div className="flex justify-between items-center">
                      <input
                        type="text"
                        value={customization.name}
                        onChange={(e) => updateCustomization(index, { name: e.target.value })}
                        className="text-lg font-semibold bg-transparent border-none focus:outline-none flex-1"
                        placeholder="Customization Name"
                      />
                      <button
                        type="button"
                        onClick={() => removeCustomization(index)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <select
                        value={customization.type}
                        onChange={(e) => updateCustomization(index, { type: e.target.value as any })}
                        className="p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="radio">Single Choice</option>
                        <option value="checkbox">Multiple Choice</option>
                        <option value="select">Dropdown</option>
                      </select>

                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={customization.required}
                          onChange={(e) => updateCustomization(index, { required: e.target.checked })}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium">Required</span>
                      </label>

                      {customization.type === 'checkbox' && (
                        <input
                          type="number"
                          min="1"
                          max="10"
                          value={customization.maxSelections || 5}
                          onChange={(e) => updateCustomization(index, { maxSelections: parseInt(e.target.value) })}
                          className="p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                          placeholder="Max selections"
                        />
                      )}
                    </div>

                    <div className="space-y-2">
                      {customization.options.map((option, optIndex) => (
                        <div key={optIndex} className="flex items-center space-x-3">
                          <input
                            type="text"
                            value={option.name}
                            onChange={(e) => {
                              const newOptions = [...customization.options];
                              newOptions[optIndex] = { ...option, name: e.target.value };
                              updateCustomization(index, { options: newOptions });
                            }}
                            className="flex-1 p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                            placeholder="Option name"
                          />
                          <div className="flex items-center space-x-1">
                            <span className="text-sm text-gray-500">$</span>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={option.price}
                              onChange={(e) => {
                                const newOptions = [...customization.options];
                                newOptions[optIndex] = { ...option, price: parseFloat(e.target.value) || 0 };
                                updateCustomization(index, { options: newOptions });
                              }}
                              className="w-20 p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                              placeholder="0.00"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const newOptions = customization.options.filter((_, i) => i !== optIndex);
                              updateCustomization(index, { options: newOptions });
                            }}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => {
                          const newOptions = [...customization.options, { name: '', price: 0 }];
                          updateCustomization(index, { options: newOptions });
                        }}
                        className="w-full p-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-all flex items-center justify-center space-x-2"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add Option</span>
                      </button>
                    </div>
                  </div>
                ))}

                {customizations.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    <Settings className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium mb-2">No customizations added yet</p>
                    <p className="text-sm">Use templates above or add custom options for this item</p>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Footer Actions */}
          <div className="flex space-x-4 p-8 bg-gray-50 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 bg-gray-200 text-gray-800 py-4 rounded-2xl hover:bg-gray-300 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-2xl hover:from-blue-700 hover:to-purple-700 transition-all font-semibold shadow-lg flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <ChefHat className="w-5 h-5" />
                  <span>{editingMenuItem ? 'Update Item' : 'Add Item'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}