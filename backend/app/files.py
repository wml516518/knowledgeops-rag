from io import BytesIO
from pathlib import Path

from pypdf import PdfReader


SUPPORTED_EXTENSIONS = {"pdf", "txt", "md", "markdown"}


def validate_upload_name(file_name: str) -> str:
    extension = Path(file_name).suffix.lower().lstrip(".")
    if extension not in SUPPORTED_EXTENSIONS:
        raise ValueError("Unsupported file type. Upload PDF, TXT, or Markdown.")
    return extension


def extract_text(file_name: str, content: bytes) -> str:
    extension = validate_upload_name(file_name)
    if extension == "pdf":
        reader = PdfReader(BytesIO(content))
        return "\n".join(page.extract_text() or "" for page in reader.pages).strip()
    return content.decode("utf-8", errors="ignore").strip()
