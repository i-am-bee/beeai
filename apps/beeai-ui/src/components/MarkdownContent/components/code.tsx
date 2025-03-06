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

import type { Components } from 'react-markdown';
import { isString } from 'lodash';
import { CopySnippet } from '#components/CopySnippet/CopySnippet.tsx';
import { SyntaxHighlighter } from '#components/SyntaxHighlighter/SyntaxHighlighter.tsx';

export const code: Components['code'] = ({ className = '', children }) => {
  const language = getLanguage(className);
  if (!language) {
    return <code className={className}>{children}</code>;
  }

  if (!isString(children)) {
    return null;
  }

  return (
    <CopySnippet>
      <SyntaxHighlighter language={language}>{children}</SyntaxHighlighter>
    </CopySnippet>
  );
};

function getLanguage(className: string): string | undefined {
  return /language-(\w+)/.exec(className)?.[1];
}
