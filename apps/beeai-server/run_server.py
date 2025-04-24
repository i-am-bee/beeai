#!/usr/bin/env python3

import asyncio
import logging
import uvicorn
from beeai_server.bootstrap import bootstrap_dependencies_sync
# from beeai_server.configuration import get_configuration

async def run_server():
    logging.basicConfig(level=logging.INFO)
    logger = logging.getLogger(__name__)
    
    bootstrap_dependencies_sync()
    
    # TODO: Configuration seems to be unused here - do we want to use it?
    # config = get_configuration()
    port = 8336  
    
    logger.info(f"Starting server on port {port}...")
    uvicorn_config = uvicorn.Config(
        "beeai_server.application:app", 
        host="0.0.0.0", 
        port=port,
        reload=True,
        log_level="info",
    )
    server = uvicorn.Server(uvicorn_config)
    await server.serve()

if __name__ == "__main__":
    asyncio.run(run_server()) 
