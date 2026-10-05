import { create } from 'zustand';
import { getActiveUserId, setActiveUserId as persistUserId } from '../services/api.js';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title?: string;
  message: string;
}

interface AppState {
  sidebarCollapsed: boolean;
  mobileNavOpen: boolean;
  searchQuery: string;
  toasts: Toast[];
  activeUserId: string;
  userModalOpen: boolean;
  userModalMode: 'list' | 'create';

  toggleSidebar: () => void;
  setMobileNavOpen: (open: boolean) => void;
  setSearchQuery: (query: string) => void;
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  setActiveUserId: (id: string) => void;
  setUserModalOpen: (open: boolean, mode?: 'list' | 'create') => void;
  openUserModal: (mode?: 'list' | 'create') => void;
}

export const useAppStore = create<AppState>((set) => ({
  sidebarCollapsed: false,
  mobileNavOpen: false,
  searchQuery: '',
  toasts: [],
  activeUserId: getActiveUserId(),
  userModalOpen: false,
  userModalMode: 'create',

  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setMobileNavOpen: (open) => set({ mobileNavOpen: open }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  addToast: (toast) => {
    const id = Math.random().toString(36).substring(2, 9);
    set((state) => ({ toasts: [...state.toasts, { ...toast, id }] }));
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    }, 4500);
  },
  removeToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
  setActiveUserId: (id: string) => {
    persistUserId(id);
    set({ activeUserId: id });
  },
  setUserModalOpen: (open: boolean, mode: 'list' | 'create' = 'create') =>
    set({ userModalOpen: open, userModalMode: mode }),
  openUserModal: (mode: 'list' | 'create' = 'create') =>
    set({ userModalOpen: true, userModalMode: mode }),
}));
