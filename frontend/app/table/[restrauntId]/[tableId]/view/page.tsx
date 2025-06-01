'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, Search, Filter, Clock, Flame, Leaf, Star,
  AlertCircle, ChevronDown, ChevronUp, X, Utensils, Wine,
  Coffee, Soup, Pizza, Salad, Cake, ShoppingBag,
  CheckCircle, Package, ChefHat, Bell, Eye, Plus,
  MapPin, Users, Grid3X3, List, Heart, Info
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
  calories?: number;
}

interface Order {
  _id: string;
  status: string;
  total: number;
  items: Array<{
    menuItemId: string;
    name: string;
    quantity: number;
    price: number;
  }>;
  createdAt: string;
  customerName: string;
  paymentStatus: string;
}

export default function ViewMenuPage() {
  const params = useParams();
  const router = useRouter();
  const restaurantId = params.restrauntId as string;
  const tableId = params.tableId as string;

  const [restaurant, setRestaurant] = useState<any>(null);
  const [menu, setMenu] = useState<Record<string, MenuItem[]>>({});
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showActiveOrders, setShowActiveOrders] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [filters, setFilters] = useState({
    vegetarian: false,
    spicy: false,
    popular: false,
    priceRange: 'all'
  });
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    loadMenu();
    loadActiveOrders();
    
    // Load favorites from localStorage
    const savedFavorites = localStorage.getItem('favorites');
    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites));
    }
    
    // Poll for order updates every 30 seconds
    const interval = setInterval(loadActiveOrders, 30000);
    return () => clearInterval(interval);
  }, [restaurantId, tableId]);

  const loadMenu = async () => {
    try {
      setError(null);
      const data = await apiService.tables.getTableMenu(restaurantId, tableId);
      setRestaurant(data.restaurant);
      setMenu(data.menu);
      // Expand all categories by default
      setExpandedCategories(Object.keys(data.menu));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load menu');
    } finally {
      setIsLoading(false);
    }
  };

  const loadActiveOrders = async () => {
    try {
      const response = await apiService.orders.getOrders({ 
        tableId: tableId 
      });
      
      // Filter for active orders (not completed or cancelled)
      const active = response.orders.filter((order: Order) => 
        ['pending', 'confirmed', 'preparing', 'ready'].includes(order.status)
      );
      
      setActiveOrders(active);
    } catch (err) {
      console.error('Failed to load active orders:', err);
      // Don't show error for orders, just log it
    }
  };

  const toggleFavorite = (itemId: string) => {
    const newFavorites = favorites.includes(itemId)
      ? favorites.filter(id => id !== itemId)
      : [...favorites, itemId];
    
    setFavorites(newFavorites);
    localStorage.setItem('favorites', JSON.stringify(newFavorites));
  };

  const getOrderStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      preparing: 'bg-orange-100 text-orange-800',
      ready: 'bg-green-100 text-green-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getOrderStatusIcon = (status: string) => {
    const icons = {
      pending: Clock,
      confirmed: CheckCircle,
      preparing: ChefHat,
      ready: Bell
    };
    const Icon = icons[status as keyof typeof icons] || Package;
    return <Icon className="w-4 h-4" />;
  };

  const formatOrderTime = (createdAt: string) => {
    const date = new Date(createdAt);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 60) {
      return `${diffMins} min ago`;
    } else {
      const diffHours = Math.floor(diffMins / 60);
      return `${diffHours}h ${diffMins % 60}m ago`;
    }
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, any> = {
      appetizers: Soup,
      mains: Pizza,
      desserts: Cake,
      beverages: Coffee,
      salads: Salad,
      wines: Wine,
      default: Utensils
    };
    const Icon = icons[category.toLowerCase()] || icons.default;
    return <Icon className="w-5 h-5" />;
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      appetizers: 'bg-gradient-to-r from-orange-400 to-red-400',
      mains: 'bg-gradient-to-r from-blue-400 to-purple-400',
      desserts: 'bg-gradient-to-r from-pink-400 to-rose-400',
      beverages: 'bg-gradient-to-r from-green-400 to-teal-400',
      salads: 'bg-gradient-to-r from-emerald-400 to-green-400',
      wines: 'bg-gradient-to-r from-purple-400 to-indigo-400'
    };
    return colors[category.toLowerCase()] || 'bg-gradient-to-r from-gray-400 to-gray-500';
  };

  const getCategoryEmoji = (category: string) => {
    const emojis: Record<string, string> = {
      appetizers: '🥗',
      mains: '🍽️', 
      desserts: '🍰',
      beverages: '🥤',
      salads: '🥙',
      wines: '🍷'
    };
    return emojis[category.toLowerCase()] || '🍴';
  };

  const filterItems = (items: MenuItem[]) => {
    let filtered = items;

    if (searchQuery) {
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (filters.vegetarian) {
      filtered = filtered.filter(item => item.isVegetarian);
    }

    if (filters.spicy) {
      filtered = filtered.filter(item => item.isSpicy);
    }

    if (filters.popular) {
      filtered = filtered.filter(item => item.isPopular);
    }

    if (filters.priceRange !== 'all') {
      switch (filters.priceRange) {
        case 'under10':
          filtered = filtered.filter(item => item.price < 10);
          break;
        case '10to20':
          filtered = filtered.filter(item => item.price >= 10 && item.price <= 20);
          break;
        case 'over20':
          filtered = filtered.filter(item => item.price > 20);
          break;
      }
    }

    return filtered;
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const activeFiltersCount = () => {
    let count = 0;
    if (filters.vegetarian) count++;
    if (filters.spicy) count++;
    if (filters.popular) count++;
    if (filters.priceRange !== 'all') count++;
    return count;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-green-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 sm:h-20 sm:w-20 border-4 border-green-600 border-t-transparent mx-auto mb-6">
            </div>
            <ChefHat className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6 sm:w-8 sm:h-8 text-green-600" />
          </div>
          <h2 className="text-lg sm:text-xl font-semibold text-gray-700 mb-2">Loading Menu</h2>
          <p className="text-sm sm:text-base text-gray-500">Discovering delicious options...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center p-6 sm:p-8 bg-white rounded-3xl shadow-xl">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
            <AlertCircle className="w-8 h-8 sm:w-10 sm:h-10 text-red-500" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">Unable to Load Menu</h1>
          <p className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8">{error}</p>
          <button 
            onClick={() => router.back()}
            className="bg-gradient-to-r from-gray-600 to-gray-700 text-white px-6 sm:px-8 py-3 rounded-2xl hover:from-gray-700 hover:to-gray-800 transition-all duration-200 shadow-lg text-sm sm:text-base"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-green-50">
      {/* Enhanced Header */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-lg shadow-lg border-b border-gray-100">
        <div className="max-w-7xl mx-auto">
          {/* Top Bar */}
          <div className="grid grid-cols-12 items-center p-3 sm:p-4 gap-3 sm:gap-4">
            <div className="col-span-2">
              <button
                onClick={() => router.back()}
                className="p-2 sm:p-3 hover:bg-gray-100 rounded-xl sm:rounded-2xl transition-all duration-200"
              >
                <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700" />
              </button>
            </div>
            
            <div className="col-span-8 text-center">
              <h1 className="text-lg sm:text-xl font-bold text-gray-900 truncate">{restaurant?.name} Menu</h1>
              <div className="flex items-center justify-center text-xs sm:text-sm text-gray-500 space-x-1 sm:space-x-2">
                <MapPin className="w-3 h-3 sm:w-4 sm:h-4" />
                <span>Table {tableId}</span>
                <span className="hidden sm:inline">•</span>
                <div className="hidden sm:flex items-center space-x-1">
                  <Users className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span>Browse & Order</span>
                </div>
              </div>
            </div>
            
            <div className="col-span-2 flex justify-end">
              <button
                onClick={() => router.push(`/table/${restaurantId}/${tableId}/menu`)}
                className="bg-gradient-to-r from-green-500 to-green-600 text-white px-3 sm:px-4 py-2 sm:py-3 rounded-xl sm:rounded-2xl hover:from-green-600 hover:to-green-700 transition-all duration-200 text-xs sm:text-sm font-medium shadow-lg"
              >
                <span className="hidden sm:inline">Order Now</span>
                <Plus className="w-4 h-4 sm:hidden" />
              </button>
            </div>
          </div>

          {/* Search and Controls */}
          <div className="grid grid-cols-12 gap-3 sm:gap-4 px-3 sm:px-4 pb-3 sm:pb-4">
            <div className="col-span-8 sm:col-span-9">
              <div className="relative">
                <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search menu items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-3 sm:py-4 bg-gray-50 border-0 rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-green-500 focus:bg-white transition-all duration-200 placeholder-gray-400 text-sm sm:text-base"
                />
              </div>
            </div>
            
            <div className="col-span-2 sm:col-span-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`w-full px-3 sm:px-4 py-3 sm:py-4 border-0 rounded-xl sm:rounded-2xl flex items-center justify-center space-x-1 sm:space-x-2 transition-all duration-200 text-sm sm:text-base ${
                  showFilters || activeFiltersCount() > 0
                    ? 'bg-green-500 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Filter className="w-4 h-4 sm:w-5 sm:h-5" />
                {activeFiltersCount() > 0 && (
                  <span className="bg-white text-green-600 text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                    {activeFiltersCount()}
                  </span>
                )}
              </button>
            </div>

            <div className="col-span-2 sm:col-span-1">
              <div className="flex bg-gray-100 rounded-xl sm:rounded-2xl p-1">
                <button
                  onClick={() => setViewMode('list')}
                  className={`flex-1 p-2 sm:p-3 rounded-lg sm:rounded-xl transition-all ${
                    viewMode === 'list' 
                      ? 'bg-white shadow-sm text-green-600' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <List className="w-4 h-4 sm:w-5 sm:h-5 mx-auto" />
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`flex-1 p-2 sm:p-3 rounded-lg sm:rounded-xl transition-all ${
                    viewMode === 'grid' 
                      ? 'bg-white shadow-sm text-green-600' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Grid3X3 className="w-4 h-4 sm:w-5 sm:h-5 mx-auto" />
                </button>
              </div>
            </div>
          </div>

          {/* Enhanced Filters */}
          {showFilters && (
            <div className="mx-3 sm:mx-4 mb-3 sm:mb-4 p-4 sm:p-6 bg-white/80 backdrop-blur-lg rounded-2xl sm:rounded-3xl border border-gray-200 shadow-lg">
              <div className="space-y-4 sm:space-y-6">
                <div className="flex flex-wrap gap-2 sm:gap-3">
                  <button
                    onClick={() => setFilters({ ...filters, vegetarian: !filters.vegetarian })}
                    className={`px-3 sm:px-4 py-2 sm:py-3 rounded-xl sm:rounded-2xl flex items-center space-x-1 sm:space-x-2 transition-all duration-200 text-sm sm:text-base ${
                      filters.vegetarian
                        ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg'
                        : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                    }`}
                  >
                    <Leaf className="w-4 h-4" />
                    <span>Vegetarian</span>
                  </button>
                  <button
                    onClick={() => setFilters({ ...filters, spicy: !filters.spicy })}
                    className={`px-3 sm:px-4 py-2 sm:py-3 rounded-xl sm:rounded-2xl flex items-center space-x-1 sm:space-x-2 transition-all duration-200 text-sm sm:text-base ${
                      filters.spicy
                        ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg'
                        : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                    }`}
                  >
                    <Flame className="w-4 h-4" />
                    <span>Spicy</span>
                  </button>
                  <button
                    onClick={() => setFilters({ ...filters, popular: !filters.popular })}
                    className={`px-3 sm:px-4 py-2 sm:py-3 rounded-xl sm:rounded-2xl flex items-center space-x-1 sm:space-x-2 transition-all duration-200 text-sm sm:text-base ${
                      filters.popular
                        ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg'
                        : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                    }`}
                  >
                    <Star className="w-4 h-4" />
                    <span>Popular</span>
                  </button>
                </div>
                
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-3">Price Range</p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { key: 'all', label: 'All Prices' },
                      { key: 'under10', label: 'Under $10' },
                      { key: '10to20', label: '$10-$20' },
                      { key: 'over20', label: 'Over $20' }
                    ].map(({ key, label }) => (
                      <button
                        key={key}
                        onClick={() => setFilters({ ...filters, priceRange: key })}
                        className={`px-3 sm:px-4 py-2 rounded-xl sm:rounded-2xl text-sm sm:text-base transition-all duration-200 ${
                          filters.priceRange === key
                            ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg'
                            : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Active Orders Section */}
      {activeOrders.length > 0 && (
        <div className="max-w-7xl mx-auto p-3 sm:p-4">
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-gray-100 overflow-hidden mb-4 sm:mb-6">
            <button
              onClick={() => setShowActiveOrders(!showActiveOrders)}
              className="w-full px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between hover:bg-gray-50 transition-colors border-b border-gray-100"
            >
              <div className="flex items-center space-x-3 sm:space-x-4">
                <div className="p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg">
                  <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div className="text-left">
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900">Active Orders</h2>
                  <p className="text-sm sm:text-base text-gray-600">{activeOrders.length} order{activeOrders.length !== 1 ? 's' : ''} in progress</p>
                </div>
              </div>
              {showActiveOrders ? (
                <ChevronUp className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400" />
              )}
            </button>

            {showActiveOrders && (
              <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
                {activeOrders.map((order) => (
                  <div key={order._id} className="border border-gray-200 rounded-2xl sm:rounded-3xl p-4 sm:p-5 hover:bg-gray-50 transition-all duration-200 hover:shadow-md">
                    <div className="grid grid-cols-12 gap-3 sm:gap-4 items-start">
                      <div className="col-span-8 sm:col-span-9">
                        <div className="flex items-center space-x-2 sm:space-x-3 mb-2">
                          <h3 className="font-bold text-gray-900 text-sm sm:text-base">
                            Order #{order._id.slice(-6)}
                          </h3>
                          <span className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium flex items-center space-x-1 ${getOrderStatusColor(order.status)}`}>
                            {getOrderStatusIcon(order.status)}
                            <span className="capitalize">{order.status}</span>
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm text-gray-600 mb-3">
                          {order.customerName} • {formatOrderTime(order.createdAt)}
                        </p>
                        
                        <div className="space-y-1">
                          {order.items.slice(0, 2).map((item, index) => (
                            <div key={index} className="flex justify-between text-xs sm:text-sm">
                              <span className="text-gray-600">
                                {item.quantity}x {item.name}
                              </span>
                              <span className="text-gray-900 font-medium">${(item.price * item.quantity).toFixed(2)}</span>
                            </div>
                          ))}
                          {order.items.length > 2 && (
                            <p className="text-xs sm:text-sm text-gray-500">
                              +{order.items.length - 2} more item{order.items.length - 2 !== 1 ? 's' : ''}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="col-span-4 sm:col-span-3 text-right">
                        <p className="text-lg sm:text-xl font-bold text-gray-900 mb-2">${order.total.toFixed(2)}</p>
                        <button 
                          onClick={() => router.push(`/table/${restaurantId}/${tableId}/order/${order._id}`)}
                          className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-3 sm:px-4 py-2 rounded-xl sm:rounded-2xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 text-xs sm:text-sm font-medium shadow-lg"
                        >
                          <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span>View</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Menu Content */}
      <div className="max-w-7xl mx-auto p-3 sm:p-4">
        <div className="space-y-4 sm:space-y-6">
          {Object.entries(menu).map(([category, items]) => {
            const filteredItems = filterItems(items);
            if (filteredItems.length === 0) return null;

            return (
              <div key={category} className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <button
                  onClick={() => toggleCategory(category)}
                  className="w-full px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-3 sm:space-x-4">
                    <div className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl ${getCategoryColor(category)} text-white shadow-lg`}>
                      {getCategoryIcon(category)}
                    </div>
                    <div className="text-left">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg sm:text-xl">{getCategoryEmoji(category)}</span>
                        <h2 className="text-lg sm:text-xl font-bold text-gray-900 capitalize">{category}</h2>
                      </div>
                      <p className="text-sm sm:text-base text-gray-600">{filteredItems.length} item{filteredItems.length !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  {expandedCategories.includes(category) ? (
                    <ChevronUp className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400" />
                  )}
                </button>

                {expandedCategories.includes(category) && (
                  <div className="border-t border-gray-100">
                    {viewMode === 'grid' ? (
                      // Grid View
                      <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                        {filteredItems.map((item) => (
                          <div
                            key={item.id}
                            className="border border-gray-200 rounded-2xl sm:rounded-3xl p-4 sm:p-5 hover:bg-gray-50 transition-all duration-200 cursor-pointer hover:shadow-md hover:border-gray-300"
                            onClick={() => setSelectedItem(item)}
                          >
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-gray-900 text-sm sm:text-base line-clamp-2 mb-2">{item.name}</h3>
                                <div className="flex items-center flex-wrap gap-1 text-xs mb-2">
                                  {item.isPopular && (
                                    <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full flex items-center font-medium">
                                      <Star className="w-3 h-3 mr-1 fill-current" />
                                      <span className="hidden sm:inline">Popular</span>
                                    </span>
                                  )}
                                  {item.isVegetarian && (
                                    <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full flex items-center font-medium">
                                      <Leaf className="w-3 h-3" />
                                    </span>
                                  )}
                                  {item.isSpicy && (
                                    <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full flex items-center font-medium">
                                      <Flame className="w-3 h-3" />
                                    </span>
                                  )}
                                </div>
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleFavorite(item.id);
                                }}
                                className={`p-2 rounded-full transition-all duration-200 flex-shrink-0 ml-2 ${
                                  favorites.includes(item.id)
                                    ? 'text-red-500 bg-red-50'
                                    : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
                                }`}
                              >
                                <Heart className={`w-4 h-4 ${favorites.includes(item.id) ? 'fill-current' : ''}`} />
                              </button>
                            </div>
                            
                            <p className="text-gray-600 mb-3 text-xs sm:text-sm line-clamp-2">{item.description}</p>
                            
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-lg sm:text-xl font-bold text-gray-900">${item.price.toFixed(2)}</p>
                                {item.preparationTime && (
                                  <div className="flex items-center text-xs text-gray-500 mt-1">
                                    <Clock className="w-3 h-3 mr-1" />
                                    {item.preparationTime} min
                                  </div>
                                )}
                              </div>
                              <button className="bg-gradient-to-r from-green-500 to-green-600 text-white px-3 sm:px-4 py-2 rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-200 text-xs sm:text-sm font-medium shadow-lg">
                                View Details
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      // List View
                      <div>
                        {filteredItems.map((item, index) => (
                          <div
                            key={item.id}
                            className={`p-4 sm:p-6 hover:bg-gray-50 transition-all duration-200 cursor-pointer ${
                              index !== filteredItems.length - 1 ? 'border-b border-gray-100' : ''
                            }`}
                            onClick={() => setSelectedItem(item)}
                          >
                            <div className="grid grid-cols-12 gap-3 sm:gap-4 items-start">
                              <div className="col-span-9 sm:col-span-8">
                                <div className="flex items-start justify-between mb-2">
                                  <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-gray-900 text-sm sm:text-base line-clamp-2 mb-2">{item.name}</h3>
                                    <div className="flex items-center flex-wrap gap-1 text-xs mb-3">
                                      {item.isPopular && (
                                        <span className="bg-yellow-100 text-yellow-800 px-2 sm:px-3 py-1 rounded-full flex items-center font-medium">
                                          <Star className="w-3 h-3 mr-1 fill-current" />
                                          <span className="hidden sm:inline">Popular</span>
                                        </span>
                                      )}
                                      {item.isVegetarian && (
                                        <span className="bg-green-100 text-green-700 px-2 sm:px-3 py-1 rounded-full flex items-center font-medium">
                                          <Leaf className="w-3 h-3 mr-1" />
                                          <span className="hidden sm:inline">Vegetarian</span>
                                        </span>
                                      )}
                                      {item.isSpicy && (
                                        <span className="bg-red-100 text-red-700 px-2 sm:px-3 py-1 rounded-full flex items-center font-medium">
                                          <Flame className="w-3 h-3 mr-1" />
                                          Spicy
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleFavorite(item.id);
                                    }}
                                    className={`p-2 rounded-full transition-all duration-200 flex-shrink-0 ml-2 ${
                                      favorites.includes(item.id)
                                        ? 'text-red-500 bg-red-50'
                                        : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
                                    }`}
                                  >
                                    <Heart className={`w-4 h-4 ${favorites.includes(item.id) ? 'fill-current' : ''}`} />
                                  </button>
                                </div>
                                
                                <p className="text-gray-600 mb-3 text-xs sm:text-sm line-clamp-2 sm:line-clamp-3">{item.description}</p>
                                
                                {(item.preparationTime || item.calories) && (
                                  <div className="flex items-center space-x-3 sm:space-x-4 text-xs text-gray-500">
                                    {item.preparationTime && (
                                      <span className="flex items-center">
                                        <Clock className="w-3 h-3 mr-1" />
                                        {item.preparationTime} min
                                      </span>
                                    )}
                                    {item.calories && (
                                      <span>{item.calories} cal</span>
                                    )}
                                  </div>
                                )}
                              </div>
                              
                              <div className="col-span-3 sm:col-span-4 text-right">
                                <p className="text-lg sm:text-2xl font-bold text-gray-900 mb-2">${item.price.toFixed(2)}</p>
                                <button className="bg-gradient-to-r from-green-500 to-green-600 text-white px-3 sm:px-4 py-2 rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-200 text-xs sm:text-sm font-medium shadow-lg flex items-center space-x-1 mx-auto sm:mx-0">
                                  <Info className="w-3 h-3 sm:w-4 sm:h-4" />
                                  <span className="hidden sm:inline">Details</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Enhanced Item Details Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl sm:rounded-3xl max-w-lg w-full max-h-[90vh] overflow-hidden shadow-2xl transform transition-all">
            <div className="relative bg-gradient-to-br from-green-500 to-green-600 text-white p-4 sm:p-6">
              <button
                onClick={() => setSelectedItem(null)}
                className="absolute top-3 right-3 sm:top-4 sm:right-4 p-2 hover:bg-white/20 rounded-xl transition-colors"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              <h3 className="text-xl sm:text-2xl font-bold mb-2 pr-12">{selectedItem.name}</h3>
              <p className="text-green-100 text-sm sm:text-base capitalize">{selectedItem.category}</p>
            </div>
            
            <div className="p-4 sm:p-6 overflow-y-auto max-h-[60vh]">
              <p className="text-gray-600 mb-4 sm:mb-6 leading-relaxed text-sm sm:text-base">{selectedItem.description}</p>
              
              <div className="flex items-center flex-wrap gap-2 sm:gap-3 mb-4 sm:mb-6">
                {selectedItem.isVegetarian && (
                  <span className="bg-green-100 text-green-800 px-3 py-2 rounded-xl flex items-center text-sm font-medium">
                    <Leaf className="w-4 h-4 mr-2" />
                    Vegetarian
                  </span>
                )}
                {selectedItem.isSpicy && (
                  <span className="bg-red-100 text-red-800 px-3 py-2 rounded-xl flex items-center text-sm font-medium">
                    <Flame className="w-4 h-4 mr-2" />
                    Spicy
                  </span>
                )}
                {selectedItem.isPopular && (
                  <span className="bg-yellow-100 text-yellow-800 px-3 py-2 rounded-xl flex items-center text-sm font-medium">
                    <Star className="w-4 h-4 mr-2 fill-current" />
                    Popular
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 sm:gap-6 py-4 sm:py-6 border-y border-gray-200">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Price</p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900">${selectedItem.price.toFixed(2)}</p>
                </div>
                {selectedItem.preparationTime && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Prep Time</p>
                    <p className="text-lg sm:text-xl font-bold text-gray-900">{selectedItem.preparationTime} min</p>
                  </div>
                )}
              </div>

              {selectedItem.allergens && selectedItem.allergens.length > 0 && (
                <div className="mt-4 sm:mt-6">
                  <h4 className="font-bold text-gray-900 mb-3 text-sm sm:text-base">Allergen Information</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedItem.allergens.map(allergen => (
                      <span key={allergen} className="bg-orange-100 text-orange-800 px-3 py-2 rounded-xl text-sm font-medium text-center">
                        {allergen}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {selectedItem.calories && (
                <div className="mt-4 sm:mt-6 bg-gray-50 rounded-2xl p-4">
                  <p className="text-sm text-gray-600 mb-1">Nutritional Information</p>
                  <p className="text-lg font-bold text-gray-900">{selectedItem.calories} calories</p>
                </div>
              )}
            </div>

            <div className="p-4 sm:p-6 border-t border-gray-200 bg-gray-50">
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <button
                  onClick={() => setSelectedItem(null)}
                  className="bg-white text-gray-700 py-3 sm:py-4 rounded-xl sm:rounded-2xl hover:bg-gray-100 transition-colors font-medium border border-gray-200"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setSelectedItem(null);
                    router.push(`/table/${restaurantId}/${tableId}/menu`);
                  }}
                  className="bg-gradient-to-r from-green-500 to-green-600 text-white py-3 sm:py-4 rounded-xl sm:rounded-2xl hover:from-green-600 hover:to-green-700 transition-all duration-200 font-medium shadow-lg"
                >
                  Order This Item
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}