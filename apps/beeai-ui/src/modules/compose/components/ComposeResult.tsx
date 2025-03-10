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

import { MarkdownContent } from '#components/MarkdownContent/MarkdownContent.tsx';
import { Container } from '#components/layouts/Container.tsx';
import { NewTab } from '@carbon/icons-react';
import { Button } from '@carbon/react';
import { useEffect, useRef } from 'react';
import { useCompose } from '../contexts';
import classes from './ComposeResult.module.scss';

export function ComposeResult() {
  const { result, onReset } = useCompose();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [result]);

  return (
    <div className={classes.root} ref={containerRef}>
      <Container>
        <div className={classes.resultHeader}>
          <div>
            <Button renderIcon={NewTab} size="md" kind="tertiary" onClick={() => onReset()}>
              New test
            </Button>
          </div>
        </div>

        <div className={classes.result}>
          <MarkdownContent>{result}</MarkdownContent>
        </div>
      </Container>
    </div>
  );
}
