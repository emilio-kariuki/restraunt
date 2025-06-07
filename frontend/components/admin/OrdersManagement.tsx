'use client';

import { RefreshCw, Package, AlertTriangle, Utensils, FileText } from 'lucide-react';
import { Order } from '../../types/admin';
import { getStatusColor, formatDate, getStatusButtonText, getNextStatus } from '../../utils/adminUtils';

interface OrdersManagementProps {
  orders: Order[];
  isLoading: boolean;
  onRefresh: () => void;
  onUpdateOrderStatus: (orderId: string, newStatus: string) => void;
}

export default function OrdersManagement({ 
  orders, 
  isLoading, 
  onRefresh, 
  onUpdateOrderStatus 
}: OrdersManagementProps) {
  // Helper function to check if order has allergen concerns
  const hasAllergenConcerns = (order: Order) => {
    return order.hasAllergenConcerns || 
           order.orderAllergenSummary?.hasAllergenConcerns ||
           order.items.some(item => 
             (item.allergenPreferences?.avoidAllergens?.length ?? 0) > 0 ||
             item.allergenPreferences?.specialInstructions?.trim() ||
             (item.allergenPreferences?.dietaryPreferences?.length ?? 0) > 0
           );
  };

  // Helper function to get all allergen info for an order
  const getAllergenInfo = (order: Order) => {
    const allAvoidedAllergens = new Set<string>();
    const allDietaryPrefs = new Set<string>();
    const specialInstructions: string[] = [];

    order.items.forEach(item => {
      if (item.allergenPreferences) {
        // Collect avoided allergens
        item.allergenPreferences.avoidAllergens?.forEach(allergen => {
          if (allergen?.trim()) allAvoidedAllergens.add(allergen);
        });

        // Collect dietary preferences
        item.allergenPreferences.dietaryPreferences?.forEach(pref => {
          if (pref?.trim()) allDietaryPrefs.add(pref);
        });

        // Collect special instructions
        if (item.allergenPreferences.specialInstructions?.trim()) {
          specialInstructions.push(`${item.name}: ${item.allergenPreferences.specialInstructions}`);
        }
      }
    });

    return {
      avoidedAllergens: Array.from(allAvoidedAllergens),
      dietaryPreferences: Array.from(allDietaryPrefs),
      specialInstructions
    };
  };

  // Debug: Log order data to see what we're receiving
  console.log('Orders received in OrdersManagement:', orders.length > 0 ? {
    firstOrder: orders[0],
    hasAllergenData: orders[0]?.items?.some(item => 
      item.allergenPreferences && (
        item.allergenPreferences.avoidAllergens?.length > 0 ||
        item.allergenPreferences.dietaryPreferences?.length > 0 ||
        item.allergenPreferences.specialInstructions
      )
    )
  } : 'No orders');

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Active Orders</h2>
          <p className="text-gray-600 mt-1">Manage and track customer orders</p>
        </div>
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-all flex items-center disabled:opacity-50"
        >
          <RefreshCw className={`w-5 h-5 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading orders...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl shadow-sm border border-gray-200">
          <Package className="w-20 h-20 text-gray-300 mx-auto mb-6" />
          <p className="text-gray-500 text-xl font-medium mb-2">No active orders</p>
          <p className="text-gray-400">Orders will appear here when customers place them</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {orders.map(order => {
            const allergenInfo = getAllergenInfo(order);
            const hasAllergens = hasAllergenConcerns(order);

            return (
              <div 
                key={order._id} 
                className={`bg-white rounded-2xl shadow-sm border p-6 hover:shadow-lg transition-all ${
                  hasAllergens ? 'border-orange-200 bg-orange-50/30' : 'border-gray-200'
                }`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-lg text-gray-900">
                        Table {order.tableId}
                      </h3>
                      {hasAllergens && (
                        <AlertTriangle className="w-5 h-5 text-orange-500" />
                      )}
                    </div>
                    <p className="text-gray-600 text-sm">
                      Order #{order._id.slice(-6)}
                    </p>
                    {order.customerName && (
                      <p className="text-gray-600 text-sm">
                        {order.customerName}
                      </p>
                    )}
                    <p className="text-gray-500 text-xs mt-1">
                      {formatDate(order.createdAt)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900">${order.total.toFixed(2)}</p>
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </div>
                </div>

                {/* Allergen Alert Section */}
                {hasAllergens && (
                  <div className="mb-4 p-3 bg-orange-100 border border-orange-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-4 h-4 text-orange-600" />
                      <h5 className="font-semibold text-orange-800 text-sm">Allergen Alert</h5>
                    </div>
                    
                    {allergenInfo.avoidedAllergens.length > 0 && (
                      <div className="mb-2">
                        <p className="text-xs font-medium text-orange-700 mb-1">Avoid Allergens:</p>
                        <div className="flex flex-wrap gap-1">
                          {allergenInfo.avoidedAllergens.map((allergen, idx) => (
                            <span 
                              key={idx}
                              className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full border border-red-200"
                            >
                              {allergen}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {allergenInfo.dietaryPreferences.length > 0 && (
                      <div className="mb-2">
                        <p className="text-xs font-medium text-orange-700 mb-1">Dietary Preferences:</p>
                        <div className="flex flex-wrap gap-1">
                          {allergenInfo.dietaryPreferences.map((pref, idx) => (
                            <span 
                              key={idx}
                              className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full border border-green-200"
                            >
                              {pref}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {allergenInfo.specialInstructions.length > 0 && (
                      <div className="mb-2">
                        <p className="text-xs font-medium text-orange-700 mb-1">Special Instructions:</p>
                        <div className="space-y-1">
                          {allergenInfo.specialInstructions.map((instruction, idx) => (
                            <p key={idx} className="text-xs text-orange-800 bg-yellow-50 p-2 rounded border border-yellow-200">
                              {instruction}
                            </p>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="mb-6">
                  <h4 className="font-semibold mb-3 text-gray-900">Order Items:</h4>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {order.items.map((item, index) => {
                      const itemHasAllergens = (item.allergenPreferences?.avoidAllergens?.length ?? 0) > 0 ||
                                             item.allergenPreferences?.specialInstructions?.trim() ||
                                             (item.allergenPreferences?.dietaryPreferences?.length ?? 0) > 0;

                      return (
                        <div 
                          key={index} 
                          className={`p-3 rounded-lg border ${
                            itemHasAllergens ? 'bg-orange-50 border-orange-200' : 'bg-gray-50 border-gray-200'
                          }`}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-gray-800 font-medium">{item.quantity}x {item.name}</span>
                              {itemHasAllergens && (
                                <div className="flex gap-1">
                                  {(item.allergenPreferences?.avoidAllergens?.length ?? 0) > 0 && (
                                    <AlertTriangle className="w-3 h-3 text-orange-500" title="Allergen avoidance" />
                                  )}
                                  {(item.allergenPreferences?.dietaryPreferences?.length ?? 0) > 0 && (
                                    <Utensils className="w-3 h-3 text-green-500" title="Dietary preferences" />
                                  )}
                                  {item.allergenPreferences?.specialInstructions?.trim() && (
                                    <FileText className="w-3 h-3 text-blue-500" title="Special instructions" />
                                  )}
                                </div>
                              )}
                            </div>
                            <span className="font-semibold text-gray-900">${(item.price * item.quantity).toFixed(2)}</span>
                          </div>
                          
                          {/* Show customizations */}
                          {item.selectedCustomizations && item.selectedCustomizations.length > 0 && (
                            <div className="mb-2">
                              <div className="flex flex-wrap gap-1">
                                {item.selectedCustomizations.map((custom, customIndex) => (
                                  <span key={customIndex} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                                    {custom.customizationName}: {custom.selectedOptions.map(opt => opt.name).join(', ')}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {/* Show detailed allergen preferences for this item */}
                          {itemHasAllergens && (
                            <div className="text-xs space-y-1">
                              {(item.allergenPreferences?.avoidAllergens?.length ?? 0) > 0 && (
                                <div className="flex items-center gap-2">
                                  <AlertTriangle className="w-3 h-3 text-red-500" />
                                  <span className="text-red-700 font-medium">
                                    Avoid: {item.allergenPreferences?.avoidAllergens?.join(', ')}
                                  </span>
                                </div>
                              )}
                              {(item.allergenPreferences?.dietaryPreferences?.length ?? 0) > 0 && (
                                <div className="flex items-center gap-2">
                                  <Utensils className="w-3 h-3 text-green-500" />
                                  <span className="text-green-700 font-medium">
                                    Diet: {item.allergenPreferences?.dietaryPreferences?.join(', ')}
                                  </span>
                                </div>
                              )}
                              {item.allergenPreferences?.specialInstructions?.trim() && (
                                <div className="flex items-center gap-2">
                                  <FileText className="w-3 h-3 text-blue-500" />
                                  <span className="text-blue-700 font-medium">
                                    Note: {item.allergenPreferences.specialInstructions}
                                  </span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* General Special Instructions */}
                {order.specialInstructions && (
                  <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <h5 className="font-semibold text-blue-800 text-sm mb-1">Order Notes:</h5>
                    <p className="text-sm text-blue-700">{order.specialInstructions}</p>
                  </div>
                )}

                {order.status !== 'served' && (
                  <button
                    onClick={() => onUpdateOrderStatus(order._id, getNextStatus(order.status))}
                    className={`w-full py-3 rounded-xl transition-all font-semibold shadow-lg ${
                      hasAllergens 
                        ? 'bg-orange-600 hover:bg-orange-700 text-white border-2 border-orange-200' 
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    {getStatusButtonText(order.status)}
                    {hasAllergens && ' ⚠️'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}