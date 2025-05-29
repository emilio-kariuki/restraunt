'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ShoppingCart, Plus, Minus, Clock, ChefHat, Flame, Leaf, 
  AlertCircle, ArrowLeft, Search, Filter, Star, Info,
  CheckCircle2, X, ShoppingBag, CreditCard
} from 'lucide-react';
import { apiService } from '../../../../../lib/api';

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image?: string;
  allergens?: string[];
  isVegetarian?: boolean;
  isSpicy?: boolean;
  isPopular?: boolean;
  preparationTime?: number;
}

interface CartItem extends MenuItem {
  quantity: number;
  customizations?: string[];
}

interface Restaurant {
  name: string;
  phone: string;
}

export default function MenuPage() {
  const params = useParams();
  const router = useRouter();
  const restaurantId = params.restrauntId as string;
  const tableId = params.tableId as string;

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [menu, setMenu] = useState<Record<string, MenuItem[]>>({});
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCart, setShowCart] = useState(false);
  const [showItemDetails, setShowItemDetails] = useState<MenuItem | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    loadMenu();
  }, [restaurantId, tableId]);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const loadMenu = async () => {
    try {
      setError(null);
      const data = await apiService.tables.getTableMenu(restaurantId, tableId);
      setRestaurant(data.restaurant);
      setMenu(data.menu);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load menu');
    } finally {
      setIsLoading(false);
    }
  };

  const categories = ['all', ...Object.keys(menu)];
  
  const filteredItems = () => {
    let items: MenuItem[] = [];
    
    if (selectedCategory === 'all') {
      Object.values(menu).forEach(categoryItems => {
        items = [...items, ...categoryItems];
      });
    } else {
      items = menu[selectedCategory] || [];
    }

    if (searchQuery) {
      items = items.filter(item => 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return items;
  };

  const addToCart = (item: MenuItem) => {
    const existingItem = cart.find(cartItem => cartItem.id === item.id);
    
    if (existingItem) {
      setCart(cart.map(cartItem => 
        cartItem.id === item.id 
          ? { ...cartItem, quantity: cartItem.quantity + 1 }
          : cartItem
      ));
    } else {
      setCart([...cart, { ...item, quantity: 1 }]);
    }

    setNotification({ type: 'success', message: `${item.name} added to cart` });
  };

  const updateQuantity = (itemId: string, delta: number) => {
    setCart(cart.map(item => {
      if (item.id === itemId) {
        const newQuantity = item.quantity + delta;
        return newQuantity > 0 ? { ...item, quantity: newQuantity } : null;
      }
      return item;
    }).filter(Boolean) as CartItem[]);
  };

  const removeFromCart = (itemId: string) => {
    setCart(cart.filter(item => item.id !== itemId));
    setNotification({ type: 'success', message: 'Item removed from cart' });
  };

  const getTotalAmount = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const proceedToCheckout = () => {
    if (cart.length === 0) {
      setNotification({ type: 'error', message: 'Your cart is empty' });
      return;
    }
    
    // Save cart to localStorage for checkout page
    localStorage.setItem('cart', JSON.stringify(cart));
    localStorage.setItem('restaurantId', restaurantId);
    localStorage.setItem('tableId', tableId);
    
    router.push(`/table/${restaurantId}/${tableId}/checkout`);
  };

  const getCategoryEmoji = (category: string) => {
    const emojis: Record<string, string> = {
      appetizers: '🥗',
      mains: '🍽️',
      desserts: '🍰',
      beverages: '🥤'
    };
    return emojis[category] || '🍴';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-green-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading delicious menu...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center p-8 bg-white rounded-2xl shadow-xl">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Unable to Load Menu</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button 
            onClick={() => router.back()}
            className="bg-gray-600 text-white px-8 py-3 rounded-full hover:bg-gray-700 transition-all duration-200"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg flex items-center space-x-2 transform transition-all duration-300 ${
          notification.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          <span className="font-medium">{notification.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="sticky top-0 z-40 bg-white shadow-sm">
        <div className="max-w-md mx-auto p-4">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div className="text-center flex-1">
              <h1 className="text-xl font-bold text-gray-900">{restaurant?.name}</h1>
              <p className="text-sm text-gray-600">Table {tableId}</p>
            </div>
            <button
              onClick={() => setShowCart(true)}
              className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ShoppingCart className="w-6 h-6" />
              {cart.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-green-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {getTotalItems()}
                </span>
              )}
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search menu items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
            />
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="sticky top-[144px] z-30 bg-white border-b">
        <div className="max-w-md mx-auto px-4 py-3">
          <div className="flex space-x-4 overflow-x-auto scrollbar-hide">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-full whitespace-nowrap transition-all ${
                  selectedCategory === category
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span>{getCategoryEmoji(category)}</span>
                <span className="capitalize font-medium">{category}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <div className="max-w-md mx-auto p-4">
        <div className="space-y-4">
          {filteredItems().map(item => (
            <div key={item.id} className="bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="font-semibold text-gray-900">{item.name}</h3>
                      {item.isPopular && (
                        <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full flex items-center">
                          <Star className="w-3 h-3 mr-1" />
                          Popular
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                    
                    <div className="flex items-center space-x-3 text-xs">
                      {item.isVegetarian && (
                        <span className="text-green-600 flex items-center">
                          <Leaf className="w-3 h-3 mr-1" />
                          Vegetarian
                        </span>
                      )}
                      {item.isSpicy && (
                        <span className="text-red-600 flex items-center">
                          <Flame className="w-3 h-3 mr-1" />
                          Spicy
                        </span>
                      )}
                      {item.preparationTime && (
                        <span className="text-gray-500 flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {item.preparationTime} min
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <button
                    onClick={() => setShowItemDetails(item)}
                    className="ml-4 text-gray-400 hover:text-gray-600"
                  >
                    <Info className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex items-center justify-between mt-4">
                  <p className="text-xl font-bold text-gray-900">${item.price.toFixed(2)}</p>
                  
                  {cart.find(cartItem => cartItem.id === item.id) ? (
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => updateQuantity(item.id, -1)}
                        className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="font-medium text-gray-900 w-8 text-center">
                        {cart.find(cartItem => cartItem.id === item.id)?.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, 1)}
                        className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center hover:bg-green-700 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => addToCart(item)}
                      className="bg-green-600 text-white px-6 py-2 rounded-full hover:bg-green-700 transition-colors flex items-center space-x-2"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cart Summary (Fixed Bottom) */}
      {cart.length > 0 && !showCart && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4">
          <div className="max-w-md mx-auto">
            <button
              onClick={() => setShowCart(true)}
              className="w-full bg-green-600 text-white py-4 rounded-xl hover:bg-green-700 transition-colors flex items-center justify-between px-6"
            >
              <div className="flex items-center space-x-3">
                <ShoppingBag className="w-5 h-5" />
                <span className="font-medium">{getTotalItems()} items</span>
              </div>
              <div className="flex items-center space-x-3">
                <span className="font-bold text-lg">${getTotalAmount().toFixed(2)}</span>
                <ArrowLeft className="w-5 h-5 rotate-180" />
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Cart Sidebar */}
      {showCart && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 transition-opacity">
          <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-xl transform transition-transform">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-xl font-bold text-gray-900">Your Cart</h2>
              <button
                onClick={() => setShowCart(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64">
                <ShoppingCart className="w-16 h-16 text-gray-300 mb-4" />
                <p className="text-gray-500">Your cart is empty</p>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto p-4">
                  <div className="space-y-4">
                    {cart.map(item => (
                      <div key={item.id} className="bg-gray-50 rounded-xl p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{item.name}</h4>
                            <p className="text-sm text-gray-500">${item.price.toFixed(2)} each</p>
                          </div>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <button
                              onClick={() => updateQuantity(item.id, -1)}
                              className="w-8 h-8 rounded-full bg-white flex items-center justify-center hover:bg-gray-200 transition-colors"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="font-medium text-gray-900 w-8 text-center">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.id, 1)}
                              className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center hover:bg-green-700 transition-colors"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                          <p className="font-semibold text-gray-900">
                            ${(item.price * item.quantity).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t p-4 space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-gray-600">
                      <span>Subtotal</span>
                      <span>${getTotalAmount().toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Tax (8%)</span>
                      <span>${(getTotalAmount() * 0.08).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xl font-bold text-gray-900">
                      <span>Total</span>
                      <span>${(getTotalAmount() * 1.08).toFixed(2)}</span>
                    </div>
                  </div>
                  
                  <button
                    onClick={proceedToCheckout}
                    className="w-full bg-green-600 text-white py-4 rounded-xl hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
                  >
                    <CreditCard className="w-5 h-5" />
                    <span className="font-medium">Proceed to Checkout</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Item Details Modal */}
      {showItemDetails && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold text-gray-900">{showItemDetails.name}</h3>
              <button
                onClick={() => setShowItemDetails(null)}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <p className="text-gray-600 mb-4">{showItemDetails.description}</p>
            
            {showItemDetails.allergens && showItemDetails.allergens.length > 0 && (
              <div className="mb-4">
                <h4 className="font-medium text-gray-900 mb-2">Allergens</h4>
                <div className="flex flex-wrap gap-2">
                  {showItemDetails.allergens.map(allergen => (
                    <span key={allergen} className="bg-orange-100 text-orange-800 text-sm px-3 py-1 rounded-full">
                      {allergen}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            <div className="flex items-center justify-between mt-6">
              <p className="text-2xl font-bold text-gray-900">${showItemDetails.price.toFixed(2)}</p>
              <button
                onClick={() => {
                  addToCart(showItemDetails);
                  setShowItemDetails(null);
                }}
                className="bg-green-600 text-white px-8 py-3 rounded-xl hover:bg-green-700 transition-colors flex items-center space-x-2"
              >
                <Plus className="w-5 h-5" />
                <span>Add to Cart</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}