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
import { AcpServer } from "@i-am-bee/acp-sdk/server/acp.js";
import { SSEServerTransport } from "@i-am-bee/acp-sdk/server/sse.js";
import { Implementation } from "@i-am-bee/acp-sdk/types.js";
import { NodeSDK, resources } from "@opentelemetry/sdk-node";
import {
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_VERSION,
} from "@opentelemetry/semantic-conventions";

export async function runAgentProvider(
  server: AcpServer,
  opentelemetrySdk?: NodeSDK,
): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { name, version } = (server.server as any)
    ._serverInfo as Implementation;
  const sdk =
    opentelemetrySdk ??
    new NodeSDK({
      resource: new resources.Resource({
        [ATTR_SERVICE_NAME]: name,
        [ATTR_SERVICE_VERSION]: version,
      }),
    });
  sdk.start();
  try {
    const app = express();

    let connected = false;
    app.get("/sse", async (req, res) => {
      if (connected) {
        res
          .status(400)
          .send("Multiple connections at a time are not permitted");
        return;
      }
      connected = true;
      res.on("close", () => {
        connected = false;
      });

      const transport = new SSEServerTransport("/messages", res);
      app.post("/messages", async (req, res) => {
        await transport.handlePostMessage(req, res);
      });
      await server.connect(transport);
    });

    const port = parseInt(process.env.PORT ?? "8000");

    await new Promise<void>((resolve, reject) => {
      const server = app.listen(port, () => {
        console.log(`Server is running on port ${port}`);
      });

      server.on("error", (err) => {
        reject(err);
      });

      const shutdownHandler = () => {
        server.close(() => {
          process.removeListener("SIGINT", shutdownHandler);
          resolve();
        });
      };

      process.on("SIGINT", shutdownHandler);
    });
  } finally {
    await sdk.shutdown().catch(() => {});
  }
}
