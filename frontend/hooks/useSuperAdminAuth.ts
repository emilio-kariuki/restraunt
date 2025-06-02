'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiService } from '../lib/api';

interface User {
  _id: string;
  email: string;
  role: string;
  name?: string;
}

export function useSuperAdminAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        router.push('/admin');
        return;
      }

      const response = await apiService.auth.verifyToken();
      
      if (response.user.role !== 'superadmin') {
        localStorage.removeItem('adminToken');
        router.push('/admin');
        return;
      }

      setUser(response.user);
    } catch (err) {
      console.error('Auth check failed:', err);
      localStorage.removeItem('adminToken');
      router.push('/admin');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setError(null);
      const response = await apiService.auth.login(email, password);
      
      if (response.user.role !== 'superadmin') {
        throw new Error('Access denied. Superadmin privileges required.');
      }

      localStorage.setItem('adminToken', response.token);
      setUser(response.user);
      router.push('/superadmin');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message);
      throw err;
    }
  };

  const logout = async () => {
    try {
      await apiService.auth.logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      localStorage.removeItem('adminToken');
      setUser(null);
      router.push('/admin');
    }
  };

  return {
    user,
    loading,
    error,
    login,
    logout,
    isAuthenticated: !!user
  };
}
