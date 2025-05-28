
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { 
  ShoppingCart, Plus, Minus, CreditCard, CheckCircle, Clock, ChefHat, 
  Phone, MapPin, Star, Utensils, AlertCircle, Mail, User, MessageSquare,
  Filter, Search, X, ChevronLeft, Info, Loader2,
  Users
} from 'lucide-react';
import { apiService } from '../../../../lib/api';
import { loadStripe } from '@stripe/stripe-js';
import { 
  Elements, 
  CardElement, 
  useStripe, 
  useElements 
} from '@stripe/react-stripe-js';

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface MenuItem {
  _id: string;
  name: string;
  description: string;
  price: number;
  image?: string;
  allergens?: string[];
  category: string;
  preparationTime?: number;
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
  orderNumber?: string;
}

interface CustomerInfo {
  name: string;
  phone: string;
  email: string;
  specialInstructions: string;
}

// Payment Form Component
function PaymentForm({ 
  clientSecret, 
  onSuccess, 
  onError, 
  customerInfo,
  amount 
}: { 
  clientSecret: string;
  onSuccess: () => void;
  onError: (error: string) => void;
  customerInfo: CustomerInfo;
  amount: number;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [cardError, setCardError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) return;

    setIsProcessing(true);
    setCardError(null);

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) return;

    try {
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: customerInfo.name,
            phone: customerInfo.phone,
            email: customerInfo.email,
          },
        },
      });

      if (error) {
        setCardError(error.message || 'Payment failed');
        onError(error.message || 'Payment failed');
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        onSuccess();
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Payment failed';
      setCardError(message);
      onError(message);
    } finally {
      setIsProcessing(false);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#1f2937',
        '::placeholder': {
          color: '#9ca3af',
        },
        iconColor: '#3b82f6',
      },
      invalid: {
        color: '#ef4444',
        iconColor: '#ef4444',
      },
    },
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-gray-50 p-4 rounded-xl">
        <label className="block text-sm font-semibold mb-3 text-gray-700">
          Card Details
        </label>
        <div className="p-4 border-2 border-gray-200 rounded-lg bg-white focus-within:border-blue-500 transition-colors">
          <CardElement options={cardElementOptions} />
        </div>
        {cardError && (
          <p className="mt-2 text-sm text-red-600 flex items-center">
            <AlertCircle className="w-4 h-4 mr-1" />
            {cardError}
          </p>
        )}
      </div>

      <div className="bg-blue-50 p-4 rounded-xl">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600">Amount to pay</span>
          <span className="text-2xl font-bold text-gray-900">${amount.toFixed(2)}</span>
        </div>
        <p className="text-xs text-gray-500">
          Your payment info is secure and encrypted
        </p>
      </div>

      <button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center"
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Processing Payment...
          </>
        ) : (
          <>
            <CreditCard className="w-5 h-5 mr-2" />
            Complete Payment
          </>
        )}
      </button>
    </form>
  );
}

export default function TablePage() {
  const params = useParams();
  const restaurantId = params.restrauntId as string;
  const tableId = params.tableId as string;

  // State management
  const [currentView, setCurrentView] = useState<'loading' | 'menu' | 'cart' | 'checkout' | 'payment' | 'order-status'>('loading');
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [table, setTable] = useState<Table | null>(null);
  const [menu, setMenu] = useState<Record<string, MenuItem[]>>({});
  const [cart, setCart] = useState<CartItem[]>([]);
  const [order, setOrder] = useState<Order | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    name: '',
    phone: '',
    email: '',
    specialInstructions: ''
  });
  const [validationErrors, setValidationErrors] = useState<Partial<CustomerInfo>>({});

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

  // Validate customer info
  const validateCustomerInfo = (): boolean => {
    const errors: Partial<CustomerInfo> = {};
    
    if (!customerInfo.name.trim()) {
      errors.name = 'Name is required';
    }
    
    if (!customerInfo.phone.trim()) {
      errors.phone = 'Phone number is required';
    } else if (!/^\+?[1-9]\d{1,14}$/.test(customerInfo.phone.replace(/\s/g, ''))) {
      errors.phone = 'Invalid phone number format';
    }
    
    if (customerInfo.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerInfo.email)) {
      errors.email = 'Invalid email format';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Cart functions
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

  // Filter menu items based on search
  const getFilteredMenuItems = () => {
    if (!selectedCategory || !menu[selectedCategory]) return [];
    
    return menu[selectedCategory].filter(item => {
      if (!searchQuery) return true;
      return item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
             item.description.toLowerCase().includes(searchQuery.toLowerCase());
    });
  };

  // Create order and payment intent
  const proceedToPayment = async () => {
    if (!validateCustomerInfo()) return;
    
    try {
      setIsProcessing(true);
      
      const orderData = {
        tableId: tableId,
        items: cart.map(item => ({
          menuItemId: item._id,
          quantity: item.quantity,
          customizations: item.customizations || []
        })),
        customerName: customerInfo.name,
        customerPhone: customerInfo.phone,
        customerEmail: customerInfo.email,
        specialInstructions: customerInfo.specialInstructions
      };

      const orderResult = await apiService.orders.createOrder(restaurantId, orderData);
      const paymentResult = await apiService.orders.createPaymentIntent(orderResult.order._id);
      
      setOrder(orderResult.order);
      setClientSecret(paymentResult.clientSecret);
      setCurrentView('payment');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create order');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle successful payment
  const handlePaymentSuccess = async () => {
    try {
      if (!order) return;
      
      const result = await apiService.orders.confirmPayment(order._id);
      setOrder(result.order);
      setCart([]);
      setCurrentView('order-status');
      
      // Start polling for order updates
      startOrderPolling(result.order._id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment confirmation failed');
    }
  };

  // Poll for order status updates
  const startOrderPolling = (orderId: string) => {
    const pollInterval = setInterval(async () => {
      try {
        const data = await apiService.orders.getOrder(orderId);
        setOrder(data.order);
        
        if (data.order.status === 'completed' || data.order.status === 'cancelled') {
          clearInterval(pollInterval);
        }
      } catch (err) {
        console.error('Error polling order status:', err);
      }
    }, 10000); // Poll every 10 seconds
  };

  // Loading state
  if (currentView === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading your dining experience...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center p-8 bg-white rounded-2xl shadow-xl">
          <div className="text-red-500 mb-6">
            <AlertCircle className="w-16 h-16 mx-auto" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Oops! Something went wrong</h1>
          <p className="text-gray-600 mb-6">{error}</p>
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
    const filteredItems = getFilteredMenuItems();
    
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-lg sticky top-0 z-20">
          <div className="max-w-md mx-auto">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{restaurant?.name}</h1>
                  <div className="flex items-center text-gray-500 text-sm mt-1">
                    <MapPin className="w-4 h-4 mr-1" />
                    <span>Table {table?.number}</span>
                    <span className="mx-2">•</span>
                    <Users className="w-4 h-4 mr-1" />
                    <span>{table?.capacity} seats</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center text-green-600 text-sm font-semibold">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                    Open Now
                  </div>
                </div>
              </div>

              {/* Search Bar */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search menu items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>

              {/* Category Pills */}
              <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-hide">
                {categories.map(category => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                      selectedCategory === category
                        ? 'bg-blue-600 text-white shadow-lg transform scale-105'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Floating Cart Summary */}
        {cart.length > 0 && (
          <div className="fixed bottom-0 left-0 right-0 z-30 p-4 bg-gradient-to-t from-black/20 to-transparent pointer-events-none">
            <div className="max-w-md mx-auto">
              <div 
                className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-2xl p-4 shadow-2xl cursor-pointer hover:shadow-3xl transition-all duration-300 transform hover:scale-[1.02] pointer-events-auto"
                onClick={() => setCurrentView('cart')}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="bg-white/20 backdrop-blur-sm p-2 rounded-full mr-3">
                      <ShoppingCart className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="font-semibold text-lg">{getCartItemCount()} items</p>
                      <p className="text-blue-100 text-sm">Tap to view cart</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">${getCartTotal().toFixed(2)}</p>
                    <p className="text-xs text-blue-100">incl. tax</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Menu Items */}
        <div className="max-w-md mx-auto pb-32">
          <div className="p-4">
            {filteredItems.length === 0 ? (
              <div className="text-center py-12">
                <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No items found</p>
                <p className="text-gray-400 text-sm">Try searching for something else</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredItems.map(item => (
                  <div key={item._id} className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1 pr-4">
                          <h3 className="font-bold text-gray-900 text-lg mb-2 group-hover:text-blue-600 transition-colors">
                            {item.name}
                          </h3>
                          <p className="text-gray-600 text-sm leading-relaxed mb-3">{item.description}</p>
                          
                          <div className="flex flex-wrap gap-2 mb-3">
                            {item.allergens && item.allergens.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {item.allergens.map(allergen => (
                                  <span key={allergen} className="inline-flex items-center px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full">
                                    <AlertCircle className="w-3 h-3 mr-1" />
                                    {allergen}
                                  </span>
                                ))}
                              </div>
                            )}
                            {item.preparationTime && (
                              <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                                <Clock className="w-3 h-3 mr-1" />
                                {item.preparationTime} min
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-2xl font-bold text-blue-600">${item.price.toFixed(2)}</span>
                          <div className="flex items-center mt-1 text-yellow-500">
                            <Star className="w-4 h-4 fill-current" />
                            <span className="text-xs text-gray-500 ml-1">4.8</span>
                          </div>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => addToCart(item)}
                        className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-6 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-[1.02] flex items-center justify-center group"
                      >
                        <Plus className="w-5 h-5 mr-2 transform group-hover:rotate-90 transition-transform" />
                        Add to Cart
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
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
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 sticky top-0 z-10">
            <button 
              onClick={() => setCurrentView('menu')}
              className="text-blue-100 hover:text-white mb-4 flex items-center transition-colors"
            >
              <ChevronLeft className="w-5 h-5 mr-1" />
              Back to Menu
            </button>
            <h1 className="text-2xl font-bold mb-1">Your Order</h1>
            <p className="text-blue-100">Review and checkout</p>
          </div>

          <div className="p-6">
            {cart.length === 0 ? (
              <div className="text-center py-16">
                <div className="bg-gray-100 p-6 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                  <ShoppingCart className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Your cart is empty</h3>
                <p className="text-gray-600 mb-6">Add some delicious items from our menu</p>
                <button
                  onClick={() => setCurrentView('menu')}
                  className="bg-blue-600 text-white px-8 py-3 rounded-full hover:bg-blue-700 transition-colors font-semibold shadow-lg hover:shadow-xl"
                >
                  Browse Menu
                </button>
              </div>
            ) : (
              <>
                {/* Cart Items */}
                <div className="space-y-4 mb-8">
                  {cart.map(item => (
                    <div key={item._id} className="bg-gray-50 rounded-2xl p-4 hover:bg-gray-100 transition-colors">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-900">{item.name}</h3>
                          <p className="text-gray-600 text-sm mt-1">${item.price.toFixed(2)} each</p>
                        </div>
                        <div className="text-right">
                          <span className="text-lg font-bold text-gray-900">
                            ${(item.price * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center bg-white rounded-full shadow-sm">
                          <button
                            onClick={() => updateQuantity(item._id, item.quantity - 1)}
                            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                          >
                            <Minus className="w-4 h-4 text-gray-600" />
                          </button>
                          <span className="mx-4 font-semibold text-gray-900 min-w-[2rem] text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item._id, item.quantity + 1)}
                            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                          >
                            <Plus className="w-4 h-4 text-gray-600" />
                          </button>
                        </div>
                        <button
                          onClick={() => updateQuantity(item._id, 0)}
                          className="text-red-500 hover:text-red-700 transition-colors text-sm font-medium"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Order Summary */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 mb-8">
                  <h3 className="font-bold text-gray-900 mb-4">Order Summary</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between text-gray-700">
                      <span>Subtotal</span>
                      <span>${getSubtotal().toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-gray-700">
                      <span>Tax (8%)</span>
                      <span>${getTax().toFixed(2)}</span>
                    </div>
                    <div className="border-t border-gray-200 pt-3 flex justify-between font-bold text-xl text-gray-900">
                      <span>Total</span>
                      <span>${getCartTotal().toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Checkout Button */}
                <button
                  onClick={() => setCurrentView('checkout')}
                  className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-4 rounded-2xl hover:from-green-700 hover:to-green-800 transition-all duration-200 text-lg font-bold shadow-lg hover:shadow-xl transform hover:scale-[1.02] flex items-center justify-center"
                >
                  Proceed to Checkout
                  <ChevronLeft className="w-5 h-5 ml-2 transform rotate-180" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Checkout View (Customer Info)
  if (currentView === 'checkout') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-md mx-auto bg-white min-h-screen">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-6 sticky top-0 z-10">
            <button 
              onClick={() => setCurrentView('cart')}
              className="text-green-100 hover:text-white mb-4 flex items-center transition-colors"
            >
              <ChevronLeft className="w-5 h-5 mr-1" />
              Back to Cart
            </button>
            <h1 className="text-2xl font-bold mb-1">Contact Information</h1>
            <p className="text-green-100">We'll notify you when your order is ready</p>
          </div>

          <div className="p-6">
            <form className="space-y-6">
              {/* Name Field */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">
                  Your Name *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    value={customerInfo.name}
                    onChange={(e) => setCustomerInfo({...customerInfo, name: e.target.value})}
                    className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors ${
                      validationErrors.name ? 'border-red-300' : 'border-gray-200'
                    }`}
                    placeholder="John Doe"
                  />
                </div>
                {validationErrors.name && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {validationErrors.name}
                  </p>
                )}
              </div>

              {/* Phone Field */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">
                  Phone Number *
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="tel"
                    value={customerInfo.phone}
                    onChange={(e) => setCustomerInfo({...customerInfo, phone: e.target.value})}
                    className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors ${
                      validationErrors.phone ? 'border-red-300' : 'border-gray-200'
                    }`}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
                {validationErrors.phone && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {validationErrors.phone}
                  </p>
                )}
              </div>

              {/* Email Field */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">
                  Email (optional)
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="email"
                    value={customerInfo.email}
                    onChange={(e) => setCustomerInfo({...customerInfo, email: e.target.value})}
                    className={`w-full pl-10 pr-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors ${
                      validationErrors.email ? 'border-red-300' : 'border-gray-200'
                    }`}
                    placeholder="john@example.com"
                  />
                </div>
                {validationErrors.email && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {validationErrors.email}
                  </p>
                )}
              </div>

              {/* Special Instructions */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">
                  Special Instructions (optional)
                </label>
                <div className="relative">
                  <MessageSquare className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                  <textarea
                    value={customerInfo.specialInstructions}
                    onChange={(e) => setCustomerInfo({...customerInfo, specialInstructions: e.target.value})}
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors resize-none"
                    rows={3}
                    placeholder="Any allergies, dietary restrictions, or special requests..."
                  />
                </div>
              </div>

              {/* Order Summary */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center">
                  <Info className="w-5 h-5 mr-2 text-green-600" />
                  Order Summary
                </h3>
                <div className="space-y-2 mb-4">
                  {cart.map(item => (
                    <div key={item._id} className="flex justify-between text-sm">
                      <span className="text-gray-700">{item.quantity}x {item.name}</span>
                      <span className="font-semibold text-gray-900">${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-gray-200 pt-4 font-bold text-lg flex justify-between text-gray-900">
                  <span>Total</span>
                  <span>${getCartTotal().toFixed(2)}</span>
                </div>
              </div>

              {/* Continue Button */}
              <button
                type="button"
                onClick={proceedToPayment}
                disabled={isProcessing}
                className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-4 rounded-2xl hover:from-green-700 hover:to-green-800 transition-all duration-200 text-lg font-bold shadow-lg hover:shadow-xl transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Creating Order...
                  </>
                ) : (
                  <>
                    Continue to Payment
                    <ChevronLeft className="w-5 h-5 ml-2 transform rotate-180" />
                  </>
                )}
              </button>

              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-2xl">
                  <div className="flex items-center text-red-700">
                    <AlertCircle className="w-5 h-5 mr-2" />
                    <div>
                      <p className="font-semibold">Error</p>
                      <p className="text-sm">{error}</p>
                    </div>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Payment View
  if (currentView === 'payment' && clientSecret) {
    return (
      <Elements stripe={stripePromise}>
        <div className="min-h-screen bg-gray-50">
          <div className="max-w-md mx-auto bg-white min-h-screen">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 sticky top-0 z-10">
              <button 
                onClick={() => setCurrentView('checkout')}
                className="text-blue-100 hover:text-white mb-4 flex items-center transition-colors"
              >
                <ChevronLeft className="w-5 h-5 mr-1" />
                Back to Checkout
              </button>
              <h1 className="text-2xl font-bold mb-1">Secure Payment</h1>
              <p className="text-blue-100">Complete your order</p>
            </div>

            <div className="p-6">
              {/* Customer Info Summary */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 mb-6">
                <h3 className="font-bold text-gray-900 mb-3">Order Details</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Name:</span>
                    <span className="font-medium">{customerInfo.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Phone:</span>
                    <span className="font-medium">{customerInfo.phone}</span>
                  </div>
                  {customerInfo.email && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Email:</span>
                      <span className="font-medium">{customerInfo.email}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Table:</span>
                    <span className="font-medium">{table?.number}</span>
                  </div>
                </div>
              </div>

              {/* Payment Form */}
              <PaymentForm
                clientSecret={clientSecret}
                onSuccess={handlePaymentSuccess}
                onError={setError}
                customerInfo={customerInfo}
                amount={getCartTotal()}
              />

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
                <p className="text-xs text-gray-500 flex items-center justify-center">
                  <span className="mr-1">🔒</span>
                  Your payment is secured with 256-bit SSL encryption
                </p>
              </div>
            </div>
          </div>
        </div>
      </Elements>
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
        case 'completed':
          return <CheckCircle className="w-16 h-16 text-green-600" />;
        default:
          return <Clock className="w-16 h-16 text-gray-600" />;
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
        case 'completed':
          return 'Thank you for dining with us! We hope you enjoyed your meal.';
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
        case 'completed':
          return 'from-green-600 to-emerald-600';
        default:
          return 'from-gray-600 to-gray-700';
      }
    };

    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-md mx-auto bg-white min-h-screen">
          {/* Header */}
          <div className={`bg-gradient-to-r ${getStatusColor()} text-white p-6 sticky top-0 z-10`}>
            <h1 className="text-2xl font-bold mb-1">{restaurant?.name}</h1>
            <p className="text-blue-100">Order #{order.orderNumber || order._id.slice(-6)}</p>
          </div>

          <div className="p-6 text-center">
            {/* Status Icon */}
            <div className="flex justify-center mb-8">
              <div className="bg-gray-50 p-6 rounded-full">
                {getStatusIcon()}
              </div>
            </div>
            
            {/* Status */}
            <div className={`inline-block px-6 py-3 rounded-full text-white font-bold text-lg mb-6 bg-gradient-to-r ${getStatusColor()}`}>
              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
            </div>
            
            <p className="text-gray-600 mb-8 text-lg leading-relaxed px-4">
              {getStatusMessage()}
            </p>

            {/* Estimated Time */}
            {order.estimatedReadyTime && order.status !== 'ready' && order.status !== 'completed' && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 mb-8">
                <div className="flex items-center justify-center text-blue-800">
                  <Clock className="w-5 h-5 mr-2" />
                  <p className="font-semibold">Estimated time: {order.estimatedReadyTime}</p>
                </div>
              </div>
            )}

            {/* Order Details */}
            <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl p-6 mb-8 text-left">
              <h3 className="font-bold text-center mb-6 text-gray-900 text-lg">Your Order</h3>
              {order.items.map((item: any, index: number) => (
                <div key={index} className="flex justify-between text-gray-700 mb-3">
                  <span>{item.quantity}x {item.name}</span>
                  <span className="font-semibold">${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              <div className="border-t border-gray-200 mt-4 pt-4 font-bold text-lg flex justify-between text-gray-900">
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
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 rounded-2xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
              >
                Order More Items
              </button>
              
              {order.status === 'completed' && (
                <button
                  onClick={() => window.location.reload()}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-4 rounded-2xl hover:from-green-700 hover:to-emerald-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
                >
                  Start New Order
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