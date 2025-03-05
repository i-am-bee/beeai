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

import {
  PropsWithChildren,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from "react";
import { ViewTransitionContext } from "./context";
import { usePathname } from "next/navigation";
import { NavigateOptions } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { moderate02 } from "@carbon/motion";
import { useRouter } from "@bprogress/next/app";

export function ViewTransitionProvider({ children }: PropsWithChildren) {
  const router = useRouter();
  const pathname = usePathname();

  const transitionControlRef = useRef<{
    element: Element;
    sourcePath: string;
  } | null>(null);

  const pathnameRef = useRef<string>(pathname);
  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  useEffect(() => {
    if (transitionControlRef.current) {
      transitionControlRef.current.element.setAttribute(
        "data-transition-view",
        "in"
      );
      transitionControlRef.current = null;
    }
  }, [pathname]);

  const transitionTo = useCallback(
    async (href: string, options: NavigateOptions) => {
      const element = document.querySelector("[data-transition-view]");
      if (!element) {
        router.push(href, options);
        return;
      }

      element.setAttribute("data-transition-view", "out");
      const sourcePathname = pathnameRef.current;
      setTimeout(() => {
        router.push(href, options);

        if (
          sourcePathname !== pathnameRef.current ||
          href === pathnameRef.current
        ) {
          element.setAttribute("data-transition-view", "in");
        } else {
          transitionControlRef.current = {
            sourcePath: sourcePathname,
            element,
          };
        }
      }, duration);
    },
    [router]
  );

  const value = useMemo(() => ({ transitionTo }), [transitionTo]);

  return (
    <ViewTransitionContext.Provider value={value}>
      {children}
    </ViewTransitionContext.Provider>
  );
}

const duration = parseFloat(moderate02);
