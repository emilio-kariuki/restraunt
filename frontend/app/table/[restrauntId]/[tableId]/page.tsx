'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ShoppingCart, Plus, Minus, CreditCard, CheckCircle, Clock, ChefHat, Phone, MapPin } from 'lucide-react';

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
  id: string;
  status: string;
  total: number;
  items: any[];
  createdAt: string;
  estimatedReadyTime?: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:6000/api';

export default function TablePage() {
  const params = useParams();
  const restaurantId = params.restaurantId as string;
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

  // Initialize - Load table and menu data
  useEffect(() => {
    loadTableData();
  }, [restaurantId, tableId]);

  const loadTableData = async () => {
    try {
      setError(null);
      
      // Get table info
      const tableResponse = await fetch(`${API_BASE}/tables/${restaurantId}/${tableId}`);
      if (!tableResponse.ok) {
        throw new Error('Table not found');
      }
      const tableData = await tableResponse.json();
      setRestaurant(tableData.restaurant);
      setTable(tableData.table);

      // Check if restaurant is open and table is available
      if (!tableData.restaurant.isOpen) {
        setError('Restaurant is currently closed');
        return;
      }

      if (!tableData.table.available) {
        setError('Table is currently being cleaned. Please wait for staff assistance.');
        return;
      }

      // Get menu
      const menuResponse = await fetch(`${API_BASE}/tables/${restaurantId}/${tableId}/menu`);
      if (!menuResponse.ok) {
        throw new Error('Menu not available');
      }
      const menuData = await menuResponse.json();
      setMenu(menuData.menu);
      
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
    const tax = subtotal * 0.08; // 8% tax
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
        items: cart.map(item => ({
          menuItemId: item._id,
          quantity: item.quantity,
          customizations: item.customizations || []
        })),
        customerName,
        customerPhone
      };

      const response = await fetch(`${API_BASE}/orders/${restaurantId}/table/${tableId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        throw new Error('Failed to create order');
      }

      const result = await response.json();
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
      
      // Create order first
      const newOrder = await createOrder();
      
      // Create payment intent
      const paymentResponse = await fetch(`${API_BASE}/orders/${newOrder.id}/payment-intent`, {
        method: 'POST',
      });
      
      if (!paymentResponse.ok) {
        throw new Error('Failed to create payment');
      }
      
      // Simulate successful payment (in real app, integrate with Stripe Elements)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Confirm payment
      const confirmResponse = await fetch(`${API_BASE}/orders/${newOrder.id}/confirm-payment`, {
        method: 'POST',
      });
      
      if (!confirmResponse.ok) {
        throw new Error('Payment confirmation failed');
      }
      
      const result = await confirmResponse.json();
      setOrder(result.order);
      setCart([]);
      setCurrentView('order-status');
      
      // Start polling for order updates
      startOrderPolling(result.order.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const startOrderPolling = (orderId: string) => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`${API_BASE}/orders/${orderId}`);
        if (response.ok) {
          const data = await response.json();
          setOrder(data.order);
          
          // Stop polling when order is ready or served
          if (data.order.status === 'ready' || data.order.status === 'served') {
            clearInterval(pollInterval);
          }
        }
      } catch (err) {
        console.error('Error polling order status:', err);
      }
    }, 30000); // Poll every 30 seconds
  };

  // Loading state
  if (currentView === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading table information...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center p-6">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Oops!</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={loadTableData}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Menu View
  if (currentView === 'menu') {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b sticky top-0 z-10">
          <div className="max-w-md mx-auto p-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold text-gray-900">{restaurant?.name}</h1>
                <p className="text-sm text-gray-500">Table {table?.number}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-green-600">Open</p>
                <div className="flex items-center text-xs text-gray-500">
                  <MapPin className="w-3 h-3 mr-1" />
                  <span>Dine-in</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Cart Summary */}
        {cart.length > 0 && (
          <div className="max-w-md mx-auto p-4">
            <div 
              className="bg-green-50 border border-green-200 rounded-lg p-4 cursor-pointer hover:bg-green-100 transition-colors"
              onClick={() => setCurrentView('cart')}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <ShoppingCart className="w-5 h-5 text-green-600 mr-2" />
                  <span className="font-medium text-green-800">{getCartItemCount()} items</span>
                </div>
                <span className="font-bold text-green-800">${getCartTotal().toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Menu */}
        <div className="max-w-md mx-auto">
          {Object.entries(menu).map(([category, items]) => (
            <div key={category} className="p-4">
              <h2 className="text-lg font-bold mb-4 text-gray-900 capitalize border-b pb-2">
                {category}
              </h2>
              <div className="space-y-4">
                {items.map(item => (
                  <div key={item._id} className="bg-white rounded-lg shadow-sm border p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{item.name}</h3>
                        <p className="text-gray-600 text-sm mt-1">{item.description}</p>
                        {item.allergens && item.allergens.length > 0 && (
                          <p className="text-xs text-orange-600 mt-1">
                            Contains: {item.allergens.join(', ')}
                          </p>
                        )}
                      </div>
                      <span className="font-bold text-blue-600 ml-4">${item.price.toFixed(2)}</span>
                    </div>
                    <button
                      onClick={() => addToCart(item)}
                      className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                      Add to Cart
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Cart View
  if (currentView === 'cart') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-md mx-auto bg-white min-h-screen">
          {/* Header */}
          <div className="bg-blue-600 text-white p-4 sticky top-0 z-10">
            <button 
              onClick={() => setCurrentView('menu')}
              className="text-blue-100 hover:text-white mb-2 flex items-center"
            >
              ← Back to Menu
            </button>
            <h1 className="text-xl font-bold">Your Order</h1>
            <p className="text-blue-100">Table {table?.number}</p>
          </div>

          <div className="p-4">
            {cart.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">Your cart is empty</p>
                <button
                  onClick={() => setCurrentView('menu')}
                  className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg"
                >
                  Browse Menu
                </button>
              </div>
            ) : (
              <>
                {/* Cart Items */}
                <div className="space-y-4 mb-6">
                  {cart.map(item => (
                    <div key={item._id} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{item.name}</h3>
                          <p className="text-gray-600 text-sm">${item.price.toFixed(2)} each</p>
                        </div>
                        <div className="flex items-center">
                          <button
                            onClick={() => updateQuantity(item._id, item.quantity - 1)}
                            className="bg-gray-200 hover:bg-gray-300 p-2 rounded-full"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="mx-4 font-medium min-w-[2rem] text-center">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item._id, item.quantity + 1)}
                            className="bg-gray-200 hover:bg-gray-300 p-2 rounded-full"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-gray-900">
                          ${(item.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Order Summary */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span>${getSubtotal().toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tax (8%)</span>
                      <span>${getTax().toFixed(2)}</span>
                    </div>
                    <div className="border-t pt-2 flex justify-between font-bold text-lg">
                      <span>Total</span>
                      <span>${getCartTotal().toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Checkout Button */}
                <button
                  onClick={() => setCurrentView('payment')}
                  className="w-full bg-green-600 text-white py-4 rounded-lg hover:bg-green-700 transition-colors text-lg font-semibold"
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
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-md mx-auto bg-white min-h-screen">
          {/* Header */}
          <div className="bg-blue-600 text-white p-4 sticky top-0 z-10">
            <button 
              onClick={() => setCurrentView('cart')}
              className="text-blue-100 hover:text-white mb-2 flex items-center"
            >
              ← Back to Cart
            </button>
            <h1 className="text-xl font-bold">Payment</h1>
            <p className="text-blue-100">Table {table?.number}</p>
          </div>

          <div className="p-4">
            {/* Order Summary */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="font-semibold mb-3">Order Summary</h3>
              {cart.map(item => (
                <div key={item._id} className="flex justify-between text-sm mb-1">
                  <span>{item.quantity}x {item.name}</span>
                  <span>${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              <div className="border-t mt-3 pt-3 font-bold flex justify-between">
                <span>Total</span>
                <span>${getCartTotal().toFixed(2)}</span>
              </div>
            </div>

            {/* Payment Form */}
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium mb-2">Card Number</label>
                <input 
                  type="text" 
                  placeholder="1234 5678 9012 3456"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isProcessing}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Expiry</label>
                  <input 
                    type="text" 
                    placeholder="MM/YY"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={isProcessing}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">CVV</label>
                  <input 
                    type="text" 
                    placeholder="123"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={isProcessing}
                  />
                </div>
              </div>
            </div>
            
            {/* Pay Button */}
            <button
              onClick={processPayment}
              disabled={isProcessing}
              className="w-full bg-green-600 text-white py-4 rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 flex items-center justify-center text-lg font-semibold"
            >
              {isProcessing ? (
                <>
                  <Clock className="w-5 h-5 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="w-5 h-5 mr-2" />
                  Pay ${getCartTotal().toFixed(2)}
                </>
              )}
            </button>

            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}
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
          return <CheckCircle className="w-12 h-12 text-green-600" />;
        case 'preparing':
          return <ChefHat className="w-12 h-12 text-orange-600" />;
        case 'ready':
          return <CheckCircle className="w-12 h-12 text-green-600" />;
        default:
          return <Clock className="w-12 h-12 text-gray-600" />;
      }
    };

    const getStatusMessage = () => {
      switch (order.status) {
        case 'confirmed':
          return 'Your order has been confirmed and sent to the kitchen.';
        case 'preparing':
          return 'Your food is being prepared with care. It will be ready soon!';
        case 'ready':
          return 'Your order is ready! Please let your server know or come to the counter.';
        default:
          return 'Processing your order...';
      }
    };

    const getStatusColor = () => {
      switch (order.status) {
        case 'confirmed':
          return 'text-blue-600';
        case 'preparing':
          return 'text-orange-600';
        case 'ready':
          return 'text-green-600';
        default:
          return 'text-gray-600';
      }
    };

    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-md mx-auto bg-white min-h-screen">
          {/* Header */}
          <div className="bg-blue-600 text-white p-4 sticky top-0 z-10">
            <h1 className="text-xl font-bold">{restaurant?.name}</h1>
            <p className="text-blue-100">Table {table?.number} • Order #{order.id.slice(-6)}</p>
          </div>

          <div className="p-6 text-center">
            {/* Status Icon */}
            <div className="flex justify-center mb-6">
              {getStatusIcon()}
            </div>
            
            {/* Status */}
            <h2 className={`text-2xl font-bold mb-3 capitalize ${getStatusColor()}`}>
              {order.status}
            </h2>
            <p className="text-gray-600 mb-6 text-lg leading-relaxed">
              {getStatusMessage()}
            </p>

            {/* Estimated Time */}
            {order.estimatedReadyTime && order.status !== 'ready' && (
              <div className="bg-blue-50 rounded-lg p-4 mb-6">
                <p className="text-blue-800 font-medium">
                  Estimated time: {order.estimatedReadyTime}
                </p>
              </div>
            )}

            {/* Order Details */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
              <h3 className="font-semibold mb-3 text-center">Your Order</h3>
              {order.items.map((item: any, index: number) => (
                <div key={index} className="flex justify-between text-sm mb-2">
                  <span>{item.quantity}x {item.name}</span>
                  <span>${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              <div className="border-t mt-3 pt-3 font-bold flex justify-between">
                <span>Total Paid</span>
                <span>${order.total.toFixed(2)}</span>
              </div>
            </div>

            {/* Restaurant Contact */}
            <div className="bg-blue-50 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-center text-blue-800">
                <Phone className="w-4 h-4 mr-2" />
                <span className="text-sm">Need help? Call {restaurant?.phone}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={() => {
                  setCurrentView('menu');
                  setOrder(null);
                }}
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Order More Items
              </button>
              
              {order.status === 'ready' && (
                <button
                  onClick={() => window.location.reload()}
                  className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
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