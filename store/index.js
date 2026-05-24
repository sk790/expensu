import { configureStore } from '@reduxjs/toolkit';
import groupReducer from './slices/groupSlice';

export const store = configureStore({
  reducer: {
    groups: groupReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});
