import pytest

from app.files import validate_upload_name


def test_validate_upload_name_accepts_supported_extensions():
    assert validate_upload_name("guide.pdf") == "pdf"
    assert validate_upload_name("notes.txt") == "txt"
    assert validate_upload_name("runbook.md") == "md"
    assert validate_upload_name("manual.markdown") == "markdown"


def test_validate_upload_name_rejects_unsupported_extensions():
    with pytest.raises(ValueError, match="Unsupported file type"):
        validate_upload_name("archive.zip")
