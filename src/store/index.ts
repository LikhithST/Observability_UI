import { configureStore } from '@reduxjs/toolkit';
import dashboardReducer from './dashboardSlice';
import { throttle } from 'lodash';

// Function to load state from localStorage
const loadState = () => {
  try {
    const serializedState = localStorage.getItem('dashboardState');
    if (serializedState === null) {
      return undefined; // No state in localStorage, Redux will use the reducer's initial state
    }
    // The stored state is just the dashboard slice, not the whole RootState
    return JSON.parse(serializedState);
  } catch (err) {
    console.error("Could not load state from localStorage", err);
    return undefined;
  }
};

// Function to save state to localStorage
const saveState = (state: RootState) => {
  try {
    // We only want to persist the dashboard slice
    const serializedState = JSON.stringify(state.dashboard);
    localStorage.setItem('dashboardState', serializedState);
  } catch (err) {
    console.error("Could not save state to localStorage", err);
  }
};

const preloadedState = {
  dashboard: loadState()
};

export const store = configureStore({
  reducer: {
    dashboard: dashboardReducer,
  },
  preloadedState,
});

// Throttle saving to avoid performance issues on frequent updates
store.subscribe(throttle(() => {
  saveState(store.getState());
}, 1000)); // Save at most once per second

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
