/**
 * Copyright 2025 IBM Corp.
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

'use client';

import { noop } from '#utils/helpers.ts';
import { useCallback, useEffect, useRef, useState } from 'react';

interface Props {
  enabled?: boolean;
}

export function useToTopButton({ enabled = true }: Props = {}) {
  const ref = useRef<HTMLDivElement>(null);
  const [showButton, setShowButton] = useState(false);

  const handleScroll = useCallback((event: Event) => {
    const { scrollTop } = event.target as HTMLDivElement;

    setShowButton(scrollTop > SCROLLED_OFFSET);
  }, []);

  const handleToTopClick = useCallback(() => {
    const element = ref.current;

    if (element) {
      element.scrollTo({ top: 0 });
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const element = ref.current;

    if (element) {
      element.addEventListener('scroll', handleScroll);
    }

    return () => {
      if (element) {
        element.removeEventListener('scroll', handleScroll);
      }
    };
  }, [handleScroll, enabled]);

  return enabled
    ? {
        ref,
        showButton,
        handleToTopClick,
      }
    : {
        ref,
        showButton: false,
        handleToTopClick: noop,
      };
}

const SCROLLED_OFFSET = 48;
