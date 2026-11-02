"""Export an image-based PDF from reviewed final-slide renders, without LibreOffice.

This preserves the reviewed appearance. Text remains editable in the PPTX, but is
not selectable/searchable in this PDF. Do not present this as a vector conversion.
"""
from pathlib import Path
from PIL import Image
from reportlab.pdfgen import canvas
from pypdf import PdfReader

brochure = Path(__file__).resolve().parent.parent
build = brochure / '.build' / '20261102'
output = brochure / 'output-20261102' / '퀼브릿지_회사소개_메일용_20261102.pdf'
if output.exists():
    raise RuntimeError('기존 PDF를 덮어쓰지 않습니다.')
pdf = canvas.Canvas(str(output), pagesize=(960, 540), pageCompression=1)
pdf.setTitle('퀼브릿지 회사소개 2026-11-02')
pdf.setAuthor('QUALBRIDGE')
pdf.setSubject('회사소개 및 취급품목 안내. 화면 보존용 이미지 PDF, 편집은 PPTX 사용.')
for i in range(1, 7):
    jpeg = build / f'slide-{i}.jpg'
    with Image.open(build / f'slide-{i}.png') as image:
        image.convert('RGB').save(jpeg, quality=94, optimize=True)
    pdf.drawImage(str(jpeg), 0, 0, width=960, height=540)
    if i == 6:
        pdf.linkURL('mailto:qbridge3@naver.com', (500, 220, 850, 255), relative=0)
    pdf.showPage()
pdf.save()
assert len(PdfReader(output).pages) == 6
print(output)
