import { useMemo } from 'react';
import { Draft, produce, freeze } from 'immer';
import { useStateWithGetter } from './useStateWithGetter';

export type DraftFunction<S> = (draft: Draft<S>) => void;
export type Updater<S> = (arg: S | DraftFunction<S>) => void;

export function useImmerWithGetter<S>(initialValue: S): [() => S, Updater<S>] {
  const [get, set] = useStateWithGetter(freeze(initialValue));

  return useMemo(
    () => [
      get,
      (updater: S | DraftFunction<S>) => {
        if (typeof updater === 'function') {
          set(produce(updater as DraftFunction<S>));
        } else {
          set(freeze(updater));
        }
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
}
