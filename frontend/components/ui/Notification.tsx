'use client';

import { useEffect } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

interface NotificationProps {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  onClose: () => void;
  duration?: number;
}

export default function Notification({ type, message, onClose, duration = 5000 }: NotificationProps) {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return (
          <div className="w-8 h-8 bg-green-100 rounded-xl flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
        );
      case 'error':
        return (
          <div className="w-8 h-8 bg-red-100 rounded-xl flex items-center justify-center">
            <XCircle className="w-5 h-5 text-red-600" />
          </div>
        );
      case 'warning':
        return (
          <div className="w-8 h-8 bg-yellow-100 rounded-xl flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
          </div>
        );
      case 'info':
        return (
          <div className="w-8 h-8 bg-blue-100 rounded-xl flex items-center justify-center">
            <Info className="w-5 h-5 text-blue-600" />
          </div>
        );
    }
  };

  const getStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-300 text-green-900 shadow-xl shadow-green-100/50';
      case 'error':
        return 'bg-gradient-to-r from-red-50 to-rose-50 border-red-300 text-red-900 shadow-xl shadow-red-100/50';
      case 'warning':
        return 'bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-300 text-amber-900 shadow-xl shadow-amber-100/50';
      case 'info':
        return 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-300 text-blue-900 shadow-xl shadow-blue-100/50';
    }
  };

  return (
    <div className={`fixed top-6 right-6 z-50 animate-bounce-in`}>
      <div className={`p-5 rounded-2xl border-2 shadow-2xl max-w-sm backdrop-blur-md ${getStyles()} transform transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-3xl`}>
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0">
            {getIcon()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-base leading-relaxed break-words">{message}</p>
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 p-2 rounded-xl text-gray-500 hover:text-gray-700 hover:bg-white/70 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-300 transform hover:scale-110"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        {/* Enhanced progress bar for auto-dismiss */}
        {duration > 0 && (
          <div className="mt-4 w-full bg-white/40 rounded-full h-2 overflow-hidden shadow-inner">
            <div 
              className="h-full bg-current opacity-80 rounded-full transition-all ease-linear shadow-sm"
              style={{
                width: '100%',
                animation: `shrink ${duration}ms linear forwards`
              }}
            />
          </div>
        )}
      </div>
      
      <style jsx>{`
        @keyframes shrink {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
      `}</style>
    </div>
  );
}