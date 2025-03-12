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
import { useFormState } from 'react-hook-form';
import { Button, IconButton } from '@carbon/react';
import { ArrowLeft, PlayFilledAlt, StopOutlineFilled } from '@carbon/icons-react';
import { useCompose } from '../contexts';
import { ComposeStepListItem } from '../components/ComposeStepListItem';
import clsx from 'clsx';
import NewSession from '#modules/run/components/NewSession.svg';
import { routes } from '#utils/router.ts';
import { TransitionLink } from '#components/TransitionLink/TransitionLink.tsx';

export function SequentialSetup() {
  const {
    onCancel,
    onSubmit,
    onReset,
    result,
    status,
    stepsFields: { append, fields },
  } = useCompose();

  const { isValid } = useFormState<SequentialFormValues>();

  const isPending = status === 'pending';

  return (
    <form
      className={clsx(classes.form, { [classes.toLeft]: Boolean(result) })}
      onSubmit={(e) => {
        e.preventDefault();
        if (!isValid) return;

        onSubmit();
      }}
    >
      <div className={classes.content}>
        <Container size="sm">
          <div className={classes.header}>
            {result ? (
              <>
                <h1>Sequential workflow</h1>
                <IconButton kind="tertiary" size="sm" label="New session" onClick={() => onReset()}>
                  <NewSession />
                </IconButton>
              </>
            ) : (
              <h1>
                Compose playground <VersionTag>alpha</VersionTag>
              </h1>
            )}
          </div>

          <h2 className={classes.label}>Sequence</h2>
          <div className={classes.agents}>
            {fields.map((field, idx) => (
              <ComposeStepListItem key={field.id} idx={idx} />
            ))}

            {status === 'ready' && (
              <AddAgentButton
                isDisabled={isPending}
                onSelectAgent={(agent: Agent) => {
                  append({ data: agent, instruction: '' });
                }}
              />
            )}
          </div>
        </Container>
      </div>
      <div className={classes.actionBar}>
        <Container size="sm">
          <TransitionLink to={routes.compose()} asChild>
            <Button kind="ghost" size="md" className={classes.backButton} href={routes.compose()}>
              <ArrowLeft /> Back to patterns
            </Button>
          </TransitionLink>

          {status !== 'finished' &&
            (!isPending ? (
              <Button
                type="submit"
                renderIcon={PlayFilledAlt}
                kind="primary"
                size="md"
                iconDescription="Send"
                disabled={isPending || !isValid || !fields.length}
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
                Stop
              </Button>
            ))}
        </Container>
      </div>
    </form>
  );
}
