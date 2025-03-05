from aider.io import webbrowser

# disable all attempts to open browser
webbrowser.open = lambda *args, **kwargs: False
