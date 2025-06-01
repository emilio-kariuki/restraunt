'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, QrCode, Users, RefreshCw, AlertCircle, CheckCircle, X, Download, Clock, DollarSign, TrendingUp, Package } from 'lucide-react';
import { apiService } from '../../lib/api';

interface MenuItem {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  available: boolean;
  allergens?: string[];
}

interface Order {
  _id: string;
  tableId: string;
  items: any[];
  total: number;
  status: string;
  customerName?: string;
  createdAt: string;
}

interface Restaurant {
  _id: string;
  name: string;
  tables: Array<{
    tableNumber: string;
    capacity: number;
    status: string;
    qrCode?: string;
  }>;
}

interface MenuItemForm {
  name: string;
  description: string;
  price: string;
  category: string;
  allergens: string;
}

interface TableForm {
  tableNumber: string;
  capacity: string;
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'orders' | 'menu' | 'tables'>('dashboard');
  const [orders, setOrders] = useState<Order[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  
  // Modal states
  const [showMenuItemModal, setShowMenuItemModal] = useState(false);
  const [showTableModal, setShowTableModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [editingMenuItem, setEditingMenuItem] = useState<MenuItem | null>(null);
  
  // Form states
  const [menuItemForm, setMenuItemForm] = useState<MenuItemForm>({
    name: '',
    description: '',
    price: '',
    category: '',
    allergens: ''
  });
  
  const [tableForm, setTableForm] = useState<TableForm>({
    tableNumber: '',
    capacity: ''
  });

  // Auto-clear notifications
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Auth check and initialization
  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      setAuthToken(token);
      setIsAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    if (authToken && isAuthenticated) {
      loadData();
    }
  }, [authToken, isAuthenticated, activeTab]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    try {
      const data = await apiService.auth.login(loginForm.email, loginForm.password);
      localStorage.setItem('adminToken', data.token);
      setAuthToken(data.token);
      setIsAuthenticated(true);
      setNotification({ type: 'success', message: 'Login successful!' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed';
      setError(message);
    }
  };

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (activeTab === 'dashboard') {
        await Promise.all([loadOrders(), loadMenu(), loadRestaurant()]);
      } else if (activeTab === 'orders') {
        await loadOrders();
      } else if (activeTab === 'menu') {
        await loadMenu();
      } else if (activeTab === 'tables') {
        await loadRestaurant();
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load data';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const loadOrders = async () => {
    try {
      const data = await apiService.orders.getOrders();
      setOrders(data.orders || []);
    } catch (error) {
      throw error;
    }
  };

  const loadMenu = async () => {
    try {
      // Get restaurant first to get the ID
      const restaurantData = await apiService.restaurants.getMyRestaurant();
      const restaurantId = restaurantData.restaurant._id;
      
      // Now get the menu
      const data = await apiService.menu.getMenu(restaurantId);
      
      // Flatten menu object into array
      const items: MenuItem[] = [];
      Object.entries(data.menu).forEach(([category, categoryItems]: [string, any]) => {
        categoryItems.forEach((item: any) => {
          items.push({ ...item, category });
        });
      });
      setMenuItems(items);
    } catch (error) {
      throw error;
    }
  };

  const loadRestaurant = async () => {
    try {
      const data = await apiService.restaurants.getMyRestaurant();
      setRestaurant(data.restaurant);
    } catch (error) {
      throw error;
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      await apiService.orders.updateOrderStatus(orderId, newStatus);
      await loadOrders();
      setNotification({ 
        type: 'success', 
        message: `Order updated to ${newStatus}` 
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update order';
      setNotification({ type: 'error', message });
    }
  };

  // Menu Item CRUD Operations
  const handleCreateMenuItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const allergenArray = menuItemForm.allergens
        .split(',')
        .map(a => a.trim())
        .filter(a => a.length > 0);

      await apiService.menu.createMenuItem({
        name: menuItemForm.name,
        description: menuItemForm.description,
        price: parseFloat(menuItemForm.price),
        category: menuItemForm.category,
        allergens: allergenArray
      });

      setNotification({ type: 'success', message: 'Menu item created successfully!' });
      setShowMenuItemModal(false);
      resetMenuItemForm();
      await loadMenu();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create menu item';
      setNotification({ type: 'error', message });
    }
  };

  const handleUpdateMenuItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMenuItem) return;

    try {
      const allergenArray = menuItemForm.allergens
        .split(',')
        .map(a => a.trim())
        .filter(a => a.length > 0);

      await apiService.menu.updateMenuItem(editingMenuItem._id, {
        name: menuItemForm.name,
        description: menuItemForm.description,
        price: parseFloat(menuItemForm.price),
        category: menuItemForm.category,
        allergens: allergenArray
      });

      setNotification({ type: 'success', message: 'Menu item updated successfully!' });
      setShowMenuItemModal(false);
      setEditingMenuItem(null);
      resetMenuItemForm();
      await loadMenu();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update menu item';
      setNotification({ type: 'error', message });
    }
  };

  const handleDeleteMenuItem = async (id: string) => {
    if (!confirm('Are you sure you want to delete this menu item?')) return;

    try {
      await apiService.menu.deleteMenuItem(id);
      setNotification({ type: 'success', message: 'Menu item deleted successfully!' });
      await loadMenu();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete menu item';
      setNotification({ type: 'error', message });
    }
  };

  const openEditMenuItem = (item: MenuItem) => {
    setEditingMenuItem(item);
    setMenuItemForm({
      name: item.name,
      description: item.description,
      price: item.price.toString(),
      category: item.category,
      allergens: item.allergens?.join(', ') || ''
    });
    setShowMenuItemModal(true);
  };

  const resetMenuItemForm = () => {
    setMenuItemForm({
      name: '',
      description: '',
      price: '',
      category: '',
      allergens: ''
    });
  };

  // Table CRUD Operations
  const handleCreateTable = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiService.restaurants.addTable({
        tableNumber: tableForm.tableNumber,
        capacity: parseInt(tableForm.capacity)
      });

      setNotification({ type: 'success', message: 'Table added successfully!' });
      setShowTableModal(false);
      resetTableForm();
      await loadRestaurant();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to add table';
      setNotification({ type: 'error', message });
    }
  };

  const resetTableForm = () => {
    setTableForm({
      tableNumber: '',
      capacity: ''
    });
  };

  // QR Code Operations
  const generateQRCode = async (tableNumber: string) => {
    if (!restaurant) return;
    
    try {
      const data = await apiService.restaurants.getTableQR(tableNumber, restaurant._id);
      setSelectedTable(tableNumber);
      setShowQRModal(true);
      
      // Update the restaurant state with the new QR code
      setRestaurant(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          tables: prev.tables.map(table => 
            table.tableNumber === tableNumber 
              ? { ...table, qrCode: data.qrCode }
              : table
          )
        };
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to generate QR code';
      setNotification({ type: 'error', message });
    }
  };

  const downloadQRCode = async (tableNumber: string) => {
    if (!restaurant) return;

    try {
      const data = await apiService.restaurants.getTableQR(tableNumber, restaurant._id);
      
      // Create a download link
      const link = document.createElement('a');
      link.href = data.qrCode;
      link.download = `table-${tableNumber}-qr.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setNotification({ type: 'success', message: 'QR Code downloaded successfully!' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to download QR code';
      setNotification({ type: 'error', message });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'confirmed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'preparing': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'ready': return 'bg-green-100 text-green-800 border-green-200';
      case 'served': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTableStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800 border-green-200';
      case 'occupied': return 'bg-red-100 text-red-800 border-red-200';
      case 'reserved': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'cleaning': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusButtonText = (currentStatus: string) => {
    switch (currentStatus) {
      case 'pending': return 'Confirm Order';
      case 'confirmed': return 'Start Preparing';
      case 'preparing': return 'Mark Ready';
      case 'ready': return 'Mark Served';
      default: return 'Update Status';
    }
  };

  const getNextStatus = (currentStatus: string) => {
    switch (currentStatus) {
      case 'pending': return 'confirmed';
      case 'confirmed': return 'preparing';
      case 'preparing': return 'ready';
      case 'ready': return 'served';
      default: return currentStatus;
    }
  };

  const logout = () => {
    localStorage.removeItem('adminToken');
    setAuthToken(null);
    setIsAuthenticated(false);
    setNotification({ type: 'success', message: 'Logged out successfully' });
  };

  // Calculate dashboard stats
  const getDashboardStats = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayOrders = orders.filter(order => new Date(order.createdAt) >= today);
    const activeOrders = orders.filter(order => !['served', 'completed', 'cancelled'].includes(order.status));
    const totalRevenue = todayOrders.reduce((sum, order) => sum + order.total, 0);
    
    return {
      totalOrders: todayOrders.length,
      activeOrders: activeOrders.length,
      totalRevenue,
      totalMenuItems: menuItems.length,
      totalTables: restaurant?.tables.length || 0
    };
  };

  // Login form
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4 text-black">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Restaurant Admin</h1>
            <p className="text-gray-600">Sign in to manage your restaurant</p>
          </div>
          
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center">
              <AlertCircle className="w-5 h-5 text-red-600 mr-3" />
              <span className="text-red-700 text-sm">{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6 text-black">
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">Email</label>
              <input
                type="email"
                value={loginForm.email}
                onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Enter your email"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-700">Password</label>
              <input
                type="password"
                value={loginForm.password}
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Enter your password"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all font-semibold shadow-lg"
            >
              Sign In
            </button>
          </form>
          
          <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
            <p className="text-sm font-semibold text-blue-800 mb-3">Demo Credentials:</p>
            <div className="space-y-2 text-sm text-blue-700">
              <p><strong>Admin:</strong> admin@bellavista.com / admin123</p>
              <p><strong>Kitchen:</strong> kitchen@bellavista.com / kitchen123</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const stats = getDashboardStats();

  return (
    <div className="min-h-screen bg-gray-50 text-black">
      {/* Notification */}
      {notification && (
        <div className={`fixed top-6 right-6 z-50 p-4 rounded-xl shadow-2xl flex items-center backdrop-blur-sm ${
          notification.type === 'success' 
            ? 'bg-green-50/90 border border-green-200 text-green-800' 
            : 'bg-red-50/90 border border-red-200 text-red-800'
        }`}>
          {notification.type === 'success' ? (
            <CheckCircle className="w-5 h-5 mr-3" />
          ) : (
            <AlertCircle className="w-5 h-5 mr-3" />
          )}
          <span className="font-medium">{notification.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Restaurant Admin</h1>
              <p className="text-gray-600 mt-1">Manage your restaurant operations</p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                  activeTab === 'dashboard' 
                    ? 'bg-blue-600 text-white shadow-lg' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <TrendingUp className="w-5 h-5 inline mr-2" />
                Dashboard
              </button>
              <button
                onClick={() => setActiveTab('orders')}
                className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                  activeTab === 'orders' 
                    ? 'bg-blue-600 text-white shadow-lg' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Package className="w-5 h-5 inline mr-2" />
                Orders
              </button>
              <button
                onClick={() => setActiveTab('menu')}
                className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                  activeTab === 'menu' 
                    ? 'bg-blue-600 text-white shadow-lg' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Menu
              </button>
              <button
                onClick={() => setActiveTab('tables')}
                className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                  activeTab === 'tables' 
                    ? 'bg-blue-600 text-white shadow-lg' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <QrCode className="w-5 h-5 inline mr-2" />
                Tables
              </button>
              <button
                onClick={logout}
                className="px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all font-semibold shadow-lg"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Display */}
        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center">
            <AlertCircle className="w-6 h-6 text-red-600 mr-3" />
            <span className="text-red-700 flex-1">{error}</span>
            <button 
              onClick={() => setError(null)}
              className="ml-4 text-red-600 hover:text-red-800 p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm font-medium">Today's Orders</p>
                    <p className="text-3xl font-bold">{stats.totalOrders}</p>
                  </div>
                  <Package className="w-10 h-10 text-blue-200" />
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-2xl p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm font-medium">Active Orders</p>
                    <p className="text-3xl font-bold">{stats.activeOrders}</p>
                  </div>
                  <Clock className="w-10 h-10 text-green-200" />
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm font-medium">Today's Revenue</p>
                    <p className="text-3xl font-bold">${stats.totalRevenue.toFixed(0)}</p>
                  </div>
                  <DollarSign className="w-10 h-10 text-purple-200" />
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100 text-sm font-medium">Menu Items</p>
                    <p className="text-3xl font-bold">{stats.totalMenuItems}</p>
                  </div>
                  <Users className="w-10 h-10 text-orange-200" />
                </div>
              </div>
            </div>

            {/* Recent Orders Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900">Recent Orders</h3>
                  <button
                    onClick={() => setActiveTab('orders')}
                    className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                  >
                    View All
                  </button>
                </div>
                <div className="space-y-4">
                  {orders.slice(0, 5).map(order => (
                    <div key={order._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                      <div>
                        <p className="font-semibold text-gray-900">Table {order.tableId}</p>
                        <p className="text-sm text-gray-600">#{order._id.slice(-6)}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900">${order.total.toFixed(2)}</p>
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900">Table Status</h3>
                  <button
                    onClick={() => setActiveTab('tables')}
                    className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                  >
                    Manage Tables
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {restaurant?.tables.slice(0, 4).map(table => (
                    <div key={table.tableNumber} className="p-4 bg-gray-50 rounded-xl text-center">
                      <p className="font-semibold text-gray-900 mb-2">Table {table.tableNumber}</p>
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${getTableStatusColor(table.status)}`}>
                        {table.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 space-y-4 sm:space-y-0">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Active Orders</h2>
                <p className="text-gray-600 mt-1">Manage and track customer orders</p>
              </div>
              <button
                onClick={loadOrders}
                disabled={isLoading}
                className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-all flex items-center disabled:opacity-50 shadow-lg"
              >
                <RefreshCw className={`w-5 h-5 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>

            {isLoading ? (
              <div className="text-center py-16">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
                <p className="text-gray-600 text-lg">Loading orders...</p>
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl shadow-sm border border-gray-200">
                <Package className="w-20 h-20 text-gray-300 mx-auto mb-6" />
                <p className="text-gray-500 text-xl font-medium mb-2">No active orders</p>
                <p className="text-gray-400">Orders will appear here when customers place them</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {orders.map(order => (
                  <div key={order._id} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-all">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-bold text-lg text-gray-900 mb-1">
                          Table {order.tableId}
                        </h3>
                        <p className="text-gray-600 text-sm">
                          Order #{order._id.slice(-6)}
                        </p>
                        {order.customerName && (
                          <p className="text-gray-600 text-sm">
                            {order.customerName}
                          </p>
                        )}
                        <p className="text-gray-500 text-xs mt-1">
                          {formatDate(order.createdAt)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-gray-900">${order.total.toFixed(2)}</p>
                        <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </div>
                    </div>

                    <div className="mb-6">
                      <h4 className="font-semibold mb-3 text-gray-900">Order Items:</h4>
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {order.items.map((item, index) => (
                          <div key={index} className="flex justify-between text-sm bg-gray-50 p-3 rounded-lg">
                            <span className="text-gray-800">{item.quantity}x {item.name}</span>
                            <span className="font-semibold text-gray-900">${(item.price * item.quantity).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {order.status !== 'served' && (
                      <button
                        onClick={() => updateOrderStatus(order._id, getNextStatus(order.status))}
                        className="w-full bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 transition-all font-semibold shadow-lg"
                      >
                        {getStatusButtonText(order.status)}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Menu Tab */}
        {activeTab === 'menu' && (
          <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 space-y-4 sm:space-y-0">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Menu Management</h2>
                <p className="text-gray-600 mt-1">Manage your restaurant menu items</p>
              </div>
              <button 
                onClick={() => {
                  resetMenuItemForm();
                  setEditingMenuItem(null);
                  setShowMenuItemModal(true);
                }}
                className="bg-green-600 text-white px-6 py-3 rounded-xl hover:bg-green-700 transition-all shadow-lg"
              >
                <Plus className="w-5 h-5 inline mr-2" />
                Add Item
              </button>
            </div>

            {isLoading ? (
              <div className="text-center py-16">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
                <p className="text-gray-600 text-lg">Loading menu...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {menuItems.map(item => (
                  <div key={item._id} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-all">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h3 className="font-bold text-lg text-gray-900 mb-2">{item.name}</h3>
                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{item.description}</p>
                        <div className="flex flex-wrap gap-2 mb-3">
                          <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-medium">
                            {item.category}
                          </span>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            item.available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {item.available ? 'Available' : 'Unavailable'}
                          </span>
                        </div>
                        {item.allergens && item.allergens.length > 0 && (
                          <p className="text-xs text-orange-600">
                            Allergens: {item.allergens.join(', ')}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <p className="font-bold text-2xl text-gray-900">${item.price.toFixed(2)}</p>
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => openEditMenuItem(item)}
                          className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-all"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => handleDeleteMenuItem(item._id)}
                          className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tables Tab */}
        {activeTab === 'tables' && (
          <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 space-y-4 sm:space-y-0">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Table Management</h2>
                <p className="text-gray-600 mt-1">Manage tables and QR codes</p>
              </div>
              <button 
                onClick={() => {
                  resetTableForm();
                  setShowTableModal(true);
                }}
                className="bg-green-600 text-white px-6 py-3 rounded-xl hover:bg-green-700 transition-all shadow-lg"
              >
                <Plus className="w-5 h-5 inline mr-2" />
                Add Table
              </button>
            </div>

            {isLoading ? (
              <div className="text-center py-16">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
                <p className="text-gray-600 text-lg">Loading tables...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {restaurant?.tables.map(table => (
                  <div key={table.tableNumber} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-all">
                    <div className="text-center">
                      <h3 className="font-bold text-xl mb-4 text-gray-900">Table {table.tableNumber}</h3>
                      <div className="bg-gray-50 p-6 rounded-xl mb-6">
                        {table.qrCode ? (
                          <img 
                            src={table.qrCode} 
                            alt={`QR Code for Table ${table.tableNumber}`}
                            className="w-24 h-24 mx-auto rounded-lg"
                          />
                        ) : (
                          <QrCode className="w-16 h-16 mx-auto text-gray-400" />
                        )}
                        <p className="text-sm text-gray-600 mt-3 font-medium">QR Code</p>
                      </div>
                      <div className="space-y-3 mb-6">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Capacity:</span>
                          <span className="font-semibold text-gray-900">{table.capacity} people</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Status:</span>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getTableStatusColor(table.status)}`}>
                            {table.status}
                          </span>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <button 
                          onClick={() => generateQRCode(table.tableNumber)}
                          className="w-full bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 transition-all font-semibold"
                        >
                          Generate QR Code
                        </button>
                        <button 
                          onClick={() => downloadQRCode(table.tableNumber)}
                          className="w-full bg-green-600 text-white py-3 rounded-xl hover:bg-green-700 transition-all font-semibold"
                        >
                          <Download className="w-4 h-4 inline mr-2" />
                          Download QR
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

      {/* Menu Item Modal */}
      {showMenuItemModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">
                {editingMenuItem ? 'Edit Menu Item' : 'Add Menu Item'}
              </h3>
              <button 
                onClick={() => {
                  setShowMenuItemModal(false);
                  setEditingMenuItem(null);
                  resetMenuItemForm();
                }}
                className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={editingMenuItem ? handleUpdateMenuItem : handleCreateMenuItem} className="p-6">
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700">Name</label>
                  <input
                    type="text"
                    value={menuItemForm.name}
                    onChange={(e) => setMenuItemForm({...menuItemForm, name: e.target.value})}
                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700">Description</label>
                  <textarea
                    value={menuItemForm.description}
                    onChange={(e) => setMenuItemForm({...menuItemForm, description: e.target.value})}
                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    rows={3}
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700">Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={menuItemForm.price}
                    onChange={(e) => setMenuItemForm({...menuItemForm, price: e.target.value})}
                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700">Category</label>
                  <select
                    value={menuItemForm.category}
                    onChange={(e) => setMenuItemForm({...menuItemForm, category: e.target.value})}
                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    required
                  >
                    <option value="">Select Category</option>
                    <option value="appetizers">Appetizers</option>
                    <option value="mains">Main Courses</option>
                    <option value="desserts">Desserts</option>
                    <option value="beverages">Beverages</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700">Allergens (comma-separated)</label>
                  <input
                    type="text"
                    value={menuItemForm.allergens}
                    onChange={(e) => setMenuItemForm({...menuItemForm, allergens: e.target.value})}
                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="e.g., dairy, gluten, nuts"
                  />
                </div>
              </div>
              
              <div className="flex space-x-3 mt-8">
                <button
                  type="button"
                  onClick={() => {
                    setShowMenuItemModal(false);
                    setEditingMenuItem(null);
                    resetMenuItemForm();
                  }}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-semibold shadow-lg"
                >
                  {editingMenuItem ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Table Modal */}
      {showTableModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">Add Table</h3>
              <button 
                onClick={() => {
                  setShowTableModal(false);
                  resetTableForm();
                }}
                className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleCreateTable} className="p-6">
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700">Table Number</label>
                  <input
                    type="text"
                    value={tableForm.tableNumber}
                    onChange={(e) => setTableForm({...tableForm, tableNumber: e.target.value})}
                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="e.g., T007"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700">Capacity</label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={tableForm.capacity}
                    onChange={(e) => setTableForm({...tableForm, capacity: e.target.value})}
                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    required
                  />
                </div>
              </div>
              
              <div className="flex space-x-3 mt-8">
                <button
                  type="button"
                  onClick={() => {
                    setShowTableModal(false);
                    resetTableForm();
                  }}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-semibold shadow-lg"
                >
                  Add Table
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {showQRModal && selectedTable && restaurant && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">QR Code - Table {selectedTable}</h3>
              <button 
                onClick={() => {
                  setShowQRModal(false);
                  setSelectedTable(null);
                }}
                className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="text-center p-6">
              {restaurant.tables.find(t => t.tableNumber === selectedTable)?.qrCode && (
                <div className="mb-6">
                  <img 
                    src={restaurant.tables.find(t => t.tableNumber === selectedTable)?.qrCode} 
                    alt={`QR Code for Table ${selectedTable}`}
                    className="w-64 h-64 mx-auto border border-gray-200 rounded-xl shadow-sm"
                  />
                </div>
              )}
              
              <p className="text-gray-600 mb-6">
                Customers can scan this QR code to view the menu and place orders for Table {selectedTable}
              </p>
              
              <button 
                onClick={() => downloadQRCode(selectedTable)}
                className="w-full bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 transition-all font-semibold shadow-lg"
              >
                <Download className="w-5 h-5 inline mr-2" />
                Download QR Code
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}