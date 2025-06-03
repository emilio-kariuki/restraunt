// filepath: /Users/emilio/projects/restraunt/frontend/app/order/[orderId]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiService } from '../../../../../../lib/api';
import { 
  Clock, 
  CheckCircle, 
  ChefHat, 
  Bell, 
  Utensils, 
  ArrowLeft, 
  User, 
  Phone, 
  Mail,
  AlertCircle,
  Leaf,
  Info
} from 'lucide-react';

interface OrderItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  category: string;
  description?: string;
  originalAllergens?: string[];
  selectedCustomizations?: Array<{
    customizationId: string;
    customizationName: string;
    selectedOptions: Array<{
      name: string;
      price: number;
    }>;
  }>;
  allergenPreferences?: {
    avoidAllergens: string[];
    specialInstructions: string;
    dietaryPreferences: string[];
  };
  customizations?: string[];
  specialInstructions?: string;
}

interface Order {
  _id: string;
  restaurantId: string;
  tableId: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: string;
  estimatedPrepTime?: number;
  orderTime: string;
  confirmedAt?: string;
  completedAt?: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  paymentStatus: string;
  specialInstructions?: string;
  estimatedReadyTime?: string;
  orderAllergenSummary?: {
    hasAllergenConcerns: boolean;
    avoidedAllergens: string[];
    specialInstructionsCount: number;
    dietaryPreferences: string[];
  };
  hasAllergenConcerns?: boolean;
  allergenSummary?: {
    hasAllergenConcerns: boolean;
    avoidedAllergens: string[];
    specialInstructionsCount: number;
    dietaryPreferences: string[];
  };
}

export default function OrderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const restaurantId = params.restrauntId as string;
  const tableId = params.tableId as string;
  const orderId = params.orderId as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiService.orders.getOrderById(orderId);
      
      if (response.success) {
        setOrder(response.order);
      } else {
        setError('Order not found');
      }
    } catch (err: any) {
      console.error('Error fetching order:', err);
      setError(err.message || 'Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = (status: string) => {
    const configs = {
      pending: {
        icon: Clock,
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        bgColor: 'bg-yellow-50',
        iconColor: 'text-yellow-600',
        title: 'Order Pending',
        description: 'Your order is being reviewed and will be confirmed shortly'
      },
      confirmed: {
        icon: CheckCircle,
        color: 'bg-blue-100 text-blue-800 border-blue-200',
        bgColor: 'bg-blue-50',
        iconColor: 'text-blue-600',
        title: 'Order Confirmed',
        description: 'Your order has been confirmed and is being prepared'
      },
      preparing: {
        icon: ChefHat,
        color: 'bg-orange-100 text-orange-800 border-orange-200',
        bgColor: 'bg-orange-50',
        iconColor: 'text-orange-600',
        title: 'Preparing',
        description: 'Our chefs are preparing your delicious meal'
      },
      ready: {
        icon: Bell,
        color: 'bg-green-100 text-green-800 border-green-200',
        bgColor: 'bg-green-50',
        iconColor: 'text-green-600',
        title: 'Ready for Pickup',
        description: 'Your order is ready! Please pick it up'
      },
      served: {
        icon: Utensils,
        color: 'bg-purple-100 text-purple-800 border-purple-200',
        bgColor: 'bg-purple-50',
        iconColor: 'text-purple-600',
        title: 'Served',
        description: 'Your order has been served. Enjoy your meal!'
      },
      completed: {
        icon: CheckCircle,
        color: 'bg-green-100 text-green-800 border-green-200',
        bgColor: 'bg-green-50',
        iconColor: 'text-green-600',
        title: 'Completed',
        description: 'Thank you for dining with us!'
      },
      cancelled: {
        icon: AlertCircle,
        color: 'bg-red-100 text-red-800 border-red-200',
        bgColor: 'bg-red-50',
        iconColor: 'text-red-600',
        title: 'Cancelled',
        description: 'This order has been cancelled'
      }
    };

    return configs[status as keyof typeof configs] || configs.pending;
  };

  const getPaymentStatusConfig = (paymentStatus: string) => {
    const configs = {
      pending: {
        color: 'bg-yellow-100 text-yellow-800',
        text: 'Payment Pending'
      },
      processing: {
        color: 'bg-blue-100 text-blue-800',
        text: 'Processing Payment'
      },
      completed: {
        color: 'bg-green-100 text-green-800',
        text: 'Payment Completed'
      },
      failed: {
        color: 'bg-red-100 text-red-800',
        text: 'Payment Failed'
      },
      refunded: {
        color: 'bg-gray-100 text-gray-800',
        text: 'Refunded'
      }
    };

    return configs[paymentStatus as keyof typeof configs] || configs.pending;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getElapsedTime = (createdAt: string) => {
    const now = new Date();
    const orderTime = new Date(createdAt);
    const diffMs = now.getTime() - orderTime.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 60) {
      return `${diffMins} min ago`;
    } else {
      const diffHours = Math.floor(diffMins / 60);
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    }
  };

  const calculateItemTotal = (item: OrderItem) => {
    const customizationPrice = item.selectedCustomizations?.reduce((sum, custom) => {
      return sum + custom.selectedOptions.reduce((optSum, option) => optSum + option.price, 0);
    }, 0) || 0;
    
    return (item.price + customizationPrice) * item.quantity;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-500 border-t-transparent mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Order Details</h2>
          <p className="text-gray-600">Please wait while we fetch your order information...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-green-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Not Found</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push(`/table/${restaurantId}/${tableId}/menu`)}
            className="w-full bg-gray-100 text-gray-700 px-8 py-4 rounded-2xl hover:bg-gray-200 transition-all duration-200 font-semibold"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-green-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Order Not Found</h2>
          <button
            onClick={() => router.push(`/table/${restaurantId}/${tableId}/menu`)}
            className="bg-blue-600 text-white px-6 py-3 rounded-2xl hover:bg-blue-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const statusConfig = getStatusConfig(order.status);
  const paymentConfig = getPaymentStatusConfig(order.paymentStatus);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-green-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>
          
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">Order Details</h1>
            <p className="text-gray-600">Table {tableId}</p>
          </div>
          
          <div className="w-16" /> {/* Spacer for centering */}
        </div>

        {/* Order Status Card */}
        <div className={`${statusConfig.bgColor} rounded-3xl p-6 mb-8 border-2 ${statusConfig.color.split(' ')[2]}`}>
          <div className="flex items-start space-x-4">
            <div className={`p-3 rounded-2xl ${statusConfig.color.replace('border-', 'bg-').replace('text-', 'bg-').replace('bg-bg-', 'bg-')} bg-white`}>
              <statusConfig.icon className={`w-8 h-8 ${statusConfig.iconColor}`} />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{statusConfig.title}</h2>
              <p className="text-gray-700 mb-4">{statusConfig.description}</p>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500 mb-1">Order Placed</p>
                  <p className="font-semibold">{formatDate(order.orderTime)}</p>
                </div>
                <div>
                  <p className="text-gray-500 mb-1">Time Elapsed</p>
                  <p className="font-semibold">{getElapsedTime(order.orderTime)}</p>
                </div>
              </div>

              {order.estimatedReadyTime && (
                <div className="mt-4 p-3 bg-white rounded-xl">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-gray-900">Estimated Ready Time</span>
                  </div>
                  <p className="text-gray-600 mt-1">{formatTime(order.estimatedReadyTime)}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Allergen Summary Card */}
        {(order.hasAllergenConcerns || order.orderAllergenSummary?.hasAllergenConcerns || order.allergenSummary?.hasAllergenConcerns) && (
          <div className="bg-orange-50 border-2 border-orange-200 rounded-3xl p-6 mb-8">
            <div className="flex items-start space-x-4">
              <div className="p-3 rounded-2xl bg-orange-100">
                <AlertCircle className="w-8 h-8 text-orange-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-orange-900 mb-2">⚠️ Allergen Information</h3>
                <p className="text-orange-800 mb-4">This order contains specific allergen preferences and dietary requirements.</p>
                
                {/* Order-level allergen summary */}
                {(order.orderAllergenSummary || order.allergenSummary) && (
                  <div className="space-y-3">
                    {((order.orderAllergenSummary?.avoidedAllergens || order.allergenSummary?.avoidedAllergens) || []).length > 0 && (
                      <div>
                        <p className="font-semibold text-orange-900 mb-2">Allergens to Avoid:</p>
                        <div className="flex flex-wrap gap-2">
                          {(order.orderAllergenSummary?.avoidedAllergens || order.allergenSummary?.avoidedAllergens || []).map(allergen => (
                            <span key={allergen} className="bg-red-100 text-red-800 px-3 py-1 rounded-lg text-sm font-medium">
                              {allergen}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {((order.orderAllergenSummary?.dietaryPreferences || order.allergenSummary?.dietaryPreferences) || [])?.length > 0 && (
                      <div>
                        <p className="font-semibold text-orange-900 mb-2">Dietary Preferences:</p>
                        <div className="flex flex-wrap gap-2">
                          {((order.orderAllergenSummary?.dietaryPreferences || order.allergenSummary?.dietaryPreferences) || []).map(preference => (
                            <span key={preference} className="bg-green-100 text-green-800 px-3 py-1 rounded-lg text-sm font-medium">
                              <Leaf className="w-3 h-3 inline mr-1" />
                              {preference}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {((order.orderAllergenSummary?.specialInstructionsCount ?? 0) || (order.allergenSummary?.specialInstructionsCount ?? 0)) > 0 && (
                      <div>
                        <p className="font-semibold text-orange-900">
                          {order.orderAllergenSummary?.specialInstructionsCount || order.allergenSummary?.specialInstructionsCount} item(s) have special instructions
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Order Items */}
        <div className="bg-white rounded-3xl shadow-lg p-6 mb-8">
          <div className="flex items-center space-x-3 mb-6">
            <ChefHat className="w-6 h-6 text-green-600" />
            <h3 className="text-xl font-bold text-gray-900">Order Items</h3>
            <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm font-medium">
              {order.items.length} item{order.items.length !== 1 ? 's' : ''}
            </span>
          </div>
          
          <div className="space-y-6">
            {order.items.map((item, index) => (
              <div key={index} className="border border-gray-200 rounded-2xl p-4">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900 text-lg mb-1">{item.name}</h4>
                    <p className="text-gray-600 text-sm mb-2">{item.description}</p>
                    
                    <div className="space-y-1 text-sm text-gray-500">
                      <span>Quantity: {item.quantity}</span>
                      <span className="mx-2">•</span>
                      <span>Unit Price: ${item.price.toFixed(2)}</span>
                    </div>

                    {/* Original Item Allergens */}
                    {item.originalAllergens && item.originalAllergens.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs font-semibold text-red-600 mb-1">Contains Allergens:</p>
                        <div className="flex flex-wrap gap-1">
                          {item.originalAllergens.map(allergen => (
                            <span key={allergen} className="bg-red-100 text-red-800 px-2 py-1 rounded-lg text-xs font-medium">
                              {allergen}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Customer Allergen Preferences */}
                    {item.allergenPreferences && (
                      <div className="mt-3 space-y-2">
                        {item.allergenPreferences.avoidAllergens?.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-orange-600 mb-1">Customer Wants to Avoid:</p>
                            <div className="flex flex-wrap gap-1">
                              {item.allergenPreferences.avoidAllergens.map(allergen => (
                                <span key={allergen} className="bg-orange-100 text-orange-800 px-2 py-1 rounded-lg text-xs font-medium">
                                  {allergen}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {item.allergenPreferences.dietaryPreferences?.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-green-600 mb-1">Dietary Preferences:</p>
                            <div className="flex flex-wrap gap-1">
                              {item.allergenPreferences.dietaryPreferences.map(preference => (
                                <span key={preference} className="bg-green-100 text-green-800 px-2 py-1 rounded-lg text-xs font-medium">
                                  <Leaf className="w-3 h-3 inline mr-1" />
                                  {preference}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {item.allergenPreferences.specialInstructions && (
                          <div>
                            <p className="text-xs font-semibold text-purple-600 mb-1">Special Instructions:</p>
                            <p className="text-xs text-purple-700 bg-purple-50 p-2 rounded-lg border border-purple-200">
                              {item.allergenPreferences.specialInstructions}
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Selected Customizations */}
                    {item.selectedCustomizations && item.selectedCustomizations.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs font-semibold text-blue-600 mb-1">Customizations:</p>
                        <div className="space-y-1">
                          {item.selectedCustomizations.map(custom => (
                            <div key={custom.customizationId} className="text-xs">
                              <span className="font-medium text-blue-700">{custom.customizationName}:</span>
                              <div className="flex flex-wrap gap-1 ml-2 mt-1">
                                {custom.selectedOptions.map(option => (
                                  <span key={option.name} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-lg">
                                    {option.name}
                                    {option.price > 0 && (
                                      <span className="text-green-600 ml-1">+${option.price.toFixed(2)}</span>
                                    )}
                                  </span>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Legacy Customizations */}
                    {item.customizations && item.customizations.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs font-semibold text-blue-600 mb-1">Customizations:</p>
                        <div className="flex flex-wrap gap-1">
                          {item.customizations.map((customization, i) => (
                            <span key={i} className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm">
                              {customization}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Legacy Special Instructions */}
                    {item.specialInstructions && !item.allergenPreferences?.specialInstructions && (
                      <div className="mt-3">
                        <p className="text-xs font-semibold text-purple-600 mb-1">Special Instructions:</p>
                        <p className="text-xs text-purple-700 bg-purple-50 p-2 rounded-lg border border-purple-200">
                          {item.specialInstructions}
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="text-right ml-4">
                    <p className="text-xl font-bold text-gray-900">
                      ${calculateItemTotal(item).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-white rounded-3xl shadow-lg p-6 mb-8">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h3>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span>Subtotal</span>
              <span className="font-semibold">${order.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span>Tax</span>
              <span className="font-semibold">${order.tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-t-2 border-gray-200">
              <span className="text-lg font-bold">Total</span>
              <span className="text-xl font-bold text-green-600">${order.total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Customer Information */}
        {(order.customerName || order.customerPhone || order.customerEmail) && (
          <div className="bg-white rounded-3xl shadow-lg p-6 mb-8">
            <div className="flex items-center space-x-3 mb-6">
              <User className="w-6 h-6 text-blue-600" />
              <h3 className="text-xl font-bold text-gray-900">Customer Information</h3>
            </div>
            
            <div className="space-y-4">
              {order.customerName && (
                <div className="flex items-center space-x-3">
                  <User className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-900">{order.customerName}</span>
                </div>
              )}
              
              {order.customerPhone && (
                <div className="flex items-center space-x-3">
                  <Phone className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-900">{order.customerPhone}</span>
                </div>
              )}
              
              {order.customerEmail && (
                <div className="flex items-center space-x-3">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-900">{order.customerEmail}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Payment Status */}
        <div className="bg-white rounded-3xl shadow-lg p-6 mb-8">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Payment Status</h3>
          <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${paymentConfig.color}`}>
            {paymentConfig.text}
          </div>
        </div>

        {/* Order-level Special Instructions */}
        {order.specialInstructions && (
          <div className="bg-white rounded-3xl shadow-lg p-6 mb-8">
            <div className="flex items-center space-x-3 mb-4">
              <Info className="w-6 h-6 text-purple-600" />
              <h3 className="text-xl font-bold text-gray-900">Special Instructions</h3>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
              <p className="text-purple-800">{order.specialInstructions}</p>
            </div>
          </div>
        )}

        {/* Order Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={() => router.push(`/table/${restaurantId}/${tableId}/menu`)}
            className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 rounded-2xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            Order More Items
          </button>
          <button
            onClick={() => router.push(`/table/${restaurantId}/${tableId}`)}
            className="bg-gray-100 text-gray-700 py-4 rounded-2xl hover:bg-gray-200 transition-all duration-200 font-semibold"
          >
            Back to Table
          </button>
        </div>

        {/* Order ID & Timestamp */}
        <div className="mt-8 text-center space-y-2">
          <div className="text-sm text-gray-500">
            <p className="text-sm text-gray-500">Order ID</p>
            <p className="font-mono text-xs text-gray-400">{order._id}</p>
          </div>
          <div className="text-sm text-gray-500">
            <p className="text-sm text-gray-500">Order Placed</p>
            <p className="text-xs text-gray-400">{formatDate(order.orderTime)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}