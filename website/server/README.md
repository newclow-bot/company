# 견적문의 메일 서버

회사 전용 도메인 없이 현재 사이트 주소와 `qbridge3@naver.com`을 유지하는 구성입니다.
브라우저 → `https://qualbridge-quote-api.newclow.workers.dev/api/quote` → Brevo API → 회사 메일로 전달합니다.
API 키와 발신 주소는 서버 환경 변수로만 설정합니다. 키를 채팅이나 저장소에 올리지 마세요.

## 운영에 필요한 설정

1. Brevo 계정에서 트랜잭션 메일 사용이 가능한지 확인합니다. 플랜·발송 한도·계정 승인은 서비스 정책에 따릅니다.
2. 발신자 `qbridge3@naver.com`을 추가하고 해당 메일로 오는 인증 코드를 Brevo에서 확인합니다.
   무료 메일 도메인은 DNS 인증할 수 없으며, 서비스 정책에 따라 발신 주소가 Brevo 도메인으로 대체될 수 있습니다.
3. 전송용 API 키를 발급받아 **배포 서버의 비밀 설정**에 `BREVO_API_KEY`로 저장합니다.
4. 서버 설정에 `MAIL_FROM=qbridge3@naver.com`, `SITE_ORIGIN=https://qualbridge.quietegret16.chatgpt.site`를 설정합니다.
5. 기존 Sites 정적 배포는 Node 서버를 실행하지 않습니다. 별도 Cloudflare Worker에
   `node website/server/build-worker.mjs`로 생성한 `cloudflare-worker.mjs`를 배포합니다.
   이 Worker는 2026-10-29 배포했으며, 홈페이지는 해당 API 주소를 직접 호출합니다.
   `server/` 폴더를 정적 파일로 공개하지 마세요. `.openai/hosting.json`은 홈페이지 정적 배포 설정을 유지합니다.
6. 실제 운영 출처에서 테스트 문의를 보내 API 성공, Brevo 전송 기록, 네이버 수신함·스팸함을 모두 확인합니다.

공식 문서:
- https://developers.brevo.com/reference/send-transac-email
- https://help.brevo.com/hc/en-us/articles/208836149-Create-a-new-sender-From-name-and-From-email
- https://help.brevo.com/hc/en-us/articles/16045394674066-Troubleshooting-Domain-authentication

## 로컬 실행 및 검사

Node.js 22 이상에서 별도 패키지 설치 없이 실행합니다. 환경 변수는 실행 환경에서 설정합니다.
Node 서버 API를 로컬에서 시험할 때 `SITE_ORIGIN`은 실제 로컬 주소와 일치해야 합니다.
홈페이지의 클라이언트 스크립트는 운영 Worker 주소를 호출하므로 로컬 출처에서는 운영 Worker가 요청을 거절합니다.
운영 Worker의 허용 출처를 개발 편의를 위해 넓히지 마세요.

```powershell
$env:SITE_ORIGIN = 'http://127.0.0.1:8765'
node website/server/index.mjs
node --test website/server/quote.test.mjs
```

`PORT` 기본값은 8765, `HOST` 기본값은 127.0.0.1입니다. 호스팅이 외부 리슨을 요구하면 `HOST=0.0.0.0`을 설정합니다.
메일 키가 없으면 실제 발송이나 성공 표시 대신 준비 중 안내를 반환합니다.

## 동작과 제한

- 서버가 수신 주소를 고정하므로 임의 주소로 발송하는 기능은 없습니다. 회신 주소는 고객 이메일입니다.
- 성공은 메일 서비스의 접수 성공이며 수신함 도착을 보장하지 않습니다.
- 자동 재전송은 하지 않습니다. 오류·타임아웃 시 입력 내용을 유지하며, 결과가 불명확한 경우 접수 여부를 먼저 확인해야 합니다.
- 연속 클릭 차단, 허니팟, 출처 확인, 서버 검증, 20KB 본문 제한을 적용합니다.
- 프로세스 메모리에서 직접 접속 IP별 10분에 5건으로 제한합니다. 서버 재시작·여러 인스턴스에 걸친 전역 제한은 아닙니다.
  프록시 환경은 공유 IP 때문에 제한을 공유할 수 있으므로 운영 시 호스팅의 신뢰 가능한 IP 판별과 WAF 제한을 설정해야 합니다.
- 문의 저장 DB 및 파일 첨부는 제공하지 않습니다. 고객 데이터 보관·삭제 정책은 메일 서비스 설정도 함께 검토합니다.
- Worker의 API 키 설정과 서버 배포는 완료됐으며, 2026-11-02 모의 문의에서 `ok: true`를 확인했습니다.
- 네이버 받은메일함·스팸함의 실제 수신 확인, 홈페이지 변경본 배포, 운영 브라우저에서의 문의 검증은 아직 남아 있습니다.
- 운영 홈페이지가 ChatGPT 로그인을 요구하는 상태가 관찰됐습니다. 고객용 공개 접근 여부를 소유자가 확인해야 합니다.
