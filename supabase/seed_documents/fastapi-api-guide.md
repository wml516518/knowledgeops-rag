# FastAPI API Guide

FastAPI routers should keep request validation, service orchestration, and persistence separated. Use Pydantic models for request and response contracts.

For file upload endpoints, validate file extension, content type, and file size before parsing. Return clear 400 responses for unsupported formats and oversized files.

For AI endpoints, keep API keys on the backend. The frontend should call only the FastAPI service, never the model provider directly.
