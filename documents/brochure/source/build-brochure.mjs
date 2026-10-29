import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { execFileSync } from "node:child_process";

const sourceDir = path.dirname(fileURLToPath(import.meta.url));
const brochureDir = path.resolve(sourceDir, "..");
const workspaceDir = path.resolve(brochureDir, "../..");
const assetsDir = path.join(sourceDir, "assets");
const buildDir = path.join(brochureDir, ".build");
// Keep generated files separate from the reviewed, committed deliverables.
const deliverablesDir = path.join(buildDir, "output");
const skillDir = process.env.PRESENTATIONS_SKILL_DIR;
const runtimePython = process.env.BROCHURE_PYTHON || "python";
const soffice = process.env.LIBREOFFICE_BIN || "soffice";
const finalPptx = path.join(deliverablesDir, "퀼브릿지_회사소개_브로슈어_3차.pptx");
const finalPdf = path.join(deliverablesDir, "퀼브릿지_회사소개_브로슈어_메일용_3차.pdf");

if (!skillDir) throw new Error("PRESENTATIONS_SKILL_DIR에 presentations 스킬 폴더를 지정하세요. README의 재제작 방법을 참고하세요.");
await fs.access(path.join(skillDir, "container_tools/artifact_tool_utils.mjs"));
for (const name of ["qualbridge-logo.png", "qualbridge-logo-transparent.png", "qualbridge-industrial-hero.png", "valves-fittings.png", "mro-supplies.png"]) {
  await fs.access(path.join(assetsDir, name));
}
execFileSync(runtimePython, ["--version"], { stdio: "pipe" });
execFileSync(soffice, ["--version"], { stdio: "pipe" });
const artifactModule = process.env.ARTIFACT_TOOL_MODULE;
const { Presentation, PresentationFile } = await import(
  artifactModule ? pathToFileURL(path.resolve(artifactModule)).href : "@oai/artifact-tool"
);
if (process.argv.includes("--check")) {
  console.log("브로슈어 경로, 이미지, Python, LibreOffice, 제작 모듈 확인 완료");
  process.exit(0);
}
try {
  await fs.access(finalPptx);
  throw new Error(`기존 생성 결과가 있습니다. 검토 후 이동하거나 삭제하세요: ${deliverablesDir}`);
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}
const fontFamily = "Noto Sans KR";

const C = {
  navy: "071727",
  navy2: "0C2237",
  ink: "14202B",
  muted: "65707A",
  gold: "B28B4C",
  goldLight: "D0B175",
  cream: "F4F0E7",
  paper: "FBFAF6",
  line: "D8D2C6",
  white: "FFFFFF",
};

const presentation = Presentation.create({ slideSize: { width: 1280, height: 720 } });

async function imageBytes(fileName) {
  const data = await fs.readFile(path.join(assetsDir, fileName));
  return data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
}

function textBox(slide, text, left, top, width, height, options = {}) {
  const box = slide.shapes.add({
    geometry: "textbox",
    position: { left, top, width, height },
    fill: "none",
    line: { style: "solid", fill: "none", width: 0 },
  });
  box.text = text;
  box.text.style = {
    typeface: fontFamily,
    fontSize: options.fontSize ?? 20,
    bold: options.bold ?? false,
    color: options.color ?? C.ink,
    alignment: options.alignment ?? "left",
    verticalAlignment: options.verticalAlignment ?? "top",
  };
  return box;
}

function rect(slide, left, top, width, height, fill, line = fill) {
  return slide.shapes.add({
    geometry: "rect",
    position: { left, top, width, height },
    fill,
    line: { style: "solid", fill: line, width: 0 },
  });
}

function eyebrow(slide, text, left, top, color = C.gold) {
  return textBox(slide, text, left, top, 420, 24, { fontSize: 12, bold: true, color });
}

function footer(slide, page, dark = false) {
  const color = dark ? "99A5AF" : C.muted;
  textBox(slide, "QUALBRIDGE", 64, 679, 180, 20, { fontSize: 10, bold: true, color });
  textBox(slide, String(page).padStart(2, "0"), 1170, 679, 46, 20, { fontSize: 10, bold: true, color, alignment: "right" });
}

function bullets(slide, items, left, top, width, color = C.ink, gap = 44) {
  items.forEach((item, index) => {
    rect(slide, left, top + index * gap + 9, 5, 5, C.gold);
    textBox(slide, item, left + 18, top + index * gap, width - 18, 38, { fontSize: 17, color });
  });
}

// 1. Cover
{
  const slide = presentation.slides.add();
  slide.background.fill = C.navy;
  slide.images.add({
    blob: await imageBytes("qualbridge-industrial-hero.png"),
    contentType: "image/png",
    alt: "브랜드 표시가 없는 산업용 밸브와 피팅 이미지",
    fit: "cover",
    position: { left: 0, top: 0, width: 1280, height: 720 },
  });
  rect(slide, 0, 0, 720, 720, "071727E8");
  rect(slide, 0, 0, 1280, 6, C.gold);
  slide.images.add({
    blob: await imageBytes("qualbridge-logo-transparent.png"),
    contentType: "image/png",
    alt: "퀼브릿지 골드 로고",
    fit: "contain",
    position: { left: 60, top: 38, width: 154, height: 116 },
  });
  textBox(slide, "QUALBRIDGE", 232, 53, 300, 40, { fontSize: 24, bold: true, color: C.white });
  rect(slide, 232, 98, 110, 2, C.gold);
  textBox(slide, "Bridging Quality to the World", 232, 110, 310, 24, { fontSize: 13, bold: true, color: C.goldLight });
  textBox(slide, "회사소개 브로슈어", 232, 139, 250, 24, { fontSize: 14, bold: true, color: "C4CDD5" });
  eyebrow(slide, "QUALITY  RESPONSIBILITY  TRUST", 64, 244, C.goldLight);
  textBox(slide, "좋은 제품을 연결하고,\n끝까지 책임지는 기업", 64, 284, 620, 164, { fontSize: 49, bold: true, color: C.white });
  textBox(slide, "제조사와 고객을 신뢰로 연결하고, 품질과 납기에 책임지는\n산업용 밸브·피팅 및 기업 자재 전문 공급기업입니다.", 64, 486, 590, 78, { fontSize: 18, color: "D9E0E6" });
  textBox(slide, "2026  ·  QUALBRIDGE COMPANY BROCHURE", 64, 638, 410, 20, { fontSize: 10, color: "9BA8B3" });
}

// 2. About
{
  const slide = presentation.slides.add();
  slide.background.fill = C.paper;
  eyebrow(slide, "ABOUT QUALBRIDGE", 64, 58);
  textBox(slide, "QUALITY와 BRIDGE가 만나는 이름", 64, 94, 720, 70, { fontSize: 40, bold: true, color: C.navy });
  textBox(slide, "QUALBRIDGE = QUALITY + BRIDGE", 64, 184, 620, 36, { fontSize: 20, bold: true, color: C.gold });
  textBox(slide, "좋은 품질의 제품을 고객에게 연결하고, 제조사와 고객 사이의 약속을 끝까지 책임지는 기업이라는 뜻입니다.", 64, 228, 630, 82, { fontSize: 18, color: C.ink });
  slide.images.add({
    blob: await imageBytes("qualbridge-logo-transparent.png"),
    contentType: "image/png",
    alt: "퀼브릿지 로고",
    fit: "contain",
    position: { left: 850, top: 48, width: 320, height: 236 },
  });
  textBox(slide, "Q", 814, 292, 80, 24, { fontSize: 12, bold: true, color: C.gold });
  textBox(slide, "Quality, 퀼브릿지의 정체성", 894, 292, 300, 24, { fontSize: 13, color: C.muted });
  textBox(slide, "다리", 814, 326, 80, 24, { fontSize: 12, bold: true, color: C.gold });
  textBox(slide, "제조사와 고객을 연결하는 역할", 894, 326, 300, 24, { fontSize: 13, color: C.muted });
  textBox(slide, "색상", 814, 360, 80, 24, { fontSize: 12, bold: true, color: C.gold });
  textBox(slide, "골드는 품질과 전문성, 블랙과 화이트는\n신뢰·책임과 투명한 거래를 뜻합니다.", 894, 360, 310, 52, { fontSize: 13, color: C.muted });
  rect(slide, 64, 330, 650, 1, C.line);
  textBox(slide, "퀼브릿지는 산업용 밸브와 피팅, 기업 운영에 필요한 소모성 자재 및 잡자재를 공급합니다. 요청 규격과 수량을 확인하고, 공급 조건과 예상 납기를 안내한 뒤 발주 내용에 맞춰 납품까지 책임 있게 대응합니다.", 64, 362, 650, 132, { fontSize: 18, color: C.ink });
  const principles = [
    ["품질  QUALITY", "요청 사양에 맞는 제품을 확인하고, 검증된 품목을 공급합니다."],
    ["책임  RESPONSIBILITY", "견적과 발주 이후에도 납품 완료까지 책임 있게 대응합니다."],
    ["신뢰  TRUST", "고객과 약속한 공급 조건과 납기 일정을 철저히 관리합니다."],
  ];
  principles.forEach(([title, body], i) => {
    const x = 64 + i * 384;
    rect(slide, x, 528, 340, 2, C.gold);
    textBox(slide, title, x, 550, 340, 28, { fontSize: 16, bold: true, color: C.navy });
    textBox(slide, body, x, 588, 340, 64, { fontSize: 14, color: C.muted });
  });
  footer(slide, 2);
}

// 3. Valves and fittings
{
  const slide = presentation.slides.add();
  slide.background.fill = C.cream;
  slide.images.add({
    blob: await imageBytes("valves-fittings.png"),
    contentType: "image/png",
    alt: "브랜드 표시가 없는 밸브와 피팅 제품 이미지",
    fit: "cover",
    position: { left: 606, top: 0, width: 674, height: 720 },
  });
  rect(slide, 0, 0, 650, 720, C.cream);
  eyebrow(slide, "PRODUCTS 01", 64, 58);
  textBox(slide, "밸브 및 피팅", 64, 95, 500, 65, { fontSize: 44, bold: true, color: C.navy });
  textBox(slide, "배관과 유체 제어에 필요한 피팅 및 각종 산업용 밸브를 문의할 수 있습니다.", 64, 182, 480, 70, { fontSize: 19, color: C.ink });
  bullets(slide, [
    "튜브 피팅 및 연결 부품",
    "글로브밸브·게이트밸브·버터플라이밸브",
    "스팀밸브·오토밸브·매뉴얼밸브",
    "기타 밸브류 및 요청 가공품",
  ], 64, 286, 470, C.ink, 50);
  rect(slide, 64, 518, 460, 1, "C9C0B1");
  textBox(slide, "지정 브랜드 문의", 64, 544, 180, 24, { fontSize: 12, bold: true, color: C.gold });
  textBox(slide, "스웨즈락 · 옥광엔지니어링 · 한양밸브\n스파이렉스사코 · 액츠 등", 64, 578, 470, 58, { fontSize: 16, bold: true, color: C.navy });
  textBox(slide, "브랜드 및 사양은 견적 과정에서 공급 가능 여부를 확인합니다.", 64, 642, 470, 26, { fontSize: 11, color: C.muted });
  footer(slide, 3);
}

// 4. MRO supplies
{
  const slide = presentation.slides.add();
  slide.background.fill = C.paper;
  slide.images.add({
    blob: await imageBytes("mro-supplies.png"),
    contentType: "image/png",
    alt: "브랜드 표시가 없는 기업 소모성 자재 이미지",
    fit: "cover",
    position: { left: 606, top: 0, width: 674, height: 720 },
  });
  rect(slide, 0, 0, 650, 720, C.paper);
  eyebrow(slide, "PRODUCTS 02", 64, 58);
  textBox(slide, "기업 소모성 자재", 64, 95, 500, 65, { fontSize: 44, bold: true, color: C.navy });
  textBox(slide, "구매 부서와 현장에서 반복적으로 필요한 소모품과 잡자재를 품목별로 확인해 공급합니다.", 64, 182, 485, 76, { fontSize: 19, color: C.ink });
  bullets(slide, [
    "A4 용지 및 사무용 소모품",
    "작업복·안전화 등 현장 용품",
    "공구류·건전지 및 유지보수 소모품",
    "목록 외 기업용 잡자재",
  ], 64, 298, 470, C.ink, 50);
  rect(slide, 64, 536, 460, 1, C.line);
  textBox(slide, "여러 품목을 한 번에 문의하는 경우 엑셀 품목표를 보내 주시면 검토와 견적 작성에 도움이 됩니다.", 64, 568, 470, 78, { fontSize: 16, color: C.muted });
  footer(slide, 4);
}

// 5. Process
{
  const slide = presentation.slides.add();
  slide.background.fill = C.navy;
  eyebrow(slide, "ORDER PROCESS", 64, 58, C.goldLight);
  textBox(slide, "견적부터 납품까지", 64, 95, 560, 65, { fontSize: 44, bold: true, color: C.white });
  textBox(slide, "약속한 조건과 납기를 서면으로 확인하고, 납품이 완료될 때까지 과정을 관리합니다.", 64, 174, 760, 48, { fontSize: 18, color: "B7C1CA" });
  const steps = [
    ["01", "견적 의뢰", "품목명, 브랜드, 규격, 수량, 희망 납기와 참고 자료를 전달합니다."],
    ["02", "내용 확인", "공급 가능 여부와 사양, 수량, 요청 조건을 확인합니다."],
    ["03", "견적서 송부", "가격, 공급 조건과 예상 납기를 기재해 보내드립니다."],
    ["04", "발주 확정", "발주서 또는 최종 주문 내용을 기준으로 품목과 일정을 확정합니다."],
    ["05", "준비 및 납품", "품목과 수량을 확인하고 안내한 일정에 맞춰 납품을 진행합니다."],
  ];
  const startX = 64;
  const colW = 230;
  steps.forEach(([no, title, body], i) => {
    const x = startX + i * colW;
    rect(slide, x, 270, colW - 18, 1, "405061");
    textBox(slide, no, x, 292, 50, 24, { fontSize: 12, bold: true, color: C.goldLight });
    textBox(slide, title, x, 352, colW - 30, 34, { fontSize: 20, bold: true, color: C.white });
    textBox(slide, body, x, 408, colW - 30, 122, { fontSize: 15, color: "AEB9C3" });
  });
  rect(slide, 64, 574, 1152, 1, "405061");
  textBox(slide, "견적 요청 시 함께 보내 주세요", 64, 602, 290, 28, { fontSize: 14, bold: true, color: C.goldLight });
  textBox(slide, "제품명 · 제조사 · 모델명 또는 규격 · 수량 · 희망 납기 · 납품 장소 · 도면/사진", 350, 600, 866, 32, { fontSize: 16, color: C.white });
  footer(slide, 5, true);
}

// 6. Contact
{
  const slide = presentation.slides.add();
  slide.background.fill = C.paper;
  rect(slide, 0, 0, 470, 720, C.navy);
  slide.images.add({
    blob: await imageBytes("qualbridge-logo-transparent.png"),
    contentType: "image/png",
    alt: "퀼브릿지 로고",
    fit: "contain",
    position: { left: 64, top: 56, width: 342, height: 252 },
  });
  textBox(slide, "QUALBRIDGE", 64, 340, 342, 44, { fontSize: 28, bold: true, color: C.white, alignment: "center" });
  textBox(slide, "좋은 제품을 연결하고,\n끝까지 책임지는 기업", 64, 404, 340, 58, { fontSize: 16, bold: true, color: C.goldLight, alignment: "center" });
  textBox(slide, "Bridging Quality to the World", 64, 486, 342, 26, { fontSize: 13, color: "B7C1CA", alignment: "center" });
  eyebrow(slide, "REQUEST A QUOTE", 548, 76);
  textBox(slide, "필요한 품목을\n알려주세요", 548, 116, 600, 120, { fontSize: 48, bold: true, color: C.navy });
  textBox(slide, "품목명, 규격, 수량과 희망 납기를 보내 주시면 공급 가능 여부를 확인해 견적드립니다.", 548, 270, 600, 68, { fontSize: 19, color: C.ink });
  const rows = [
    ["이메일", "qbridge3@naver.com"],
    ["운영시간", "평일 09:00–18:00"],
    ["주소", "서울특별시 구로구 경인로54길 4, H동 106호"],
    ["대표자", "김건희"],
  ];
  rows.forEach(([label, value], i) => {
    const y = 382 + i * 58;
    rect(slide, 548, y - 12, 600, 1, C.line);
    textBox(slide, label, 548, y, 110, 28, { fontSize: 13, bold: true, color: C.gold });
    textBox(slide, value, 674, y, 500, 30, { fontSize: 17, bold: true, color: C.navy });
  });
  textBox(slide, "회사 전화번호와 팩스번호는 추후 반영 예정입니다.", 548, 632, 600, 26, { fontSize: 12, color: C.muted });
  footer(slide, 6);
}

await fs.mkdir(buildDir, { recursive: true });
await fs.mkdir(deliverablesDir, { recursive: true });

for (const [index, slide] of presentation.slides.items.entries()) {
  const stem = `slide-${String(index + 1).padStart(2, "0")}`;
  const png = await presentation.export({ slide, format: "png", scale: 1.25 });
  await fs.writeFile(path.join(buildDir, `${stem}.png`), new Uint8Array(await png.arrayBuffer()));
}

const montage = await presentation.export({ format: "webp", montage: true });
await fs.writeFile(path.join(buildDir, "brochure-montage.webp"), new Uint8Array(await montage.arrayBuffer()));

const { finalizePresentation } = await import(pathToFileURL(path.join(skillDir, "container_tools/artifact_tool_utils.mjs")).href);
const stagingDir = path.join(buildDir, "finalizer");
await fs.mkdir(stagingDir, { recursive: true });
const candidatePath = path.join(stagingDir, "candidate.pptx");
await (await PresentationFile.exportPptx(presentation)).save(candidatePath);

await finalizePresentation({
  explicitTotalSlideCount: 6,
  requiredNativeTableOwnerSlides: [],
  requiredNativeChartOwnerSlides: [],
  workspaceDir,
  candidatePath,
  finalPath: finalPptx,
  pythonExecutable: runtimePython,
  integrityValidatorPath: path.join(skillDir, "container_tools/inspect_presentation_package_integrity.py"),
  layoutValidatorPath: path.join(skillDir, "container_tools/inspect_presentation_layout_geometry.py"),
  layoutArgs: [
    "--expected-slide-size-emu", "12192000,6858000",
    "--validate-bullet-geometry",
    "--validate-heading-fit",
  ],
  fontPolicy: { basis: "design", families: [fontFamily], scriptFonts: { ea: fontFamily } },
  verifyArtifactToolImport: true,
  receiptPath: path.join(stagingDir, "qualbridge-brochure-v3.validation.json"),
});

// Convert the validated PPTX, using an isolated LibreOffice profile.
const pdfDir = await fs.mkdtemp(path.join(buildDir, "pdf-"));
execFileSync(soffice, [
  `-env:UserInstallation=${pathToFileURL(path.join(pdfDir, "profile")).href}`,
  "--headless", "--convert-to", "pdf:impress_pdf_Export",
  "--outdir", pdfDir, finalPptx,
], { stdio: "inherit", timeout: 120000 });
const convertedPdf = path.join(pdfDir, path.basename(finalPptx, ".pptx") + ".pdf");
const pdfBytes = await fs.readFile(convertedPdf);
if (pdfBytes.subarray(0, 5).toString() !== "%PDF-") throw new Error("PDF 변환 결과가 올바르지 않습니다.");
await fs.copyFile(convertedPdf, finalPdf);
console.log(JSON.stringify({ finalPptx, finalPdf, slideCount: presentation.slides.items.length, montage: path.join(buildDir, "brochure-montage.webp") }));
