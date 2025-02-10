from beeai_cli.async_typer import AsyncTyper


app = AsyncTyper()


@app.command("serve")
async def serve():
    import beeai_server

    beeai_server.serve()
