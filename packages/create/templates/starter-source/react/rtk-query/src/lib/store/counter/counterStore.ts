import { useDispatch, useSelector } from 'react-redux';

import { configureStore, createSlice } from '@reduxjs/toolkit';

import { baseApi } from '../../apis/base/baseApi';

export interface CounterState {
  count: number;
}

export interface Counter {
  count: number;
  add: () => void;
}

export type RootState = ReturnType<typeof store.getState>;

const counter = createSlice({
  name: 'counter',
  initialState: { count: 0 } satisfies CounterState as CounterState,
  reducers: {
    add: (state) => {
      state.count += 1;
    },
  },
});

// The middleware gives an endpoint its cache and invalidation; the reducer alone leaves the hooks inert.
export const store = configureStore({
  reducer: {
    counter: counter.reducer,
    [baseApi.reducerPath]: baseApi.reducer,
  },
  middleware: (getDefaultMiddleware) => {
    return getDefaultMiddleware().concat(baseApi.middleware);
  },
});

export const useCounter = (): Counter => {
  const count = useSelector((state: RootState) => {
    return state.counter.count;
  });
  const dispatch = useDispatch();

  return {
    count,
    add: () => {
      dispatch(counter.actions.add());
    },
  };
};
