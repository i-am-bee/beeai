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

"use client";
import { ProgressBarProvider } from "@/contexts/ProgressBar/ProgressBarProvider";
import { RouteTransitionProvider } from "@/contexts/TransitionContext/RouteTransitionProvider";
import { ThemeProvider } from "@i-am-bee/beeai-ui";
import { QueryClientProvider } from "@tanstack/react-query";
import { PropsWithChildren } from "react";
import { getQueryClient } from "./get-query-client";

export default function Providers({ children }: PropsWithChildren) {
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <ProgressBarProvider>
        <ThemeProvider>
          <RouteTransitionProvider>{children}</RouteTransitionProvider>
        </ThemeProvider>
      </ProgressBarProvider>
    </QueryClientProvider>
  );
}
