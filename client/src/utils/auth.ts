import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export function useAuth() {
  const [status, setStatus] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading');
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/check');
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        setStatus('authenticated');
      } else {
        setStatus('unauthenticated');
      }
    } catch (error) {
      setStatus('unauthenticated');
    }
  };

  return { status, user };
}