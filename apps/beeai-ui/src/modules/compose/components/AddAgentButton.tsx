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

import { Button } from '@carbon/react';
import classes from './AddAgentButton.module.scss';
import { useAgents } from '#modules/agents/contexts/index.ts';
import { RefObject, useId, useMemo, useRef, useState } from 'react';
import { AgentListOption } from './AgentListOption';
import { useOnClickOutside } from 'usehooks-ts';
import { useCompose } from '../contexts';
import { messageInputSchema } from '@i-am-bee/beeai-sdk/schemas/message';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { promptInputSchema, promptOutputSchema } from '@i-am-bee/beeai-sdk/schemas/prompt';
import { ExtendedJSONSchema } from 'json-schema-to-ts';

export function AddAgentButton() {
  const id = useId();
  const [expanded, setExpanded] = useState(false);

  const selectorRef = useRef<HTMLDivElement>(null);
  useOnClickOutside(selectorRef as RefObject<HTMLElement>, () => {
    setExpanded(false);
  });

  const { setAgents } = useCompose();
  const {
    agentsQuery: { data, isPending },
  } = useAgents();

  const availableAgents = useMemo(
    () =>
      data?.filter(
        (agent) =>
          (validateSchema(agent.inputSchema as JSONSchema, messageInputJsonSchema as JSONSchema) &&
            validateSchema(agent.outputSchema as JSONSchema, messageOutputJsonSchema as JSONSchema)) ||
          (validateSchema(agent.inputSchema as JSONSchema, promptInputJsonSchema as JSONSchema) &&
            validateSchema(agent.outputSchema as JSONSchema, promptOutputJsonSchema as JSONSchema)),
      ),
    [data],
  );

  return (
    <div className={classes.root} ref={selectorRef}>
      <Button
        kind="tertiary"
        size="md"
        className={classes.button}
        aria-haspopup="listbox"
        aria-controls={`${id}:options`}
        onClick={() => setExpanded(!expanded)}
      >
        Add an agent
      </Button>
      <ul className={classes.list} role="listbox" tabIndex={0} id={`${id}:options`} aria-expanded={expanded}>
        {!isPending
          ? availableAgents?.map((agent) => (
              <AgentListOption
                agent={agent}
                key={agent.name}
                onClick={() => {
                  setAgents((agents) => [...agents, { data: agent }]);
                  setExpanded(false);
                }}
              />
            ))
          : Array.from({ length: AGENTS_SKELETON_COUNT }, (_, idx) => <AgentListOption.Skeleton key={idx} />)}
      </ul>
    </div>
  );
}

const AGENTS_SKELETON_COUNT = 4;

const messageInputJsonSchema = zodToJsonSchema(messageInputSchema);
const messageOutputJsonSchema = zodToJsonSchema(messageInputSchema);
const promptInputJsonSchema = zodToJsonSchema(promptInputSchema);
const promptOutputJsonSchema = zodToJsonSchema(promptOutputSchema);

type JSONSchema = Exclude<ExtendedJSONSchema, boolean>;

function validateSchema(schema: JSONSchema, targetSchema: JSONSchema): boolean {
  if (!schema.required || !targetSchema.required || !targetSchema.properties || !schema.properties) {
    return false;
  }

  const missingRequired = targetSchema.required.some((key: string) => !schema.required?.includes(key));
  if (missingRequired) return false;

  targetSchema.required?.forEach((key) => {
    const targetValue = targetSchema.properties?.[key];
    const value = schema.properties?.[key];

    if (!value || !targetValue || typeof targetValue === 'boolean' || typeof value === 'boolean') {
      return false;
    }

    if (targetValue.type === 'object') {
      if (!validateSchema(targetValue, schema)) {
        return false;
      }
    } else {
      if (value.type !== targetValue.type) {
        return false;
      }
    }
  });

  return true;
}
