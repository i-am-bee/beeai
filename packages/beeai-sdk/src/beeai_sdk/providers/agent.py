# Copyright 2025 IBM Corp.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import logging
import os

from opentelemetry import trace
from opentelemetry.sdk.resources import Resource, SERVICE_NAME, SERVICE_NAMESPACE
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor, SpanExportResult
from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter
from acp.server.highlevel import Server


class SilentOTLPSpanExporter(OTLPSpanExporter):
    def export(self, spans):
        try:
            return super().export(spans)
        except Exception as e:
            logging.debug(f"OpenTelemetry Exporter failed silently: {e}")
            return SpanExportResult.FAILURE


async def run_agent_provider(server: Server):
    server.settings.host = os.getenv("HOST", "127.0.0.1")
    server.settings.port = int(os.getenv("PORT", "8000"))
    trace.set_tracer_provider(
        tracer_provider=TracerProvider(
            resource=Resource(attributes={SERVICE_NAME: server.name, SERVICE_NAMESPACE: "beeai-agent-provider"}),
            active_span_processor=BatchSpanProcessor(SilentOTLPSpanExporter()),
        )
    )
    with trace.get_tracer("beeai-sdk").start_as_current_span("agent-provider"):
        try:
            await server.run_sse_async(timeout_graceful_shutdown=5)
        except KeyboardInterrupt:
            pass
