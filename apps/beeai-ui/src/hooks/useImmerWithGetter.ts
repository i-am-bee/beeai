/**
 * Copyright 2025 © BeeAI a Series of LF Projects, LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import type { Draft } from 'immer';
import { produce } from 'immer';
import { useMemo, useRef, useState } from 'react';

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
