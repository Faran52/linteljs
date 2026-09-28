import { useDispatch, useSelector } from 'react-redux';

import { configureStore, createSlice } from '@reduxjs/toolkit';

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

export const store = configureStore({ reducer: { counter: counter.reducer } });

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
