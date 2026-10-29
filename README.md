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
- 주소: 서울특별시 구로구 경인로54길 4, H동 106호
- 운영시간: 평일 09:00–18:00
