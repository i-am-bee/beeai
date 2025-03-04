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

import { Light as Highlighter } from 'react-syntax-highlighter';
import bash from 'react-syntax-highlighter/dist/esm/languages/hljs/bash';
import shell from 'react-syntax-highlighter/dist/esm/languages/hljs/shell';
import json from 'react-syntax-highlighter/dist/esm/languages/hljs/json';
import yaml from 'react-syntax-highlighter/dist/esm/languages/hljs/yaml';
import javascript from 'react-syntax-highlighter/dist/esm/languages/hljs/javascript';
import typescript from 'react-syntax-highlighter/dist/esm/languages/hljs/typescript';
import python from 'react-syntax-highlighter/dist/esm/languages/hljs/python';
import { style, customStyle } from './theme';

interface Props {
  language: string;
  children: string;
}

export function SyntaxHighlighter({ language, children }: Props) {
  return (
    <Highlighter style={style} customStyle={customStyle} language={language} wrapLongLines>
      {children}
    </Highlighter>
  );
}

Highlighter.registerLanguage('bash', bash);
Highlighter.registerLanguage('shell', shell);
Highlighter.registerLanguage('json', json);
Highlighter.registerLanguage('yaml', yaml);
Highlighter.registerLanguage('javascript', javascript);
Highlighter.registerLanguage('typescript', typescript);
Highlighter.registerLanguage('python', python);
