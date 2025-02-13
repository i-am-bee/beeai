import { Dispatch, SetStateAction, useMemo, useRef } from 'react';
import { useForceUpdate } from './useForceUpdate';

export function useStateWithGetter<S>(initialState: S): [() => S, Dispatch<SetStateAction<S>>] {
  const stateRef = useRef(initialState);
  const forceUpdate = useForceUpdate();

  return useMemo(
    () => [
      () => stateRef.current as S,
      (updater: SetStateAction<S>) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
        stateRef.current = typeof updater === 'function' ? (updater as Function)(stateRef.current) : updater;
        forceUpdate();
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
}
