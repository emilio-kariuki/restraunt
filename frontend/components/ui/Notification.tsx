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
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'info':
        return <Info className="w-5 h-5 text-blue-600" />;
    }
  };

  const getStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800 shadow-green-100';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800 shadow-red-100';
      case 'warning':
        return 'bg-amber-50 border-amber-200 text-amber-800 shadow-amber-100';
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-800 shadow-blue-100';
    }
  };

  return (
    <div className={`fixed top-4 right-4 z-50 animate-slide-up animate-fade-in`}>
      <div className={`p-4 rounded-2xl border-2 shadow-2xl max-w-sm backdrop-blur-sm ${getStyles()} transform transition-all duration-300 ease-in-out hover:scale-105`}>
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0 mt-0.5">
            {getIcon()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm leading-relaxed break-words">{message}</p>
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 ml-2 p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-white/50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-300"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        {/* Progress bar for auto-dismiss */}
        {duration > 0 && (
          <div className="mt-3 w-full bg-white/30 rounded-full h-1 overflow-hidden">
            <div 
              className="h-full bg-current opacity-60 rounded-full transition-all ease-linear"
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