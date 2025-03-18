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

import express from "express";
import { AcpServer } from "@i-am-bee/acp-sdk/server/acp";
import { SSEServerTransport } from "@i-am-bee/acp-sdk/server/sse";
import { Implementation } from "@i-am-bee/acp-sdk/types";
import { NodeSDK, resources } from "@opentelemetry/sdk-node";
import { trace, SpanStatusCode } from "@opentelemetry/api";
import {
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_VERSION,
} from "@opentelemetry/semantic-conventions";
import stoppable from "stoppable";

const ATTR_SERVICE_NAMESPACE = "service.namespace";

export async function runAgentProvider(
  acpServer: AcpServer,
  opentelemetrySdk?: NodeSDK,
): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { name, version } = (acpServer.server as any)
    ._serverInfo as Implementation;
  const sdk =
    opentelemetrySdk ??
    new NodeSDK({
      resource: new resources.Resource({
        [ATTR_SERVICE_NAMESPACE]: "beeai-agent-provider",
        [ATTR_SERVICE_NAME]: name,
        [ATTR_SERVICE_VERSION]: version,
      }),
    });
  sdk.start();
  try {
    await trace
      .getTracer("beeai-sdk")
      .startActiveSpan("agent-provider", async (span) => {
        try {
          const app = express();

          let clientConnected = false;

          app.get("/sse", async (req, res) => {
            if (clientConnected) {
              res
                .status(400)
                .send("Multiple connections at a time are not permitted");
              return;
            }
            clientConnected = true;
            console.log("Client connected");

            res.on("close", () => {
              clientConnected = false;
              console.log("Client disconnected");
            });

            const transport = new SSEServerTransport("/messages", res);
            await acpServer.connect(transport);
          });

          app.post("/messages", async (req, res) => {
            const transport = acpServer.server.transport as SSEServerTransport;
            if (!transport) {
              res.status(404).send("Session not found");
              return;
            }
            await transport.handlePostMessage(req, res);
          });

          const port = parseInt(process.env.PORT ?? "8000");
          const host = process.env.HOST ?? "127.0.0.1";

          await new Promise<void>((resolve, reject) => {
            const server = app.listen(port, host, () => {
              console.log(`Server is running on ${host}:${port}`);
            });

            server.on("error", (err) => {
              reject(err);
            });

            const shutdownHandler = () => {
              process.removeListener("SIGINT", shutdownHandler);
              stoppable(server, 5_000).stop((err) => {
                if (err) reject(err);
                else resolve();
              });
            };

            process.on("SIGINT", shutdownHandler);
          });
        } catch (err) {
          span.setStatus({
            code: SpanStatusCode.ERROR,
            message: err instanceof Error ? err.message : undefined,
          });
          throw err;
        } finally {
          span.end();
        }
      });
  } finally {
    await sdk.shutdown().catch(() => {});
  }
}
