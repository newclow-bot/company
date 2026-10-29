# 퀼브릿지 프로젝트

퀼브릿지(QUALBRIDGE)의 회사 홈페이지와 홍보용 회사소개 브로슈어를 함께 관리하는 저장소입니다.

> 좋은 제품을 연결하고, 끝까지 책임지는 기업.

## 프로젝트 구성

```text
website/
  .openai/hosting.json       Sites 배포 설정
  dist/                      정적 홈페이지 소스

documents/brochure/
  퀼브릿지_회사소개_브로슈어_3차.pptx
  퀼브릿지_회사소개_브로슈어_메일용_3차.pdf
  source/                    브로슈어 제작 소스와 이미지
```

## 홈페이지

- 운영 주소: https://qualbridge.quietegret16.chatgpt.site
- 구성: 메인, 회사소개, 취급품목, 거래절차, 견적문의
- 기술: HTML, CSS, JavaScript 정적 사이트

로컬에서는 `website/dist/index.html`을 열거나 정적 파일 서버로 `website/dist` 폴더를 실행하면 확인할 수 있습니다.

## 브로슈어

- PPTX: 편집용 원본
- PDF: 이메일 첨부 및 배포용
- `source/`: Codex에서 제작·수정할 때 참고하는 스크립트와 이미지 자료

## 보안 안내

이 저장소에는 공개 가능한 홈페이지와 홍보 자료만 보관합니다. 다음 자료는 커밋하지 않습니다.

- 계정 아이디와 비밀번호
- API 키, 토큰, 인증서 및 `.env` 파일
- 통장사본과 사업자등록증
- 고객 정보, 거래 명세 및 기타 개인정보

## 회사 정보

- 회사명: 퀼브릿지 / QUALBRIDGE
- 대표자: 김건희
- 이메일: qbridge3@naver.com
- 전화: 010-7757-2096
- 팩스: 0504-332-2096
- 주소: 서울특별시 구로구 경인로54길 4, H동 106호
- 운영시간: 평일 09:00–18:00

## 브로슈어 재제작

GitHub에서 저장소를 내려받은 위치와 관계없이 스크립트 파일 위치를 기준으로 실행합니다.
이미지는 `documents/brochure/source/assets/`에서 읽습니다.

### GitHub에서 PDF 만들기 (권장)

작업하는 컴퓨터에는 LibreOffice를 설치하지 않아도 됩니다.

1. 편집한 `documents/brochure/퀼브릿지_회사소개_브로슈어_3차.pptx`를 GitHub에 올립니다.
2. **Actions → Brochure PDF**에서 실행 결과를 엽니다. PPTX 변경 시 자동 실행됩니다.
   수동 실행은 기본 브랜치에 이 워크플로가 반영된 후 **Run workflow**를 누릅니다.
3. 성공한 실행의 **Artifacts**에서 `qualbridge-brochure-실행번호`를 내려받습니다.
   ZIP 안에 편집용 PPTX와 새로 변환한 메일용 PDF가 들어 있습니다. 보관 기간은 30일입니다.
4. PDF의 글꼴·줄바꿈을 확인한 뒤 배포합니다. 저장소의 배포용 PDF도 갱신하려면 직접 올립니다.

GitHub 실행 환경에 LibreOffice와 한글 글꼴을 설치하고 6페이지 여부 및 텍스트 추출을 검사합니다.
변환 결과는 다운로드 파일로 제공하며 저장소 파일을 자동으로 덮어쓰거나 커밋하지 않습니다.
GitHub Actions 사용이 허용된 저장소에서 동작하며 계정의 사용 한도가 적용됩니다.

**범위:** GitHub 자동화는 저장된 PPTX를 PDF로 변환합니다. 아래 Codex 제작 스크립트를
실행해 PPTX 자체를 새로 만드는 작업은 포함하지 않습니다. `source/assets/`나
`build-brochure.mjs`만 바꾸면 배포 자료가 갱신되지 않으므로 먼저 PPTX를 재제작해 올려야 합니다.

### Codex에서 PPTX 자체를 재제작하는 환경


- Node.js와 Codex 제공 `@oai/artifact-tool` 모듈 (일반 npm 설치를 전제로 하지 않습니다)
- Codex presentations 스킬 폴더와 해당 검증 도구의 Python 의존성이 설치된 Python
- LibreOffice (`soffice` 명령), Noto Sans KR 글꼴

아래 환경 변수에 **현재 컴퓨터의 실제 설치 경로**를 지정합니다. 개인 경로는 저장소에 커밋하지 않습니다.

| 환경 변수 | 값 |
| --- | --- |
| `PRESENTATIONS_SKILL_DIR` | `container_tools`를 포함하는 presentations 스킬 폴더 (필수) |
| `BROCHURE_PYTHON` | Python 실행 파일 (생략 시 `python`) |
| `LIBREOFFICE_BIN` | LibreOffice 실행 파일 (생략 시 `soffice`) |
| `ARTIFACT_TOOL_MODULE` | artifact-tool의 진입 모듈 파일 경로. Node.js가 패키지를 찾을 수 있으면 생략 |

Codex에서 작업할 때는 workspace dependencies 조회로 현재 Node.js·Python·패키지 경로를 확인합니다.
LibreOffice는 별도 설치가 필요합니다. GitHub 웹 편집기만으로는 생성할 수 없으며,
저장소를 받은 로컬 환경 또는 위 도구가 준비된 실행 환경에서 다음 명령을 사용합니다.

```powershell
# 저장소 루트에서 환경 준비 확인 (결과 파일을 만들지 않음)
node documents/brochure/source/build-brochure.mjs --check

# PPTX 검증 후 PDF까지 생성
node documents/brochure/source/build-brochure.mjs
```

생성 결과는 `documents/brochure/.build/output/`에 저장됩니다.
기존에 커밋된 PPTX·PDF를 자동으로 덮어쓰지 않습니다. 생성 결과가 이미 있으면 중단하므로,
다시 실행하기 전 해당 결과를 검토하여 다른 곳으로 이동하거나 삭제하세요.
PDF는 검증된 PPTX를 LibreOffice로 변환합니다. 변환 실패 시 명령이 실패하며 PPTX는 남을 수 있습니다.

생성된 PPTX와 PDF의 6페이지 내용·글꼴·줄바꿈을 확인한 뒤,
배포할 두 파일만 `documents/brochure/`로 복사해 Git에 커밋합니다.
미리보기와 검증 기록을 포함한 `.build/`는 Git에서 제외됩니다.

## 홈페이지 견적문의 서버

견적폼은 메일 프로그램 대신 같은 출처의 `/api/quote`로 내용을 보내며, 서버가 Brevo API로 `qbridge3@naver.com`에 전달합니다.
전화는 010-7757-2096, 팩스는 0504-332-2096입니다.
회사 전용 도메인은 필수가 아니며, 발신 이메일 인증과 메일 서비스 API 키 설정이 필요합니다.
실행 방법과 남은 운영 설정은 [서버 안내](website/server/README.md)를 참고하세요.
현재 Sites 설정은 정적 배포이므로 서버 API 운영 연결과 배포 전에는 실제 문의 수신을 사용할 수 없습니다.
