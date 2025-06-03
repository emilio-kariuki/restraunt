'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
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
  Info,
  RefreshCw,
  CreditCard,
  MapPin,
  Calendar,
  DollarSign,
  MessageSquare,
  Star,
  Package,
  ShieldAlert,
  Timer,
  Receipt
} from 'lucide-react';

interface OrderItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  category: string;
  description: string;
  originalAllergens: string[];
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
  kitchenNotes?: string;
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
  paymentIntentId?: string;
  createdAt?: string;
  updatedAt?: string;
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
  const [refreshing, setRefreshing] = useState(false);
  const [requestingService, setRequestingService] = useState<string | null>(null);

  // Memoized status configurations for performance
  const statusConfigs = useMemo(() => ({
    pending: {
      icon: Clock,
      color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      bgColor: 'bg-yellow-50',
      iconColor: 'text-yellow-600',
      title: 'Order Pending',
      description: 'Your order is being reviewed and will be confirmed shortly',
      gradient: 'from-yellow-100 to-yellow-50'
    },
    confirmed: {
      icon: CheckCircle,
      color: 'bg-blue-100 text-blue-800 border-blue-200',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
      title: 'Order Confirmed',
      description: 'Your order has been confirmed and is being prepared',
      gradient: 'from-blue-100 to-blue-50'
    },
    preparing: {
      icon: ChefHat,
      color: 'bg-orange-100 text-orange-800 border-orange-200',
      bgColor: 'bg-orange-50',
      iconColor: 'text-orange-600',
      title: 'Preparing Your Order',
      description: 'Our chefs are carefully preparing your delicious meal',
      gradient: 'from-orange-100 to-orange-50'
    },
    ready: {
      icon: Bell,
      color: 'bg-green-100 text-green-800 border-green-200',
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600',
      title: 'Ready for Pickup',
      description: 'Your order is ready! Please pick it up at the counter',
      gradient: 'from-green-100 to-green-50'
    },
    served: {
      icon: Utensils,
      color: 'bg-purple-100 text-purple-800 border-purple-200',
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600',
      title: 'Order Served',
      description: 'Your order has been served. Enjoy your meal!',
      gradient: 'from-purple-100 to-purple-50'
    },
    completed: {
      icon: CheckCircle,
      color: 'bg-green-100 text-green-800 border-green-200',
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600',
      title: 'Order Completed',
      description: 'Order completed successfully. Thank you for dining with us!',
      gradient: 'from-green-100 to-green-50'
    },
    cancelled: {
      icon: AlertCircle,
      color: 'bg-red-100 text-red-800 border-red-200',
      bgColor: 'bg-red-50',
      iconColor: 'text-red-600',
      title: 'Order Cancelled',
      description: 'This order has been cancelled',
      gradient: 'from-red-100 to-red-50'
    }
  }), []);

  const paymentStatusConfigs = useMemo(() => ({
    pending: { 
      color: 'bg-yellow-100 text-yellow-800 border-yellow-200', 
      text: 'Payment Pending',
      icon: Timer 
    },
    processing: { 
      color: 'bg-blue-100 text-blue-800 border-blue-200', 
      text: 'Processing Payment',
      icon: CreditCard 
    },
    completed: { 
      color: 'bg-green-100 text-green-800 border-green-200', 
      text: 'Payment Completed',
      icon: CheckCircle 
    },
    failed: { 
      color: 'bg-red-100 text-red-800 border-red-200', 
      text: 'Payment Failed',
      icon: AlertCircle 
    },
    refunded: { 
      color: 'bg-gray-100 text-gray-800 border-gray-200', 
      text: 'Payment Refunded',
      icon: Receipt 
    }
  }), []);

  // Optimized order fetching with error handling
  const fetchOrder = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      
      const response = await apiService.orders.getOrderById(orderId);
      
      if (response.success && response.order) {
        setOrder(response.order);
      } else {
        setError('Order not found');
      }
    } catch (err: any) {
      console.error('Error fetching order:', err);
      setError(err.message || 'Failed to load order details');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [orderId]);

  useEffect(() => {
    if (orderId) {
      fetchOrder();
      
      // Auto-refresh every 30 seconds for active orders
      const interval = setInterval(() => {
        if (order && ['pending', 'confirmed', 'preparing'].includes(order.status)) {
          fetchOrder(true);
        }
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [orderId, fetchOrder, order?.status]);

  // Memoized calculations for performance
  const calculations = useMemo(() => {
    if (!order) return null;

    const getElapsedTime = (createdAt: string) => {
      const now = new Date();
      const orderTime = new Date(createdAt);
      const diffMs = now.getTime() - orderTime.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      
      if (diffMins < 1) {
        return 'Just now';
      } else if (diffMins < 60) {
        return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
      } else {
        const diffHours = Math.floor(diffMins / 60);
        const remainingMins = diffMins % 60;
        return `${diffHours}h ${remainingMins}m ago`;
      }
    };

    const calculateItemTotal = (item: OrderItem) => {
      const customizationPrice = item.selectedCustomizations?.reduce((sum, custom) => {
        return sum + custom.selectedOptions.reduce((optSum, option) => optSum + option.price, 0);
      }, 0) || 0;
      
      return (item.price + customizationPrice) * item.quantity;
    };

    const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    const formatTime = (dateString: string) => {
      return new Date(dateString).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    const getEstimatedReadyTime = () => {
      if (!order.estimatedPrepTime) return null;
      const readyTime = new Date(new Date(order.orderTime).getTime() + order.estimatedPrepTime * 60000);
      return readyTime;
    };

    const getOrderNumber = () => {
      return order._id.toString().slice(-6).toUpperCase();
    };

    return {
      getElapsedTime,
      calculateItemTotal,
      formatDate,
      formatTime,
      getEstimatedReadyTime,
      getOrderNumber
    };
  }, [order]);

  // Handle special service requests
  const handleServiceRequest = useCallback(async (serviceType: string, message?: string) => {
    if (!order) return;
    
    try {
      setRequestingService(serviceType);
      
      await apiService.orders.requestSpecialService(order._id, serviceType, message);
      
      // Show success message (you might want to use a toast notification library)
      alert('Service request sent successfully!');
      
    } catch (error: any) {
      console.error('Service request error:', error);
      alert(error.message || 'Failed to send service request');
    } finally {
      setRequestingService(null);
    }
  }, [order]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-green-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-green-500 border-t-transparent mx-auto mb-6"></div>
            <ChefHat className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Loading Your Order</h2>
          <p className="text-gray-600 leading-relaxed">Please wait while we fetch your order information...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-green-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md mx-auto">
          <div className="bg-white rounded-3xl shadow-2xl p-8">
            <AlertCircle className="w-20 h-20 text-red-500 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Oops! Something went wrong</h2>
            <p className="text-gray-600 mb-8 leading-relaxed">{error}</p>
            <div className="space-y-4">
              <button
                onClick={() => fetchOrder()}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-4 rounded-2xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 flex items-center justify-center font-semibold shadow-lg"
              >
                <RefreshCw className="w-5 h-5 mr-2" />
                Try Again
              </button>
              <button
                onClick={() => router.push(`/table/${restaurantId}/${tableId}/menu`)}
                className="w-full bg-gray-100 text-gray-700 px-8 py-4 rounded-2xl hover:bg-gray-200 transition-colors font-medium"
              >
                Go Back to Menu
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Order not found state
  if (!order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-green-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md mx-auto">
          <div className="bg-white rounded-3xl shadow-2xl p-8">
            <Package className="w-20 h-20 text-gray-400 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Order Not Found</h2>
            <p className="text-gray-600 mb-8">We couldn't find the order you're looking for.</p>
            <button
              onClick={() => router.push(`/table/${restaurantId}/${tableId}/menu`)}
              className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white px-8 py-4 rounded-2xl hover:from-green-700 hover:to-green-800 transition-all duration-200 font-semibold shadow-lg"
            >
              Go Back to Menu
            </button>
          </div>
        </div>
      </div>
    );
  }

  const statusConfig = statusConfigs[order.status as keyof typeof statusConfigs] || statusConfigs.pending;
  const paymentConfig = paymentStatusConfigs[order.paymentStatus as keyof typeof paymentStatusConfigs] || paymentStatusConfigs.pending;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-green-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Enhanced Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors bg-white px-4 py-2 rounded-xl shadow-sm hover:shadow-md"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back</span>
          </button>
          
          <div className="flex items-center space-x-3">
            <span className="text-sm text-gray-500">Order #{calculations?.getOrderNumber()}</span>
            <button
              onClick={() => fetchOrder(true)}
              disabled={refreshing}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 shadow-lg"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Order Status Card */}
        <div className={`bg-gradient-to-r ${statusConfig.gradient} rounded-3xl shadow-xl p-8 mb-8 border-2 ${statusConfig.color.split(' ')[2]}`}>
          <div className="flex items-start space-x-6">
            <div className={`p-4 rounded-2xl ${statusConfig.bgColor} shadow-lg`}>
              <statusConfig.icon className={`w-10 h-10 ${statusConfig.iconColor}`} />
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-3">
                <h2 className="text-3xl font-bold text-gray-900">{statusConfig.title}</h2>
                <span className={`px-3 py-1 rounded-full text-sm font-bold ${statusConfig.color}`}>
                  {order.status.toUpperCase()}
                </span>
              </div>
              <p className="text-gray-700 text-lg mb-6 leading-relaxed">{statusConfig.description}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                <div className="bg-white bg-opacity-70 p-4 rounded-xl">
                  <div className="flex items-center space-x-2 mb-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <p className="text-gray-500 font-medium">Order Placed</p>
                  </div>
                  <p className="font-bold text-gray-900">{calculations?.formatDate(order.orderTime)}</p>
                </div>
                
                <div className="bg-white bg-opacity-70 p-4 rounded-xl">
                  <div className="flex items-center space-x-2 mb-2">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <p className="text-gray-500 font-medium">Time Elapsed</p>
                  </div>
                  <p className="font-bold text-gray-900">{calculations?.getElapsedTime(order.orderTime)}</p>
                </div>

                {order.estimatedPrepTime && (
                  <div className="bg-white bg-opacity-70 p-4 rounded-xl">
                    <div className="flex items-center space-x-2 mb-2">
                      <Timer className="w-4 h-4 text-green-600" />
                      <p className="text-gray-500 font-medium">Est. Ready Time</p>
                    </div>
                    <p className="font-bold text-green-700">
                      {calculations?.getEstimatedReadyTime() ? 
                        calculations.formatTime(calculations.getEstimatedReadyTime()!.toISOString()) : 
                        `${order.estimatedPrepTime} mins`
                      }
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Payment Status */}
        <div className="bg-white rounded-3xl shadow-xl p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <paymentConfig.icon className="w-6 h-6 text-gray-600" />
              <h3 className="text-xl font-bold text-gray-900">Payment Status</h3>
            </div>
            <span className={`px-4 py-2 rounded-full text-sm font-bold border-2 ${paymentConfig.color}`}>
              {paymentConfig.text}
            </span>
          </div>
          
          {order.paymentIntentId && (
            <div className="mt-4 text-sm text-gray-500">
              <span>Payment ID: {order.paymentIntentId}</span>
            </div>
          )}
        </div>

        {/* Allergen Summary Card */}
        {(order.hasAllergenConcerns || order.orderAllergenSummary?.hasAllergenConcerns || order.allergenSummary?.hasAllergenConcerns) && (
          <div className="bg-white rounded-3xl shadow-xl p-6 mb-8 border-l-4 border-orange-500">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-orange-100 rounded-xl">
                <ShieldAlert className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Allergen & Dietary Information</h3>
            </div>
            
            {(order.orderAllergenSummary || order.allergenSummary) && (
              <div className="bg-gradient-to-r from-orange-50 to-yellow-50 p-6 rounded-2xl space-y-6">
                {((order.orderAllergenSummary?.avoidedAllergens || order.allergenSummary?.avoidedAllergens) || []).length > 0 && (
                  <div>
                    <p className="font-bold text-orange-900 mb-3 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-2" />
                      Allergens to Avoid:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {(order.orderAllergenSummary?.avoidedAllergens || order.allergenSummary?.avoidedAllergens || []).map(allergen => (
                        <span key={allergen} className="bg-red-100 text-red-800 px-4 py-2 rounded-xl text-sm font-bold border border-red-200 shadow-sm">
                          {allergen}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {((order.orderAllergenSummary?.dietaryPreferences || order.allergenSummary?.dietaryPreferences) || [])?.length > 0 && (
                  <div>
                    <p className="font-bold text-green-900 mb-3 flex items-center">
                      <Leaf className="w-4 h-4 mr-2" />
                      Dietary Preferences:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {((order.orderAllergenSummary?.dietaryPreferences || order.allergenSummary?.dietaryPreferences) || []).map(preference => (
                        <span key={preference} className="bg-green-100 text-green-800 px-4 py-2 rounded-xl text-sm font-bold border border-green-200 shadow-sm">
                          <Leaf className="w-3 h-3 inline mr-1" />
                          {preference}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {((order.orderAllergenSummary?.specialInstructionsCount ?? 0) || (order.allergenSummary?.specialInstructionsCount ?? 0)) > 0 && (
                  <div className="bg-white bg-opacity-60 p-4 rounded-xl">
                    <p className="font-bold text-purple-900 flex items-center">
                      <MessageSquare className="w-4 h-4 mr-2" />
                      {order.orderAllergenSummary?.specialInstructionsCount || order.allergenSummary?.specialInstructionsCount} item(s) have special instructions
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Order Items */}
        <div className="bg-white rounded-3xl shadow-xl p-6 mb-8">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-green-100 rounded-xl">
              <ChefHat className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Order Items</h3>
            <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm font-bold">
              {order.items.length} item{order.items.length !== 1 ? 's' : ''}
            </span>
          </div>
          
          <div className="space-y-6">
            {order.items.map((item, index) => (
              <div key={index} className="border-2 border-gray-100 rounded-2xl p-6 hover:border-gray-200 transition-colors">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="font-bold text-gray-900 text-xl">{item.name}</h4>
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-lg text-xs font-bold">
                        {item.category}
                      </span>
                    </div>
                    <p className="text-gray-600 mb-3 leading-relaxed">{item.description}</p>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-500 mb-4">
                      <span className="flex items-center space-x-1">
                        <Package className="w-4 h-4" />
                        <span>Qty: {item.quantity}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <DollarSign className="w-4 h-4" />
                        <span>Unit: ${item.price.toFixed(2)}</span>
                      </span>
                    </div>

                    {/* Original Item Allergens */}
                    {item.originalAllergens && item.originalAllergens.length > 0 && (
                      <div className="mb-4">
                        <p className="text-sm font-bold text-gray-600 mb-2">Original Allergens:</p>
                        <div className="flex flex-wrap gap-2">
                          {item.originalAllergens.map((allergen, i) => (
                            <span key={i} className="bg-gray-100 text-gray-700 px-3 py-1 rounded-xl text-xs font-medium border">
                              {allergen}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Allergen Preferences */}
                    {item.allergenPreferences && (
                      <div className="mb-4 bg-gradient-to-r from-yellow-50 to-orange-50 p-4 rounded-xl border border-yellow-200">
                        <div className="flex items-center space-x-2 mb-3">
                          <ShieldAlert className="w-4 h-4 text-yellow-600" />
                          <span className="text-sm font-bold text-yellow-800">Allergen Preferences</span>
                        </div>
                        
                        {item.allergenPreferences.avoidAllergens.length > 0 && (
                          <div className="mb-3">
                            <p className="text-xs font-bold text-yellow-700 mb-2">Avoid:</p>
                            <div className="flex flex-wrap gap-2">
                              {item.allergenPreferences.avoidAllergens.map((allergen, i) => (
                                <span key={i} className="bg-red-100 text-red-700 px-3 py-1 rounded-lg text-xs font-bold border border-red-200">
                                  {allergen}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {item.allergenPreferences.dietaryPreferences.length > 0 && (
                          <div className="mb-3">
                            <p className="text-xs font-bold text-yellow-700 mb-2">Dietary:</p>
                            <div className="flex flex-wrap gap-2">
                              {item.allergenPreferences.dietaryPreferences.map((pref, i) => (
                                <span key={i} className="bg-green-100 text-green-700 px-3 py-1 rounded-lg text-xs font-bold border border-green-200">
                                  <Leaf className="w-3 h-3 inline mr-1" />
                                  {pref}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {item.allergenPreferences.specialInstructions && (
                          <div className="bg-white bg-opacity-70 p-3 rounded-xl">
                            <p className="text-xs font-bold text-yellow-700 mb-2">Special Instructions:</p>
                            <p className="text-xs text-yellow-600 italic leading-relaxed">
                              "{item.allergenPreferences.specialInstructions}"
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Customizations */}
                    {item.selectedCustomizations && item.selectedCustomizations.length > 0 && (
                      <div className="mb-4">
                        <p className="text-sm font-bold text-gray-700 mb-3">Customizations:</p>
                        <div className="space-y-3">
                          {item.selectedCustomizations.map((custom, customIndex) => (
                            <div key={customIndex} className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-200">
                              <p className="text-sm font-bold text-blue-800 mb-2">{custom.customizationName}</p>
                              <div className="space-y-2">
                                {custom.selectedOptions.map((option, optIndex) => (
                                  <div key={optIndex} className="flex justify-between items-center text-sm text-blue-700 bg-white bg-opacity-60 p-2 rounded-lg">
                                    <span className="flex items-center space-x-2">
                                      <Star className="w-3 h-3" />
                                      <span>{option.name}</span>
                                    </span>
                                    {option.price > 0 && (
                                      <span className="font-bold text-green-600">+${option.price.toFixed(2)}</span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Legacy customizations fallback */}
                    {(!item.selectedCustomizations || item.selectedCustomizations.length === 0) && 
                     item.customizations && item.customizations.length > 0 && (
                      <div className="mb-4">
                        <p className="text-sm font-bold text-gray-700 mb-2">Customizations:</p>
                        <div className="flex flex-wrap gap-2">
                          {item.customizations.map((custom, i) => (
                            <span key={i} className="bg-blue-100 text-blue-700 px-3 py-1 rounded-xl text-xs font-medium border border-blue-200">
                              {custom}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Legacy special instructions */}
                    {item.specialInstructions && 
                     (!item.allergenPreferences?.specialInstructions || item.specialInstructions !== item.allergenPreferences.specialInstructions) && (
                      <div className="mb-4 bg-gray-50 p-3 rounded-xl border">
                        <p className="text-sm font-bold text-gray-700 mb-2">Special Instructions:</p>
                        <p className="text-sm text-gray-600 italic leading-relaxed">
                          "{item.specialInstructions}"
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div className="text-right ml-6">
                    <div className="bg-gray-50 p-4 rounded-xl">
                      <p className="text-sm text-gray-500 mb-1">Item Total</p>
                      <p className="text-2xl font-bold text-gray-900">
                        ${calculations?.calculateItemTotal(item).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-white rounded-3xl shadow-xl p-6 mb-8">
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <Receipt className="w-5 h-5 mr-2" />
            Order Summary
          </h3>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-700 font-medium">Subtotal</span>
              <span className="font-bold text-lg">${order.subtotal.toFixed(2)}</span>
            </div>
            
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-700 font-medium">Tax</span>
              <span className="font-bold text-lg">${order.tax.toFixed(2)}</span>
            </div>
            
            <div className="border-t-2 border-gray-200 pt-4">
              <div className="flex justify-between items-center">
                <span className="text-xl font-bold text-gray-900">Total</span>
                <span className="text-2xl font-bold text-green-600 bg-green-50 px-4 py-2 rounded-xl">
                  ${order.total.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Customer Information */}
        {(order.customerName || order.customerPhone || order.customerEmail) && (
          <div className="bg-white rounded-3xl shadow-xl p-6 mb-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-blue-100 rounded-xl">
                <User className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Customer Information</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {order.customerName && (
                <div className="flex items-center space-x-4 bg-gray-50 p-4 rounded-xl">
                  <div className="p-2 bg-white rounded-lg">
                    <User className="w-5 h-5 text-gray-500" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 font-medium">Customer Name</p>
                    <p className="font-bold text-gray-900 text-lg">{order.customerName}</p>
                  </div>
                </div>
              )}
              
              {order.customerPhone && (
                <div className="flex items-center space-x-4 bg-gray-50 p-4 rounded-xl">
                  <div className="p-2 bg-white rounded-lg">
                    <Phone className="w-5 h-5 text-gray-500" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 font-medium">Phone Number</p>
                    <p className="font-bold text-gray-900 text-lg">{order.customerPhone}</p>
                  </div>
                </div>
              )}
              
              {order.customerEmail && (
                <div className="flex items-center space-x-4 bg-gray-50 p-4 rounded-xl md:col-span-2">
                  <div className="p-2 bg-white rounded-lg">
                    <Mail className="w-5 h-5 text-gray-500" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 font-medium">Email Address</p>
                    <p className="font-bold text-gray-900 text-lg">{order.customerEmail}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Table Information */}
        <div className="bg-white rounded-3xl shadow-xl p-6 mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-purple-100 rounded-xl">
              <MapPin className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Table Information</h3>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-xl">
            <p className="text-purple-800 font-bold text-lg">Table {order.tableId}</p>
          </div>
        </div>

        {/* Special Instructions */}
        {(order.specialInstructions || order.kitchenNotes) && (
          <div className="bg-white rounded-3xl shadow-xl p-6 mb-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-purple-100 rounded-xl">
                <MessageSquare className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Order Notes</h3>
            </div>
            
            {order.specialInstructions && (
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-2xl mb-4">
                <p className="text-sm font-bold text-purple-700 mb-2">Customer Instructions:</p>
                <p className="text-purple-800 italic leading-relaxed text-lg">"{order.specialInstructions}"</p>
              </div>
            )}
            
            {order.kitchenNotes && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-2xl">
                <p className="text-sm font-bold text-blue-700 mb-2">Kitchen Notes:</p>
                <p className="text-blue-800 leading-relaxed">{order.kitchenNotes}</p>
              </div>
            )}
          </div>
        )}

        {/* Order Actions */}
        {/* <div className="bg-white rounded-3xl shadow-xl p-6 mb-8">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Need Assistance?</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              onClick={() => handleServiceRequest('server_call', 'Customer needs assistance with order')}
              disabled={requestingService === 'server_call'}
              className="flex flex-col items-center justify-center space-y-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-2xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 disabled:opacity-50 shadow-lg"
            >
              <Bell className="w-8 h-8" />
              <span className="font-bold">Call Server</span>
              {requestingService === 'server_call' && (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              )}
            </button>
            
            <button
              onClick={() => handleServiceRequest('special_instructions', 'Customer has additional special instructions')}
              disabled={requestingService === 'special_instructions'}
              className="flex flex-col items-center justify-center space-y-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white p-6 rounded-2xl hover:from-purple-700 hover:to-purple-800 transition-all duration-200 disabled:opacity-50 shadow-lg"
            >
              <MessageSquare className="w-8 h-8" />
              <span className="font-bold">Special Request</span>
              {requestingService === 'special_instructions' && (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              )}
            </button>
            
            <button
              onClick={() => handleServiceRequest('packing', 'Customer requests packing/takeaway service')}
              disabled={requestingService === 'packing'}
              className="flex flex-col items-center justify-center space-y-3 bg-gradient-to-r from-orange-600 to-orange-700 text-white p-6 rounded-2xl hover:from-orange-700 hover:to-orange-800 transition-all duration-200 disabled:opacity-50 shadow-lg"
            >
              <Package className="w-8 h-8" />
              <span className="font-bold">Request Packing</span>
              {requestingService === 'packing' && (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              )}
            </button>
            
            <button
              onClick={() => router.push(`/table/${restaurantId}/${tableId}/menu`)}
              className="flex flex-col items-center justify-center space-y-3 bg-gradient-to-r from-green-600 to-green-700 text-white p-6 rounded-2xl hover:from-green-700 hover:to-green-800 transition-all duration-200 shadow-lg"
            >
              <ChefHat className="w-8 h-8" />
              <span className="font-bold">Order More</span>
            </button>
          </div>
        </div> */}

        {/* Order Timeline */}
        <div className="bg-white rounded-3xl shadow-xl p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <Clock className="w-5 h-5 mr-2" />
            Order Timeline
          </h3>
          
          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-gray-900 text-lg">Order Placed</p>
                <p className="text-gray-500">{calculations?.formatDate(order.orderTime)}</p>
              </div>
            </div>
            
            {order.confirmedAt && (
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center shadow-lg">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-gray-900 text-lg">Order Confirmed</p>
                  <p className="text-gray-500">{calculations?.formatDate(order.confirmedAt)}</p>
                </div>
              </div>
            )}
            
            {order.status === 'preparing' && (
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center shadow-lg">
                  <ChefHat className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-gray-900 text-lg">Currently Preparing</p>
                  <p className="text-gray-500">Your order is being prepared by our chefs</p>
                </div>
              </div>
            )}
            
            {order.completedAt && (
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center shadow-lg">
                  <Utensils className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-gray-900 text-lg">Order Completed</p>
                  <p className="text-gray-500">{calculations?.formatDate(order.completedAt)}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}