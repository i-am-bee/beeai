import logging
import os

from opentelemetry import trace
from opentelemetry.sdk.resources import Resource, SERVICE_NAME, SERVICE_VERSION
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import (
    BatchSpanProcessor, SpanExportResult
)
from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter
from mcp.server.fastmcp import FastMCP


class SilentOTLPSpanExporter(OTLPSpanExporter):
    def export(self, spans):
        try:
            return super().export(spans)
        except Exception as e:
            logging.debug(f"OpenTelemetry Exporter failed silently: {e}")
            return SpanExportResult.FAILURE


async def run_agent_provider(server: FastMCP):
    server.settings.port = int(os.getenv("PORT", "8000"))
    trace.set_tracer_provider(
        tracer_provider=TracerProvider(
            resource=Resource(attributes={
                SERVICE_NAME: server.name
            }),
            active_span_processor=BatchSpanProcessor(SilentOTLPSpanExporter())
        )
    )
    with trace.get_tracer('beeai-sdk').start_as_current_span("agent-provider"):
        try:
            await server.run_sse_async()
        except KeyboardInterrupt:
            pass