'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ShoppingCart, Plus, Minus, CreditCard, CheckCircle, Clock, ChefHat, Phone, MapPin, Star, Utensils, AlertCircle } from 'lucide-react';
import { apiService } from '../../../../lib/api';

interface MenuItem {
  _id: string;
  name: string;
  description: string;
  price: number;
  image?: string;
  allergens?: string[];
}

interface CartItem extends MenuItem {
  quantity: number;
  customizations?: string[];
}

interface Restaurant {
  id: string;
  name: string;
  address: string;
  phone: string;
  isOpen: boolean;
}

interface Table {
  number: string;
  capacity: number;
  status: string;
  available: boolean;
}

interface Order {
  _id: string;
  status: string;
  total: number;
  items: any[];
  createdAt: string;
  estimatedReadyTime?: string;
}

export default function TablePage() {
  const params = useParams();
  const restaurantId = params.restrauntId as string;
  const tableId = params.tableId as string;

  // State management
  const [currentView, setCurrentView] = useState<'loading' | 'menu' | 'cart' | 'payment' | 'order-status'>('loading');
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [table, setTable] = useState<Table | null>(null);
  const [menu, setMenu] = useState<Record<string, MenuItem[]>>({});
  const [cart, setCart] = useState<CartItem[]>([]);
  const [order, setOrder] = useState<Order | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  // Initialize - Load table and menu data
  useEffect(() => {
    loadTableData();
  }, [restaurantId, tableId]);

  const loadTableData = async () => {
    try {
      setError(null);
      
      const tableData = await apiService.tables.getTableInfo(restaurantId, tableId);
      setRestaurant(tableData.restaurant);
      setTable(tableData.table);

    //   if (!tableData.restaurant.isOpen) {
    //     setError('Restaurant is currently closed');
    //     return;
    //   }

    //   if (!tableData.table.available) {
    //     setError('Table is currently being cleaned. Please wait for staff assistance.');
    //     return;
    //   }

      const menuData = await apiService.tables.getTableMenu(restaurantId, tableId);
      setMenu(menuData.menu);
      
      // Set first category as selected
      const categories = Object.keys(menuData.menu);
      if (categories.length > 0) {
        setSelectedCategory(categories[0]);
      }
      
      setCurrentView('menu');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load table data');
    }
  };

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(cartItem => cartItem._id === item._id);
      if (existing) {
        return prev.map(cartItem =>
          cartItem._id === item._id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const updateQuantity = (id: string, newQuantity: number) => {
    if (newQuantity === 0) {
      setCart(prev => prev.filter(item => item._id !== id));
    } else {
      setCart(prev => prev.map(item =>
        item._id === id ? { ...item, quantity: newQuantity } : item
      ));
    }
  };

  const getCartTotal = () => {
    const subtotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    const tax = subtotal * 0.08;
    return subtotal + tax;
  };

  const getSubtotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getTax = () => {
    return getSubtotal() * 0.08;
  };

  const getCartItemCount = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const createOrder = async (customerName?: string, customerPhone?: string) => {
    try {
      setIsProcessing(true);
      
      const orderData = {
        tableId: tableId,
        items: cart.map(item => ({
          menuItemId: item._id,
          quantity: item.quantity,
          customizations: item.customizations || []
        })),
        customerName,
        customerPhone
      };

      const result = await apiService.orders.createOrder(restaurantId, orderData);
      setOrder(result.order);
      return result.order;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to create order');
    } finally {
      setIsProcessing(false);
    }
  };

  const processPayment = async () => {
    try {
      setIsProcessing(true);
      
      const newOrder = await createOrder();
      await apiService.orders.createPaymentIntent(newOrder._id);
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const result = await apiService.orders.confirmPayment(newOrder._id);
      
      setOrder(result.order);
      setCart([]);
      setCurrentView('order-status');
      
      startOrderPolling(result.order._id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const startOrderPolling = (orderId: string) => {
    const pollInterval = setInterval(async () => {
      try {
        const data = await apiService.orders.getOrder(orderId);
        setOrder(data.order);
        
        if (data.order.status === 'ready' || data.order.status === 'served') {
          clearInterval(pollInterval);
        }
      } catch (err) {
        console.error('Error polling order status:', err);
      }
    }, 30000);
  };

//   // Loading state
//   if (currentView === 'loading') {
//     return (
//       <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
//         <div className="text-center">
//           <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
//           <p className="text-slate-600 font-medium">Loading your dining experience...</p>
//         </div>
//       </div>
//     );
//   }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center p-8 bg-white rounded-2xl shadow-xl">
          <div className="text-red-500 text-6xl mb-6">
            <AlertCircle className="w-16 h-16 mx-auto" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-4">Oops! Something went wrong</h1>
          <p className="text-slate-600 mb-6">{error}</p>
          <button 
            onClick={loadTableData}
            className="bg-blue-600 text-white px-8 py-3 rounded-full hover:bg-blue-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Menu View
  if (currentView === 'menu') {
    const categories = Object.keys(menu);
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        {/* Header */}
        <div className="bg-white shadow-lg border-b sticky top-0 z-20">
          <div className="max-w-md mx-auto p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">{restaurant?.name}</h1>
                <div className="flex items-center text-slate-600 text-sm mt-1">
                  <MapPin className="w-4 h-4 mr-1" />
                  <span>Table {table?.number} • {table?.capacity} seats</span>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center text-green-600 text-sm font-semibold">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  Open Now
                </div>
                <div className="flex items-center text-slate-500 text-xs mt-1">
                  <Phone className="w-3 h-3 mr-1" />
                  <span>Dine-in</span>
                </div>
              </div>
            </div>

            {/* Category Pills */}
            <div className="flex space-x-2 overflow-x-auto pb-2">
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                    selectedCategory === category
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Cart Summary */}
        {cart.length > 0 && (
          <div className="max-w-md mx-auto p-4">
            <div 
              className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl p-4 cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              onClick={() => setCurrentView('cart')}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="bg-white bg-opacity-20 p-2 rounded-full mr-3">
                    <ShoppingCart className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold">{getCartItemCount()} items in cart</p>
                    <p className="text-green-100 text-sm">Tap to review & checkout</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">${getCartTotal().toFixed(2)}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Menu Items */}
        <div className="max-w-md mx-auto pb-20">
          {selectedCategory && menu[selectedCategory] && (
            <div className="p-4">
              <h2 className="text-xl font-bold mb-4 text-slate-900 capitalize flex items-center">
                <Utensils className="w-5 h-5 mr-2 text-blue-600" />
                {selectedCategory}
              </h2>
              <div className="space-y-4">
                {menu[selectedCategory].map(item => (
                  <div key={item._id} className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1 pr-4">
                          <h3 className="font-bold text-slate-900 text-lg mb-2">{item.name}</h3>
                          <p className="text-slate-600 text-sm leading-relaxed mb-3">{item.description}</p>
                          {item.allergens && item.allergens.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-3">
                              {item.allergens.map(allergen => (
                                <span key={allergen} className="bg-orange-100 text-orange-700 text-xs px-2 py-1 rounded-full">
                                  {allergen}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <span className="text-2xl font-bold text-blue-600">${item.price.toFixed(2)}</span>
                          <div className="flex items-center mt-1 text-yellow-500">
                            <Star className="w-4 h-4 fill-current" />
                            <span className="text-xs text-slate-500 ml-1">4.8</span>
                          </div>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => addToCart(item)}
                        className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-6 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
                      >
                        <Plus className="w-5 h-5 inline mr-2" />
                        Add to Cart
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Cart View
  if (currentView === 'cart') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="max-w-md mx-auto bg-white min-h-screen">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 sticky top-0 z-10">
            <button 
              onClick={() => setCurrentView('menu')}
              className="text-blue-100 hover:text-white mb-4 flex items-center transition-colors"
            >
              ← Back to Menu
            </button>
            <h1 className="text-2xl font-bold mb-1">Your Order</h1>
            <p className="text-blue-100">Table {table?.number} • {restaurant?.name}</p>
          </div>

          <div className="p-6">
            {cart.length === 0 ? (
              <div className="text-center py-16">
                <div className="bg-slate-100 p-6 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                  <ShoppingCart className="w-12 h-12 text-slate-400" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Your cart is empty</h3>
                <p className="text-slate-600 mb-6">Add some delicious items from our menu</p>
                <button
                  onClick={() => setCurrentView('menu')}
                  className="bg-blue-600 text-white px-8 py-3 rounded-full hover:bg-blue-700 transition-colors font-semibold"
                >
                  Browse Menu
                </button>
              </div>
            ) : (
              <>
                {/* Cart Items */}
                <div className="space-y-4 mb-8">
                  {cart.map(item => (
                    <div key={item._id} className="bg-slate-50 rounded-2xl p-4 hover:bg-slate-100 transition-colors">
                      <div className="flex justify-between items-center mb-3">
                        <div className="flex-1">
                          <h3 className="font-bold text-slate-900">{item.name}</h3>
                          <p className="text-slate-600 text-sm">${item.price.toFixed(2)} each</p>
                        </div>
                        <div className="flex items-center bg-white rounded-full shadow-sm">
                          <button
                            onClick={() => updateQuantity(item._id, item.quantity - 1)}
                            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                          >
                            <Minus className="w-4 h-4 text-slate-600" />
                          </button>
                          <span className="mx-4 font-semibold text-slate-900 min-w-[2rem] text-center">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item._id, item.quantity + 1)}
                            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                          >
                            <Plus className="w-4 h-4 text-slate-600" />
                          </button>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-bold text-slate-900">
                          ${(item.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Order Summary */}
                <div className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-2xl p-6 mb-8">
                  <h3 className="font-bold text-slate-900 mb-4">Order Summary</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between text-slate-700">
                      <span>Subtotal</span>
                      <span>${getSubtotal().toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-slate-700">
                      <span>Tax (8%)</span>
                      <span>${getTax().toFixed(2)}</span>
                    </div>
                    <div className="border-t border-slate-200 pt-3 flex justify-between font-bold text-xl text-slate-900">
                      <span>Total</span>
                      <span>${getCartTotal().toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Checkout Button */}
                <button
                  onClick={() => setCurrentView('payment')}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-4 rounded-2xl hover:from-green-700 hover:to-emerald-700 transition-all duration-200 text-lg font-bold shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  Proceed to Payment
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Payment View
  if (currentView === 'payment') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="max-w-md mx-auto bg-white min-h-screen">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-6 sticky top-0 z-10">
            <button 
              onClick={() => setCurrentView('cart')}
              className="text-green-100 hover:text-white mb-4 flex items-center transition-colors"
            >
              ← Back to Cart
            </button>
            <h1 className="text-2xl font-bold mb-1">Secure Payment</h1>
            <p className="text-green-100">Complete your order</p>
          </div>

          <div className="p-6">
            {/* Order Summary */}
            <div className="bg-gradient-to-r from-slate-50 to-green-50 rounded-2xl p-6 mb-8">
              <h3 className="font-bold text-slate-900 mb-4 flex items-center">
                <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
                Order Summary
              </h3>
              {cart.map(item => (
                <div key={item._id} className="flex justify-between text-sm mb-2">
                  <span className="text-slate-700">{item.quantity}x {item.name}</span>
                  <span className="font-semibold text-slate-900">${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              <div className="border-t border-slate-200 mt-4 pt-4 font-bold text-lg flex justify-between text-slate-900">
                <span>Total</span>
                <span>${getCartTotal().toFixed(2)}</span>
              </div>
            </div>

            {/* Payment Form */}
            <div className="space-y-6 mb-8">
              <div>
                <label className="block text-sm font-semibold mb-3 text-slate-700">Card Information</label>
                <div className="bg-slate-50 rounded-2xl p-4 space-y-4">
                  <input 
                    type="text" 
                    placeholder="1234 5678 9012 3456"
                    className="w-full p-4 bg-white border-2 border-slate-200 rounded-xl focus:border-green-500 focus:outline-none transition-colors font-mono"
                    disabled={isProcessing}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <input 
                      type="text" 
                      placeholder="MM/YY"
                      className="w-full p-4 bg-white border-2 border-slate-200 rounded-xl focus:border-green-500 focus:outline-none transition-colors font-mono"
                      disabled={isProcessing}
                    />
                    <input 
                      type="text" 
                      placeholder="CVV"
                      className="w-full p-4 bg-white border-2 border-slate-200 rounded-xl focus:border-green-500 focus:outline-none transition-colors font-mono"
                      disabled={isProcessing}
                    />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Pay Button */}
            <button
              onClick={processPayment}
              disabled={isProcessing}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-4 rounded-2xl hover:from-green-700 hover:to-emerald-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-lg font-bold shadow-lg hover:shadow-xl"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-3"></div>
                  Processing Payment...
                </>
              ) : (
                <>
                  <CreditCard className="w-5 h-5 mr-3" />
                  Pay ${getCartTotal().toFixed(2)}
                </>
              )}
            </button>

            {error && (
              <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-2xl">
                <div className="flex items-center text-red-700">
                  <AlertCircle className="w-5 h-5 mr-2" />
                  <div>
                    <p className="font-semibold">Payment Error</p>
                    <p className="text-sm">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Security Notice */}
            <div className="mt-6 text-center">
              <p className="text-xs text-slate-500">
                🔒 Your payment is secured with 256-bit SSL encryption
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Order Status View
  if (currentView === 'order-status' && order) {
    const getStatusIcon = () => {
      switch (order.status) {
        case 'confirmed':
          return <CheckCircle className="w-16 h-16 text-green-600" />;
        case 'preparing':
          return <ChefHat className="w-16 h-16 text-orange-600" />;
        case 'ready':
          return <CheckCircle className="w-16 h-16 text-green-600" />;
        default:
          return <Clock className="w-16 h-16 text-slate-600" />;
      }
    };

    const getStatusMessage = () => {
      switch (order.status) {
        case 'confirmed':
          return 'Your order has been confirmed and sent to our kitchen. Our chefs are preparing your delicious meal!';
        case 'preparing':
          return 'Our kitchen team is carefully preparing your food with fresh ingredients. It will be ready soon!';
        case 'ready':
          return 'Your order is ready! Please let your server know or visit our counter to collect your meal.';
        default:
          return 'Processing your order...';
      }
    };

    const getStatusColor = () => {
      switch (order.status) {
        case 'confirmed':
          return 'from-blue-600 to-blue-700';
        case 'preparing':
          return 'from-orange-600 to-red-600';
        case 'ready':
          return 'from-green-600 to-emerald-600';
        default:
          return 'from-slate-600 to-slate-700';
      }
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="max-w-md mx-auto bg-white min-h-screen">
          {/* Header */}
          <div className={`bg-gradient-to-r ${getStatusColor()} text-white p-6 sticky top-0 z-10`}>
            <h1 className="text-2xl font-bold mb-1">{restaurant?.name}</h1>
            <p className="text-blue-100">Table {table?.number} • Order #{order._id.slice(-6)}</p>
          </div>

          <div className="p-6 text-center">
            {/* Status Icon */}
            <div className="flex justify-center mb-8">
              <div className="bg-slate-50 p-6 rounded-full">
                {getStatusIcon()}
              </div>
            </div>
            
            {/* Status */}
            <div className={`inline-block px-6 py-3 rounded-full text-white font-bold text-lg mb-6 bg-gradient-to-r ${getStatusColor()}`}>
              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
            </div>
            
            <p className="text-slate-600 mb-8 text-lg leading-relaxed px-4">
              {getStatusMessage()}
            </p>

            {/* Estimated Time */}
            {order.estimatedReadyTime && order.status !== 'ready' && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 mb-8">
                <div className="flex items-center justify-center text-blue-800">
                  <Clock className="w-5 h-5 mr-2" />
                  <p className="font-semibold">Estimated time: {order.estimatedReadyTime}</p>
                </div>
              </div>
            )}

            {/* Order Details */}
            <div className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-2xl p-6 mb-8 text-left">
              <h3 className="font-bold text-center mb-6 text-slate-900 text-lg">Your Order</h3>
              {order.items.map((item: any, index: number) => (
                <div key={index} className="flex justify-between text-slate-700 mb-3">
                  <span>{item.quantity}x {item.name}</span>
                  <span className="font-semibold">${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              <div className="border-t border-slate-200 mt-4 pt-4 font-bold text-lg flex justify-between text-slate-900">
                <span>Total Paid</span>
                <span>${order.total.toFixed(2)}</span>
              </div>
            </div>

            {/* Restaurant Contact */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 mb-8">
              <div className="flex items-center justify-center text-blue-800">
                <Phone className="w-5 h-5 mr-2" />
                <span className="font-medium">Need help? Call {restaurant?.phone}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-4">
              <button
                onClick={() => {
                  setCurrentView('menu');
                  setOrder(null);
                }}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 rounded-2xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl"
              >
                Order More Items
              </button>
              
              {order.status === 'ready' && (
                <button
                  onClick={() => window.location.reload()}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-4 rounded-2xl hover:from-green-700 hover:to-emerald-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl"
                >
                  ✓ Order Received
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}