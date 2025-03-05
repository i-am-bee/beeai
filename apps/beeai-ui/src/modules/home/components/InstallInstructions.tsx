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

import { CopySnippet } from '#components/CopySnippet/CopySnippet.tsx';
import { useCallback, useMemo, useState } from 'react';
import classes from './InstallInstructions.module.scss';

export function InstallInstructions() {
  const [language, setLanguage] = useState<Language>(Language.Python);

  const { switchToLabel, command } = useMemo(() => COMMANDS[language], [language]);

  const switchLanguage = useCallback(
    () => setLanguage(language === Language.Python ? Language.TypeScript : Language.Python),
    [language],
  );

  return (
    <div className={classes.root}>
      <CopySnippet>{command}</CopySnippet>

      <button type="button" onClick={switchLanguage} className={classes.button}>
        Or get started with {switchToLabel}
      </button>
    </div>
  );
}

enum Language {
  Python = 'python',
  TypeScript = 'typescript',
}

const COMMANDS = {
  [Language.Python]: {
    command: 'pip install beeai-framework',
    switchToLabel: 'TypeScript',
  },
  [Language.TypeScript]: {
    command: 'npm install beeai-framework',
    switchToLabel: 'Python',
  },
};
