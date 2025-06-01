// filepath: /Users/emilio/projects/restraunt/frontend/app/order/[orderId]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, Clock, CheckCircle, ChefHat, Bell, Package,
  AlertCircle, Phone, Mail, MessageSquare, CreditCard,
  Receipt, MapPin, Users, Utensils, Star, RefreshCw,
  XCircle, Truck, CheckCircle2, Timer, DollarSign,
  Calendar, Hash, User, FileText, ShoppingBag
} from 'lucide-react';
import { apiService } from '../../../../../../lib/api';

interface OrderItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  customizations?: string[];
}

interface Order {
  _id: string;
  restaurantId: string;
  tableId: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'served' | 'completed' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentIntentId?: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  specialInstructions?: string;
  estimatedReadyTime?: string;
  createdAt: string;
  updatedAt: string;
  orderNumber?: string;
}

export default function OrderDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const restaurantId = params.restrauntId as string;
  const tableId = params.tableId as string;
  const orderId = params.orderId as string;
  
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (orderId) {
      loadOrderDetails();
    }
  }, [orderId]);

  // Auto-refresh order status every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (order && !['completed', 'cancelled'].includes(order.status)) {
        refreshOrderStatus();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [order]);

  const loadOrderDetails = async () => {
    try {
      setError(null);
      const response = await apiService.orders.getOrder(orderId);
      setOrder(response.order);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load order details');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshOrderStatus = async () => {
    try {
      setIsRefreshing(true);
      const response = await apiService.orders.getOrder(orderId);
      setOrder(response.order);
    } catch (err) {
      console.error('Failed to refresh order status:', err);
    } finally {
      setIsRefreshing(false);
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
        description: 'Your order is waiting for confirmation'
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
        icon: CheckCircle2,
        color: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        bgColor: 'bg-emerald-50',
        iconColor: 'text-emerald-600',
        title: 'Completed',
        description: 'Order completed successfully. Thank you!'
      },
      cancelled: {
        icon: XCircle,
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
        icon: Timer,
        color: 'bg-yellow-100 text-yellow-800',
        title: 'Payment Pending'
      },
      paid: {
        icon: CheckCircle,
        color: 'bg-green-100 text-green-800',
        title: 'Payment Completed'
      },
      failed: {
        icon: XCircle,
        color: 'bg-red-100 text-red-800',
        title: 'Payment Failed'
      },
      refunded: {
        icon: RefreshCw,
        color: 'bg-blue-100 text-blue-800',
        title: 'Payment Refunded'
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
      const remainingMins = diffMins % 60;
      return `${diffHours}h ${remainingMins}m ago`;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-6"></div>
            <Package className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-blue-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Loading Order Details</h2>
          <p className="text-gray-500">Please wait while we fetch your order information...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center p-8 bg-white rounded-3xl shadow-lg border border-gray-200">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Unable to Load Order</h1>
          <p className="text-gray-600 mb-8 leading-relaxed">{error}</p>
          <div className="space-y-3">
            <button 
              onClick={loadOrderDetails}
              className="w-full bg-blue-600 text-white px-8 py-4 rounded-2xl hover:bg-blue-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              Try Again
            </button>
            <button 
              onClick={() => router.back()}
              className="w-full bg-gray-100 text-gray-700 px-8 py-4 rounded-2xl hover:bg-gray-200 transition-all duration-200 font-semibold"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700">Order Not Found</h2>
          <p className="text-gray-500 mb-6">The order you're looking for doesn't exist.</p>
          <button 
            onClick={() => router.back()}
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
  const StatusIcon = statusConfig.icon;
  const PaymentIcon = paymentConfig.icon;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-lg shadow-lg border-b border-gray-100">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="p-3 hover:bg-gray-100 rounded-2xl transition-all duration-200"
              >
                <ArrowLeft className="w-6 h-6 text-gray-700" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  Order #{order.orderNumber || order._id.slice(-6).toUpperCase()}
                </h1>
                <div className="flex items-center text-sm text-gray-500 space-x-2">
                  <MapPin className="w-4 h-4" />
                  <span>Table {tableId}</span>
                  <span>•</span>
                  <span>{getElapsedTime(order.createdAt)}</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={refreshOrderStatus}
                disabled={isRefreshing}
                className={`p-3 rounded-2xl border border-gray-200 bg-white hover:bg-gray-50 transition-all duration-200 ${
                  isRefreshing ? 'animate-spin' : ''
                }`}
              >
                <RefreshCw className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>
        </div>

        <div className="p-4 space-y-6">
          {/* Order Status Card */}
          <div className={`rounded-3xl p-6 border ${statusConfig.bgColor} ${statusConfig.color.split(' ')[2]}`}>
            <div className="flex items-center space-x-4 mb-4">
              <div className={`p-4 rounded-2xl bg-white/80 backdrop-blur-sm shadow-lg ${statusConfig.iconColor}`}>
                <StatusIcon className="w-8 h-8" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900">{statusConfig.title}</h2>
                <p className="text-gray-600 text-lg">{statusConfig.description}</p>
              </div>
              <div className={`px-4 py-2 rounded-full text-sm font-semibold border ${statusConfig.color}`}>
                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
              </div>
            </div>

            {order.estimatedReadyTime && (
              <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 flex items-center space-x-3">
                <Clock className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="font-semibold text-gray-900">Estimated Ready Time</p>
                  <p className="text-gray-600">{formatTime(order.estimatedReadyTime)}</p>
                </div>
              </div>
            )}
          </div>

          {/* Payment Status */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`p-3 rounded-2xl ${paymentConfig.color}`}>
                  <PaymentIcon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">{paymentConfig.title}</h3>
                  <p className="text-gray-600 text-sm">Payment method: Credit Card</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-900">${order.total.toFixed(2)}</p>
                <p className="text-sm text-gray-500">Total Amount</p>
              </div>
            </div>

            {order.paymentStatus === 'pending' && (
              <div className="mt-4 p-4 bg-yellow-50 rounded-2xl border border-yellow-200">
                <div className="flex items-center space-x-2">
                  <Timer className="w-5 h-5 text-yellow-600" />
                  <p className="text-sm text-yellow-800 font-medium">
                    Payment is still being processed. You'll receive a confirmation shortly.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Order Items */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center space-x-3">
                <div className="p-3 rounded-2xl bg-blue-100">
                  <ShoppingBag className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Order Items</h3>
                  <p className="text-gray-600">{order.items.length} item{order.items.length !== 1 ? 's' : ''}</p>
                </div>
              </div>
            </div>
            
            <div className="divide-y divide-gray-100">
              {order.items.map((item, index) => (
                <div key={index} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900 text-lg mb-2">{item.name}</h4>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span>Quantity: {item.quantity}</span>
                        <span>Unit Price: ${item.price.toFixed(2)}</span>
                      </div>
                      {item.customizations && item.customizations.length > 0 && (
                        <div className="mt-3">
                          <p className="text-sm font-medium text-gray-700 mb-1">Customizations:</p>
                          <div className="flex flex-wrap gap-2">
                            {item.customizations.map((customization, i) => (
                              <span key={i} className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm">
                                {customization}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-gray-900">
                        ${(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-3 rounded-2xl bg-green-100">
                <Receipt className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Order Summary</h3>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>${order.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Tax</span>
                <span>${order.tax.toFixed(2)}</span>
              </div>
              <div className="border-t border-gray-200 pt-3">
                <div className="flex justify-between text-xl font-bold text-gray-900">
                  <span>Total</span>
                  <span>${order.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Customer Information */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-3 rounded-2xl bg-purple-100">
                <User className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Customer Information</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <User className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Customer Name</p>
                    <p className="font-semibold text-gray-900">{order.customerName}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Phone className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Phone Number</p>
                    <p className="font-semibold text-gray-900">{order.customerPhone}</p>
                  </div>
                </div>
                
                {order.customerEmail && (
                  <div className="flex items-center space-x-3">
                    <Mail className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="font-semibold text-gray-900">{order.customerEmail}</p>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Order Placed</p>
                    <p className="font-semibold text-gray-900">{formatDate(order.createdAt)}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <Hash className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Order ID</p>
                    <p className="font-semibold text-gray-900 font-mono">{order._id}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Special Instructions */}
          {order.specialInstructions && (
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-3 rounded-2xl bg-orange-100">
                  <FileText className="w-6 h-6 text-orange-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Special Instructions</h3>
              </div>
              <div className="bg-orange-50 rounded-2xl p-4 border border-orange-200">
                <p className="text-gray-800 leading-relaxed">{order.specialInstructions}</p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-8">
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
        </div>
      </div>
    </div>
  );
}