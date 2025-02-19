import { CopySnippet } from '@/components/CopySnippet/CopySnippet';
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
      <CopySnippet snippet={command} />

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
  python: {
    command: 'pip install beeai-framework',
    switchToLabel: 'TypeScript',
  },
  typescript: {
    command: 'npm install beeai-framework',
    switchToLabel: 'Python',
  },
};
