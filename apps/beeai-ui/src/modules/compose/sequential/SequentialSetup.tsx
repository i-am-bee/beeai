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

import { Container } from '#components/layouts/Container.tsx';
import { VersionTag } from '#components/VersionTag/VersionTag.tsx';
import { Agent } from '#modules/agents/api/types.ts';
import { AddAgentButton } from '../components/AddAgentButton';
import classes from './SequentialSetup.module.scss';
import { SequentialFormValues } from '../contexts/compose-context';
import { useFieldArray, useFormState } from 'react-hook-form';
import { Button } from '@carbon/react';
import { PlayFilledAlt, StopOutlineFilled } from '@carbon/icons-react';
import { useCompose } from '../contexts';
import { ComposeStepListItem } from '../components/ComposeStepListItem';

export function SequentialSetup() {
  const { onCancel, onSubmit } = useCompose();

  const { isSubmitting, isValid } = useFormState<SequentialFormValues>();
  const { append, fields } = useFieldArray<SequentialFormValues>({
    name: 'steps',
  });

  console.log({ isSubmitting });

  return (
    <div className={classes.root}>
      <Container size="sm">
        <form
          className={classes.form}
          onSubmit={(e) => {
            e.preventDefault();
            if (!isValid) return;

            onSubmit();
          }}
        >
          <h1>
            Compose playground <VersionTag>alpha</VersionTag>
          </h1>

          <div className={classes.agents}>
            {fields.map((field, idx) => (
              <ComposeStepListItem agent={field} key={field.id} idx={idx} />
            ))}

            <AddAgentButton
              isDisabled={isSubmitting}
              onSelectAgent={(agent: Agent) => {
                append({ data: agent, instruction: '' });
              }}
            />
          </div>

          <div className={classes.buttons}>
            {!isSubmitting ? (
              <Button
                type="submit"
                renderIcon={PlayFilledAlt}
                kind="primary"
                size="md"
                iconDescription="Send"
                disabled={isSubmitting || !isValid}
              >
                Run
              </Button>
            ) : (
              <Button
                renderIcon={StopOutlineFilled}
                kind="tertiary"
                size="md"
                iconDescription="Cancel"
                onClick={(e) => {
                  onCancel();
                  e.preventDefault();
                }}
              >
                Running&hellip;
              </Button>
            )}
          </div>
        </form>
      </Container>
    </div>
  );
}
