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

import { PropsWithChildren, useCallback, useEffect, useMemo } from 'react';
import { useLocalStorage, useMediaQuery } from 'usehooks-ts';
import { ThemeContext } from './theme-context';
import { Theme } from './types';
import { getThemeClassName } from './utils';

const MEDIA_QUERY = '(prefers-color-scheme: dark)';
const STORAGE_KEY = '@i-am-bee/beeai/DARK_MODE';

export function ThemeProvider({ children }: PropsWithChildren) {
  const isDarkModeOS = useMediaQuery(MEDIA_QUERY);
  const [isDarkMode, setIsDarkMode] = useLocalStorage<boolean>(STORAGE_KEY, isDarkModeOS);

  const theme = useMemo(() => (isDarkMode ? Theme.Dark : Theme.Light), [isDarkMode]);
  const toggleTheme = useCallback(() => setIsDarkMode((state) => !state), [setIsDarkMode]);

  useEffect(() => {
    const html = document.documentElement;

    html.classList.toggle(getThemeClassName(Theme.Dark), isDarkMode);
    html.classList.toggle(getThemeClassName(Theme.Light), !isDarkMode);
  }, [isDarkMode]);

  const contextValue = useMemo(() => ({ theme, toggleTheme }), [theme, toggleTheme]);

  return <ThemeContext.Provider value={contextValue}>{children}</ThemeContext.Provider>;
}
