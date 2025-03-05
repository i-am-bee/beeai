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

// This needs to be `Symbol.for()` because this module is evaluated separately during instrumentation and then
// for next-server so just a `Symbol()` would not work
const NATIVE_FETCH = Symbol.for('beeai-native-fetch');

export function getNativeFetch() {
  return (globalThis as Record<symbol, unknown>)[NATIVE_FETCH] as typeof globalThis.fetch;
}

/**
 * Run this during instrumentation, when native unpatched fetch is still available on globalThis
 * We will store it as a symbol global variable. This global variable will be then still available
 * during normal next-server operation
 */
export function storeNativeFetch() {
  (globalThis as Record<symbol, unknown>)[NATIVE_FETCH] = globalThis.fetch;
}
