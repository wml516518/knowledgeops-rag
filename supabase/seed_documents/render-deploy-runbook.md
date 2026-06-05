# Render Deploy Runbook

When a Render deployment fails after a successful build, inspect runtime logs first. Common causes include missing environment variables, an invalid start command, and binding to the wrong port.

Python web services should read the `PORT` environment variable provided by Render. A safe pattern is to start the app from a small Python entrypoint that reads `os.environ.get("PORT", "8000")` and passes it to Uvicorn.

For FastAPI services, verify the health check path returns a 200 response. If the service is on the free plan, remember that cold starts can delay the first request.
