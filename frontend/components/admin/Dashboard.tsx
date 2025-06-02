'use client';

import { Package, Clock, DollarSign, Users } from 'lucide-react';
import { Order, Restaurant } from '../../types/admin';
import { getDashboardStats, getStatusColor, getTableStatusColor } from '../../utils/adminUtils';

interface DashboardProps {
  orders: Order[];
  menuItems: any[];
  restaurant: Restaurant | null;
  setActiveTab: (tab: any) => void;
}

export default function Dashboard({ orders, menuItems, restaurant, setActiveTab }: DashboardProps) {
  const stats = getDashboardStats(orders, menuItems, restaurant);

  return (
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
  );
}