/**
 * Copyright 2025 © BeeAI a Series of LF Projects, LLC
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

import { PlayFilledAlt } from '@carbon/icons-react';
import { Button } from '@carbon/react';
import { useForm } from 'react-hook-form';

import { LineClampText } from '#components/LineClampText/LineClampText.tsx';

import { InputBar } from '../components/InputBar';
import { useHandsOff } from '../contexts/hands-off';
import classes from './HandsOffInput.module.scss';

export function HandsOffInput() {
  const { onSubmit, input, text, isPending } = useHandsOff();

  const form = useForm<FormValues>({
    mode: 'onChange',
    defaultValues: {},
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = form;

  const isSubmitDisabled = isSubmitting;
  const isPendingOrText = Boolean(isPending || text);

  return (
    <>
      {isPendingOrText ? (
        <h2 className={classes.input}>
          <LineClampText lines={3}>{input?.text}</LineClampText>
        </h2>
      ) : (
        <InputBar
          onSubmit={() => {
            handleSubmit(async ({ input }) => {
              await onSubmit(input);

              reset();
            })();
          }}
          isSubmitDisabled={isSubmitDisabled}
          inputProps={{
            placeholder: 'Write the agent prompt here',
            ...register('input', { required: true }),
          }}
        >
          <Button type="submit" renderIcon={PlayFilledAlt} size="sm" disabled={isSubmitDisabled}>
            Run
          </Button>
        </InputBar>
      )}
    </>
  );
}

export interface FormValues {
  input: string;
}
