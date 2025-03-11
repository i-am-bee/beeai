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
import { style, customStyle } from './theme';
import { registerLanguages } from './languages';
import classes from './SyntaxHighlighter.module.scss';

interface Props {
  language: string;
  children: string;
}

export function SyntaxHighlighter({ language, children }: Props) {
  return (
    <div className={classes.container}>
      <Highlighter style={style} customStyle={customStyle} language={language} wrapLongLines>
        {children}
      </Highlighter>
    </div>
  );
}

registerLanguages(Highlighter);
