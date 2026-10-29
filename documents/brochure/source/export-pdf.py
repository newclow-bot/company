"""Export the committed editable brochure without Codex-specific dependencies."""
import os
from pathlib import Path
import shutil
import subprocess
import tempfile
import zipfile
from pypdf import PdfReader

brochure = Path(__file__).resolve().parent.parent
source = brochure / "퀼브릿지_회사소개_브로슈어_3차.pptx"
output = brochure / ".build" / "github-output"


def main():
    with zipfile.ZipFile(source) as package:
        slides = sum(
            name.startswith("ppt/slides/slide") and name.endswith(".xml")
            and "/_rels/" not in name
            for name in package.namelist()
        )
    if slides != 6:
        raise RuntimeError(f"Expected 6 slides, found {slides}")
    output.parent.mkdir(parents=True, exist_ok=True)
    # Convert in a fresh directory so stale PDFs can never count as success.
    with tempfile.TemporaryDirectory(dir=output.parent) as temporary:
        work = Path(temporary)
        subprocess.run([
            os.environ.get("LIBREOFFICE_BIN", "soffice"),
            f"-env:UserInstallation={(work / 'profile').as_uri()}",
            "--headless", "--convert-to", "pdf:impress_pdf_Export",
            "--outdir", str(work), str(source),
        ], check=True, timeout=120)
        pdf = work / (source.stem + ".pdf")
        reader = PdfReader(pdf)
        if len(reader.pages) != slides:
            raise RuntimeError("PDF page count does not match PPTX")
        if any(not page.extract_text().strip() for page in reader.pages):
            raise RuntimeError("PDF contains a page without extractable text")
        output.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source, output / source.name)
        shutil.copy2(pdf, output / "퀼브릿지_회사소개_브로슈어_메일용_3차.pdf")
    print(f"Validated {slides}-page brochure: {output}")


if __name__ == "__main__":
    main()
