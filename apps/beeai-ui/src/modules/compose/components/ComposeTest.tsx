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

import { TextAreaAutoHeight } from '#components/TextAreaAutoHeight/TextAreaAutoHeight.tsx';
import { useForm } from 'react-hook-form';
import { submitFormOnEnter } from '#utils/formUtils.ts';
import classes from './ComposeTest.module.scss';
import { Button } from '@carbon/react';
import { ArrowRight, NewTab, StopOutlineFilled } from '@carbon/icons-react';
import { useEffect, useRef } from 'react';
import { useCompose } from '../contexts';
import { MarkdownContent } from '#components/MarkdownContent/MarkdownContent.tsx';
import { Container } from '#components/layouts/Container.tsx';

export function ComposeTest() {
  const { result, onSubmit, onCancel, onReset, isPending } = useCompose();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [result]);

  const {
    register,
    handleSubmit,
    watch,
    formState: { isSubmitting, isValid },
  } = useForm<FormValues>({
    mode: 'onChange',
  });

  const input = watch('input');

  return (
    <div className={classes.root} ref={containerRef}>
      <Container>
        {!result ? (
          <>
            <h2>Test</h2>
            <form
              className={classes.form}
              onSubmit={(e) => {
                e.preventDefault();
                if (!isValid) return;

                handleSubmit(async ({ input }) => {
                  await onSubmit(input);
                })();
              }}
            >
              <TextAreaAutoHeight
                className={classes.textarea}
                rows={4}
                placeholder="What is your research task?"
                disabled={isPending}
                {...register('input', {
                  required: true,
                })}
                onKeyDown={(e) => submitFormOnEnter(e)}
              />

              <div className={classes.buttons}>
                {!isSubmitting ? (
                  <Button
                    type="submit"
                    renderIcon={ArrowRight}
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
          </>
        ) : (
          <div className={classes.resultHeader}>
            <h2>
              Input: <strong>{input}</strong>
            </h2>
            <div>
              <Button renderIcon={NewTab} size="md" kind="tertiary" onClick={() => onReset()}>
                New test
              </Button>
            </div>
          </div>
        )}

        <div className={classes.result}>
          <MarkdownContent>{result}</MarkdownContent>
        </div>
      </Container>
    </div>
  );
}

interface FormValues {
  input: string;
}
