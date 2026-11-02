import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';

async function main() {
  const sourceDir = path.dirname(fileURLToPath(import.meta.url));
  const brochureDir = path.resolve(sourceDir, '..');
  const workspaceDir = path.resolve(brochureDir, '../..');
  const buildDir = path.join(brochureDir, '.build', '20261102');
  const sourcePath = path.join(brochureDir, '퀼브릿지_회사소개_브로슈어_3차.pptx');
  const outputDir = path.join(brochureDir, 'output-20261102');
  const finalPath = path.join(outputDir, '퀼브릿지_회사소개_20261102.pptx');
  const skillDir = process.env.PRESENTATIONS_SKILL_DIR;
  if (!skillDir || !process.env.ARTIFACT_TOOL_MODULE || !process.env.BROCHURE_PYTHON) throw new Error('PRESENTATIONS_SKILL_DIR, ARTIFACT_TOOL_MODULE, BROCHURE_PYTHON을 설정하세요.');
  try { await fs.access(finalPath); throw new Error('기존 결과가 있습니다. 덮어쓰지 않습니다.'); } catch (e) { if (e.code !== 'ENOENT') throw e; }
  const { FileBlob, PresentationFile } = await import(pathToFileURL(process.env.ARTIFACT_TOOL_MODULE));
  const p = await PresentationFile.importPptx(await FileBlob.load(sourcePath));
  await fs.mkdir(buildDir, { recursive: true });
  await fs.mkdir(outputDir, { recursive: true });
  const replace = (slide, before, after) => {
    const shape = slide.shapes.items.find(s => String(s.text) === before);
    if (!shape) throw new Error(`대상 문구 없음: ${before}`);
    shape.text.replace(before, after);
    return shape;
  };
  replace(p.slides.items[1], '요청 사양에 맞는 제품을 확인하고, 검증된 품목을 공급합니다.', '요청 사양과 제품 정보를 확인하고, 합의한 품목을 공급합니다.');
  replace(p.slides.items[2], '브랜드 및 사양은 견적 과정에서 공급 가능 여부를 확인합니다.', '브랜드명은 품목 식별을 위한 예시이며, 공급 가능 여부는 견적에서 확인합니다.');
  replace(p.slides.items[3], '여러 품목을 한 번에 문의하는 경우 엑셀 품목표를 보내 주시면 검토와 견적 작성에 도움이 됩니다.', '여러 품목은 엑셀 품목표로 정리해 회사 메일로 보내주세요. 회사명과 희망 납기를 함께 알려주시면 검토에 도움이 됩니다.');
  const contact = p.slides.items[5];
  replace(contact, '운영시간', '전화 / 팩스');
  replace(contact, '평일 09:00–18:00', '010-7757-2096 / 0504-332-2096');
  replace(contact, '대표자', '대표 / 운영');
  replace(contact, '김건희', '김건희 / 평일 09:00–18:00');
  const note = replace(contact, '회사 전화번호와 팩스번호는 추후 반영 예정입니다.', '도면·사진·품목표는 회사명과 문의 품목을 적어 이메일로 보내주세요.');
  note.text.style = { fontSize: 13, typeface: 'Noto Sans KR', color: '#65707A' };
  const candidatePath = path.join(buildDir, 'candidate.pptx');
  await (await PresentationFile.exportPptx(p)).save(candidatePath);
  const { finalizePresentation } = await import(pathToFileURL(path.join(skillDir, 'container_tools/artifact_tool_utils.mjs')));
  await finalizePresentation({
    explicitTotalSlideCount: 6, requiredNativeTableOwnerSlides: [], requiredNativeChartOwnerSlides: [],
    workspaceDir, candidatePath, finalPath, pythonExecutable: process.env.BROCHURE_PYTHON,
    integrityValidatorPath: path.join(skillDir, 'container_tools/inspect_presentation_package_integrity.py'),
    layoutValidatorPath: path.join(skillDir, 'container_tools/inspect_presentation_layout_geometry.py'),
    layoutArgs: ['--expected-slide-size-emu', '12192000,6858000', '--validate-bullet-geometry', '--validate-heading-fit'],
    fontPolicy: { basis: 'reference', families: ['Noto Sans KR'], scriptFonts: { ea: 'Noto Sans KR' }, referencePath: sourcePath, referenceSha256: createHash('sha256').update(await fs.readFile(sourcePath)).digest('hex') },
    verifyArtifactToolImport: true, receiptPath: path.join(buildDir, 'validation.json')
  });
  // Render the finalized file, not the in-memory draft.
  const final = await PresentationFile.importPptx(await FileBlob.load(finalPath));
  for (let i = 0; i < final.slides.items.length; i++) {
    const slide = final.slides.items[i];
    // PDF export is a separate step so a renderer issue cannot invalidate PPTX.
    for (const format of ['png']) {
      const blob = await slide.export({ format, scale: 1.5 });
      await fs.writeFile(path.join(buildDir, `slide-${i + 1}.${format}`), new Uint8Array(await blob.arrayBuffer()));
    }
  }
  console.log(JSON.stringify({ finalPath, buildDir, slides: final.slides.items.length }));
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
