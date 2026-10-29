'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Toaster } from 'react-hot-toast';
import toast from 'react-hot-toast';
import { api } from '@/lib/client';
import CartDrawer from './CartDrawer';

const AuthContext = createContext(null);
const GUEST_KEY = 'qf_guest_cart';

const readGuest = () => {
  try {
    return JSON.parse(localStorage.getItem(GUEST_KEY) || '[]');
  } catch {
    return [];
  }
};
const writeGuest = (ids) => {
  try {
    localStorage.setItem(GUEST_KEY, JSON.stringify(ids));
  } catch {}
};

export function Providers({ children }) {
  const [user, setUser] = useState(null);
  const [counts, setCounts] = useState({ cart: 0, notifications: 0, wishlist: 0 });
  const [loading, setLoading] = useState(true);
  const [guestIds, setGuestIds] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [lastAdded, setLastAdded] = useState(null);
  const [cartVersion, setCartVersion] = useState(0);
  const merged = useRef(false);

  const bumpCart = useCallback(() => setCartVersion((v) => v + 1), []);

  const refresh = useCallback(async () => {
    try {
      const d = await api('/api/auth/me');
      setUser(d.user);
      setCounts(d.counts);
      return d.user;
    } catch {
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setGuestIds(readGuest());
    refresh();
  }, [refresh]);

  // A guest cart moves into the account as soon as the visitor logs in
  useEffect(() => {
    if (!user || merged.current) return;
    const ids = readGuest();
    merged.current = true;
    if (!ids.length) return;
    api('/api/cart/merge', { method: 'POST', body: { courseIds: ids } })
      .then(() => {
        writeGuest([]);
        setGuestIds([]);
        refresh();
        bumpCart();
      })
      .catch(() => {});
  }, [user, refresh, bumpCart]);

  useEffect(() => {
    import('bootstrap/dist/js/bootstrap.bundle.min.js');
  }, []);

  /** Adds a course to the cart (account or guest) and opens the mini cart. */
  const addToCart = useCallback(
    async (course, { open = true } = {}) => {
      if (user) {
        try {
          const d = await api('/api/cart', { method: 'POST', body: { courseId: course.id } });
          setCounts((c) => ({ ...c, cart: d.items.length }));
        } catch (e) {
          toast.error(e.message);
          return false;
        }
      } else {
        const ids = [course.id, ...readGuest().filter((id) => id !== course.id)];
        writeGuest(ids);
        setGuestIds(ids);
      }
      setLastAdded(course);
      bumpCart();
      if (open) setCartOpen(true);
      return true;
    },
    [user, bumpCart]
  );

  const removeFromCart = useCallback(
    async (courseId) => {
      if (user) {
        const d = await api(`/api/cart?courseId=${courseId}`, { method: 'DELETE' });
        setCounts((c) => ({ ...c, cart: d.items.length }));
      } else {
        const ids = readGuest().filter((id) => id !== courseId);
        writeGuest(ids);
        setGuestIds(ids);
      }
      bumpCart();
    },
    [user, bumpCart]
  );

  const logout = useCallback(async () => {
    await api('/api/auth/logout', { method: 'POST' }).catch(() => {});
    setUser(null);
    window.location.href = '/';
  }, []);

  const cartCount = user ? counts.cart : guestIds.length;

  return (
    <AuthContext.Provider
      value={{
        user, loading, counts, setCounts, refresh, logout,
        cartCount, guestIds, addToCart, removeFromCart, cartVersion, bumpCart,
        cartOpen, openCart: () => setCartOpen(true), closeCart: () => setCartOpen(false), lastAdded,
      }}
    >
      {children}
      <CartDrawer />
      <Toaster
        position="bottom-center"
        toastOptions={{
          style: { borderRadius: '10px', fontWeight: 600, fontSize: '0.92rem', background: '#1B1F3B', color: '#fff' },
          success: { iconTheme: { primary: '#FFD84D', secondary: '#1B1F3B' } },
        }}
      />
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
