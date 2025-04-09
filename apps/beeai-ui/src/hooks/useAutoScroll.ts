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

import { useCallback, useEffect, useRef, useState } from 'react';

import { useScrollableContainer } from './useScrollableContainer';

export function useAutoScroll(dependencies: unknown[]) {
  const ref = useRef<HTMLDivElement>(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const scrollableContainer = useScrollableContainer(ref.current);

  const handleWheel = useCallback(
    (event: WheelEvent) => {
      if (!scrollableContainer) {
        return;
      }

      const scrolledToBottom =
        scrollableContainer.scrollHeight - scrollableContainer.scrollTop === scrollableContainer.clientHeight;

      if (event.deltaY < 0) {
        setShouldAutoScroll(false);
      } else if (scrolledToBottom) {
        setShouldAutoScroll(true);
      }
    },
    [scrollableContainer],
  );

  useEffect(() => {
    if (scrollableContainer) {
      scrollableContainer.addEventListener('wheel', handleWheel);
    }

    return () => {
      if (scrollableContainer) {
        scrollableContainer.removeEventListener('wheel', handleWheel);
      }
    };
  }, [scrollableContainer, handleWheel]);

  useEffect(() => {
    if (shouldAutoScroll) {
      ref.current?.scrollIntoView();
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);

  return { ref };
}
