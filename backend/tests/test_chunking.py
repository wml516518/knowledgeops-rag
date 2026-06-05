from app.chunking import chunk_text


def test_chunk_text_removes_blank_chunks():
    chunks = chunk_text("First paragraph.\n\n\nSecond paragraph.", max_chars=80, overlap=10)

    assert chunks == ["First paragraph.\nSecond paragraph."]


def test_chunk_text_splits_long_text_with_overlap():
    text = "A" * 120 + "B" * 120

    chunks = chunk_text(text, max_chars=100, overlap=20)

    assert len(chunks) == 3
    assert chunks[0] == "A" * 100
    assert chunks[1].startswith("A" * 20)
    assert chunks[2].endswith("B" * 80)
