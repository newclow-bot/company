from pathlib import Path
from PIL import Image
from reportlab.pdfgen import canvas
from pypdf import PdfReader
import pypdfium2 as pdfium
root=Path('documents/brochure')
build=root/'.build'/'20261106'
out=root/'output-20261106'/'퀼브릿지_회사소개_20261106.pdf'
c=canvas.Canvas(str(out),pagesize=(960,540),pageCompression=1)
c.setTitle('QUALBRIDGE 회사소개 2026-11-06')
c.setAuthor('QUALBRIDGE')
for i in range(1,9):
    jpg=build/f'final-{i}.jpg'
    with Image.open(build/f'final-{i}.png') as im: im.convert('RGB').save(jpg,quality=94,optimize=True)
    c.drawImage(str(jpg),0,0,width=960,height=540)
    if i==8:c.linkURL('https://qualbridge.newclow.chatgpt.site/',(410,25,880,55),relative=0)
    c.showPage()
c.save()
assert len(PdfReader(out).pages)==8
pdf=pdfium.PdfDocument(str(out))
for i,page in enumerate(pdf):page.render(scale=1.25).to_pil().save(build/f'pdf-{i+1}.png')
print(out, out.stat().st_size)
