'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import {
  ArrowLeft, CreditCard, ShoppingBag, AlertCircle, 
  CheckCircle2, Loader2, User, Phone, Mail, 
  MessageSquare, Shield, Clock, DollarSign, MapPin,
  Receipt, Utensils, Star, Trash2, Edit3
} from 'lucide-react';
import { apiService } from '../../../../../lib/api';

// Initialize Stripe - you'll need to add your publishable key
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

interface CartItem {
  id: string;
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  description?: string;
}

interface OrderFormData {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  specialInstructions: string;
}

// Checkout form component that uses Stripe hooks
function CheckoutForm({ cart, total }: { cart: CartItem[], total: number }) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const params = useParams();
  const restaurantId = params.restrauntId as string;
  const tableId = params.tableId as string;

  const [formData, setFormData] = useState<OrderFormData>({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    specialInstructions: ''
  });

  const [errors, setErrors] = useState<Partial<OrderFormData>>({});
  const [cardError, setCardError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);

  const validateForm = (): boolean => {
    const newErrors: Partial<OrderFormData> = {};

    if (!formData.customerName.trim()) {
      newErrors.customerName = 'Name is required';
    }

    if (!formData.customerPhone.trim()) {
      newErrors.customerPhone = 'Phone number is required';
    } else if (!/^\+?[1-9]\d{1,14}$/.test(formData.customerPhone.replace(/\s/g, ''))) {
      newErrors.customerPhone = 'Invalid phone number format';
    }

    if (formData.customerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.customerEmail)) {
      newErrors.customerEmail = 'Invalid email format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;
    if (!stripe || !elements) return;

    setIsProcessing(true);
    setCardError(null);

    try {
      // Step 1: Create order
      const orderData = {
        tableId,
        items: cart.map(item => ({
          menuItemId: item.menuItemId || item.id,
          quantity: item.quantity,
          customizations: []
        })),
        customerName: formData.customerName,
        customerPhone: formData.customerPhone.replace(/\s/g, ''),
        customerEmail: formData.customerEmail || undefined,
        specialInstructions: formData.specialInstructions || undefined
      };

      const orderResponse = await apiService.orders.createOrder(restaurantId, orderData);
      const createdOrderId = orderResponse.order._id;
      setOrderId(createdOrderId);

      // Step 2: Create payment intent
      const paymentIntentResponse = await apiService.orders.createPaymentIntent(createdOrderId);
      
      // Step 3: Confirm payment with Stripe
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) throw new Error('Card element not found');

      const { error, paymentIntent } = await stripe.confirmCardPayment(
        paymentIntentResponse.clientSecret,
        {
          payment_method: {
            card: cardElement,
            billing_details: {
              name: formData.customerName,
              email: formData.customerEmail || undefined,
              phone: formData.customerPhone || undefined
            }
          }
        }
      );

      if (error) {
        setCardError(error.message || 'Payment failed');
        return;
      }

      if (paymentIntent?.status === 'succeeded') {
        // Step 4: Confirm payment on backend
        await apiService.orders.confirmPayment(createdOrderId);
        
        // Clear cart and show success
        localStorage.removeItem('cart');
        setOrderComplete(true);
        
        // Redirect to order tracking after 3 seconds
        setTimeout(() => {
          router.push(`/table/${restaurantId}/${tableId}/order/${createdOrderId}`);
        }, 3000);
      }
    } catch (error) {
      console.error('Checkout error:', error);
      setCardError(error instanceof Error ? error.message : 'Payment failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Success state
  if (orderComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl p-6 sm:p-8 max-w-md w-full text-center transform animate-in zoom-in duration-500">
          <div className="relative mb-6">
            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-r from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto shadow-lg">
              <CheckCircle2 className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center">
              <Star className="w-4 h-4 text-yellow-700 fill-current" />
            </div>
          </div>
          
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">Order Confirmed!</h1>
          <p className="text-gray-600 mb-6 text-sm sm:text-base leading-relaxed">
            Thank you for your order! Our chefs are already preparing your delicious meal.
          </p>
          
          <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-xl p-4 mb-6 border border-blue-100">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Receipt className="w-4 h-4 text-blue-600" />
              <p className="text-sm font-semibold text-blue-700">
                Order #{orderId?.slice(-6)}
              </p>
            </div>
            <p className="text-xs text-blue-600">
              SMS confirmation will be sent shortly
            </p>
          </div>
          
          <div className="flex items-center justify-center text-gray-500 text-sm">
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
            <span>Redirecting to order tracking...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Contact Information */}
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-4 sm:px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center">
            <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center mr-3">
              <User className="w-4 h-4 text-white" />
            </div>
            Contact Information
          </h2>
          <p className="text-sm text-gray-600 mt-1">We'll use this to keep you updated about your order</p>
        </div>
        
        <div className="p-4 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div className="sm:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                value={formData.customerName}
                onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                className={`w-full px-4 py-3 sm:py-4 border-2 rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-900 placeholder-gray-400 ${
                  errors.customerName ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                }`}
                placeholder="Enter your full name"
              />
              {errors.customerName && (
                <div className="mt-2 flex items-center text-sm text-red-600">
                  <AlertCircle className="w-4 h-4 mr-1 flex-shrink-0" />
                  {errors.customerName}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Phone Number *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type="tel"
                  value={formData.customerPhone}
                  onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                  className={`w-full pl-10 pr-4 py-3 sm:py-4 border-2 rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-900 placeholder-gray-400 ${
                    errors.customerPhone ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                  placeholder="+1 234 567 8900"
                />
              </div>
              {errors.customerPhone && (
                <div className="mt-2 flex items-center text-sm text-red-600">
                  <AlertCircle className="w-4 h-4 mr-1 flex-shrink-0" />
                  {errors.customerPhone}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email Address (Optional)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  value={formData.customerEmail}
                  onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                  className={`w-full pl-10 pr-4 py-3 sm:py-4 border-2 rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-gray-900 placeholder-gray-400 ${
                    errors.customerEmail ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                  placeholder="your@email.com"
                />
              </div>
              {errors.customerEmail && (
                <div className="mt-2 flex items-center text-sm text-red-600">
                  <AlertCircle className="w-4 h-4 mr-1 flex-shrink-0" />
                  {errors.customerEmail}
                </div>
              )}
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Special Instructions (Optional)
              </label>
              <div className="relative">
                <div className="absolute top-3 left-3 pointer-events-none">
                  <MessageSquare className="w-5 h-5 text-gray-400" />
                </div>
                <textarea
                  value={formData.specialInstructions}
                  onChange={(e) => setFormData({ ...formData, specialInstructions: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 sm:py-4 border-2 border-gray-200 rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 resize-none text-gray-900 placeholder-gray-400 hover:border-gray-300"
                  rows={3}
                  placeholder="Any special dietary requirements, allergies, or cooking preferences..."
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Information */}
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-4 sm:px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center">
            <div className="w-8 h-8 bg-green-600 rounded-xl flex items-center justify-center mr-3">
              <CreditCard className="w-4 h-4 text-white" />
            </div>
            Payment Information
          </h2>
          <p className="text-sm text-gray-600 mt-1">Your payment is secure and encrypted</p>
        </div>
        
        <div className="p-4 sm:p-6">
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Card Details
            </label>
            <div className="relative">
              <div className="p-4 sm:p-5 border-2 border-gray-200 rounded-xl sm:rounded-2xl focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all duration-200 bg-gray-50 hover:bg-white hover:border-gray-300">
                <CardElement
                  options={{
                    style: {
                      base: {
                        fontSize: '16px',
                        color: '#1f2937',
                        fontFamily: '"Inter", system-ui, sans-serif',
                        '::placeholder': {
                          color: '#9ca3af',
                        },
                      },
                      invalid: {
                        color: '#ef4444',
                      },
                    },
                  }}
                  onChange={(e) => {
                    if (e.error) {
                      setCardError(e.error.message);
                    } else {
                      setCardError(null);
                    }
                  }}
                />
              </div>
            </div>
            {cardError && (
              <div className="mt-3 p-3 bg-red-50 rounded-xl border border-red-200">
                <div className="flex items-center text-sm text-red-700">
                  <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                  {cardError}
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-gray-50 rounded-xl sm:rounded-2xl p-4">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Shield className="w-4 h-4 text-green-600" />
              <span className="font-medium">256-bit SSL</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <span className="font-medium">PCI Compliant</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Clock className="w-4 h-4 text-blue-600" />
              <span className="font-medium">Instant Processing</span>
            </div>
          </div>
        </div>
      </div>

      {/* Total Amount */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl sm:rounded-3xl shadow-lg overflow-hidden">
        <div className="p-4 sm:p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-bold">Total Amount</h3>
                <p className="text-blue-100 text-sm">Including tax and fees</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl sm:text-3xl font-bold">${total.toFixed(2)}</div>
              <div className="text-blue-100 text-sm">USD</div>
            </div>
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        onClick={handleSubmit}
        disabled={isProcessing || !stripe}
        className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-500 text-white py-4 sm:py-5 rounded-2xl sm:rounded-3xl font-bold text-base sm:text-lg transition-all duration-200 shadow-lg hover:shadow-xl disabled:cursor-not-allowed disabled:shadow-none transform hover:scale-[1.02] disabled:transform-none flex items-center justify-center space-x-3"
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin" />
            <span>Processing Payment...</span>
          </>
        ) : (
          <>
            <CreditCard className="w-5 h-5 sm:w-6 sm:h-6" />
            <span>Complete Order - ${total.toFixed(2)}</span>
          </>
        )}
      </button>

      <div className="text-center">
        <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">
          By completing this purchase, you agree to our{' '}
          <button className="text-blue-600 hover:text-blue-700 underline font-medium">
            Terms of Service
          </button>{' '}
          and{' '}
          <button className="text-blue-600 hover:text-blue-700 underline font-medium">
            Privacy Policy
          </button>
        </p>
      </div>
    </div>
  );
}

// Main checkout page component
export default function CheckoutPage() {
  const router = useRouter();
  const params = useParams();
  const tableId = params.tableId as string;
  const restaurantId = params.restrauntId as string;

  const [cart, setCart] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    } else {
      // No cart items, redirect back to menu
      router.push(`/table/${restaurantId}/${tableId}/menu`);
    }
    setIsLoading(false);
  }, [router, restaurantId, tableId]);

  const getSubtotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getTax = () => {
    return getSubtotal() * 0.08;
  };

  const getTotal = () => {
    return getSubtotal() + getTax();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 sm:h-20 sm:w-20 border-4 border-blue-600 border-t-transparent mx-auto mb-6"></div>
            <CreditCard className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
          </div>
          <h2 className="text-lg sm:text-xl font-semibold text-gray-700 mb-2">Loading Checkout</h2>
          <p className="text-sm sm:text-base text-gray-500">Preparing your secure payment...</p>
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-xl p-6 sm:p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShoppingBag className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">Your Cart is Empty</h2>
          <p className="text-gray-600 mb-6 text-sm sm:text-base leading-relaxed">
            Add some delicious items to your cart before proceeding to checkout
          </p>
          <button
            onClick={() => router.push(`/table/${restaurantId}/${tableId}/menu`)}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-2xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            Browse Menu
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      {/* Enhanced Header */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-lg shadow-lg border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <button
                onClick={() => router.back()}
                className="p-2 sm:p-3 hover:bg-gray-100 rounded-xl transition-all duration-200 group"
              >
                <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700 group-hover:text-gray-900" />
              </button>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Secure Checkout</h1>
                <div className="flex items-center text-sm text-gray-600 space-x-2">
                  <MapPin className="w-4 h-4" />
                  <span>Table {tableId}</span>
                  <span>•</span>
                  <span>{cart.length} item{cart.length !== 1 ? 's' : ''}</span>
                </div>
              </div>
            </div>
            <div className="hidden sm:flex items-center space-x-2 text-sm text-gray-500">
              <Shield className="w-4 h-4 text-green-600" />
              <span>Secure Payment</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Order Summary - Mobile first, Desktop sidebar */}
          <div className="lg:order-2 lg:col-span-1">
            <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-gray-100 overflow-hidden sticky top-32">
              <div className="bg-gradient-to-r from-orange-50 to-yellow-50 px-4 sm:px-6 py-4 border-b border-gray-100">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center">
                  <div className="w-8 h-8 bg-orange-600 rounded-xl flex items-center justify-center mr-3">
                    <ShoppingBag className="w-4 h-4 text-white" />
                  </div>
                  Order Summary
                </h2>
                <p className="text-sm text-gray-600 mt-1">Review your delicious selections</p>
              </div>
              
              <div className="p-4 sm:p-6">
                <div className="space-y-4 mb-6">
                  {cart.map((item) => (
                    <div key={item.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                      <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-red-400 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Utensils className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 text-sm line-clamp-2">{item.name}</h4>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-sm text-gray-600">Qty: {item.quantity}</span>
                          <span className="font-bold text-gray-900">${(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-gray-200 pt-4 space-y-3">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Subtotal</span>
                    <span className="font-medium">${getSubtotal().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Tax (8%)</span>
                    <span className="font-medium">${getTax().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-lg font-bold text-gray-900 pt-3 border-t border-gray-200">
                    <span>Total</span>
                    <div className="text-right">
                      <div className="text-2xl">${getTotal().toFixed(2)}</div>
                      <div className="text-xs text-gray-500 font-normal">USD</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Checkout Form */}
          <div className="lg:order-1 lg:col-span-2">
            <Elements stripe={stripePromise}>
              <CheckoutForm cart={cart} total={getTotal()} />
            </Elements>
          </div>
        </div>
      </div>
    </div>
  );
}