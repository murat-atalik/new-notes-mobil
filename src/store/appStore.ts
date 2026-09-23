import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';

import { authenticate, createList, deleteList, fetchInitialData } from '../services/apiClient';
import { loadState, saveState } from '../services/storageService';
import type { AppList, Expense, ListType, PaymentCard, SavingsGoal, User } from '../types';
import type { RootState } from './store';

type AppState = {
  user: User | null;
  lists: AppList[];
  dark: boolean;
  status: 'idle' | 'loading' | 'ready' | 'failed';
  error: string | null;
  expenses: Expense[];
  paymentCards: PaymentCard[];
  savingsGoals: SavingsGoal[];
};

const initialState: AppState = {
  user: null,
  lists: [],
  dark: false,
  status: 'idle',
  error: null,
  expenses: [],
  paymentCards: [],
  savingsGoals: [],
};

const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : 'Sunucu isteği başarısız oldu';

export const hydrateApp = createAsyncThunk('app/hydrate', async () => {
  const saved = await loadState();
  const data = await fetchInitialData();
  return {
    user: saved?.user ?? null,
    lists: data.lists,
    dark: saved?.dark ?? false,
    expenses: data.expenses,
    paymentCards: data.paymentCards,
    savingsGoals: data.savingsGoals,
  };
});

export const signIn = createAsyncThunk(
  'app/signIn',
  async ({ username, password, name }: { username: string; password: string; name?: string }) => {
    const user = await authenticate(username, password, name);
    const data = await fetchInitialData();
    return {
      user,
      lists: data.lists,
      expenses: data.expenses,
      paymentCards: data.paymentCards,
      savingsGoals: data.savingsGoals,
    };
  },
);

export const createServerList = createAsyncThunk(
  'app/createList',
  async (
    { title, type, isShared }: { title: string; type: ListType; isShared: boolean },
    { getState },
  ) => {
    const user = (getState() as RootState).app.user;
    if (!user) throw new Error('Oturum bulunamadı');
    return createList(user, title, type, isShared);
  },
);

export const deleteServerList = createAsyncThunk('app/deleteList', async (id: string) => {
  await deleteList(id);
  return id;
});

const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<User | null>) => {
      state.user = action.payload;
    },
    setDark: (state, action: PayloadAction<boolean>) => {
      state.dark = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(hydrateApp.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(hydrateApp.fulfilled, (state, action) => {
        Object.assign(state, action.payload);
        state.status = 'ready';
      })
      .addCase(hydrateApp.rejected, (state, action) => {
        state.status = 'failed';
        state.error = errorMessage(action.error.message);
      })
      .addCase(signIn.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(signIn.fulfilled, (state, action) => {
        Object.assign(state, action.payload);
        state.status = 'ready';
      })
      .addCase(signIn.rejected, (state, action) => {
        state.status = 'failed';
        state.error = errorMessage(action.error.message);
      })
      .addCase(createServerList.fulfilled, (state, action) => {
        state.lists.unshift(action.payload);
      })
      .addCase(deleteServerList.fulfilled, (state, action) => {
        state.lists = state.lists.filter((list) => list.id !== action.payload);
      });
  },
});

export const { clearError, setDark, setUser } = appSlice.actions;
export const appReducer = appSlice.reducer;

export const selectApp = (state: RootState) => state.app;

export async function persistAppState(state: RootState): Promise<void> {
  if (state.app.user) {
    await saveState({ user: state.app.user, lists: [], dark: state.app.dark });
  }
}
