import { useEffect, useMemo, useRef } from 'react';
import { Draft } from 'immer';
import { useImmer } from 'use-immer';

export type DraftFunction<S> = (draft: Draft<S>) => void;
export type Updater<S> = (arg: S | DraftFunction<S>) => void;

export function useImmerWithGetter<S>(initialValue: S): [S, () => S, Updater<S>] {
  const [value, setValue] = useImmer<S>(initialValue);
  const valueRef = useRef(value);

  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  return useMemo(() => [value, () => valueRef.current, setValue], [setValue, value]);
}
