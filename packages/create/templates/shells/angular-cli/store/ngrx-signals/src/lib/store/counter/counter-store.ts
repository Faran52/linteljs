import {
  patchState,
  signalStore,
  withMethods,
  withState,
} from '@ngrx/signals';

export const CounterStore = signalStore(
  { providedIn: 'root' },
  withState({ count: 0 }),
  withMethods((store) => {
    const methods = {
      add: (): void => {
        patchState(store, ({ count }) => {
          const next = { count: count + 1 };

          return next;
        });
      },
    };

    return methods;
  }),
);
