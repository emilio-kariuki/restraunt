'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, QrCode, Users, RefreshCw, AlertCircle, CheckCircle, X, Download } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState<'orders' | 'menu' | 'tables'>('orders');
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
      if (activeTab === 'orders') {
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
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'preparing': return 'bg-orange-100 text-orange-800';
      case 'ready': return 'bg-green-100 text-green-800';
      case 'served': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTableStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800';
      case 'occupied': return 'bg-red-100 text-red-800';
      case 'reserved': return 'bg-blue-100 text-blue-800';
      case 'cleaning': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
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

  // Login form
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Restaurant Admin</h1>
            <p className="text-gray-600 mt-2">Sign in to manage your restaurant</p>
          </div>
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center">
              <AlertCircle className="w-4 h-4 text-red-600 mr-2" />
              <span className="text-red-700 text-sm">{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2 text-gray-700">Email</label>
              <input
                type="email"
                value={loginForm.email}
                onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                placeholder="Enter your email"
                required
              />
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2 text-gray-700">Password</label>
              <input
                type="password"
                value={loginForm.password}
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                placeholder="Enter your password"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Sign In
            </button>
          </form>
          
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm font-medium text-blue-800 mb-2">Demo Credentials:</p>
            <div className="space-y-1 text-sm text-blue-700">
              <p><strong>Admin:</strong> admin@bellavista.com / admin123</p>
              <p><strong>Kitchen:</strong> kitchen@bellavista.com / kitchen123</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg flex items-center ${
          notification.type === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
        }`}>
          {notification.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
          )}
          <span className={`text-sm font-medium ${
            notification.type === 'success' ? 'text-green-800' : 'text-red-800'
          }`}>
            {notification.message}
          </span>
        </div>
      )}

      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Restaurant Admin</h1>
              <p className="text-sm text-gray-600">Manage your restaurant operations</p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setActiveTab('orders')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'orders' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Users className="w-4 h-4 inline mr-2" />
                Orders
              </button>
              <button
                onClick={() => setActiveTab('menu')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'menu' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Menu
              </button>
              <button
                onClick={() => setActiveTab('tables')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'tables' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <QrCode className="w-4 h-4 inline mr-2" />
                Tables
              </button>
              <button
                onClick={logout}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
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
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
            <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
            <span className="text-red-700">{error}</span>
            <button 
              onClick={() => setError(null)}
              className="ml-auto text-red-600 hover:text-red-800"
            >
              ×
            </button>
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Active Orders</h2>
                <p className="text-gray-600">Manage and track customer orders</p>
              </div>
              <button
                onClick={loadOrders}
                disabled={isLoading}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>

            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading orders...</p>
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg shadow-sm">
                <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No active orders</p>
                <p className="text-gray-400">Orders will appear here when customers place them</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {orders.map(order => (
                  <div key={order._id} className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-semibold text-lg text-gray-900">
                          Table {order.tableId}
                        </h3>
                        <p className="text-gray-600">
                          Order #{order._id.slice(-6)}
                        </p>
                        {order.customerName && (
                          <p className="text-gray-600">
                            Customer: {order.customerName}
                          </p>
                        )}
                        <p className="text-gray-500 text-sm">
                          {formatDate(order.createdAt)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-gray-900">${order.total.toFixed(2)}</p>
                        <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </div>
                    </div>

                    <div className="mb-4">
                      <h4 className="font-medium mb-2 text-gray-900">Order Items:</h4>
                      <div className="space-y-1">
                        {order.items.map((item, index) => (
                          <div key={index} className="flex justify-between text-sm bg-gray-50 p-2 rounded text-black">
                            <span>{item.quantity}x {item.name}</span>
                            <span className="font-medium">${(item.price * item.quantity).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {order.status !== 'served' && (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => updateOrderStatus(order._id, getNextStatus(order.status))}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex-1"
                        >
                          {getStatusButtonText(order.status)}
                        </button>
                      </div>
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
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Menu Management</h2>
                <p className="text-gray-600">Manage your restaurant menu items</p>
              </div>
              <button 
                onClick={() => {
                  resetMenuItemForm();
                  setEditingMenuItem(null);
                  setShowMenuItemModal(true);
                }}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                <Plus className="w-4 h-4 inline mr-2" />
                Add Item
              </button>
            </div>

            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading menu...</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {menuItems.map(item => (
                  <div key={item._id} className="bg-white rounded-lg shadow-sm border p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{item.name}</h3>
                        <p className="text-gray-600 text-sm mt-1">{item.description}</p>
                        <div className="flex items-center mt-2">
                          <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs">
                            {item.category}
                          </span>
                          <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                            item.available ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {item.available ? 'Available' : 'Unavailable'}
                          </span>
                        </div>
                        {item.allergens && item.allergens.length > 0 && (
                          <p className="text-xs text-orange-600 mt-1">
                            Allergens: {item.allergens.join(', ')}
                          </p>
                        )}
                      </div>
                      <div className="text-right ml-4">
                        <p className="font-bold text-lg text-gray-900">${item.price.toFixed(2)}</p>
                        <div className="flex space-x-2 mt-2">
                          <button 
                            onClick={() => openEditMenuItem(item)}
                            className="text-blue-600 hover:text-blue-800 transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteMenuItem(item._id)}
                            className="text-red-600 hover:text-red-800 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
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
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Table Management</h2>
                <p className="text-gray-600">Manage tables and QR codes</p>
              </div>
              <button 
                onClick={() => {
                  resetTableForm();
                  setShowTableModal(true);
                }}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                <Plus className="w-4 h-4 inline mr-2" />
                Add Table
              </button>
            </div>

            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading tables...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {restaurant?.tables.map(table => (
                  <div key={table.tableNumber} className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow">
                    <div className="text-center">
                      <h3 className="font-semibold text-lg mb-2 text-gray-900">Table {table.tableNumber}</h3>
                      <div className="bg-gray-100 p-4 rounded-lg mb-4">
                        {table.qrCode ? (
                          <img 
                            src={table.qrCode} 
                            alt={`QR Code for Table ${table.tableNumber}`}
                            className="w-24 h-24 mx-auto"
                          />
                        ) : (
                          <QrCode className="w-16 h-16 mx-auto text-gray-400" />
                        )}
                        <p className="text-sm text-gray-600 mt-2">QR Code</p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm text-gray-700">
                          <strong>Capacity:</strong> {table.capacity} people
                        </p>
                        <p className="text-sm text-gray-700">
                          <strong>Status:</strong> 
                          <span className={`ml-1 px-2 py-1 rounded-full text-xs ${getTableStatusColor(table.status)}`}>
                            {table.status}
                          </span>
                        </p>
                      </div>
                      <div className="mt-4 space-y-2">
                        <button 
                          onClick={() => generateQRCode(table.tableNumber)}
                          className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Generate QR Code
                        </button>
                        <button 
                          onClick={() => downloadQRCode(table.tableNumber)}
                          className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                {editingMenuItem ? 'Edit Menu Item' : 'Add Menu Item'}
              </h3>
              <button 
                onClick={() => {
                  setShowMenuItemModal(false);
                  setEditingMenuItem(null);
                  resetMenuItemForm();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={editingMenuItem ? handleUpdateMenuItem : handleCreateMenuItem}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Name</label>
                  <input
                    type="text"
                    value={menuItemForm.name}
                    onChange={(e) => setMenuItemForm({...menuItemForm, name: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea
                    value={menuItemForm.description}
                    onChange={(e) => setMenuItemForm({...menuItemForm, description: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={menuItemForm.price}
                    onChange={(e) => setMenuItemForm({...menuItemForm, price: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Category</label>
                  <select
                    value={menuItemForm.category}
                    onChange={(e) => setMenuItemForm({...menuItemForm, category: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  <label className="block text-sm font-medium mb-1">Allergens (comma-separated)</label>
                  <input
                    type="text"
                    value={menuItemForm.allergens}
                    onChange={(e) => setMenuItemForm({...menuItemForm, allergens: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., dairy, gluten, nuts"
                  />
                </div>
              </div>
              
              <div className="flex space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowMenuItemModal(false);
                    setEditingMenuItem(null);
                    resetMenuItemForm();
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Add Table</h3>
              <button 
                onClick={() => {
                  setShowTableModal(false);
                  resetTableForm();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleCreateTable}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Table Number</label>
                  <input
                    type="text"
                    value={tableForm.tableNumber}
                    onChange={(e) => setTableForm({...tableForm, tableNumber: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., T007"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Capacity</label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={tableForm.capacity}
                    onChange={(e) => setTableForm({...tableForm, capacity: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>
              
              <div className="flex space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowTableModal(false);
                    resetTableForm();
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">QR Code - Table {selectedTable}</h3>
              <button 
                onClick={() => {
                  setShowQRModal(false);
                  setSelectedTable(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="text-center">
              {restaurant.tables.find(t => t.tableNumber === selectedTable)?.qrCode && (
                <div className="mb-4">
                  <img 
                    src={restaurant.tables.find(t => t.tableNumber === selectedTable)?.qrCode} 
                    alt={`QR Code for Table ${selectedTable}`}
                    className="w-64 h-64 mx-auto border rounded-lg"
                  />
                </div>
              )}
              
              <p className="text-sm text-gray-600 mb-4">
                Customers can scan this QR code to view the menu and place orders for Table {selectedTable}
              </p>
              
              <button 
                onClick={() => downloadQRCode(selectedTable)}
                className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Download className="w-4 h-4 inline mr-2" />
                Download QR Code
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}