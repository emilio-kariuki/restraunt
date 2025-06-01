'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
    ShoppingCart, Plus, Minus, Clock, ChefHat, Flame, Leaf, 
    AlertCircle, ArrowLeft, Search, Filter, Star, Info,
    CheckCircle2, X, ShoppingBag, CreditCard, Heart, Users,
    Utensils, MapPin, Grid3X3, List
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
    const [favorites, setFavorites] = useState<string[]>([]);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    useEffect(() => {
        loadMenu();
        const savedFavorites = localStorage.getItem('favorites');
        if (savedFavorites) {
            setFavorites(JSON.parse(savedFavorites));
        }
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

    const toggleFavorite = (itemId: string) => {
        const newFavorites = favorites.includes(itemId)
            ? favorites.filter(id => id !== itemId)
            : [...favorites, itemId];
        
        setFavorites(newFavorites);
        localStorage.setItem('favorites', JSON.stringify(newFavorites));
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
            beverages: '🥤',
            sides: '🍟',
            salads: '🥙',
            soups: '🍲',
            pizza: '🍕',
            pasta: '🍝'
        };
        return emojis[category.toLowerCase()] || '🍴';
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
                    <h2 className="text-lg sm:text-xl font-semibold text-gray-700 mb-2">Preparing your menu</h2>
                    <p className="text-sm sm:text-base text-gray-500">Loading delicious options...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="max-w-sm w-full text-center p-6 sm:p-8 bg-white rounded-3xl shadow-xl">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                        <AlertCircle className="w-8 h-8 sm:w-10 sm:h-10 text-red-500" />
                    </div>
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">Oops! Something went wrong</h1>
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
            {/* Notification */}
            {notification && (
                <div className={`fixed top-4 right-4 left-4 sm:left-auto sm:right-4 z-50 p-3 sm:p-4 rounded-2xl shadow-xl flex items-center space-x-2 sm:space-x-3 transform transition-all duration-500 backdrop-blur-sm ${
                    notification.type === 'success' 
                        ? 'bg-green-500/90 text-white' 
                        : 'bg-red-500/90 text-white'
                }`}>
                    {notification.type === 'success' ? (
                        <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                    ) : (
                        <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                    )}
                    <span className="font-medium text-sm sm:text-base">{notification.message}</span>
                </div>
            )}

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
                            <h1 className="text-lg sm:text-xl font-bold text-gray-900 truncate">{restaurant?.name}</h1>
                            <div className="flex items-center justify-center text-xs sm:text-sm text-gray-500 space-x-1 sm:space-x-2">
                                <MapPin className="w-3 h-3 sm:w-4 sm:h-4" />
                                <span>Table {tableId}</span>
                                <span className="hidden sm:inline">•</span>
                                <div className="hidden sm:flex items-center space-x-1">
                                    <Users className="w-3 h-3 sm:w-4 sm:h-4" />
                                    <span>2-4 guests</span>
                                </div>
                            </div>
                        </div>
                        
                        <div className="col-span-2 flex justify-end">
                            <button
                                onClick={() => setShowCart(true)}
                                className="relative p-2 sm:p-3 hover:bg-gray-100 rounded-xl sm:rounded-2xl transition-all duration-200"
                            >
                                <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700" />
                                {cart.length > 0 && (
                                    <span className="absolute -top-1 -right-1 bg-gradient-to-r from-green-500 to-green-600 text-white text-xs rounded-full w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center font-bold shadow-lg animate-pulse">
                                        {getTotalItems()}
                                    </span>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Search and View Toggle */}
                    <div className="grid grid-cols-12 gap-3 sm:gap-4 px-3 sm:px-4 pb-3 sm:pb-4">
                        <div className="col-span-9 sm:col-span-10">
                            <div className="relative">
                                <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search delicious items..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-3 sm:py-4 bg-gray-50 border-0 rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-green-500 focus:bg-white transition-all duration-200 placeholder-gray-400 text-sm sm:text-base"
                                />
                            </div>
                        </div>
                        <div className="col-span-3 sm:col-span-2 flex justify-end">
                            <div className="flex bg-gray-100 rounded-xl sm:rounded-2xl p-1">
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`p-2 sm:p-3 rounded-lg sm:rounded-xl transition-all ${
                                        viewMode === 'list' 
                                            ? 'bg-white shadow-sm text-green-600' 
                                            : 'text-gray-500 hover:text-gray-700'
                                    }`}
                                >
                                    <List className="w-4 h-4 sm:w-5 sm:h-5" />
                                </button>
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`p-2 sm:p-3 rounded-lg sm:rounded-xl transition-all ${
                                        viewMode === 'grid' 
                                            ? 'bg-white shadow-sm text-green-600' 
                                            : 'text-gray-500 hover:text-gray-700'
                                    }`}
                                >
                                    <Grid3X3 className="w-4 h-4 sm:w-5 sm:h-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Enhanced Categories */}
            <div className="sticky top-[120px] sm:top-[140px] z-30 bg-white/80 backdrop-blur-lg border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
                    <div className="flex gap-2 sm:gap-3 overflow-x-auto scrollbar-hide pb-2">
                        {categories.map(category => (
                            <button
                                key={category}
                                onClick={() => setSelectedCategory(category)}
                                className={`flex items-center space-x-1 sm:space-x-2 px-3 sm:px-5 py-2 sm:py-3 rounded-xl sm:rounded-2xl whitespace-nowrap transition-all duration-200 text-sm sm:text-base flex-shrink-0 ${
                                    selectedCategory === category
                                        ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg transform scale-105'
                                        : 'bg-white text-gray-700 hover:bg-gray-50 shadow-sm border border-gray-200'
                                }`}
                            >
                                <span className="text-base sm:text-lg">{getCategoryEmoji(category)}</span>
                                <span className="capitalize font-medium">{category}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Menu Items with Grid/List View */}
            <div className="max-w-7xl mx-auto p-3 sm:p-4 pb-32">
                {viewMode === 'grid' ? (
                    // Grid View - Responsive Grid
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                        {filteredItems().map((item, index) => (
                            <div 
                                key={item.id} 
                                className="bg-white rounded-2xl sm:rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 transform hover:-translate-y-1"
                                style={{ animationDelay: `${index * 50}ms` }}
                            >
                                <div className="p-4 sm:p-5">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start space-x-2">
                                                <h3 className="font-bold text-gray-900 text-base sm:text-lg line-clamp-2 flex-1">{item.name}</h3>
                                                {item.isPopular && (
                                                    <span className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white text-xs px-2 py-1 rounded-full flex items-center font-medium shadow-sm flex-shrink-0">
                                                        <Star className="w-3 h-3 mr-1 fill-current" />
                                                        <span className="hidden sm:inline">Hot</span>
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => toggleFavorite(item.id)}
                                            className={`p-1 sm:p-2 rounded-full transition-all duration-200 flex-shrink-0 ml-2 ${
                                                favorites.includes(item.id)
                                                    ? 'text-red-500 bg-red-50'
                                                    : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
                                            }`}
                                        >
                                            <Heart className={`w-4 h-4 ${favorites.includes(item.id) ? 'fill-current' : ''}`} />
                                        </button>
                                    </div>
                                    
                                    <p className="text-gray-600 mb-3 text-sm line-clamp-2">{item.description}</p>
                                    
                                    {/* Tags */}
                                    <div className="flex items-center flex-wrap gap-1 text-xs mb-4">
                                        {item.isVegetarian && (
                                            <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full flex items-center font-medium">
                                                <Leaf className="w-3 h-3 mr-1" />
                                                <span className="hidden sm:inline">Veg</span>
                                            </span>
                                        )}
                                        {item.isSpicy && (
                                            <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full flex items-center font-medium">
                                                <Flame className="w-3 h-3 mr-1" />
                                                <span className="hidden sm:inline">Spicy</span>
                                            </span>
                                        )}
                                        {item.preparationTime && (
                                            <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full flex items-center font-medium">
                                                <Clock className="w-3 h-3 mr-1" />
                                                {item.preparationTime}m
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-lg sm:text-xl font-bold text-gray-900">${item.price.toFixed(2)}</p>
                                        </div>
                                        
                                        {cart.find(cartItem => cartItem.id === item.id) ? (
                                            <div className="flex items-center space-x-1 sm:space-x-2 bg-gray-50 rounded-xl p-1">
                                                <button
                                                    onClick={() => updateQuantity(item.id, -1)}
                                                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-white shadow-sm flex items-center justify-center hover:bg-gray-100 transition-colors"
                                                >
                                                    <Minus className="w-3 h-3 text-gray-600" />
                                                </button>
                                                <span className="font-bold text-gray-900 w-6 text-center text-sm sm:text-base">
                                                    {cart.find(cartItem => cartItem.id === item.id)?.quantity}
                                                </span>
                                                <button
                                                    onClick={() => updateQuantity(item.id, 1)}
                                                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-r from-green-500 to-green-600 text-white flex items-center justify-center hover:from-green-600 hover:to-green-700 transition-all shadow-sm"
                                                >
                                                    <Plus className="w-3 h-3" />
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => addToCart(item)}
                                                className="bg-gradient-to-r from-green-500 to-green-600 text-white px-3 sm:px-4 py-2 rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-200 flex items-center space-x-1 shadow-lg hover:shadow-xl transform hover:scale-105"
                                            >
                                                <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                                                <span className="font-medium text-sm">Add</span>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    // List View - Mobile Optimized
                    <div className="space-y-3 sm:space-y-4">
                        {filteredItems().map((item, index) => (
                            <div 
                                key={item.id} 
                                className="bg-white rounded-2xl sm:rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 transform hover:-translate-y-1"
                                style={{ animationDelay: `${index * 50}ms` }}
                            >
                                <div className="p-4 sm:p-6">
                                    <div className="grid grid-cols-12 gap-3 sm:gap-4 items-start">
                                        <div className="col-span-12 sm:col-span-8">
                                            <div className="flex items-start justify-between mb-2">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start space-x-2">
                                                        <h3 className="font-bold text-gray-900 text-base sm:text-lg line-clamp-2 flex-1">{item.name}</h3>
                                                        {item.isPopular && (
                                                            <span className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white text-xs px-2 sm:px-3 py-1 rounded-full flex items-center font-medium shadow-sm flex-shrink-0">
                                                                <Star className="w-3 h-3 mr-1 fill-current" />
                                                                <span className="hidden sm:inline">Popular</span>
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <button
                                                        onClick={() => setShowItemDetails(item)}
                                                        className="p-1 sm:p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-full transition-all duration-200"
                                                    >
                                                        <Info className="w-4 h-4 sm:w-5 sm:h-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => toggleFavorite(item.id)}
                                                        className={`p-1 sm:p-2 rounded-full transition-all duration-200 ${
                                                            favorites.includes(item.id)
                                                                ? 'text-red-500 bg-red-50'
                                                                : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
                                                        }`}
                                                    >
                                                        <Heart className={`w-4 h-4 sm:w-5 sm:h-5 ${favorites.includes(item.id) ? 'fill-current' : ''}`} />
                                                    </button>
                                                </div>
                                            </div>
                                            
                                            <p className="text-gray-600 mb-3 text-sm sm:text-base line-clamp-2 sm:line-clamp-3">{item.description}</p>
                                            
                                            {/* Tags */}
                                            <div className="flex items-center flex-wrap gap-1 sm:gap-2 text-xs mb-3 sm:mb-4">
                                                {item.isVegetarian && (
                                                    <span className="bg-green-100 text-green-700 px-2 sm:px-3 py-1 rounded-full flex items-center font-medium">
                                                        <Leaf className="w-3 h-3 mr-1" />
                                                        <span className="hidden sm:inline">Vegetarian</span>
                                                        <span className="sm:hidden">Veg</span>
                                                    </span>
                                                )}
                                                {item.isSpicy && (
                                                    <span className="bg-red-100 text-red-700 px-2 sm:px-3 py-1 rounded-full flex items-center font-medium">
                                                        <Flame className="w-3 h-3 mr-1" />
                                                        Spicy
                                                    </span>
                                                )}
                                                {item.preparationTime && (
                                                    <span className="bg-blue-100 text-blue-700 px-2 sm:px-3 py-1 rounded-full flex items-center font-medium">
                                                        <Clock className="w-3 h-3 mr-1" />
                                                        {item.preparationTime} min
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        
                                        <div className="col-span-12 sm:col-span-4">
                                            <div className="flex items-center justify-between sm:flex-col sm:items-end sm:space-y-4">
                                                <div className="text-left sm:text-right">
                                                    <p className="text-xl sm:text-2xl font-bold text-gray-900">${item.price.toFixed(2)}</p>
                                                    <p className="text-xs sm:text-sm text-gray-500">per serving</p>
                                                </div>
                                                
                                                {cart.find(cartItem => cartItem.id === item.id) ? (
                                                    <div className="flex items-center space-x-2 sm:space-x-3 bg-gray-50 rounded-xl sm:rounded-2xl p-1">
                                                        <button
                                                            onClick={() => updateQuantity(item.id, -1)}
                                                            className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-white shadow-sm flex items-center justify-center hover:bg-gray-100 transition-colors"
                                                        >
                                                            <Minus className="w-3 h-3 sm:w-4 sm:h-4 text-gray-600" />
                                                        </button>
                                                        <span className="font-bold text-gray-900 w-6 sm:w-8 text-center text-base sm:text-lg">
                                                            {cart.find(cartItem => cartItem.id === item.id)?.quantity}
                                                        </span>
                                                        <button
                                                            onClick={() => updateQuantity(item.id, 1)}
                                                            className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-r from-green-500 to-green-600 text-white flex items-center justify-center hover:from-green-600 hover:to-green-700 transition-all shadow-sm"
                                                        >
                                                            <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => addToCart(item)}
                                                        className="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl sm:rounded-2xl hover:from-green-600 hover:to-green-700 transition-all duration-200 flex items-center space-x-1 sm:space-x-2 shadow-lg hover:shadow-xl transform hover:scale-105"
                                                    >
                                                        <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                                                        <span className="font-medium text-sm sm:text-base">Add</span>
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Enhanced Cart Summary - Mobile Optimized */}
            {cart.length > 0 && !showCart && (
                <div className="fixed bottom-4 left-4 right-4 z-40">
                    <div className="max-w-7xl mx-auto">
                        <button
                            onClick={() => setShowCart(true)}
                            className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-4 sm:py-5 rounded-2xl sm:rounded-3xl hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-2xl backdrop-blur-sm"
                        >
                            <div className="grid grid-cols-12 items-center px-4 sm:px-6">
                                <div className="col-span-6 flex items-center space-x-2 sm:space-x-3">
                                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 rounded-xl sm:rounded-2xl flex items-center justify-center">
                                        <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" />
                                    </div>
                                    <div className="text-left">
                                        <p className="font-medium text-sm sm:text-base">{getTotalItems()} items</p>
                                        <p className="text-green-100 text-xs sm:text-sm">Ready to order</p>
                                    </div>
                                </div>
                                <div className="col-span-6 flex items-center justify-end space-x-2 sm:space-x-3">
                                    <div className="text-right">
                                        <p className="font-bold text-lg sm:text-xl">${getTotalAmount().toFixed(2)}</p>
                                        <p className="text-green-100 text-xs sm:text-sm">+ tax</p>
                                    </div>
                                    <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 rotate-180" />
                                </div>
                            </div>
                        </button>
                    </div>
                </div>
            )}

            {/* Cart Sidebar - Mobile Optimized */}
            {showCart && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm transition-all duration-300">
                    <div className="fixed right-0 top-0 h-full w-full sm:max-w-md bg-white shadow-2xl transform transition-transform">
                        <div className="flex items-center justify-between p-4 sm:p-6 border-b bg-gradient-to-r from-green-500 to-green-600 text-white">
                            <div>
                                <h2 className="text-lg sm:text-xl font-bold">Your Order</h2>
                                <p className="text-green-100 text-sm">Table {tableId}</p>
                            </div>
                            <button
                                onClick={() => setShowCart(false)}
                                className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                            >
                                <X className="w-5 h-5 sm:w-6 sm:h-6" />
                            </button>
                        </div>

                        {cart.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-64">
                                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                    <ShoppingCart className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" />
                                </div>
                                <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">Your cart is empty</h3>
                                <p className="text-sm sm:text-base text-gray-500 text-center">Add some delicious items to get started</p>
                            </div>
                        ) : (
                            <>
                                <div className="flex-1 overflow-y-auto p-3 sm:p-4">
                                    <div className="space-y-3 sm:space-y-4">
                                        {cart.map(item => (
                                            <div key={item.id} className="bg-gray-50 rounded-xl sm:rounded-2xl p-3 sm:p-4 hover:bg-gray-100 transition-colors">
                                                <div className="grid grid-cols-12 gap-2 sm:gap-3 items-start">
                                                    <div className="col-span-8">
                                                        <h4 className="font-medium text-gray-900 text-sm sm:text-base line-clamp-2">{item.name}</h4>
                                                        <p className="text-xs sm:text-sm text-gray-500">${item.price.toFixed(2)} each</p>
                                                    </div>
                                                    <div className="col-span-4 flex justify-end">
                                                        <button
                                                            onClick={() => removeFromCart(item.id)}
                                                            className="text-red-400 hover:text-red-600 p-1 hover:bg-red-50 rounded-lg transition-all"
                                                        >
                                                            <X className="w-3 h-3 sm:w-4 sm:h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-12 gap-2 sm:gap-3 items-center mt-2 sm:mt-3">
                                                    <div className="col-span-8">
                                                        <div className="flex items-center space-x-2 sm:space-x-3 bg-white rounded-lg sm:rounded-xl p-1">
                                                            <button
                                                                onClick={() => updateQuantity(item.id, -1)}
                                                                className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
                                                            >
                                                                <Minus className="w-3 h-3 sm:w-4 sm:h-4" />
                                                            </button>
                                                            <span className="font-medium text-gray-900 w-6 sm:w-8 text-center text-sm sm:text-base">
                                                                {item.quantity}
                                                            </span>
                                                            <button
                                                                onClick={() => updateQuantity(item.id, 1)}
                                                                className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-green-600 text-white flex items-center justify-center hover:bg-green-700 transition-colors"
                                                            >
                                                                <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <div className="col-span-4 text-right">
                                                        <p className="font-bold text-gray-900 text-base sm:text-lg">
                                                            ${(item.price * item.quantity).toFixed(2)}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="border-t bg-white p-4 sm:p-6 space-y-3 sm:space-y-4">
                                    <div className="space-y-2 sm:space-y-3">
                                        <div className="flex justify-between text-sm sm:text-base text-gray-600">
                                            <span>Subtotal</span>
                                            <span className="font-medium">${getTotalAmount().toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm sm:text-base text-gray-600">
                                            <span>Tax (8%)</span>
                                            <span className="font-medium">${(getTotalAmount() * 0.08).toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between text-lg sm:text-xl font-bold text-gray-900 pt-2 border-t">
                                            <span>Total</span>
                                            <span>${(getTotalAmount() * 1.08).toFixed(2)}</span>
                                        </div>
                                    </div>
                                    
                                    <button
                                        onClick={proceedToCheckout}
                                        className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-3 sm:py-4 rounded-xl sm:rounded-2xl hover:from-green-600 hover:to-green-700 transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg text-sm sm:text-base"
                                    >
                                        <CreditCard className="w-4 h-4 sm:w-5 sm:h-5" />
                                        <span className="font-medium">Proceed to Checkout</span>
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Item Details Modal - Mobile Optimized */}
            {showItemDetails && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl sm:rounded-3xl max-w-sm w-full max-h-[90vh] overflow-hidden shadow-2xl transform transition-all">
                        <div className="relative bg-gradient-to-br from-green-500 to-green-600 text-white p-4 sm:p-6">
                            <button
                                onClick={() => setShowItemDetails(null)}
                                className="absolute top-3 right-3 sm:top-4 sm:right-4 p-2 hover:bg-white/20 rounded-xl transition-colors"
                            >
                                <X className="w-4 h-4 sm:w-5 sm:h-5" />
                            </button>
                            <h3 className="text-xl sm:text-2xl font-bold mb-2 pr-12">{showItemDetails.name}</h3>
                            <p className="text-green-100 text-sm sm:text-base">{showItemDetails.category}</p>
                        </div>
                        
                        <div className="p-4 sm:p-6 overflow-y-auto max-h-[60vh]">
                            <p className="text-gray-600 mb-4 sm:mb-6 leading-relaxed text-sm sm:text-base">{showItemDetails.description}</p>
                            
                            {showItemDetails.allergens && showItemDetails.allergens.length > 0 && (
                                <div className="mb-4 sm:mb-6">
                                    <h4 className="font-medium text-gray-900 mb-2 sm:mb-3 text-sm sm:text-base">Allergen Information</h4>
                                    <div className="grid grid-cols-2 gap-2">
                                        {showItemDetails.allergens.map(allergen => (
                                            <span key={allergen} className="bg-orange-100 text-orange-800 text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2 rounded-lg sm:rounded-xl font-medium text-center">
                                                {allergen}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                            
                            <div className="grid grid-cols-12 gap-3 sm:gap-4 items-center pt-3 sm:pt-4 border-t">
                                <div className="col-span-6">
                                    <p className="text-2xl sm:text-3xl font-bold text-gray-900">${showItemDetails.price.toFixed(2)}</p>
                                    <p className="text-gray-500 text-sm sm:text-base">per serving</p>
                                </div>
                                <div className="col-span-6">
                                    <button
                                        onClick={() => {
                                            addToCart(showItemDetails);
                                            setShowItemDetails(null);
                                        }}
                                        className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white px-3 sm:px-4 py-2 sm:py-3 rounded-xl sm:rounded-2xl hover:from-green-600 hover:to-green-700 transition-all duration-200 flex items-center justify-center space-x-1 sm:space-x-2 shadow-lg text-sm sm:text-base"
                                    >
                                        <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                                        <span className="font-medium">Add</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
