'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, QrCode, Users } from 'lucide-react';

interface MenuItem {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  available: boolean;
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

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:6000/api';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<'orders' | 'menu' | 'tables'>('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [authToken, setAuthToken] = useState<string | null>(null);

  // Simple auth check
  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      // Simple login form would go here
      // For demo, we'll just set a dummy token
      setAuthToken('demo-admin-token');
    } else {
      setAuthToken(token);
    }
  }, []);

  useEffect(() => {
    if (authToken) {
      loadData();
    }
  }, [authToken, activeTab]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      if (activeTab === 'orders') {
        await loadOrders();
      } else if (activeTab === 'menu') {
        await loadMenu();
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadOrders = async () => {
    try {
      const response = await fetch(`${API_BASE}/orders`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders || []);
      }
    } catch (error) {
      console.error('Error loading orders:', error);
    }
  };

  const loadMenu = async () => {
    try {
      // This would need the restaurant ID in a real app
      const response = await fetch(`${API_BASE}/menu/demo-restaurant-id`);
      if (response.ok) {
        const data = await response.json();
        // Flatten menu object into array
        const items: MenuItem[] = [];
        Object.entries(data.menu).forEach(([category, categoryItems]: [string, any]) => {
          categoryItems.forEach((item: any) => {
            items.push({ ...item, category });
          });
        });
        setMenuItems(items);
      }
    } catch (error) {
      console.error('Error loading menu:', error);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const response = await fetch(`${API_BASE}/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      
      if (response.ok) {
        await loadOrders();
      }
    } catch (error) {
      console.error('Error updating order status:', error);
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

  if (!authToken) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-gray-900">Restaurant Admin</h1>
            <div className="flex space-x-4">
              <button
                onClick={() => setActiveTab('orders')}
                className={`px-4 py-2 rounded-lg font-medium ${
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
                className={`px-4 py-2 rounded-lg font-medium ${
                  activeTab === 'menu' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Menu
              </button>
              <button
                onClick={() => setActiveTab('tables')}
                className={`px-4 py-2 rounded-lg font-medium ${
                  activeTab === 'tables' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <QrCode className="w-4 h-4 inline mr-2" />
                Tables
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Active Orders</h2>
              <button
                onClick={loadOrders}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Refresh
              </button>
            </div>

            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading orders...</p>
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No active orders</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {orders.map(order => (
                  <div key={order._id} className="bg-white rounded-lg shadow-sm border p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-semibold text-lg">
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
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold">${order.total.toFixed(2)}</p>
                        <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </div>
                    </div>

                    <div className="mb-4">
                      <h4 className="font-medium mb-2">Items:</h4>
                      <div className="space-y-1">
                        {order.items.map((item, index) => (
                          <div key={index} className="flex justify-between text-sm">
                            <span>{item.quantity}x {item.name}</span>
                            <span>${(item.price * item.quantity).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      {order.status === 'pending' && (
                        <button
                          onClick={() => updateOrderStatus(order._id, 'confirmed')}
                          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                        >
                          Confirm
                        </button>
                      )}
                      {order.status === 'confirmed' && (
                        <button
                          onClick={() => updateOrderStatus(order._id, 'preparing')}
                          className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700"
                        >
                          Start Preparing
                        </button>
                      )}
                      {order.status === 'preparing' && (
                        <button
                          onClick={() => updateOrderStatus(order._id, 'ready')}
                          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                        >
                          Mark Ready
                        </button>
                      )}
                      {order.status === 'ready' && (
                        <button
                          onClick={() => updateOrderStatus(order._id, 'served')}
                          className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
                        >
                          Mark Served
                        </button>
                      )}
                    </div>
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
              <h2 className="text-xl font-semibold">Menu Management</h2>
              <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
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
                  <div key={item._id} className="bg-white rounded-lg shadow-sm border p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-semibold">{item.name}</h3>
                        <p className="text-gray-600 text-sm">{item.description}</p>
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
                      </div>
                      <div className="text-right ml-4">
                        <p className="font-bold text-lg">${item.price.toFixed(2)}</p>
                        <div className="flex space-x-2 mt-2">
                          <button className="text-blue-600 hover:text-blue-800">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button className="text-red-600 hover:text-red-800">
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
              <h2 className="text-xl font-semibold">Table Management</h2>
              <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
                <Plus className="w-4 h-4 inline mr-2" />
                Add Table
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Demo tables */}
              {['T001', 'T002', 'T003', 'T004', 'T005', 'T006'].map(tableId => (
                <div key={tableId} className="bg-white rounded-lg shadow-sm border p-6">
                  <div className="text-center">
                    <h3 className="font-semibold text-lg mb-2">Table {tableId}</h3>
                    <div className="bg-gray-100 p-4 rounded-lg mb-4">
                      <QrCode className="w-16 h-16 mx-auto text-gray-400" />
                      <p className="text-sm text-gray-600 mt-2">QR Code</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm"><strong>Capacity:</strong> 4 people</p>
                      <p className="text-sm"><strong>Status:</strong> 
                        <span className="ml-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                          Available
                        </span>
                      </p>
                    </div>
                    <button className="mt-4 w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
                      Download QR Code
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