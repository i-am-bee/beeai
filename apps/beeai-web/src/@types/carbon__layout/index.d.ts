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

declare module '@carbon/layout' {
  // wrongly typed in @types/carbon__layout
  export const spacing: string[];

  export const baseFontSize: number;

  export const breakpoints: {
    lg: {
      columns: number;
      margin: string;
      width: string;
    };
    max: {
      columns: number;
      margin: string;
      width: string;
    };
    md: {
      columns: number;
      margin: string;
      width: string;
    };
    sm: {
      columns: number;
      margin: string;
      width: string;
    };
    xlg: {
      columns: number;
      margin: string;
      width: string;
    };
  };

  export const miniUnit: number;

  export function breakpoint(...args: unknown[]): string;

  export function breakpointDown(name: string): string;

  export function breakpointUp(name: string): string;

  export function em(px: number): string;

  export function miniUnits(count: number): string;

  export function px(value: number): string;

  export function rem(px: number): string;
}
