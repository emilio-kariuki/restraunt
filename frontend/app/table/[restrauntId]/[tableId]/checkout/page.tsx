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
  MessageSquare, Shield, Clock, DollarSign
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
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Order Confirmed!</h1>
          <p className="text-gray-600 mb-4">
            Thank you for your order. We'll start preparing it right away.
          </p>
          <div className="bg-blue-50 rounded-xl p-4 mb-6">
            <p className="text-sm text-blue-700 font-medium">
              Order #{orderId?.slice(-6)}
            </p>
            <p className="text-xs text-blue-600 mt-1">
              You'll receive an SMS confirmation shortly
            </p>
          </div>
          <div className="flex items-center justify-center text-gray-600 text-sm">
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
            Redirecting to order tracking...
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
          <User className="w-5 h-5 mr-2" />
          Contact Information
        </h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Name *
            </label>
            <input
              type="text"
              value={formData.customerName}
              onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
              className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                errors.customerName ? 'border-red-300' : 'border-gray-200'
              }`}
              placeholder="John Doe"
            />
            {errors.customerName && (
              <p className="mt-1 text-sm text-red-600">{errors.customerName}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number *
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="tel"
                value={formData.customerPhone}
                onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                  errors.customerPhone ? 'border-red-300' : 'border-gray-200'
                }`}
                placeholder="+1 234 567 8900"
              />
            </div>
            {errors.customerPhone && (
              <p className="mt-1 text-sm text-red-600">{errors.customerPhone}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email (Optional)
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                value={formData.customerEmail}
                onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                className={`w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                  errors.customerEmail ? 'border-red-300' : 'border-gray-200'
                }`}
                placeholder="john@example.com"
              />
            </div>
            {errors.customerEmail && (
              <p className="mt-1 text-sm text-red-600">{errors.customerEmail}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Special Instructions (Optional)
            </label>
            <div className="relative">
              <MessageSquare className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <textarea
                value={formData.specialInstructions}
                onChange={(e) => setFormData({ ...formData, specialInstructions: e.target.value })}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                rows={3}
                placeholder="Any special requests or dietary notes..."
              />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
          <CreditCard className="w-5 h-5 mr-2" />
          Payment Information
        </h2>
        
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Card Details
          </label>
          <div className="p-4 border border-gray-200 rounded-xl focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent transition-all">
            <CardElement
              options={{
                style: {
                  base: {
                    fontSize: '16px',
                    color: '#1f2937',
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
          {cardError && (
            <p className="mt-2 text-sm text-red-600 flex items-center">
              <AlertCircle className="w-4 h-4 mr-1" />
              {cardError}
            </p>
          )}
        </div>

        <div className="bg-gray-50 rounded-xl p-4">
          <div className="flex items-center justify-center space-x-6 text-sm text-gray-600">
            <div className="flex items-center">
              <Shield className="w-4 h-4 mr-1" />
              Secure Payment
            </div>
            <div className="flex items-center">
              <Clock className="w-4 h-4 mr-1" />
              SSL Encrypted
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
        <div className="flex justify-between items-center text-xl font-bold text-gray-900">
          <span>Total Amount</span>
          <span className="text-2xl">${total.toFixed(2)}</span>
        </div>
      </div>

      <button
        type="submit"
        disabled={isProcessing || !stripe}
        className="w-full bg-blue-600 text-white py-4 rounded-xl font-semibold hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-all flex items-center justify-center space-x-2"
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Processing Payment...</span>
          </>
        ) : (
          <>
            <CreditCard className="w-5 h-5" />
            <span>Pay ${total.toFixed(2)}</span>
          </>
        )}
      </button>

      <p className="text-center text-sm text-gray-500 mt-4">
        By completing this purchase you agree to our terms of service
      </p>
    </form>
  );
}

// Main checkout page component
export default function CheckoutPage() {
  const router = useRouter();
  const params = useParams();
  const tableId = params.tableId as string;

  const [cart, setCart] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    } else {
      // No cart items, redirect back to menu
      router.push(`/table/${params.restrauntId}/${tableId}/menu`);
    }
    setIsLoading(false);
  }, []);

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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading checkout...</p>
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Your cart is empty</h2>
          <p className="text-gray-600 mb-6">Add some items to your cart to checkout</p>
          <button
            onClick={() => router.push(`/table/${params.restrauntId}/${tableId}/menu`)}
            className="bg-blue-600 text-white px-8 py-3 rounded-xl hover:bg-blue-700 transition-colors"
          >
            Back to Menu
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors mr-3"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Checkout</h1>
              <p className="text-sm text-gray-600">Table {tableId}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4">
        {/* Order Summary */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <ShoppingBag className="w-5 h-5 mr-2" />
            Order Summary
          </h2>
          
          <div className="space-y-3 mb-4">
            {cart.map((item) => (
              <div key={item.id} className="flex justify-between items-center py-2">
                <div>
                  <p className="font-medium text-gray-900">{item.name}</p>
                  <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                </div>
                <p className="font-medium text-gray-900">
                  ${(item.price * item.quantity).toFixed(2)}
                </p>
              </div>
            ))}
          </div>

          <div className="border-t pt-4 space-y-2">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>${getSubtotal().toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Tax (8%)</span>
              <span>${getTax().toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold text-gray-900 pt-2">
              <span>Total</span>
              <span>${getTotal().toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Stripe Elements Provider */}
        <Elements stripe={stripePromise}>
          <CheckoutForm cart={cart} total={getTotal()} />
        </Elements>
      </div>
    </div>
  );
}