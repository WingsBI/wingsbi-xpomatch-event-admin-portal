import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import createWebStorage from 'redux-persist/lib/storage/createWebStorage';
import { authSlice } from './slices/authSlice';
import { appSlice } from './slices/appSlice';
import { apiSlice } from './slices/apiSlice';
import { FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist';

// Create a noop storage for server-side rendering
const createNoopStorage = () => {
  return {
    getItem(_key: string) {
      return Promise.resolve(null);
    },
    setItem(_key: string, value: any) {
      return Promise.resolve(value);
    },
    removeItem(_key: string) {
      return Promise.resolve();
    },
  };
};

// Use localStorage when available, otherwise use noop storage
const clientStorage = typeof window !== 'undefined' 
  ? storage 
  : createNoopStorage();

// Extract identifier from URL
export const extractIdentifierFromURL = (): string => {
  if (typeof window !== 'undefined') {
    const path = window.location.pathname;
    const segments = path.split('/').filter(Boolean);
    // Extract the first segment as identifier (e.g., AI2025 from /AI2025/dashboard)
    return segments[0] || '';
  }
  return '';
};

const persistConfig = {
  key: 'root',
  version: 2,
  storage: clientStorage,
  whitelist: ['app'], // Only persist app state, NOT auth state for security
  // Removing 'auth' from whitelist prevents automatic login with old tokens
};

const rootReducer = combineReducers({
  auth: authSlice.reducer,
  app: appSlice.reducer,
  api: apiSlice.reducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
  devTools: process.env.NODE_ENV !== 'production',
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof rootReducer> & {
  _persist: { version: number; rehydrated: boolean }
};
export type AppDispatch = typeof store.dispatch; 