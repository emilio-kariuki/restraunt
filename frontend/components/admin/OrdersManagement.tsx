'use client';

import { RefreshCw, Package } from 'lucide-react';
import { Order } from '../../types/admin';
import { getStatusColor, formatDate, getStatusButtonText, getNextStatus } from '../../utils/adminUtils';

interface OrdersManagementProps {
  orders: Order[];
  isLoading: boolean;
  onRefresh: () => void;
  onUpdateOrderStatus: (orderId: string, newStatus: string) => void;
}

export default function OrdersManagement({ 
  orders, 
  isLoading, 
  onRefresh, 
  onUpdateOrderStatus 
}: OrdersManagementProps) {
  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Active Orders</h2>
          <p className="text-gray-600 mt-1">Manage and track customer orders</p>
        </div>
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-all flex items-center disabled:opacity-50"
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
                  onClick={() => onUpdateOrderStatus(order._id, getNextStatus(order.status))}
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
  );
}