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

import { Root } from 'hast';
import { visit } from 'unist-util-visit';

export function rehypeCarbonLists() {
  // we cannot use `usePrefix` obviously but this doesn't change anyway
  const prefix = 'cds';
  return (tree: Root) => {
    visit(tree, (node, _, parent) => {
      if (node.type !== 'element') return;

      if (node.tagName === 'li') {
        node.properties.className = `${prefix}--list__item`;
      }

      if (node.tagName === 'ul' || node.tagName === 'ol') {
        let className = node.tagName === 'ul' ? `${prefix}--list--unordered` : `${prefix}--list--ordered--native`;
        const isNested = parent?.type === 'element' && parent.tagName === 'li';
        if (isNested) {
          className += ` ${prefix}--list--nested`;
        }
        node.properties.className = className;
      }
    });
  };
}
