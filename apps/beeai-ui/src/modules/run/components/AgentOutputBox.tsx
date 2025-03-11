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
import { CopyButton } from '@carbon/react';
import classes from './AgentOutputBox.module.scss';
import { DownloadButton } from '#components/DownloadButton/DownloadButton.tsx';

interface Props {
  text?: string;
  downloadFileName?: string;
  isPending: boolean;
}

export function AgentOutputBox({ text, downloadFileName, isPending }: Props) {
  return text ? (
    <div className={classes.root}>
      {!isPending && (
        <div className={classes.actions}>
          <CopyButton kind="ghost" align="left" onClick={() => navigator.clipboard.writeText(text)} />

          <DownloadButton filename={`${downloadFileName ?? 'output'}.txt`} content={text} />
        </div>
      )}

      <MarkdownContent>{text}</MarkdownContent>
    </div>
  ) : null;
}
