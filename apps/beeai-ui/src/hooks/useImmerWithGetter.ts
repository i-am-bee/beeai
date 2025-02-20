import { useMemo, useRef, useState } from 'react';
import { Draft, produce } from 'immer';

export type DraftFunction<S> = (draft: Draft<S>) => void;
export type Updater<S> = (arg: S | DraftFunction<S>) => void;

export function useImmerWithGetter<S>(initialValue: S): [S, () => S, Updater<S>] {
  const [value, setValue] = useState<S>(initialValue);
  const valueRef = useRef(value);

  return useMemo(
    () => [
      value,
      () => valueRef.current,
      (updater: S | DraftFunction<S>) => {
        valueRef.current =
          typeof updater === 'function' ? produce(updater as DraftFunction<S>, valueRef.current)() : updater;
        setValue(valueRef.current);
      },
    ],
    [setValue, value],
  );
}
