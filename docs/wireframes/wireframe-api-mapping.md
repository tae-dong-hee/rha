# 와이어프레임 화면별 API 연결

기준: `docs/wireframes/wireframes.html`, `api-spec/openapi.yaml` (현재 정의된 경로와 권한 정책)

`operationId`는 프론트엔드에서 생성 API 함수/훅을 찾을 때 기준으로 사용한다. 아래 경로는 `/v1` 기준이다.

> 현재 `docs/wireframes/wireframes.html`은 화면 전환과 입력·모달을 보여주는 정적 프로토타입이다. 버튼은 로컬 미리보기 상태만 바꾸며 서버 API를 실제 호출하지 않는다. 아래는 실제 프론트엔드 구현 시 컨트롤에 연결할 계약이다.

## 문서 읽는 순서

이 파일에 메뉴 1~11의 화면·버튼 API 매핑과 역할별 상세를 모두 통합했다. 각 메뉴의 요약 아래에 회원·강사·관리자 상세를 이어서 배치했다. 기존의 역할별 API 문서 참조는 이 파일 안의 해당 상세 절로 연결한다.

| 메뉴 | 화면·API 요약 | 역할별 상세 |
| --- | --- | --- |
| 1 | [인증](#menu-1) | 공통 인증 |
| 2 | [홈 / 대시보드](#menu-2) | [회원](#menu-2) · [강사](#menu-2-instructor) · [관리자](#menu-2-admin) |
| 3 | [회원 수업·예약·이용권·계정](#menu-3) | 회원·강사·관리자 수업 흐름은 해당 요약과 첨부 회의안 절 참고 |
| 4 | [회원 관리](#menu-4) | 관리자 |
| 5 | [강사 관리](#menu-5) | [회원](#doc-05-instructor-management-member-api) · [강사](#doc-05-instructor-management-instructor-api) · [관리자](#doc-05-instructor-management-admin-api) |
| 6 | [수업 운영](#menu-6) | [회원](#doc-06-lesson-operations-member-api) · [강사](#doc-06-lesson-operations-instructor-api) · [관리자](#doc-06-lesson-operations-admin-api) |
| 7 | [회원 이용권](#menu-7) | [회원](#doc-07-pass-management-member-api) · [강사](#doc-07-pass-management-instructor-api) · [관리자](#doc-07-pass-management-admin-api) |
| 8 | [운영 설정](#menu-8) | [회원](#doc-08-operation-settings-member-api) · [강사](#doc-08-operation-settings-instructor-api) · [관리자](#doc-08-operation-settings-admin-api) |
| 9 | [강사 수당·정산](#menu-9) | [회원](#doc-09-instructor-settlements-member-api) · [강사](#doc-09-instructor-settlements-instructor-api) · [관리자](#doc-09-instructor-settlements-admin-api) |
| 10 | [알림·활동 이력](#menu-10) | [회원](#doc-10-notifications-activity-member-api) · [강사](#doc-10-notifications-activity-instructor-api) · [관리자](#doc-10-notifications-activity-admin-api) |
| 11 | [역할별 메뉴 안내](#menu-11) | [공통](#doc-11-role-menu-overview) · [회원](#doc-11-role-menu-member-api) · [강사](#doc-11-role-menu-instructor-api) · [관리자](#doc-11-role-menu-admin-api) |

## 화면 안 메뉴와 버튼 흐름

화면 전환은 상단 화면 선택 버튼 없이 로그인 폼과 앱 내부 메뉴로 진행한다.

| 현재 화면의 컨트롤 | 동작 / 이동 | API 연결 |
| --- | --- | --- |
| 로그인 폼의 `로그인` | 성공 시 사용자 역할에 맞는 홈으로 이동 | `POST /auth/login` · `login`; 토큰 만료 시 `POST /auth/refresh` · `refreshToken` |
| 로그인 폼의 `이메일 인증 후 회원가입` | 이메일 인증 화면으로 이동 | `POST /auth/email-verifications`, 이후 `POST /auth/email-verifications/confirm` |
| 이메일 인증 폼의 `인증 코드 확인` | 성공 시 회원가입 화면으로 이동 | `POST /auth/email-verifications/confirm` · `confirmEmailVerification` |
| 이메일 인증 폼의 `인증 코드 다시 보내기` | 코드 재발송 | `POST /auth/email-verifications` · `requestEmailVerification` |
| 회원가입 폼의 `회원가입` | 가입 처리 후 로그인 화면으로 이동 | `POST /auth/sign-up` · `signUp` |
| 로그인 폼의 `비밀번호를 잊으셨나요?` | 재설정 메일 요청 화면으로 이동 | `POST /auth/password-reset-requests` · `requestPasswordReset`; 메일 링크 화면에서 `POST /auth/password-resets` · `resetPassword` |
| 좌측 사이드바 메뉴 | 선택한 역할 내 홈·목록 화면으로 이동 | 각 화면의 목록 API는 아래 역할별 표 참고 |
| 헤더의 알림 뱃지·알림 목록 메뉴 | 알림 화면으로 이동 | `GET /notifications/unread-count`, `GET /notifications` |
| 프로필 메뉴의 `내 계정` | 프로필 화면으로 이동 | `GET /members/me` · `getMyProfile`; 수정 시 `PATCH /members/me` · `updateMyProfile` |
| 프로필 메뉴의 `로그아웃` | 세션 종료 후 로그인 화면으로 이동 | `POST /auth/logout` · `logout` |
| 목록 화면의 검색 입력·`검색` | 현재 목록 필터링 | 각 목록 조회 API의 검색/필터 쿼리를 사용. API별 지원 필터는 OpenAPI 계약을 따름 |
| 목록 행의 `상세` | 선택한 데이터 상세 확인 | 해당 상세 조회 API가 정의된 리소스에 연결. 프로토타입은 미리보기 모달 |
| 목록 화면의 `＋ 등록/신청/수정` | 입력 폼을 열고 제출 | 리소스별 생성·수정 API. 없는 계약은 구현 전에 스펙 추가 필요 |
| 대시보드 지표·수업 행·빠른 메뉴 | 관련 역할별 목록/처리 화면으로 이동 | 아래 역할별 표 참고 |

로그인 화면의 역할 선택은 **미리보기 전용**이며 실제 로그인 요청에 역할을 보내지 않는다. 실제 화면에서는 로그인 성공 후 `GET /members/me`의 `role`, `permissions`로 사이드바를 구성한다. 로그인 응답 본문에는 Access Token과 만료시간이 담긴다.

### 사이드바 메뉴 목적지

| 역할 | 메뉴 | 이동 화면 | 화면 진입 시 주요 조회 API |
| --- | --- | --- | --- |
| 회원 | 홈 | 오늘 내 수업 | `getMyReservations`, `getMyPasses`, 알림 조회 |
| 회원 | 수업 목록 | 공개 수업 목록 | `GET /lessons` · `getLessons` |
| 회원 | 내 이용권 | 내 이용권 목록 | `GET /members/me/passes` · `getMyPasses` |
| 회원 | 내 예약·대기·출결 | 내 예약 목록 | `GET /members/me/reservations` · `getMyReservations` |
| 회원 | 알림 | 내 알림 | `GET /notifications` · `getMyNotifications` |
| 회원 | 내 계정 | 프로필·비밀번호 | `GET /members/me` · `getMyProfile` |
| 강사 | 홈 | 내 수업 대시보드 | 오늘 `GET /lessons` + 수업별 예약자 조회 |
| 강사 | 내 수업 | 담당 수업 목록 | `GET /lessons` · `getLessons` (`instructorId`, 날짜 범위) |
| 강사 | 수업별 예약자 | 담당 수업의 예약자 | `GET /lessons/{lessonId}/reservations` · `getLessonReservations` |
| 강사 | 출결 처리 | 예약자 출결 상태 | 예약자 조회와 `PUT /reservations/{reservationId}/attendance` · `confirmAttendance` |
| 강사 | 부재 신청 | 내 부재 목록·신청 | `GET /absences` · `getAbsences`; `POST /absences` · `createAbsence` |
| 강사 | 내 프로필 | 프로필·비밀번호 | `GET /members/me` · `getMyProfile` |
| 강사 | 알림 | 내 알림 | `GET /notifications` · `getMyNotifications` |
| 관리자 | 홈 | 운영 대시보드 | 오늘 `GET /lessons`, `GET /reservations`, `GET /absences` 및 알림 조회 |
| 관리자 | 회원 관리 | 회원 목록·상세 | `GET /members` · `getMembers`; 상세 `GET /members/{memberId}` · `getMember` |
| 관리자 | 강사 관리 | 강사 목록·상세 | `GET /instructors` · `getInstructors`; 상세/등록은 권한·회원 API 확인 |
| 관리자 | 수업 운영 | 수업 및 예약 운영 | `GET /lessons` · `getLessons`; 생성 `POST /lessons` · `createLesson` |
| 관리자 | 회원 이용권 | 이용권 현황·발급 | `GET /passes` · `getPasses`; 발급 `POST /passes` · `createPass` |
| 관리자 | 운영 설정 | 상품·유형·룸·영업시간·정책 | 해당 설정 목록 API (`getPassProducts`, `getLessonTypes`, `getRooms`, `getBusinessHours`, `getReservationPolicy`) |
| 관리자 | 강사 수당·정산 | 수당·정산 목록 | `GET /settlements` · `getSettlements`; 상세 `GET /settlements/{settlementId}` · `getSettlement` |
| 관리자 | 알림 | 내 알림 | `GET /notifications` · `getMyNotifications` |
| 관리자 | 활동 이력 | 활동 로그 | `GET /activity-logs` · `getActivityLogs` |

<a id="menu-1"></a>

## 메뉴 1. 인증

| 와이어프레임 화면 / 동작 | API | 연결 방식 |
| --- | --- | --- |
| 로그인 | `POST /auth/login` · `login` | 이메일, 비밀번호 제출. 성공 시 역할에 맞는 대시보드로 이동한다. |
| 토큰 만료 시 세션 복구 | `POST /auth/refresh` · `refreshToken` | Refresh Token 쿠키로 Access Token을 재발급한다. |
| 로그아웃 (공통 프로필 메뉴) | `POST /auth/logout` · `logout` | Refresh Token을 폐기하고 로그인 화면으로 이동한다. |
| 이메일 인증 코드 발송 | `POST /auth/email-verifications` · `requestEmailVerification` | 인증 화면에서 이메일 제출. 이미 가입된 이메일은 오류 안내를 표시한다. |
| 이메일 인증 코드 확인 | `POST /auth/email-verifications/confirm` · `confirmEmailVerification` | 인증 코드 제출. 응답의 `emailVerificationToken`을 회원가입 요청에 전달한다. |
| 회원가입 | `POST /auth/sign-up` · `signUp` | 인증 토큰과 회원 정보를 제출한다. 생성 역할은 항상 `MEMBER`다. |
| 비밀번호 재설정 메일 요청 | `POST /auth/password-reset-requests` · `requestPasswordReset` | 재설정 화면에서 이메일 제출. 가입 여부와 관계없이 성공 안내를 표시한다. |
| 새 비밀번호 저장 (이메일 링크 진입 화면) | `POST /auth/password-resets` · `resetPassword` | 메일 링크의 토큰과 새 비밀번호 제출. 현재 와이어프레임에는 이 후속 화면이 별도로 그려져 있지 않다. |

<a id="menu-2"></a>

## 메뉴 2. 대시보드 — 회원

| 화면 영역 | API | 연결 방식 |
| --- | --- | --- |
| 오늘 내 수업 목록 / 예약 상태 | `GET /members/me/reservations` · `getMyReservations` | `lessonFrom`, `lessonTo`를 오늘 범위로 전달한다. 예약 응답의 수업 정보와 예약 상태로 오늘 수업을 표시한다. 날짜 경계는 센터 현지 시각(Asia/Seoul) 기준으로 계산한 뒤 UTC로 변환한다. |
| 오늘의 수업 수, 다음 수업, 출석 상태 | `GET /members/me/reservations` · `getMyReservations` | 같은 결과에서 상태별·시간별로 클라이언트 집계한다. 대시보드 전용 집계 API는 없다. |
| 이용권 카드 / 잔여 횟수·만료일 | `GET /members/me/passes` · `getMyPasses` | 내 이용권을 조회해 대표 이용권을 카드에 표시한다. |
| 읽지 않은 알림 뱃지 | `GET /notifications/unread-count` · `getMyUnreadNotificationCount` | 화면 진입 시와 적절한 주기로 조회한다. |
| 최근 알림 미리보기 | `GET /notifications` · `getMyNotifications` | 첫 페이지를 조회해 최근 항목을 표시한다. |
| 빠른 메뉴: 수업 예약 | `GET /lessons` · `getLessons`; `POST /reservations` · `createReservation` | 수업 목록에서 공개 수업을 조회한 뒤 회원이 예약한다. 대기 예약 API는 현재 스펙에 없다. |
| 빠른 메뉴: 이용권 확인 | `GET /members/me/passes` · `getMyPasses` | 내 이용권 화면으로 이동한다. |
| 빠른 메뉴: 예약 내역 | `GET /members/me/reservations` · `getMyReservations` | 내 예약 목록 화면으로 이동한다. |

<a id="menu-2-instructor"></a>

## 메뉴 2. 대시보드 — 강사

| 화면 영역 | API | 연결 방식 |
| --- | --- | --- |
| 오늘 담당 수업 | `GET /members/me` · `getMyProfile`; `GET /lessons` · `getLessons` | 내 프로필에서 강사 ID를 확인하고 `from`, `to`, `instructorId`로 오늘 수업을 조회한다. 날짜 경계는 Asia/Seoul 기준으로 계산해 UTC로 전달한다. |
| 오늘 담당 수업 수·출결 대기 집계 | `GET /lessons` · `getLessons`; 수업별 `GET /lessons/{lessonId}/reservations` · `getLessonReservations` | 오늘 수업과 예약자 목록으로 클라이언트에서 집계한다. 전용 대시보드 통계 API는 없다. 담당 강사는 본인 수업의 예약자를 조회할 수 있다. |
| 수업별 출결 처리 | `GET /lessons/{lessonId}/reservations` · `getLessonReservations`; `PUT /reservations/{reservationId}/attendance` · `confirmAttendance` | 예약자 조회 후 각 예약의 출석/노쇼 상태를 저장한다. 담당 강사 또는 관리자 권한이 필요하다. |
| 출결 처리 대기 숫자 | 수업별 `GET /lessons/{lessonId}/reservations` · `getLessonReservations` | 예약 상태를 읽어 프론트에서 계산한다. 별도 출결 대기 집계 API는 없다. |
| 부재 신청 | `POST /absences` · `createAbsence` | 강사 본인의 부재 기간을 등록한다. |
| 내 부재 내역 | `GET /absences` · `getAbsences` | 강사는 본인 부재 내역만 조회한다. |
| 알림 뱃지·미리보기 | `GET /notifications/unread-count` · `getMyUnreadNotificationCount`; `GET /notifications` · `getMyNotifications` | 본인 알림 수와 목록을 조회한다. |
| 프로필 메뉴 | `GET /members/me` · `getMyProfile` | 로그인 사용자 정보를 표시한다. |
| 로그아웃 | `POST /auth/logout` · `logout` | 프로필 메뉴에서 실행한다. |

<a id="menu-2-admin"></a>

## 메뉴 2. 대시보드 — 관리자

| 화면 영역 | API | 연결 방식 |
| --- | --- | --- |
| 오늘의 수업 목록 / 전체 수업 수 | `GET /lessons` · `getLessons` | `from`, `to`를 오늘 범위로 전달한다. 관리자는 전체 수업을 조회할 수 있다. 날짜는 Asia/Seoul 기준으로 계산해 UTC로 전달한다. |
| 오늘 예약 현황 | `GET /reservations` · `getReservations` | `lessonFrom`, `lessonTo`로 오늘 수업 예약을 조회한다. 페이지 결과를 이용해 프론트에서 예약 수와 상태를 집계한다. |
| 출결 현황 | `GET /reservations` · `getReservations` | 오늘 예약 결과의 출결 상태를 프론트에서 집계한다. 별도 출결 통계 API는 없다. |
| 승인 대기: 강사 부재 | `GET /absences` · `getAbsences`; 승인 `POST /absences/{absenceId}/approvals` · `approveAbsence`; 반려 `POST /absences/{absenceId}/rejections` · `rejectAbsence` | `status=REQUESTED`로 대기 목록을 조회하고 상세 행에서 승인/반려한다. |
| 승인 대기 숫자 | `GET /absences` · `getAbsences` | 부재 신청은 조회 가능하다. 현재 대시보드는 부재 승인 대기만 표시한다. 기타 승인 종류를 추가하려면 업무 정의와 계약 확인이 필요하다. |
| 읽지 않은 알림 뱃지·최근 알림 | `GET /notifications/unread-count` · `getMyUnreadNotificationCount`; `GET /notifications` · `getMyNotifications` | 관리자 본인 알림 수와 목록을 조회한다. |
| 빠른 메뉴: 수업 개설 | `POST /lessons` · `createLesson` | 수업 개설 권한을 확인한 뒤 등록한다. |
| 빠른 메뉴: 회원 등록 | 현재 대응 API 없음 | `POST /members`의 현재 요약은 “강사/관리자 등록”이며, 일반 회원 직접 등록을 지원하는지 스펙과 메뉴 설명이 불일치한다. |
| 빠른 메뉴: 이용권 발급 | `GET /pass-products` · `getPassProducts`; `POST /passes` · `createPass` | 상품을 선택하고 회원에게 이용권을 발급한다. 결제 기록은 `POST /passes/{passId}/payments` · `recordPassPayment`로 별도 등록한다. |
| 로그아웃 | `POST /auth/logout` · `logout` | 프로필 메뉴에서 실행한다. |

<a id="menu-3"></a>

## 메뉴 3.1 수업 — 회원 화면과 현행 API 기준

> 메뉴 6 추가 후 강사·관리자의 기본 수업 화면은 현재 API 기준이며 회원·회원 관리·강사 부재/인계와 같은 데이터를 사용한다. 아래 **첨부 회의안에 따른 메뉴 3의 강사·관리자 수업 화면**은 `승인 신청 대기` 메뉴 또는 수업 운영의 `승인 신청 대기` 버튼에서 확인한다. 승인·확보·출결 차감 기능이 기존 API로 지원된다는 뜻이 아니다.

### 범위와 미리보기 경로

메뉴 3.1은 회원용 수업 기능이다. 요청된 강사·관리자 수업 화면은 메뉴 6.1·6.3과 11번 역할별 요약의 수업 업무를 함께 적용했다. 회원 이용권 전체 관리(3.2), 계정(3.4), 알림(3.5)은 이번 화면 작업의 범위 밖이며 기존 미리보기 메뉴로 유지한다. 내 예약·대기·출결(3.3)은 예약 결과와 취소를 확인하는 연결 화면으로 보완했다.

| 역할 | 실제 화면 진입 | 이번에 추가한 화면·행동 |
| --- | --- | --- |
| 회원 | 로그인에서 `회원 계정` 선택 → 로그인 → 홈의 `수업 목록 보기` 또는 왼쪽 `수업 목록` | 공개 수업 목록·필터·페이지 → 수업 상세의 내 신청 상태 → 예약/대기 확인 → 내 예약·대기·지난 수업 탭 → 예약/대기 취소 |
| 강사 | `강사 계정`으로 로그인 → `내 수업` | 내 담당/조회 가능한 전체 수업 → 상세 → 본인 담당 수업 예약자 → 출석·노쇼 기록/정정 |
| 관리자 | `관리자 계정`으로 로그인 → `수업 운영` | 전체 수업 목록 → 개설/상세/수정 → 공개·비공개·공개 예약 → 수업 취소 → 예약자·출결 및 개별 예약 취소 |

한 HTML에 기존 인증·대시보드와 이번 수업 화면을 누적했다. 데이터는 메모리 예시이며 새로고침하면 초기화된다. 예시 기준시각은 **2026-10-11 12:00 Asia/Seoul**, 예약 취소 마감은 예시 정책 **24시간 전**이다. `모닝 리포머`에서 이미 시작한 수업의 출결을, `리포머 밸런스`에서 정원 마감을, `저녁 코어 필라테스`에서 기존 예약 취소를, `개인 체형 교정`에서 신규 예약을 확인할 수 있다.

화면 하단 `화면 상태 미리보기`에서 로딩·빈 결과·조회 실패를 볼 수 있다. 강사는 단체 3:1의 개설·수정 권한 보유 여부, 회원은 사용 가능한 이용권 보유 여부를 예시로 전환할 수 있다. 이 옵션은 실제 권한 변경이나 실제 이용권 조작 기능이 아니다.

### 회원 내 이용권 목록·상세 표시

- 목록은 `이용권 / 현재 잔여 횟수 / 만료일 / 상태 / 상세`의 5열로 표시한다. 상세 버튼은 별도 열에 정렬한다.
- `7 / 10` 대신 **총 10회 중 7회 남음**과 사용 비율 막대를 표시한다. 막대의 진한 부분은 `사용 3회`, 연한 부분은 `남은 7회`이며 범례로 구분한다. 내 이용권 목록에서는 요약 표를 표시하지 않는다. 상세 창에서는 범례를 오른쪽에 모아 정렬하고 바로 아래 표에 `총 횟수 10회 / 사용 횟수 3회 / 남은 횟수 7회`를 표시한다. 사용 횟수는 예약 차감 기준이며 출석한 수업 수와 다를 수 있다.
- 행의 `상세보기`와 상단의 `이용권 상세보기`는 읽기 전용 상세 창을 연다. 상품명·횟수 요약 표·상태·만료일을 표시하며, 버튼은 `닫기`만 제공한다. 이름·메모 입력 폼이나 저장 동작은 없다. 차감·복구 기준 행은 삭제했다.
- 홈의 이용권 카드와 수업 상세에서도 같은 잔여 표시 및 이용권 상세 창을 사용한다. 예약·취소 후 현재 잔여를 반영한다.
- 현재 예시에는 이용권 한 개가 있어 상단 상세 버튼도 해당 이용권을 연다. 여러 이용권 연동 시 각 행의 ID로 해당 이용권을 선택해야 한다.

| 화면 동작 | API 연결·응답 필드 | 처리 |
| --- | --- | --- |
| 내 이용권 목록·이름 검색 | `GET /members/me/passes` · `getMyPasses` | `id`, `passProduct.name`, `totalCount`, `remainingCount`, `endDate`, `status`로 표시. 현재 이름 검색은 불러온 목록 안에서 필터링하는 예시 |
| 회원 이용권 상세보기 | `getMyPasses` 목록의 선택한 이용권 객체 | 회원은 관리자용 `GET /passes/{passId}`를 호출하지 않는다. 목록의 ID로 상세 창을 구성하고 최신 상태가 필요하면 본인 목록을 재조회 |
| 예약·취소 후 이용권 표시 | `getMyPasses` 재조회 | 막대의 사용 비율은 `(totalCount - remainingCount) / totalCount`; 사용 횟수는 `totalCount - remainingCount`. 총 횟수가 0이면 막대 비율을 0으로 처리 |

### 회원 신청 상태와 이용권 표시 보완

- 수업 목록과 상세의 **내 신청 상태**에 `미신청 · 예약 가능`, `내 예약 완료`, `내 대기 신청 중`, `내 출석 완료`, `정원 마감 · 대기 가능`을 구분한다. 공개 상태와 회원 개인의 신청 상태는 다르다.
- 이미 예약한 수업에는 다시 예약하는 버튼 대신 **예약 취소하기**, 미신청·자리 있는 수업에는 **수업 예약하기**, 정원 마감 수업에는 **대기 신청하기**, 대기 중 수업에는 **대기 취소하기**를 표시한다. 시작 시각·취소 마감·이용권 부족에 따른 제한 사유도 함께 표시한다.
- 예약 전·후 모두 이용권의 **현재 전체 잔여 횟수**를 같은 위치에 표시한다. 이미 예약한 수업에는 해당 예약에 사용한 이용권·예약 번호·이미 1회 차감된 상태임을 추가로 안내한다. 실제 연동에서는 예약의 `pass`와 현재 이용권 조회 응답을 이용권 ID로 연결해야 하며, 전체 보유 이용권의 합계나 예약 당시 잔여 횟수로 오해하지 않도록 한다.
- `내 예약·대기·출결`을 **예약 완료 / 대기 신청 / 지난 수업·취소** 탭으로 나누고 수업명·날짜·시간·강사·룸·신청 번호를 표시한다. 홈의 예약 건수·내가 예약한 수업·이용권 잔여도 같은 예시 데이터를 사용한다. 과거의 고정된 대시보드 예약 예시는 제거했다.
- 초기 데이터에서 **저녁 코어 필라테스(10/12 18:00)**는 이미 예약한 수업, **개인 체형 교정(10/12 19:30)**은 신규 예약 가능한 수업, **리포머 밸런스(10/11 14:00)**는 정원 마감으로 대기 신청을 체험할 수 있는 수업이다. **모닝 리포머(10/11 09:00)**는 이미 출석 완료한 기록이다. 모두 실제 회원 예약이 아닌 예시다.

**대기 기능은 계약 미정인 화면 제안이다.** `openapi.yaml`은 대기 예약이 없다고 명시한다. 프로토타입에서는 예약 데이터와 분리된 `waitlist` 예시를 사용하여 신청·취소·내역을 보여주며, 기존 `ReservationStatus`에 임의의 상태를 추가하지 않는다. 예시에서는 대기 신청·취소로 이용권 횟수를 바꾸지 않고 시작 전까지 대기 취소를 허용한다. 이 정책은 팀의 확정된 운영 정책이 아니며, 자동 승급은 시뮬레이션하지 않는다.

| 대기 화면 동작 | API 연결 상태 | 다음 결정 사항 |
| --- | --- | --- |
| 정원 마감 수업 → 대기 신청 확인 → 대기 신청 중 | **API 없음 · 화면 동작만 제공** | 생성 요청/응답, 중복 신청, 정렬·순번, 신청 자격, 이용권 차감 시점 |
| 내 대기 탭·수업 상세에서 내 대기 확인 | **API 없음 · 별도 예시 목록** | 본인 대기 목록 API, 수업별 대기 정보, 노출 정보 |
| 대기 취소 확인 → 대기 내역에서 제거 | **API 없음 · 화면 동작만 제공** | 취소 API, 취소 가능 시각, 상태 기록·알림 |
| 빈자리 발생 시 자동 승급·예약 확정 | **미구현 · API/정책 없음** | 동시성·순번·이용권 부족·알림·예약 취소 마감 정책 |

실제 개발 전 위 항목의 정책을 합의하고 `/api-spec/openapi.yaml`부터 계약을 추가해야 한다. 이 작업에서는 API 계약을 변경하지 않았다.

### 화면별 표시 데이터

| 화면 / 영역 | API와 응답 필드 | 처리 기준 |
| --- | --- | --- |
| 수업 목록·상세 | `getLessons`, `getLesson`: `id`, `title`, `lessonType.{id,code,name}`, `instructor.{id,name}`, `room.{id,name}`, `startAt`, `endAt`, `capacity`, `reservedCount`, `status`, `publishAt` | 이름·일시·강사·룸·예약/정원·공개 상태 표시. API에 없는 수업 소개글·사진 등은 입력 항목으로 추가하지 않음 |
| 내 예약 표시 | `getMyReservations`: `id`, `lesson.id`, `status`, `pass`, `canceledBy`, `cancelReason` | 수업별 내 예약을 연결하고 중복 예약·취소 상태 표시. 내 예약 목록 조회는 `lessonId` 쿼리를 지원하지 않으므로 날짜 범위 응답의 `lesson.id`로 연결 |
| 예약 확인 안내 | `getMyPasses`, `getReservationPolicy`: 이용권 잔여·만료 정보, `cancelDeadlineHours` | 예약 이용권은 서버 자동 선택. 화면에서 예상 정보만 안내하며 예약 결과의 `pass`가 실제 사용 이용권의 기준 |
| 예약자·출결 | `getLessonReservations`: `id`, `member.name`, `pass.passProduct`, `status`, `attendanceConfirmedAt` | 출결 요청에는 회원 ID가 아니라 **예약 ID** 사용. 전체 인원은 페이지 일부의 길이가 아니라 수업의 `reservedCount`와 전체 결과 기준 |
| 개설·수정 선택지 | `getLessonTypes`, `getInstructors`, `getRooms` | 유형·강사·룸의 ID를 선택지와 연결. 개설할 유형의 정원이 수업에 복사되므로 정원 직접 입력 없음 |

### 회원: API 호출 시점과 버튼 흐름

| 화면 / 이벤트 | API · operationId | 요청값 / 성공 후 변화 |
| --- | --- | --- |
| 회원 홈의 `공개 수업 목록` | `GET /lessons` · `getLessons` | 공개된 예정 수업을 시작 시각순으로 최대 3개 미리보기. 행 클릭은 해당 ID의 수업 상세로 이동. `수업 목록 보기`·`수업 목록 전체 보기`는 전체 목록으로 이동 |
| `수업 목록` 진입·필터 조회·페이지 변경 | `GET /lessons` · `getLessons` | `from`, `to`, `lessonTypeId`, `instructorId`, `roomId`, `page`, `size`, `order=ASC`. 회원은 공개된 수업만 조회 |
| `상세 보기` | `GET /lessons/{lessonId}` · `getLesson` | 클릭한 목록의 `id`를 경로에 전달. 개인 예약·이용권·취소 정책은 별도 조회 |
| 상세에서 내 예약 여부 확인 | `GET /members/me/reservations` · `getMyReservations` | 해당 수업일의 `lessonFrom`, `lessonTo` 범위 조회 후 `lesson.id`로 연결 |
| 상세 진입의 이용권·정책 안내 | `GET /members/me/passes` · `getMyPasses`; `GET /reservation-policy` · `getReservationPolicy` | 서버의 이용권 선택 규칙과 취소 마감을 표시. 없음·미수·만료·홀딩에 따른 예약 가능 여부의 최종 판단은 예약 API 응답 |
| `예약하기` → 확인 | `POST /reservations` · `createReservation` | body `{ lessonId }`만 전송. `passId`는 전송하지 않음. 성공 시 반환 예약을 표시하고 수업 상세·내 예약·내 이용권을 재조회 |
| `내 예약·대기·출결`의 예약·지난 기록 조회 | `GET /members/me/reservations` · `getMyReservations` | 예약 완료 탭은 status=RESERVED, 지난 수업·취소는 ATTENDED/NO_SHOW/CANCELED 응답으로 구분. 필요 시 수업 날짜 범위·페이지·정렬 조건 사용. 대기 탭은 이 API로 조회할 수 없음 |
| `예약 상세` | `GET /reservations/{reservationId}` · `getReservation` | 예약 목록/예약 성공 응답의 `id` 사용. 취소·비공개 수업도 본인 예약 응답의 `lesson` 정보로 표시 |
| `예약 취소` → 사유 입력·확인 | `POST /reservations/{reservationId}/cancellations` · `cancelReservation` | body `{ reason? }`, 200자 이내. 회원 본인·RESERVED·시작 전·정책 마감 내에서 가능. 성공 후 취소 상태·예약 인원·내 이용권 횟수를 갱신 |
| 목록으로·수업 목록로·모달 닫기 | 화면 이동 | 이동 자체에는 변경 API가 없음. 목적지 진입에서 필요한 목록 조회 |

회원 날짜 입력은 시작일·종료일을 포함하는 현지 날짜다. 실제 API 요청은 서울 자정의 UTC `from` 이상, UI 종료일 다음 날 자정의 UTC `to` 미만으로 전달한다. `2026-10-11` 하루는 `2026-10-10T15:00:00Z` 이상 `2026-10-11T15:00:00Z` 미만이다. 내 예약 API는 같은 범위에 `lessonFrom`, `lessonTo`를 사용한다. 페이지는 1부터, 실제 전체 건수는 `pageInfo.totalElements`를 기준으로 한다. 이번 예시 목록은 4개씩 표시한다.

### 강사: 담당 수업·출결·유형별 운영 권한

| 화면 / 이벤트 | API · operationId | 요청값 / 권한·성공 후 변화 |
| --- | --- | --- |
| `내 수업` 진입 | `GET /members/me` · `getMyProfile`; `GET /lessons` · `getLessons` | 프로필 `id`를 `instructorId`로, 날짜 범위를 `from`, `to`로 전달 |
| `조회 가능한 전체 수업` 선택 | `GET /lessons` · `getLessons` | 본인 강사 필터를 제거. 서버가 공개 수업+본인 담당+운영 권한이 있는 유형의 수업으로 노출 범위를 제한 |
| 수업 상세 | `GET /lessons/{lessonId}` · `getLesson` | 일반 상세 조회와 동일. 다른 강사의 공개 수업을 볼 수 있어도 예약자 조회·출결 권한이 생기지 않음 |
| `예약자·출결` 또는 사이드 메뉴 | `GET /lessons/{lessonId}/reservations` · `getLessonReservations` | 본인 담당 수업만 선택·조회. `status`, `page`, `size` 사용 |
| 회원별 출석/노쇼 `저장`·`정정` | `PUT /reservations/{reservationId}/attendance` · `confirmAttendance` | body `{ status: "ATTENDED" \| "NO_SHOW" }`. 시작 이후만 가능. 개별 예약 단위 API이므로 일괄 출결로 표현하지 않음. 성공 후 예약자·예약 수업 현황 재조회. 이용권 추가 차감 없음 |
| 운영 권한을 가진 유형의 개설·수정·공개·취소 | 관리자와 같은 수업 운영 API | `LESSON_CREATE:{code}`, `LESSON_UPDATE:{code}` 필요. 본인 담당이라는 이유만으로 운영 권한을 부여하지 않음 |

강사 예시는 기본 운영 권한이 없는 상태다. 메뉴 6 기본 화면은 관리자 `강사 관리 > 강사 상세 > 권한`에서 저장한 유형별 개설/수정 권한을 사용한다. 회의안 화면의 하단 권한 미리보기는 별도 제안 스위치다. 실제 권한은 `GET /members/me`의 `permissions`로 확인하며 서버가 최종 검사한다. 조회·운영 권한과 담당 수업의 예약자·출결 권한은 별도로 판단한다.

### 관리자: 수업 개설·수정·공개·취소·출결

| 화면 / 이벤트 | API · operationId | 요청값 / 성공 후 변화 |
| --- | --- | --- |
| `수업 운영` 목록·필터 | `GET /lessons` · `getLessons` | 날짜·유형·강사·룸·상태·페이지·정렬. 관리자는 전체 공개 상태 조회 |
| `＋ 수업 개설` 폼 진입 | `GET /lesson-types` · `getLessonTypes`; `GET /instructors` · `getInstructors`; `GET /rooms` · `getRooms` | 활성 유형·강사·룸 선택지 조회. 실제 목록은 각 API의 페이지를 고려 |
| `비공개로 개설` | `POST /lessons` · `createLesson` | body `{ title, lessonTypeId, instructorId, roomId, startAt, endAt }`, 서울 입력 일시는 UTC 변환. 생성 후 CREATED 상태의 상세로 이동 |
| `수업 정보 수정` → 변경 저장 | `PATCH /lessons/{lessonId}` · `updateLesson` | `{ title?, instructorId?, roomId?, startAt?, endAt? }` 중 변경된 필드. 유형 변경 불가. RESERVED 예약이 있으면 시간 입력 제한. 성공 후 상세·목록 재조회 |
| `공개 상태 설정` | `PUT /lessons/{lessonId}/status` · `changeLessonStatus` | `{ status: "PUBLISHED" \| "UNPUBLISHED" \| "SCHEDULED", publishAt? }`. SCHEDULED에만 공개 시각 포함. 허용된 상태 전이만 선택 |
| `수업 취소` → 사유·영향 확인 | `POST /lessons/{lessonId}/cancellations` · `cancelLesson` | `{ reason? }`, 200자 이내. 시작 전 수업만 가능. 모든 RESERVED 예약이 함께 취소되고 이용권 횟수 복구. 상세·예약자·예약 수를 재조회 |
| 예약자·출결 보기·저장·정정 | `getLessonReservations`, `confirmAttendance` | 관리자 전체 수업에서 가능. 시작 전 출결 저장 제한, 정산 포함 시 서버 오류 처리 |
| 예약자 행의 `예약 취소` | `POST /reservations/{reservationId}/cancellations` · `cancelReservation` | 관리자는 회원 취소 마감과 무관하게 시작 전 RESERVED 예약 취소 가능. 성공 후 예약자·수업 인원 재조회 |

공개 상태 설정과 예약 취소를 구분한다. 비공개 전환은 기존 예약을 유지한다. 수업 취소는 예약을 함께 취소하고 복구하며 다시 공개할 수 없다. 개설 자체는 회원에게 공개되지 않으며 별도의 상태 변경이 필요하다. 새 수업은 유형의 정원을 복사하고 이후 UI에서 임의 변경하지 않는다.

### 화면 상태와 오류 처리

- **로딩:** 조회 중임을 표시하고 결과 목록 대신 로딩 문구 제공.
- **빈 결과:** 조건에 맞는 수업/예약자가 없다는 안내와 조건 초기화 제공.
- **조회 실패:** 오류 문구와 재시도 제공. 인증 만료는 공통 refresh/login 흐름, 권한 없음은 처리 기능 제한, 상세 404는 수업을 찾을 수 없음으로 처리.
- **예약 마감:** `reservedCount >= capacity`일 때 예약 버튼 제한. 화면 이후 정원이 바뀔 수 있으므로 서버 `LESSON_FULL`도 처리.
- **예약 불가:** `LESSON_NOT_RESERVABLE`, `ALREADY_RESERVED`, `NO_AVAILABLE_PASS`, `PASS_UNPAID`에 맞는 안내. 미리보기의 이용권 없음 옵션으로 실패 확인 가능.
- **취소 불가:** `CANCELLATION_DEADLINE_PASSED`, `LESSON_ALREADY_STARTED`, `INVALID_RESERVATION_STATUS`를 안내하고 최신 예약 정보를 재조회.
- **출결 불가:** `LESSON_NOT_STARTED`, `LESSON_SETTLED`, `INVALID_RESERVATION_STATUS` 안내. 예시에서는 시작 시각·취소 상태를 검사하며 정산 여부는 실제 서버 확인 필요.
- **수업 운영 불가:** `INVALID_LESSON_TIME`, `INSTRUCTOR_TIME_CONFLICT`, `ROOM_TIME_CONFLICT`는 폼 안에 표시. 영업시간·가능시간·승인 부재·퇴사일 관련 오류도 실제 구현에서 서버 `ErrorResponse.code`를 읽어 설명.
- 오류의 상세 문구는 API 계약의 RFC 7807 응답을 기준으로 작성. HTML의 동작은 서버 호출이 아닌 목 데이터 변화다.

### 안 되는 기능·추가 설계·팀 결정 사항

| 항목 | 현재 지원 여부 / 근거 | 팀에서 결정하거나 보완할 내용 |
| --- | --- | --- |
| 대기 신청·대기 취소·자동 승급 | API 없음. 예약 생성 명세는 `LESSON_FULL`을 반환하고 대기 예약이 없다고 명시 | 이번 버전 포함 여부, 대기 순서, 승급 시 이용권 차감·잔여 부족·수업 취소·알림 정책. 화면의 대기 신청·취소는 메모리에서만 동작하는 제안 흐름. 실제 API 지원 기능으로 해석하면 안 됨 |
| 반복 수업 등록·선택/이후 회차 수정 | API 없음. 현재 수업 개설은 단일 회차 | 현행 API는 단일 회차만 지원. 메뉴 6의 반복 일정은 별도 제안 예시로 제공. 반복 범위·충돌·예약자 있는 회차의 변경 정책을 합의한 뒤 계약 추가 |
| 출결 정정 요청 승인 흐름 | 출결 직접 정정 API는 있음. 별도 정정 요청·승인 API는 없음 | 현재 담당 강사·관리자 직접 정정 흐름으로 제공. 요청/승인이 업무상 필요한지 별도 결정 |
| 유형별 강사 운영 권한 | 기존 계약 있음 | 해당 센터가 강사에게 어떤 유형의 개설·수정 권한을 줄지 결정. 별도 API 누락으로 분류하지 않음 |
| 회원의 비공개 수업 예약 상세 | 예약 조회는 취소된 수업 정보도 포함. 수업 조회는 공개 수업만 제공 | 본인 예약 상세는 예약 응답의 `lesson`으로 표시. 비공개 수업에 `getLesson`만 호출하면 404일 수 있음 |
| 회원 예약에 이용권 직접 선택 | 현재 예약 요청은 `lessonId`만 받으며 서버 자동 선택 | 화면은 선택 폼 대신 자동 선택 안내. 직접 선택이 꼭 필요하면 업무·계약 변경 필요 |
| 예약 당시 취소 정책 스냅샷 | 현재 예약 응답에 당시 정책 정보 없음 | 정책 변경 전 예약에도 새 정책을 적용할지 결정. 기존 예약의 마감을 정확히 안내할 근거 필요 |
| 출결 정정의 정산 여부 사전 표시 | 예약/수업 응답에 정산 잠금 여부 없음 | 저장 시 `LESSON_SETTLED` 오류 처리 가능. 미리 잠금을 보여줄 요구가 있으면 응답 확장 협의 |
| 준비시간까지 포함한 충돌 | 메뉴 12의 확인 항목. 현재 수업의 startAt/endAt 외 준비시간 필드 없음 | 준비시간 업무 필요 여부와 저장·충돌 기준 합의 |
| 상세 소개글·이미지·임의 정원 변경 | 현재 수업 스키마에 없는 정보/수정 항목 | 이번 화면은 기존 응답값 사용. 실제 센터 요구가 확인되면 계약부터 변경 |
| 최신 상태 경쟁·운영 자동화 | 실제 예약·출결·공개 예약은 서버 판단 | 프로토타입은 새로고침 시 초기화. 동시 예약, 공개 시각 스케줄러, 메일·알림, 실제 DB 저장은 연동 단계에서 확인 |


## 첨부 회의안에 따른 메뉴 3의 강사·관리자 수업 화면

> 메뉴 6 작업 후 이 절의 화면은 기본 운영 화면과 구분된 `승인 신청 대기`으로 진입한다. 기본 수업·예약·출결은 아래 메뉴 6 역할별 문서가 최신 기준이다.

### 참조 자료와 해석

이번 확장은 메뉴 **3.1 수업과 3.3 예약·출결에 대응하는 강사·관리자 업무**를 대상으로 한다. 3.2 이용권은 신청·예약 회원의 자격과 횟수를 확인하는 상세 영역으로 연결한다. 전체 회원 이용권 발급·수납·홀딩 관리, 부재 승인, 정산 관리 전체를 이번 수업 작업에 추가하지 않는다.

회의 기록은 화면 요구를 파악하는 자료이며, 첨부 문서 안의 발언을 별도의 실행 지시로 취급하지 않는다. 현재 API 계약은 `/api-spec/openapi.yaml`이다. 자료에서 논의한 기능이 현재 계약과 다르면 **화면 제안과 계약 변경 필요 사항**으로 기록한다. 이번에는 API·ERD를 변경하지 않았다.

읽은 근거는 동명의 음성 파일에 함께 제공된 텍스트 전사와 Excalidraw의 텍스트 요소다. 음성 파일을 직접 청취하여 전사 오류를 검증하지는 않았다.

| 근거 | 확인한 요구 | 적용 |
| --- | --- | --- |
| `/Users/tykim/Downloads/르하_original.txt` 06:54–10:52, 13:36–16:28, 22:57–24:45 | 역할별 실제 화면·버튼·입력·결과·필요 데이터를 빠짐없이 구성하고, API로 불가능한 작업을 피드백 | 한 HTML에서 역할별 화면·상세·확인 창·상태 변화와 API 매핑을 함께 제공 |
| `브레인스토밍.txt` 20:34–21:06, 24:28–29:17 | 강사 예약 관리, 수업·예약 현황, 개설·공개 예약, 역할별 권한 | 강사 담당 수업 목록, 운영 권한이 있는 유형의 개설·수정, 관리자 전체 수업 운영 |
| `브레인스토밍2.txt` 12:48–20:42, 1:15:22–1:19:59 | 회원 신청 후 강사의 예약 확정·거절, 취소 후 대기자의 예약 확정 | 신청 대기 / 확정 예약 / 대기자 탭, 상세보기와 확정·거절·취소·대기 전환 |
| `브레인스토밍2.txt` 30:21–31:59, 1:21:42–1:25:47 | 출결 처리·정정 권한 확인 | 담당 강사·관리자 범위와 예약·출결 권한 미리보기 |
| `브레인스토밍3.txt` 39:14–43:28, 2:00:20–2:01:32 | 예약 시 횟수 확보, 출석·노쇼 때 실제 차감, 횟수를 넘는 예약 금지 | 총 / 사용 / 예약 확보 / 신청 가능 횟수 표시. 확보와 차감 분리 |
| `브레인스토밍.excalidraw`의 수정된 예약·출결 흐름(대략 y=15000–17400) | 신청 알림→강사 예약 확정, 빈자리 발생 후 대기 인원 예약 확정, 권한별 출결·정정 | 해당 행동을 역할별 수업 상세와 예약 회원 상세의 버튼으로 연결 |
| Excalidraw의 수업 종료·전체 출결 흐름(대략 y=9000–13000) | 수업 종료와 전체 출결 완료를 구분 | 수업 종료 처리와 전체 출결 현황을 별도로 표시. 실제 정산 실행은 포함하지 않음 |

### 화면과 진입 경로

| 역할 | 화면 진입 | 화면에서 할 수 있는 행동 |
| --- | --- | --- |
| 강사 | 로그인 `강사 계정` → `수업 목록` 또는 `예약 신청·대기 관리` | 담당 수업 상세, 회원 신청 상세, 예약 확정·신청 거절, 확정 예약 취소, 대기자 순서 확인·예약 전환·대기 취소, 출석·노쇼·정정, 수업 종료 |
| 관리자 | 로그인 `관리자 계정` → `수업 운영` 또는 `예약 신청·대기 관리` | 전체 강사 수업의 같은 예약 업무 + 개설·수정·공개 예약·공개/비공개·수업 취소 |
| 강사 운영 권한 예시 | 하단 `회의안 미리보기` → `단체 3:1 개설·수정 권한` 체크 | 해당 유형의 개설·수정·공개·취소. 담당 수업이라는 이유만으로 수업 운영 권한을 부여하지 않음 |

강사는 다른 강사의 공개 수업 상세를 볼 수 있어도 신청 회원·예약자·대기자·출결을 볼 수 없다. 회의에서 논의된 예약 처리·출결 권한은 미리보기 체크박스로 제한 상태를 체험한다. 실제 인증·인가 규칙은 API 계약 협의가 필요하다.

신청·예약·대기 화면은 수업 선택 후 다음 탭으로 구성한다.

- **신청 대기:** 신청한 회원의 상세와 이용권 확인 → 예약 확정 / 사유를 입력한 신청 거절.
- **확정 예약:** 확정된 회원 확인 → 예약 상세 / 사유를 입력한 예약 취소.
- **대기자:** 신청 시각·순서·신청 가능 횟수 확인 → 첫 대기자부터 빈자리·유효 이용권을 검사한 예약 확정 / 대기 취소.
- **출결:** 확정 예약만 처리 대상으로 표시 → 출석 또는 노쇼 확정 / 정정. 시작 전에는 처리 불가.
- **취소·거절:** 거절·예약 취소·대기 취소의 회원과 사유 확인.

상세 창은 회원명·수업명·일시·강사·룸·신청 번호·상태·이용권·만료일·결제 상태를 구분하고 `총 횟수 / 사용 / 예약 확보 / 신청 가능` 표를 표시한다. 목록 버튼과 상세 안의 처리 버튼은 같은 행동으로 연결한다.

### 회의안 예시의 상태 변화와 횟수

회의안 전용 `workflowStore`는 기존 회원의 즉시 예약 예시와 독립된 메모리 데이터다. 강사와 관리자는 동일한 회의안 데이터를 공유하지만, 이 회의안의 처리가 기존 회원 화면의 API 방식 예시에 자동 반영되지는 않는다. 회원까지 같은 승인 방식으로 바꾸려면 계약 변경과 회원 흐름의 합의가 먼저 필요하다.

| 행동 | 회의안 상태 변화 | 좌석·횟수 변화 |
| --- | --- | --- |
| 신청 대기 → 예약 확정 | REQUESTED → CONFIRMED | 이미 확보한 좌석·횟수 유지. 추가 확보·차감 없음 |
| 신청 거절 | REQUESTED → REJECTED | 좌석·횟수 확보 해제, 거절 사유 기록 |
| 확정 예약 취소 | CONFIRMED → CANCELED | 좌석·횟수 확보 해제, 취소 사유 기록 |
| 대기 회원 예약 확정 | WAITING → PROMOTED + 새 CONFIRMED 예약 | 빈자리와 신청 순서·이용권 재검사 후 좌석·횟수 확보 |
| 대기 취소 | WAITING → CANCELED | 대기는 확보하지 않았으므로 사용 횟수 변화 없음 |
| 출석 / 노쇼 확정 | CONFIRMED → ATTENDED / NO_SHOW | 해당 예약의 확보 1회를 해제하고 사용 횟수에 1회 반영 |
| 출석↔노쇼 정정 | ATTENDED ↔ NO_SHOW | 두 상태 모두 1회 사용으로 보는 예시. 재차감하지 않음 |
| 수업 취소 | 수업 → CANCELED, REQUESTED/CONFIRMED/WAITING 모두 취소 | 신청·예약의 확보 해제. 사용 완료한 기록은 이 흐름으로 취소하지 않음 |
| 수업 종료 처리 | 별도 ended 예시 표시 | 전체 출결 완료와 분리. 둘 다 완료되면 실적 확인 대상 표시 |

`신청 가능 = 총 횟수 - 사용 횟수 - REQUESTED/CONFIRMED로 확보한 횟수`다. 이 예시의 상태명·ended·charged·사용/확보 구분은 제안 모델이며 실제 API 스키마 필드라고 해석하면 안 된다.

자동 대기 승급은 구현하지 않았다. 이번 회의안 화면은 빈자리 발생 후 담당자가 첫 대기자를 확정하는 수동 흐름이다. 대기 취소와 신청 거절의 상세 정책, 승인 대기 만료 시각, 미수 사용 예외, 권한 세분화, 정산 이후 정정은 팀 결정이 남아 있다.

### API 연결 가능 여부와 누락 사항

| 화면·동작 | 현재 API / 연결 상태 | 계약 보완·결정 필요 |
| --- | --- | --- |
| 수업 목록·상세·드롭다운 | `getLessons`, `getLesson`, `getLessonTypes`, `getInstructors`, `getRooms` | 현행 목록 조건·조회 권한 사용 가능 |
| 수업 개설·수정·공개·공개 예약·취소 | `createLesson`, `updateLesson`, `changeLessonStatus`, `cancelLesson` | 현행 API는 RESERVED 예약만 처리. 회의안의 신청 대기·횟수 확보·대기 취소까지 영향 범위를 확장하려면 정책·계약 변경 필요 |
| 수업별 확정 예약자 조회 | `GET /lessons/{lessonId}/reservations` · `getLessonReservations` | 현행 응답의 RESERVED는 즉시 생성된 예약. 신청 대기 목록을 임의로 같은 상태로 해석하지 않음 |
| 예약 신청 대기 목록·강사 확정·거절 | **API·ERD 상태 없음** | 신청/확정/거절 상태, 확정·거절 요청/응답, 좌석 확보·타임아웃·알림·권한 설계. 임의의 엔드포인트를 정의하거나 구현 완료로 표시하지 않음 |
| 관리자 예약 취소 | `POST /reservations/{reservationId}/cancellations` · `cancelReservation` | 현행은 잔여 횟수 복구. 회의안은 확보 해제이므로 차감 방식 합의 필요 |
| 강사 예약 취소 | **현재 API 권한 미지원** | 현행은 본인 회원 또는 관리자만 허용. 담당 강사의 취소 권한과 영향·알림을 합의 |
| 대기자 목록·순번·승급·취소 | **API 없음** | 수동 강사 확정과 자동 승급 중 운영 정책 결정, 순번·유효 이용권·동시성·시작 전 제한·알림 계약 필요 |
| 출석·노쇼·정정 | `PUT /reservations/{reservationId}/attendance` · `confirmAttendance` | 현행은 추가 차감 없음. 회의안의 출결 시 차감을 적용하려면 확보/사용 데이터와 요청 처리 규칙 변경 |
| 수업 종료·전체 출결 완료 | **별도 상태 변경 API 없음** | 수업 시간 종료와 수동 종료 여부, 출결 완료 판정, 실적 확정·정산 반영 시점 합의. 정산 API를 대신 호출하지 않음 |
| 예약 회원의 상세 이용권 횟수 | 관리자: `getPass`; 강사: 예약 응답의 pass 요약 | 강사에게 총/사용/확보/신청 가능·결제/만료 정보가 필요한지 결정. 현행 pass 요약만으로 회의안 표 전체를 구성할 수 없음 |
| 세부 권한 확인 | `GET /members/me` · `getMyProfile` 및 `permissions` | 수업 유형별 개설·수정 권한은 기존 계약 있음. 예약 확정·취소·개별 출결 권한은 이번 미리보기 체크박스와 1:1 대응하는 계약이 아님 |
| 예약 신청·확정·거절·대기 전환 알림 | **현재 알림 발생 종류 미지원** | 기존 읽음 API는 재사용 가능. 해당 업무 이벤트별 알림 발생·종류·본문·관련 ID 계약 필요 |

### 회의안 화면 확인용 예시

- **저녁 코어 필라테스(10/12 18:00):** 기존 확정 2명 + 윤서연의 신청 대기 1명. 신청 확정/거절과 빈자리 발생 후 임유진의 대기 확정을 볼 수 있다.
- **리포머 밸런스(10/11 14:00):** 확정 예약 3명으로 정원 마감, 대기 2명. 확정 예약 1명 취소 → 첫 대기자 예약 확정 → 다음 대기자 순서 변경을 볼 수 있다.
- **오후 리포머 입문(10/13 16:00):** 신청 대기 3명, 대기 1명. 여러 신청의 확정·거절과 좌석 해제를 확인한다.
- **모닝 리포머(10/11 09:00):** 출석 완료 1명 + 출결 미처리 1명. 출결 확정·정정, 수업 종료, 전체 출결 완료 표시를 확인한다.
- **개인 체형 교정(10/12 19:30):** 박강사의 개인 수업 신청. 김강사 역할에서는 예약자 관리에 접근할 수 없고 관리자는 접근할 수 있다.


## 회원·강사·관리자 알림 목록·상세·읽음 처리

세 역할 모두 본인 알림 데이터를 따로 사용하며 같은 목록·상세 UI를 제공한다. 초기 예시는 회원·강사·관리자 각각 읽지 않은 알림 10개이며, 역할별로 서로 다른 ID와 내용을 사용한다. 알림 제목 또는 `상세보기`를 누르면 해당 알림을 읽음으로 표시하고 읽기 전용 상세 창을 연다. 상세는 분류·제목·본문·받은 시간·읽은 시간과 `닫기` 버튼으로 구성한다. 목록의 읽음 상태, 헤더의 미확인 건수, 강사 홈의 알림 건수·최근 알림도 같은 데이터로 갱신한다. `모두 읽음으로 표시`와 읽지 않은 알림 필터도 동작한다. 알림을 읽는 것은 부재 승인 같은 업무 처리를 수행하지 않는다.

| 화면 동작 | API · operationId | 연결 기준 |
| --- | --- | --- |
| 내 알림 목록·읽지 않은 알림 필터 | `GET /notifications` · `getMyNotifications` | `page`, `size`, `unread=true` 선택. `id`, `type`, `title`, `message`, `read`, `readAt`, `createdAt`를 표시 |
| 제목·상세보기 클릭 | `PUT /notifications/{notificationId}/read` · `readNotification` | 본인의 선택한 알림 ID. 성공(204) 후 읽음 상태·미확인 건수를 갱신하고 상세 창 표시. 이미 읽은 알림은 상세만 표시 가능 |
| 알림 상세 표시 | 선택한 목록 응답 객체 | 별도 상세 조회 API 없음. 목록의 제목·본문·분류·시각을 사용하며 읽은 시각은 서버 목록 재조회로 확보 |
| 모두 읽음으로 표시 | `PUT /notifications/read` · `readAllNotifications` | 본인 알림만 처리. 성공 후 목록과 읽지 않은 알림 수 재조회 |
| 헤더·대시보드 알림 수 | `GET /notifications/unread-count` · `getMyUnreadNotificationCount` | 목록 일부의 건수가 아니라 서버의 전체 미확인 건수 사용 |

현재 HTML은 메모리 데이터로 읽음 상태를 변경하므로 새로고침하면 초기화된다. 실제 연동에서는 읽음 API 실패 시 읽음으로 확정하지 않고 오류·재시도를 제공해야 한다. 알림 예시는 현재 계약의 `LESSON_CANCELED`, `RESERVATION_CANCELED`, `ABSENCE_REQUESTED`, `ABSENCE_APPROVED`, `ABSENCE_REJECTED`를 사용하며 다른 종류의 알림 발생을 임의로 구현하지 않았다.

## 기존 인증·대시보드의 추가 확인 사항

- **대시보드 집계:** 오늘 수업 수, 출결 수, 예약 수를 한 번에 주는 대시보드 API는 없다. 역할별 목록 API를 조회하고 프론트에서 계산해야 한다.
- **대기 예약:** 메뉴에는 대기 신청·대기자 목록이 있으나, 현재 `createReservation`은 정원이 찬 경우 `LESSON_FULL` 오류를 반환하며 대기 예약을 제공하지 않는다. 대기자 API도 없다.
- **일반 회원 직접 등록:** 메뉴 구조에는 관리자의 회원 직접 등록이 있으나, `/members` POST 요약은 강사/관리자 등록으로 되어 있다. 회원 직접 등록 플로우를 붙이기 전에 계약을 확인해야 한다.
- **관리자 기타 승인:** 현재 승인 API로 확인되는 것은 강사 부재 승인/반려다. 다른 승인 종류는 연결할 API가 정의되어 있지 않다.
- **강사 계정 범위:** 강사는 공개 수업과 본인 담당 수업 등을 조회할 수 있으므로, 오늘 담당 수업 위젯은 `instructorId` 필터를 포함해야 한다.


<a id="menu-4"></a>

## 메뉴 4. 회원 관리 — 관리자 와이어프레임

### 범위와 사용 경로

`menu-structure.md`의 4번은 **관리자용 메뉴**다. 이번 화면은 관리자에게만 표시한다. 회원의 내 계정 화면과 강사의 수업별 예약자 화면은 이 메뉴가 아니다. 다만 현행 API는 `MEMBER_READ`를 가진 강사에게 회원 목록·상세·예약 조회를 허용하므로, 운영에서 강사 조회 화면까지 제공할지는 별도 권한·메뉴 결정이다. 이번에는 강사 회원 관리 화면을 추가하지 않았다.

- 로그인 화면에서 관리자 계정 미리보기 → 로그인 → 왼쪽 `회원 관리`.
- 회원 목록에서 회원 이름 또는 `상세보기` → 회원 상세.
- 목록의 `회원 등록` → 직접 등록 제안 폼 → 예시 저장 → 신규 회원 상세.
- 회원 상세의 `회원 정보 수정` → 수정 폼 → 저장 → 동일 회원 상세.
- 회원 상세의 `상태 변경` → 활성/비활성 선택 → 확인 → 목록·상세에 변경 반영.
- 상세 탭 `기본 정보 / 이용권 / 예약·출결 / 결제`를 클릭해서 전환.
- 각 이용권·예약·결제 행의 `상세보기` → 항목별 읽기 전용 창 → 닫기.
- 이용권 탭의 `회원 이용권 메뉴에서 보기` → 선택 회원만 표시하는 이용권 조회 화면 → `회원 상세로 돌아가기`.
- 왼쪽 `회원 이용권`을 직접 누르면 전체 회원 이용권 조회 화면을 표시한다. 이번 작업은 메뉴 4에서 필요한 이용권 조회와 메뉴 7로의 진입까지이며, 발급·재등록·홀딩·결제 변경 처리는 포함하지 않는다.

### 화면·버튼에 연결할 기존 API

| 화면·행동 | 기존 API · operationId | 요청·연결 기준 |
| --- | --- | --- |
| 회원 목록 진입·검색·상태 필터·페이지 | `GET /members` · `getMembers` | `role=MEMBER`, 이름/이메일 `keyword`, `status`, `page`, `size`. 최신 가입순. 목록은 회원명·ID·이메일·연락처·가입일·상태·상세 버튼으로 구성. 최근 수업 등 목록 응답에 없는 값을 임의로 사용하지 않음 |
| 회원 이름·상세보기 클릭 | `GET /members/{memberId}` · `getMember` | 행의 회원 ID로 조회. 이름이 같은 회원도 ID·이메일로 구분 |
| 회원 정보 수정·저장 | `PATCH /members/{memberId}` · `updateMember` | `name`, `phoneNumber`, `birthDate`, `address` 중 변경된 필드만 전송. 주소 삭제는 `null`. 이메일 변경 불가. 이 메뉴는 일반 회원의 정보 수정에 집중하며 역할 변경 기능은 제공하지 않음 |
| 계정 상태 변경 | `PUT /members/{memberId}/status` · `changeMemberStatus` | `{ status: ACTIVE 또는 INACTIVE }`. 비활성 시 로그인 불가·토큰 폐기, 연관 데이터 보존. 시작 전 RESERVED 예약이 있으면 비활성 불가. 탈퇴 회원은 ACTIVE로만 복구 |
| 상세 이용권 탭·선택 회원 이용권 메뉴 | `GET /passes` · `getPasses` | `memberId` 유지, 필요 시 이용권 `status`, `page`, `size`. 전체 회원 이용권 메뉴에서는 회원 필터 없이 조회 |
| 이용권 상세보기 | `GET /passes/{passId}` · `getPass` | 회원·상품·담당 강사·총/잔여 횟수·기간·상태·가격·결제 상태·미수금. 사용 횟수는 현행 계약의 `totalCount - remainingCount`로 표시하며 출석 횟수와 같다고 해석하지 않음 |
| 예약·출결 탭·필터 | `GET /reservations` · `getReservations` | `memberId`, `status`, `lessonFrom`, `lessonTo`, `page`, `size`, `order=DESC`. 화면 날짜는 서울 날짜로 입력, 종료일 다음 날 자정을 UTC로 변환하여 종료 미포함 범위 사용 |
| 예약·출결 상세보기 | `GET /reservations/{reservationId}` · `getReservation` | 예약 ID로 조회. 본인 회원 정보·수업·시간·강사·룸·상태·사용 이용권 표시. 이번 탭은 조회용이며 예약 취소·출결 변경 버튼은 추가하지 않음 |
| 결제 탭·기간·수단·환불 여부 필터 | `GET /payments` · `getPayments` | `memberId`, `paidFrom`, `paidTo`, `method`, `refunded`, `page`, `size`, `sortBy=paidAt`, `order=DESC`. 결제 날짜 범위는 현지 날짜이며 양끝 포함 |
| 결제 상세보기 | 선택한 결제 목록 응답 객체 | 별도 결제 단건 조회 API 없음. 목록의 기록 ID·회원·이용권·금액·수단·결제일·메모·환불 표시·환불일·환불 메모로 구성. 결제 수정·송금·환불 실행 기능으로 해석하지 않음 |
| 탭 전환·목록으로·닫기 | 화면 이동 | 이동 자체에 변경 API 없음. 실제 구현에서는 목적지에 필요한 조회만 수행 |

### 현재 API가 없어 추가해야 할 기능

| 요구 | 현재 빠진 부분 | 현재 와이어프레임의 처리 |
| --- | --- | --- |
| 관리자 일반 회원 직접 등록 | `POST /members`는 강사/관리자 전용이며 `MemberCreateRequest.role`도 ADMIN/INSTRUCTOR만 허용. MEMBER로 호출할 수 없음 | 등록 폼과 입력 검증·중복 이메일·등록 후 상세 진입은 예시 데이터로 제공. 폼에 **API 미지원 · 화면 제안** 표시. 실제 등록·초대 메일 발송 없음 |
| 별도 휴면 상태·휴면 처리 | `MemberStatus`에 DORMANT 등 휴면 상태 없음. 상태 변경 요청은 ACTIVE/INACTIVE만 허용 | 휴면 상태를 임의로 만들지 않고 활성·비활성·탈퇴 표시. 관리자가 탈퇴 상태로 변경하는 버튼도 제공하지 않음 |

### 팀이 결정해야 할 부분

1. **일반 회원 직접 등록 방식:** 직접 등록을 허용할지, 초대 링크로 이메일·비밀번호를 설정하게 할지, 기존 공개 회원가입과 중복 회원을 어떻게 처리할지 결정해야 한다. 결정 후 OpenAPI부터 수정한다. 강사 등록 API를 그대로 회원 등록에 사용하지 않는다.
2. **‘휴면’의 의미:** 단순 로그인 차단이면 INACTIVE를 사용할지, 장기 미접속에 따른 별도 휴면 상태가 필요한지 정한다. 비활성은 이용권 홀딩과 다른 개념이다. 계정 비활성화로 만료일이 자동 연장되지 않는다.
3. **회원 예약·이용권 기준:** 이번 회원 관리 조회는 기존 API의 즉시 예약·예약 때 1회 차감 방식이다. 앞의 강사·관리자 회의안의 신청 승인·횟수 확보·출결 시 차감 방식과 합치려면 정책·API·ERD 변경이 먼저 필요하다.
4. **강사 조회 권한:** API에는 MEMBER_READ가 있지만 메뉴 4는 관리자용이다. 강사에게 별도 조회 화면을 줄지, 어떤 회원 정보를 보여줄지는 추가 결정이다.

### 예시 데이터와 제한

- 기존 한 HTML에 누적 추가했다. 회원/강사 사이드바에는 회원 관리 메뉴를 추가하지 않았다.
- 목록은 일반 회원 8명, 5명씩 페이지 이동하며 동일 이름의 이수진 회원을 서로 다른 ID·이메일로 구분한다. 비활성·탈퇴 회원과 이용권/예약/결제가 없는 사례도 포함한다.
- 홍길동은 이용권 10회 중 잔여 7회, 출석 완료 1건·향후 예약 1건, 카드 결제 1건을 확인할 수 있다. 홍길동의 잔여 횟수는 기존 회원 화면의 메모리 값과 공유한다.
- 예약·출결 조회는 기존 `courseStore`의 현행 API 방식 데이터를 사용한다. 회의안 전용 `workflowStore`의 강사 신청 확정·대기 처리는 합치지 않는다.
- 상태 변경의 시작 전 예약 검사도 기존 `courseStore` 기준이며 서버의 최종 검증을 대신하지 않는다. 예시에서는 미래 예약이 있는 홍길동의 비활성화가 차단된다. 비활성 회원 김서현은 활성화, 탈퇴 회원 오지훈은 활성으로 복구하는 흐름을 제공한다.
- 이용권 상태와 계정 상태는 각각 표시한다. 계정 비활성화가 이용권·결제 기록을 삭제하지 않는다.
- 결제 환불 표시는 기존 계약대로 기록의 표시값이며 결제 합계·미수금·이용권을 자동으로 수정하지 않는다.
- 검색·필터·모달·수정·상태 변경·등록은 서버 호출이 없는 메모리 예시다. 새로고침하면 초기화된다. 관련 내역 탭은 소량의 예시 데이터를 모두 표시하며 실제 구현에서는 각 목록 API의 `pageInfo`에 맞춰 페이지 처리가 필요하다.
- 실제 연동은 실패 시 저장 완료로 표시하지 않고 오류를 유지해야 한다. 중복 이메일, 권한 없음, 회원 없음, 시작 전 예약으로 인한 비활성 불가 등의 서버 에러에 대응해야 한다.
- 이번 작업에서 API·ERD는 변경하지 않았으며 실행 테스트·브라우저 화면 검증은 수행하지 않았다.


<a id="menu-5"></a>

## 메뉴 5. 강사 관리 — 회원·강사·관리자별 화면과 API

메뉴 구조 5.1 강사 목록·계정·권한, 5.2 부재, 5.3 퇴사·수업 인계·퇴사자 정산을 기존 HTML에 누적 추가했다. 현재 API 계약의 권한·상태·승인/퇴사/정산 제약을 기준으로 구성했으며 API·ERD는 변경하지 않았다.

| 역할 | 화면 진입 | 범위 | 상세 문서 |
| --- | --- | --- | --- |
| 회원 | 기존 수업 목록·상세·내 예약·이용권·알림 | 강사 관리 메뉴 없음. 강사 변경·수업 취소에 따른 회원 영향 확인 | [회원 API 매핑](#doc-05-instructor-management-member-api) |
| 강사 | 로그인 → 내 프로필 또는 부재 신청 | 본인 정보 수정·내 권한 조회·부재 신청/상세/승인 전 철회 | [강사 API 매핑](#doc-05-instructor-management-instructor-api) |
| 관리자 | 로그인 → 강사 관리 → 강사 목록 / 부재 관리 / 퇴사 관리 | 강사 등록/수정/계정 상태/권한, 부재 승인/반려/취소/수업 조정, 퇴사일/일괄 인계/완료, 선택 강사의 정산 계산/검토/확정/외부 지급 기록 | [관리자 API 매핑](#doc-05-instructor-management-admin-api) |

세 문서에 **기존 API / 현재 미지원 기능 / 팀 결정 사항 / 확인할 버튼 순서**를 따로 정리했다. 관리용 강사 목록은 `getMembers(role=INSTRUCTOR)`를 사용해야 하며, ID·이름만 반환하는 `getInstructors`는 담당 강사 선택용이다. 일반 회원 직접 등록과 달리 관리자 강사 등록은 기존 `createMember`가 지원한다.

강사와 관리자의 프로필·부재·퇴사·정산은 같은 예시 데이터를 사용한다. 부재 영향 수업은 현행 API 방식 `courseStore`를 사용하므로 회원 수업·예약·이용권과 연계한다. 기존 강사·관리자의 수업 메뉴에 있는 회의안 `workflowStore`는 별도 데이터이며, 승인·차감 정책 확정 전까지 변경을 자동 혼합하지 않는다. 상세 제한과 부족한 계약은 역할 문서를 참고한다.

와이어프레임은 실제 API·메일·송금을 호출하지 않는다. 새로고침 시 초기화된다. 실행 테스트·브라우저 검증은 수행하지 않았다.

<a id="doc-05-instructor-management-member-api"></a>

### 메뉴 5 강사 관리 — 회원 기준

#### 회원에게 어떤 화면이 있나요?

**회원에게는 강사 관리 메뉴가 없습니다.** 메뉴 5의 강사 계정 등록·권한·부재 사유·퇴사·정산은 관리자와 강사의 업무입니다.

회원은 기존 화면에서 다음 결과만 확인합니다.

| 확인할 화면·행동 | 기존 API | 화면에 표시할 내용 |
| --- | --- | --- |
| 수업 목록의 강사 필터 | `GET /instructors` · `getInstructors` | 활성 강사의 ID·이름만 표시. 연락처·이메일·권한·부재·퇴사·수당 정보는 표시하지 않음 |
| 수업 목록·상세의 담당 강사 | `GET /lessons` · `getLessons`; `GET /lessons/{lessonId}` · `getLesson` | 담당 강사가 바뀌면 재조회한 수업의 강사명으로 표시 |
| 내 예약·예약 상세 | `GET /members/me/reservations` · `getMyReservations`; `GET /reservations/{reservationId}` · `getReservation` | 수업 인계는 기존 예약을 유지. 수업 취소 시 예약 취소 상태와 취소 주체·사유 표시 |
| 수업 취소 후 이용권 확인 | `GET /members/me/passes` · `getMyPasses` | 기존 API 기준으로 예약에 차감했던 1회가 복구된 잔여 횟수 조회 |
| 취소 알림 목록 | `GET /notifications` · `getMyNotifications` | 지원하는 LESSON_CANCELED / RESERVATION_CANCELED 이벤트의 안내 |
| 알림 클릭·읽음·전체 읽음 | `PUT /notifications/{notificationId}/read` · `readNotification`; `PUT /notifications/read` · `readAllNotifications` | 상세 열기·읽음 처리. 읽음이 예약 변경을 수행하는 것은 아님 |
| 헤더 알림 수 | `GET /notifications/unread-count` · `getMyUnreadNotificationCount` | 전체 읽지 않은 알림 수 |

#### 기존 API로 가능한 부분

- 담당 강사의 이름과 수업 정보를 조회할 수 있습니다.
- 관리자가 강사를 바꿔도 기존 예약은 유지됩니다.
- 관리자가 수업을 취소하면 RESERVED 예약이 함께 취소되고 이용권 횟수가 복구됩니다.
- 회원은 알림과 내 예약에서 취소 결과를 확인할 수 있습니다.

#### API가 없거나 정책 확인이 필요한 부분

- **강사 변경 알림 종류:** 현재 알림 종류에는 강사 변경 전용 이벤트가 없습니다. 강사 변경 사실을 회원에게 알릴 필요가 있는지 결정 후 종류·메시지·발생 시점 계약을 보완해야 합니다.
- **강사 퇴사 알림:** 별도 퇴사 전용 회원 알림을 현재 API 지원 기능으로 표시하지 않습니다. 회원에게 필요한 것은 담당 수업·이용권 변경 안내인지 결정해야 합니다.
- **부재 정보 노출:** 회원용 부재 조회 API는 없습니다. 부재 신청 사유·승인/반려 상세를 회원에게 보여주는 화면을 만들지 않았습니다.
- **회의안과 횟수 기준:** 이번 강사 관리의 수업 취소는 기존 API의 예약 시 차감·취소 시 복구를 따릅니다. 회의안의 신청 승인·횟수 확보 모델과 합치려면 먼저 팀 결정과 API 변경이 필요합니다.

#### 와이어프레임 확인 예시

1. 관리자 로그인 → 강사 관리 → 부재 관리 → 김강사 `10/12 17:00~20:00` 부재 상세.
2. 겹치는 `저녁 코어 필라테스`에서 `강사 변경` → 박강사 선택 → 변경.
3. 로그아웃 → 회원 로그인 → 수업 목록 → 해당 수업 상세에서 박강사로 변경된 것을 확인.
4. 수업을 취소하는 경우에는 회원의 내 예약에서 취소 상태, 이용권 복구, 취소 알림을 확인.

현재 HTML은 서버 API를 호출하지 않는 예시입니다. 회원은 메뉴 5로 진입할 수 없으며 위 기존 화면에서만 결과를 확인합니다. 새로고침하면 초기화됩니다. 실행 테스트·브라우저 검증은 수행하지 않았습니다.


<a id="doc-05-instructor-management-instructor-api"></a>

### 메뉴 5 강사 관리 — 강사 기준

#### 확인할 화면

강사 로그인 후 다음 두 메뉴를 확인합니다.

- **내 프로필:** 본인 기본 정보·정보 수정·내 권한 조회·내 부재.
- **부재 신청:** 본인 부재 목록·필터·상세·신청·승인 전 철회.

관리자의 강사 목록·등록·권한 수정·부재 승인/반려·퇴사일 등록·수업 인계·정산은 강사에게 제공하지 않습니다. 퇴사 처리 후에는 로그인할 수 없고, 퇴사자의 정산은 관리자가 진행합니다.

#### 화면·버튼에 연결할 기존 API

| 화면·버튼 | API · operationId | 요청·응답 연결 |
| --- | --- | --- |
| 내 프로필 진입 | `GET /members/me` · `getMyProfile` | 로그인 강사 본인의 ID·이름·연락처·생년월일·주소·상태·permissions 등 표시 |
| 프로필 수정 → 저장 | `PATCH /members/me` · `updateMyProfile` | 변경한 name, phoneNumber, birthDate, address만 전송. 이메일 변경 불가. 주소 삭제는 null |
| 내 권한 탭 | `getMyProfile`의 `permissions` | 보유 코드 표시. 전체 코드의 설명은 프론트 표시 정의와 대응. 관리자 전용 getPermissions/getMemberPermissions를 강사 계정으로 호출하지 않음 |
| 내 부재 목록·상태·기간·페이지 | `GET /absences` · `getAbsences` | 본인 부재만 반환. status, from/to, page, size. from 이상/to 미만 범위와 겹치는 부재 조회 |
| 상세보기 | `GET /absences/{absenceId}` · `getAbsence` | 본인의 신청 ID. 기간·사유·상태·반려 사유·처리자·처리 시각 표시 |
| 부재 신청 폼 → 신청 | `POST /absences` · `createAbsence` | startAt, endAt, reason?만 전송. instructorId를 보내서 다른 강사 명의로 신청할 수 없음. 성공 후 REQUESTED |
| 승인 전 신청 철회 | `POST /absences/{absenceId}/cancellations` · `cancelAbsence` | REQUESTED인 본인 신청만 허용. APPROVED는 강사에게 취소 권한 없음 |
| 승인·반려 알림 | `getMyNotifications`, `getMyUnreadNotificationCount`, `readNotification`, `readAllNotifications` | ABSENCE_APPROVED/ABSENCE_REJECTED 이벤트. 상세를 읽어도 신청을 추가 처리하지 않음 |

시간 입력은 서울 현지 일시이며 API 요청은 UTC ISO 8601로 변환합니다. 화면 종료 날짜는 그 다음 날 서울 자정을 UTC로 변환해 to 미포함 범위로 사용합니다. 페이지는 1부터 시작합니다.

#### 동작과 제한

- 과거 시작 시각, 시작보다 빠르거나 같은 종료 시각을 막습니다.
- 본인의 REQUESTED/APPROVED 부재와 기간이 겹치면 신청할 수 없습니다.
- 승인 전에는 신청 철회 버튼을 제공합니다.
- 승인 후에는 철회 버튼을 제공하지 않습니다. 관리자가 취소해야 합니다.
- 승인·반려·취소 이후에도 신청 사유와 처리 결과는 상세에 남습니다.
- 다른 강사의 부재·권한·퇴사 정보는 조회하지 않습니다.
- 관리자와 강사는 같은 부재 예시 데이터를 사용합니다. 강사 신청 후 관리자 계정으로 전환하면 신청 내역을 볼 수 있습니다.

#### API가 없거나 팀이 결정해야 할 부분

| 항목 | 현재 기준 | 필요한 결정 |
| --- | --- | --- |
| 승인된 부재의 강사 취소 요청 | 강사 직접 취소는 불가. 별도 관리자 승인용 취소 요청 API 없음 | 취소 요청→관리자 확인 과정이 필요한지 결정 |
| 부재 신청 수정 | 수정 API 없음 | 기간·사유를 바꾸려면 승인 전 철회 후 재신청할지, 별도 수정 API를 추가할지 결정 |
| 강사 본인의 퇴사 신청 | 현재 퇴사일 등록·완료 API는 관리자 전용 | 강사가 직접 신청하는 화면이 필요하면 별도 요청/승인 계약 필요 |
| 강사 본인의 정산 조회 | 현재 정산 조회·처리 API는 관리자 전용 | 강사에게 지급 내역 조회나 검토를 제공할지 별도 결정 |
| 예약 처리 세부 권한 | 현재 permissions는 MEMBER_READ와 수업 유형별 개설·수정 코드 | 회의안의 신청 확정·거절 권한을 별도 추가할지 결정 |

#### 확인 순서

1. 강사 로그인 → 내 프로필 → 기본 정보와 내 권한 확인.
2. 프로필 수정 → 연락처 또는 주소 변경 → 저장.
3. 부재 신청 → 부재 목록에서 상세보기.
4. `＋ 부재 신청` → 10/15 09:00~12:00 신청 → 승인 대기 확인.
5. 승인 전에는 철회하거나, 관리자 로그인으로 승인/반려한 뒤 다시 강사로 로그인해 결과·알림 확인.

현재 강사 미리보기는 김강사(ID 2)입니다. 초대 메일·실제 인증·서버 호출은 수행하지 않습니다. 프로필·부재·알림 변화는 메모리 예시이며 새로고침 시 초기화됩니다. 수업 메뉴의 회의안 권한 체크박스는 별도 제안 예시로, 이 권한 설정과 실제 서버 연동된 것은 아닙니다. 실행 테스트·브라우저 검증은 수행하지 않았습니다.


<a id="doc-05-instructor-management-admin-api"></a>

### 메뉴 5 강사 관리 — 관리자 기준

기준: `docs/menu-structure.md` 5.1~5.3, `api-spec/openapi.yaml`.
화면: `docs/wireframes/wireframes.html`에 누적 추가. API·ERD는 변경하지 않았습니다.

#### 화면과 진입 경로

관리자 로그인 → 왼쪽 **강사 관리**.

| 메뉴·화면 | 확인·처리할 내용 |
| --- | --- |
| 강사 목록 | 이름/이메일 검색·계정 상태 필터·페이지·상세보기·강사 등록 |
| 강사 상세 / 기본 정보 | 개인정보·계정 상태·퇴사일·정보 수정·상태 변경 |
| 강사 상세 / 권한 | 보유 권한 조회·체크박스 선택·전체 교체 저장 |
| 강사 상세 / 부재 | 선택 강사의 신청 목록·상세 |
| 상단 부재 관리 | 전체 강사 부재·강사/상태/기간 필터·페이지·상세·승인/반려/취소 |
| 부재 상세 / 겹치는 수업 | 예약이 있는 수업 확인·담당 강사 변경·수업 취소 후 승인 재시도 |
| 상단 퇴사 관리 / 상세 | 퇴사일 등록/변경/취소·시작 전 수업·미래 수업 일괄 인계·퇴사 처리 |
| 퇴사·인계 화면 / 강사 정산 보기 | 선택 강사의 단가·정산 목록·계산·상세·검토 요청·확정·외부 지급 기록·폐기 |

상태 변경은 계정의 활성/비활성 처리입니다. 퇴사일 등록과 퇴사 완료는 별도의 업무입니다. 이 구분은 현재 API 기준이며 모든 세부 규칙이 회의에서 확정됐다는 뜻은 아닙니다.

#### 5.1 강사 계정·권한: 기존 API 연결

| 화면·버튼 | API · operationId | 연결 기준 |
| --- | --- | --- |
| 관리용 강사 목록·검색 | `GET /members` · `getMembers` | role=INSTRUCTOR, keyword(이름/이메일), status, page, size. /instructors는 활성 강사의 ID·이름만 주므로 관리용 목록으로 대체하지 않음 |
| 강사 상세보기 | `GET /members/{memberId}` · `getMember` | 목록의 강사 회원 ID로 조회 |
| 강사 등록 | `POST /members` · `createMember` | email, name, phoneNumber, birthDate, address?, role=INSTRUCTOR. 비밀번호 입력 없음. API는 비밀번호 설정 링크를 이메일로 발송. 화면은 성공 후 신규 강사 상세로 이동 |
| 이메일 설정 링크 | `POST /auth/password-resets` · `resetPassword` | 실제 초대 메일 링크에서 사용. 이번 관리자 화면에는 링크를 수신하는 후속 화면을 추가하지 않음 |
| 정보 수정 → 저장 | `PATCH /members/{memberId}` · `updateMember` | 변경한 name/phoneNumber/birthDate/address만 전송. 이메일은 수정 불가. 주소 삭제 null. 역할 변경 기능은 제공하지 않음 |
| 계정 상태 변경 | `PUT /members/{memberId}/status` · `changeMemberStatus` | ACTIVE/INACTIVE. 시작 전 비취소 담당 수업이 있으면 비활성 차단. RESIGNED는 ACTIVE로만 복구. 복구 시 퇴사일 제거, 권한은 자동 복구되지 않음 |
| 권한 목록 구성 | `GET /permissions` · `getPermissions` | API가 반환한 권한 코드·이름·설명으로 체크박스 구성. 유형 추가 시 목록도 변경되므로 실제 코드에서 고정 enum으로 사용하지 않음 |
| 강사 보유 권한 | `GET /members/{memberId}/permissions` · `getMemberPermissions` | 현재 보유 코드 체크 표시 |
| 권한 저장 | `PUT /members/{memberId}/permissions` · `updateMemberPermissions` | `{ permissions: [...] }` 전체 교체. 빈 배열은 전체 회수. INSTRUCTOR만 대상, 중복·미등록 코드 불가 |

권한 예시는 MEMBER_READ, LESSON_CREATE:GROUP_3, LESSON_UPDATE:GROUP_3, LESSON_CREATE:PRIVATE, LESSON_UPDATE:PRIVATE입니다. 퇴사 완료 상태에서는 이 UI의 권한 편집을 막고 복구 후 설정하도록 안내합니다.

#### 5.2 부재: 기존 API 연결

| 화면·버튼 | API · operationId | 연결 기준 |
| --- | --- | --- |
| 전체/선택 강사 부재 목록·필터 | `GET /absences` · `getAbsences` | instructorId, status, from/to, page, size. 기간은 겹침 기준. from 포함/to 미포함 UTC |
| 상세보기 | `GET /absences/{absenceId}` · `getAbsence` | 사유·상태·처리자·처리 시각·반려 사유 표시 |
| 부재 승인 | `POST /absences/{absenceId}/approvals` · `approveAbsence` | REQUESTED만 가능. 겹치는 비취소 수업에 예약이 하나라도 있으면 ABSENCE_HAS_RESERVATIONS, 승인 대기 유지. 예약 없는 수업은 승인과 동시에 자동 취소 |
| 부재 반려 | `POST /absences/{absenceId}/rejections` · `rejectAbsence` | REQUESTED만 가능. reason? 입력. 강사에게 표시 |
| 부재 취소 | `POST /absences/{absenceId}/cancellations` · `cancelAbsence` | 관리자 REQUESTED/APPROVED 둘 다 가능. 승인 때 취소된 수업은 되살아나지 않음 |
| 겹치는 수업 조회 | `GET /lessons` · `getLessons` 후 기간 겹침 확인 | 강사 ID와 UTC 수업 범위로 조회. 시작 전에 시작해서 부재와 겹치는 수업도 놓치지 않도록 조회 범위 확보 필요. API에 부재별 영향 수업 전용 조회 경로는 없음 |
| 겹치는 수업의 예약 확인 | `GET /lessons/{lessonId}/reservations` · `getLessonReservations` 및 reservedCount | 예약 존재를 확인하며 목록 첫 페이지 길이만으로 전체 판단하지 않음. 승인 API가 최종 검사 |
| 새 강사 선택 | `GET /instructors` · `getInstructors` | 활성 강사 후보. 현재 담당자 제외 |
| 강사 변경 | `PATCH /lessons/{lessonId}` · `updateLesson` | `{ instructorId }`. 시간과 예약 유지. 대상 강사 활성 상태·가능시간·승인 부재·퇴사일·시간 충돌은 서버 검증 |
| 수업 취소 | `POST /lessons/{lessonId}/cancellations` · `cancelLesson` | reason? 입력. 시작 전만 허용. RESERVED 예약 함께 취소·횟수 복구 |

관리자가 강사 명의로 부재를 직접 신청하는 API는 없습니다. createAbsence는 강사 본인만 허용하므로 관리자 신청 버튼을 만들지 않았습니다. 승인·반려 시 김강사 미리보기의 알림 예시에 결과를 추가하며 읽음 API는 기존 알림 계약을 사용합니다.

#### 5.3 퇴사·수업 인계: 기존 API 연결

| 화면·버튼 | API · operationId | 연결 기준 |
| --- | --- | --- |
| 퇴사일·상태 조회 | `getMembers(role=INSTRUCTOR)`, `getMember` | Member의 resignationDate/status 사용 |
| 퇴사일 등록·변경 | `PUT /members/{memberId}/resignation` · `registerResignation` | `{ resignationDate }`. 활성 강사의 오늘 또는 미래 서울 날짜. 등록 자체는 RESIGNED 변경이 아님 |
| 퇴사일 등록 취소 | `DELETE /members/{memberId}/resignation` · `cancelResignation` | 등록일 제거·새 배정 차단 해제. 이미 퇴사 완료면 불가 |
| 시작 전 담당 수업 조회 | `GET /lessons` · `getLessons` | instructorId, 현재 이후, 비취소. 퇴사일 당일/이후 수업 별도 표시 |
| 미래 수업 인계 | `POST /members/{memberId}/lesson-reassignments` · `reassignLessons` | `{ toInstructorId, from? }`. from UTC, 미입력 시 현재. 지정 강사의 이후 수업을 일괄 인계. 전체 성공/전체 실패. 실패 수업·사유는 invalidParams |
| 인계 후보 가능시간 확인 | `GET /members/{memberId}/availability` · `getInstructorAvailability` | 관리자 조회 가능. 새 강사의 가능시간·기존 수업·승인 부재·퇴사일과 배정 가능 여부 확인. 서버가 최종 검사 |
| 퇴사 처리 | `POST /members/{memberId}/resignation/completions` · `completeResignation` | 등록된 퇴사일 도래·시작 전 담당 수업 없음 필요. RESIGNED, 로그인 불가, 토큰 폐기, 권한 회수, 대기/미래 부재 취소 |
| 담당 이용권 조회·변경(연결 계획) | `GET /passes?instructorId=...` · `getPasses`; `PATCH /passes/{passId}` · `updatePass` | 퇴사·수업 인계로 담당 이용권은 자동 변경되지 않음. 이 작업은 안내만 제공, 이용권 인계 처리 UI는 메뉴 7에서 추가 필요 |

현재 일괄 인계 UI는 시작 전 수업을 대상으로 하며 기준 시각을 현재 이후로 제한합니다. 실패 시 일부 수업만 먼저 변경하지 않습니다. 새로 등록한 강사의 가능시간은 미설정이므로 예시의 인계 대상 검증에서 배정이 차단됩니다. 가능시간 설정 자체는 이번 5번 화면에 추가하지 않았으며 실제 배정을 위한 선행 설정입니다.

#### 퇴사자 정산: 기존 API 연결

| 화면·버튼 | API · operationId | 연결 기준 |
| --- | --- | --- |
| 선택 강사 정산 목록 | `GET /settlements` · `getSettlements` | instructorId 유지. 실제 구현 status, periodFrom/periodTo, page/size 가능. 퇴사한 강사도 조회 |
| 단가 조회·저장 | `GET /members/{memberId}/pay-rates` · `getPayRates`; `PUT /members/{memberId}/pay-rates` · `updatePayRates` | payRates: [{lessonTypeId, unitPrice}] 전체 교체. 체크 해제 유형 삭제. 수업 한 회당 금액, 인원 수와 무관 |
| 정산 계산 | `POST /settlements` · `createSettlement` | instructorId, periodStart, periodEnd. 서울 날짜 양끝 포함, 종료일은 오늘보다 과거. 기존 비폐기 정산과 기간 중복·미처리 출결·단가 누락 차단 |
| 정산 상세 | `GET /settlements/{settlementId}` · `getSettlement` | 수업별 items·출석/노쇼 수·계산 당시 단가·금액·미정산 사유 표시 |
| 검토 요청 | `POST /settlements/{settlementId}/review-requests` · `requestSettlementReview` | CALCULATED → REVIEW_REQUESTED. 현재는 관리자 내부 단계이며 강사 검토 권한을 뜻하지 않음 |
| 정산 확정 | `POST /settlements/{settlementId}/confirmations` · `confirmSettlement` | REVIEW_REQUESTED → CONFIRMED. 이후 금액 변경 불가 |
| 외부 지급 기록 | `POST /settlements/{settlementId}/payments` · `recordSettlementPayment` | CONFIRMED → PAID. paidAt, memo?. 실제 송금 없음. 확정 금액 전액 지급 기록, 분할 지급 미지원 |
| 정산 폐기 | `DELETE /settlements/{settlementId}` · `discardSettlement` | CALCULATED/REVIEW_REQUESTED만 가능. 폐기 후 출결 정정·재계산 가능. 확정 이후 폐기 불가 |

정산 계산은 수업 종료 플래그가 아니라 현재 API의 수업 시각·예약·출결을 기준으로 합니다. 취소되지 않은 예약이 있는 수업은 전원 노쇼여도 정산하며, 예약 없는 수업은 금액 0·NO_RESERVATION으로 표시합니다. 이미 계산한 단가는 단가 설정 변경에 따라 재계산되지 않습니다.

#### API가 없거나 팀 결정이 필요한 사항

| 항목 | 현재 기준과 남은 작업 |
| --- | --- |
| 관리자 대신 부재 신청 | 관리자 명의 대리 신청 API 없음. 필요 여부 결정 후 스펙 보완 |
| 부재 신청 수정·승인된 부재 취소 요청 | 별도 요청/승인·수정 API 없음. 철회 후 재신청 또는 관리자 직접 취소 방식으로 운영할지 결정 |
| 부재 영향 수업 전용 조회 | 전용 API 없음. 목록·예약 조회와 승인 실패의 invalidParams를 사용. 기간 겹침을 정확히 판단하는 조회 전략 필요 |
| 강사 변경·퇴사 안내 알림 | 현재 알림 종류에는 전용 이벤트 없음. 수업 취소 알림과 구분하여 발생 조건·대상·메시지 결정 |
| 예약 승인·거절 전용 권한 | 회의안 권한이 현행 permissions와 1:1로 대응하지 않음. 새로운 권한 코드를 임의로 저장하지 않음 |
| 퇴사 시 담당 이용권 인계 | 개별 updatePass는 존재하지만 일괄 인계는 없음. 자동 변경 여부·일괄 처리 필요 여부 결정. 이번 화면은 자동 인계하지 않음 |
| 퇴사자 정산·강사 조회 | 정산은 관리자 전용이며 퇴사자의 강사 로그인을 허용하지 않음. 본인 지급 내역 접근 경로가 필요하면 별도 결정 |
| 활성·비활성·휴면 | 현재 API의 로그인 차단·복구 규칙을 화면에 반영. 회의의 상태 관리/휴면 표현과 동일한 운영 의미인지 팀 확인 필요 |
| 부재·퇴사와 회의안 예약 상태 | 현재 API는 RESERVED를 기준으로 예약을 처리. 회의안 REQUESTED/CONFIRMED·대기/횟수 확보까지 적용하려면 승인 차단·수업 취소·인계 정책 확장 필요 |

#### 확인할 예시

1. 강사 관리 → `＋ 강사 등록` → 입력·등록 → 신규 강사 상세. 예시 저장이며 메일 발송 없음.
2. 김강사 상세 → 권한 → 수업 유형별 권한 체크·저장 → 보유 권한 확인.
3. 부재 관리 → 김강사 `10/12 17:00~20:00` → 예약 있는 수업 때문에 승인 차단.
4. 겹치는 `저녁 코어 필라테스`의 강사를 박강사로 바꾸거나 수업 취소 → 부재 승인 재시도.
5. 김강사 `10/13 09:00~12:00` 부재 승인 → 예약 없는 `기초 리포머` 자동 취소. 승인된 부재를 취소해도 수업은 복구되지 않음.
6. 퇴사 관리 → 김강사 상세 → 퇴사일 등록 → 수업 인계 → 퇴사일 도래/남은 미래 수업 여부에 따라 완료 가능 여부 확인. 예시 기준일은 2026-10-11이므로 10/12 퇴사일은 아직 완료 불가.
7. 퇴사 상태의 이강사 → 정산 보기 → 9/21~9/30 계산 → 정산 3개·미정산 1개·110,000원 → 검토 요청 → 확정 → 외부 지급 기록.

#### 예시 구현과 제한

- 회원은 강사 관리 메뉴 없음. 강사는 본인 프로필·부재만, 관리자는 전체 관리 화면을 제공.
- 강사·관리자는 동일한 instructorMgmtStore의 프로필·권한·부재·퇴사·정산 예시를 사용.
- 부재 영향 수업·인계·취소는 기존 API 기준 courseStore를 사용. 회원 수업·예약·이용권, 회원 관리 조회와 메뉴 6 기본 수업 운영에 반영됨. 메뉴 6 기본 수업 운영에도 같은 변경이 반영됨. 별도 `승인 신청 대기`의 workflowStore에는 같은 변경을 자동으로 적용하지 않음. 신청 승인 모델의 계약 변경이 필요한 상태이므로 혼합하지 않음.
- 정산은 예시 과거 수업과 courseStore의 끝난 수업으로 계산. 정산에 포함된 courseStore 수업의 직접 출결 정정은 폐기 전 차단. 별도 회의안 출결 데이터와 서버 정산 잠금은 연결하지 않음.
- 김·박강사의 인계 검증용 가능시간은 모든 요일 09:00~21:00 예시. 실제 영업시간·가능시간·부재·퇴사·충돌 검사와 동시성 보장은 서버가 최종 처리해야 함.
- 관리용 강사 목록·부재 목록은 5개씩 예시 페이지 이동. 소량의 퇴사·정산 목록/내역은 전체 예시를 표시하며 실제 구현은 각 pageInfo 기준으로 페이지 조회.
- 실제 API·인증·메일·송금 호출 없음. 메모리 변경이며 새로고침하면 초기화. 계정 상태의 로그인 불가·토큰 폐기는 실제 인증 서버 동작이고 역할 선택 미리보기는 실제 인증을 대체하지 않음.
- 현재 초대 링크 수신·비밀번호 설정 후 로그인, 가능시간 설정, 담당 이용권 인계 UI는 별도 작업이 필요함.
- 저장 실패 시 완료로 표시하지 않고 폼/확인 창 오류 유지. 부재 승인 차단·기간 겹침·미래 수업 잔존·퇴사일 미도래·정산 기간 중복 등의 예시 오류를 안내.
- 실행 테스트·브라우저 검증은 수행하지 않음.

#### 메뉴 9 추가 후 정산 화면

강사 정산 보기는 메뉴 9의 동일 저장소·목록·상세에 연결한다. 전체 목록은 왼쪽 강사 수당·정산에서 조회하며 강사/상태/겹치는 기간 필터와 항목·이력 페이지를 제공한다. 기존 퇴사 강사 110,000원 계산 예시는 유지한다. 상세 연결·수정/재계산·현재 없는 API는 [관리자 API 상세](#doc-09-instructor-settlements-admin-api)가 최신 기준이다.


<a id="menu-6"></a>

## 메뉴 6. 수업 운영 — 필요한 역할의 화면과 API

메뉴 구조 6.1 수업 회차, 6.2 반복 일정(고려 중), 6.3 예약·출결을 기존 HTML에 누적 반영했다.

| 역할 | 확인 위치 | 범위 | 역할별 문서 |
| --- | --- | --- | --- |
| 회원 | 기존 수업 목록 / 내 예약·대기·출결 / 내 이용권 / 알림 | 관리자용 수업 운영 메뉴 없음. 수업 공개·변경·취소·출결 결과, 본인 예약/취소 및 대기 제안 확인 | [회원 API 매핑](#doc-06-lesson-operations-member-api) |
| 강사 | 수업 목록 / 수업별 예약자 / 출결 처리 | 담당 예약자·출결·정정, 유형별 권한이 있는 개설/수정/공개/취소, 반복 제안 | [강사 API 매핑](#doc-06-lesson-operations-instructor-api) |
| 관리자 | 수업 운영 → 수업 회차 / 예약 현황·출결 / 반복 일정 · 제안 | 전체 수업·예약·출결 운영, 예약 취소, 반복 생성/수정 제안, 대기 자동 승급 제안 | [관리자 API 매핑](#doc-06-lesson-operations-admin-api) |

### 기존 화면과 달라진 부분

- 기본 운영 화면은 현재 API의 RESERVED 즉시 예약·예약 차감 기준으로 변경했다. courseStore를 회원·관리자·강사·회원 관리·부재/인계가 공유하므로 변경 결과를 같은 수업에서 확인한다.
- 강사 개설/수정 권한은 별도로 판단하고 메뉴 5에서 저장한 permissions 예시와 연결했다.
- 전체 예약 현황·예약 상세·수업별 탭·출결 모달·정산 정정 제한을 추가했다. 기본 API 권한에 맞춰 강사 개별 예약 취소 버튼은 제공하지 않는다.
- 반복 생성/이번 회차/선택 회차/이후 전체 수정은 별도 예시이며 현재 API·ERD에 없음. 실제 수업에 등록하지 않는다.
- 대기 목록·상세·취소·자동 승급 제안을 추가했다. 정원 마감 수업에 이수진(유효 이용권)과 김서현(비활성/만료)의 대기 예시가 있다. 회원의 내 대기는 본인 데이터만 표시한다.
- 자동 승급 예시는 초기 꺼짐. 켜면 예약 취소 후 빈자리를 1순위 자격 검사로 처리한다. 부적격이면 중단하고 순번 건너뛰기·알림·예약 마감 정책은 결정 필요 사항으로 남겼다.
- 기존 신청 승인·횟수 확보·출결 차감 회의안은 `승인 신청 대기` 메뉴/버튼으로 유지한다. 기본 데이터와 합치지 않는다.

각 역할 문서에 기존 API·없는 기능·정책 차이·화면 확인 순서와 요청/권한 조건을 정리했다. 전체 예약의 instructorId/keyword 검색과 반복/대기/승인형 상태는 현재 계약 미지원이다. API·ERD 변경과 서버 호출은 없다. 실행 테스트·브라우저 검증은 수행하지 않았다.

<a id="doc-06-lesson-operations-member-api"></a>

### 메뉴 6 수업 운영 — 회원 기준

#### 회원에게 필요한 화면

회원에게 관리자용 `수업 운영` 메뉴를 추가하지 않았습니다. **기존 `수업 목록`, `내 예약·대기·출결`, `내 이용권`, `알림`에서 운영 결과를 확인**합니다.

| 화면·버튼 | 기존 API · operationId | 연결 기준 |
| --- | --- | --- |
| 공개 수업 목록·필터·페이지 | `GET /lessons` · `getLessons` | from/to, lessonTypeId, instructorId, roomId, page/size, order. 회원은 PUBLISHED만 조회 |
| 강사·수업 유형·룸 선택지 | `getInstructors`, `getLessonTypes`, `getRooms` | 목록의 ID를 필터에 전달. 강사 목록은 활성 강사의 ID·이름 |
| 수업 상세보기 | `GET /lessons/{lessonId}` · `getLesson` | 시간·담당 강사·룸·정원·예약 인원. 운영 변경 후 재조회 |
| 내 신청 상태 | `GET /members/me/reservations` · `getMyReservations` | 수업 ID와 내 예약 응답 lesson.id를 연결 |
| 예약하기 | `POST /reservations` · `createReservation` | lessonId만 전송. 이용권은 서버 자동 선택. 즉시 RESERVED, 이용권 1회 차감 |
| 내 예약 목록·상세 | `getMyReservations`; `GET /reservations/{reservationId}` · `getReservation` | 예약 시각·상태·사용 이용권·취소 정보. 비공개/취소 수업도 본인 예약 응답의 lesson으로 표시 |
| 예약 취소 | `POST /reservations/{reservationId}/cancellations` · `cancelReservation` | reason? 입력. 본인 RESERVED, 시작 전·정책 마감 내에서만 가능. 이용권 1회 복구 |
| 내 이용권 목록·상세 | `GET /members/me/passes` · `getMyPasses` | 현재 전체 잔여 횟수 표시. 회원 상세는 목록의 선택한 객체 사용. 관리자 전용 getPass를 호출하지 않음 |
| 취소 정책 안내 | `GET /reservation-policy` · `getReservationPolicy` | cancelDeadlineHours 등 정책 사용 |
| 알림 목록·읽음·전체 읽음·미확인 수 | `getMyNotifications`, `readNotification`, `readAllNotifications`, `getMyUnreadNotificationCount` | 수업 취소/관리자 예약 취소 안내. 클릭해서 상세 확인·읽음 처리 |

날짜 필터는 서울 날짜로 입력합니다. API의 from은 시작일 서울 자정, to는 종료일 다음 날 서울 자정을 UTC ISO 8601로 변환합니다. from 포함/to 미포함, page는 1부터입니다.

#### 관리자 운영에 따른 회원 화면 변화

- 수업 공개 → 회원 수업 목록에 노출.
- 공개 예약 → API 서버가 publishAt에 공개한 뒤 회원에게 노출. HTML은 시간 경과에 따른 자동 공개를 실행하지 않습니다.
- 비공개 → 신규 예약 대상 목록에서 숨김. 이미 한 예약은 유지되고 내 예약에서 확인 가능.
- 제목·강사·룸 수정 → 수업/예약 재조회 후 바뀐 정보 표시. 기존 예약은 유지.
- 수업 취소 → RESERVED 예약 모두 취소·이용권 1회씩 복구·취소 알림.
- 관리자 예약 취소 → 해당 예약 취소·이용권 복구·알림.
- 강사/관리자 출석 또는 노쇼 처리 → 내 지난 기록에서 해당 상태 표시. 추가 횟수 차감 없음.
- 출결 정정 → 상태 변경만 반영. 이미 정산한 수업은 정산 폐기 전 정정 불가.

기본 메뉴 6은 courseStore를 사용하므로 회원, 관리자 수업 운영, 강사 담당 수업, 회원 관리, 강사 부재·수업 인계가 같은 수업 데이터를 확인합니다.

#### 현재 API가 없어 제안으로 제공한 기능

| 기능 | 현재 상태 | 화면 예시 |
| --- | --- | --- |
| 대기 신청·취소·내 대기 조회 | API 없음. 현재 예약 API는 정원 마감 시 LESSON_FULL, 대기 예약 없음 | 기존 회원 대기 UI를 유지. 대기는 예약 확정이 아니며 신청/취소로 횟수 변경 없음 |
| 대기자 자동 승급 | API·순번·동시성·이용권 선택·실패 정책 없음 | 관리자가 자동 승급 예시를 켜고 빈자리를 만들면 첫 대기자를 검사해 RESERVED로 전환하고 1회 차감하는 예시. 실제 지원 기능이 아님 |
| 승급 확정 알림 | 현재 알림 종류에 전용 이벤트 없음 | 예약 상태 변화는 예시 내역에서 확인. 지원하지 않는 종류의 알림을 임의로 발송하지 않음 |
| 반복 수업 | 반복 일정 API·ERD 없음 | 관리자/권한 강사의 별도 제안 화면만 제공. 제안 회차는 회원 수업 목록에 등록되지 않음 |
| 신청 후 강사 승인 | REQUESTED/CONFIRMED/REJECTED 예약 상태·확정/거절 API 없음 | 별도 `승인 신청 대기`에 남아 있으며 회원의 기본 즉시 예약과 아직 연결하지 않음 |

#### 팀이 결정해야 하는 부분

1. 회원 예약은 즉시 확정인지, 강사 승인 후 확정인지.
2. 예약 시 차감인지, 횟수 확보 후 출결 시 사용 반영인지.
3. 대기 자동 승급 포함 여부와 1순위 부적격 시 중단/건너뛰기 규칙.
4. 승급 시 회원에게 어떤 안내를 할지, 취소 마감이 지난 시각에도 승급할지.
5. 반복 회차를 회원에게 한 번에 공개할지, 회차별로 공개할지.

#### 확인 순서

1. 관리자 → 수업 운영 → 단일 수업 개설 → 상세 → 공개 상태 설정 → 즉시 공개.
2. 로그아웃 → 회원 → 수업 목록 → 생성한 수업 상세 → 예약.
3. 관리자 → 수업 운영 → 예약 현황·출결 → 동일 예약 상세 확인.
4. 관리자 예약 취소 또는 수업 취소 → 회원의 예약 취소 상태·잔여 횟수·알림 확인.
5. 강사/관리자가 모닝 리포머의 미처리 출결을 기록 → 이 회원에 해당하는 내 지난 기록 확인.

회원 미리보기는 홍길동(ID 1)입니다. 서버 호출 없는 예시이며 새로고침하면 초기화됩니다. 반복·대기·승인 회의안은 계약 미지원 제안입니다. 실행 테스트·브라우저 검증은 수행하지 않았습니다.


<a id="doc-06-lesson-operations-instructor-api"></a>

### 메뉴 6 수업 운영 — 강사 기준

#### 확인할 화면

강사 로그인 → **수업 목록 / 수업별 예약자 / 출결 처리**.

수업 운영 안의 버튼으로 `수업 회차`, `예약 현황·출결`, `반복 일정 · 제안`, `승인 신청 대기`에 진입합니다.

- 담당 수업: 예약자 상세·출석/노쇼·정정.
- 유형별 개설 권한: 해당 유형 수업 만들기.
- 유형별 수정 권한: 해당 유형 수업 수정·공개 예약·공개/비공개·수업 취소.
- 다른 강사 수업: 조회 가능한 일반 상세만 확인. 개설·수정 권한을 가지고 있어도 다른 강사 예약자·출결 권한을 자동으로 얻지 않음.

#### 6.1 수업 회차: 기존 API 연결

| 화면·버튼 | API · operationId | 연결 기준 |
| --- | --- | --- |
| 역할·유형별 운영 권한 | `GET /members/me` · `getMyProfile` | permissions의 LESSON_CREATE:{code}와 LESSON_UPDATE:{code}를 각각 확인. 개설과 수정 권한을 하나로 합치지 않음 |
| 담당 수업 목록 | `GET /lessons` · `getLessons` | 본인 instructorId, from/to, 유형/룸/상태, page/size. 조회 가능한 전체 범위 선택 시 본인 필터 제거, 서버 노출 범위 사용 |
| 수업 상세보기 | `GET /lessons/{lessonId}` · `getLesson` | 담당 또는 공개 또는 유형별 권한이 있는 수업 조회 |
| 개설 폼 선택지 | `getLessonTypes`, `getInstructors`, `getRooms` | 생성 가능한 유형만 선택. 활성 강사 후보·룸 사용 |
| 수업 개설 | `POST /lessons` · `createLesson` | title, lessonTypeId, instructorId, roomId, startAt, endAt. 유형별 개설 권한 필수. CREATED, 정원은 유형 복사 |
| 수업 수정 | `PATCH /lessons/{lessonId}` · `updateLesson` | 변경한 title, instructorId, roomId, startAt, endAt만 전송. 유형 변경 불가. RESERVED 예약이 있으면 시간 변경 불가 |
| 공개 예약·즉시 공개·비공개 | `PUT /lessons/{lessonId}/status` · `changeLessonStatus` | 유형별 수정 권한. status, SCHEDULED일 때만 publishAt. 허용된 상태 전이 사용 |
| 수업 취소 | `POST /lessons/{lessonId}/cancellations` · `cancelLesson` | 유형별 수정 권한. reason?, 시작 전. RESERVED 예약 모두 취소·이용권 복구. 취소 후 재공개 불가 |

기본 화면의 권한은 메뉴 5에서 저장한 강사 보유 권한 예시와 연결했습니다. 김강사는 초기 운영 권한이 없으므로 관리자 → 강사 관리 → 김강사 → 권한에서 필요한 유형의 개설/수정 권한을 부여한 뒤 확인합니다. 별도 회의안 하단 권한 스위치는 제안용이며 실제 권한 API에 대응하지 않습니다.

#### 6.3 예약·출결: 기존 API 연결

| 화면·버튼 | API · operationId | 연결 기준 |
| --- | --- | --- |
| 담당 수업의 예약자 목록 | `GET /lessons/{lessonId}/reservations` · `getLessonReservations` | 본인 담당만, status/page/size. 개인 이름·이용권 요약·예약 상태 사용 |
| 예약 현황·출결 화면 | 본인 수업 `getLessons` + 각 `getLessonReservations` | 일반 강사는 getReservations 호출 권한이 없음. MEMBER_READ가 있다면 getReservations를 사용할 수 있어도 출결 권한은 담당 수업에 한정 |
| 예약 상세보기 | `GET /reservations/{reservationId}` · `getReservation` | 담당 수업 예약 ID, 이름·수업·시간·강사·룸·상태·이용권 요약. 관리자 전용 상세 이용권 API를 호출하지 않음 |
| 출석/노쇼 기록·정정 | `PUT /reservations/{reservationId}/attendance` · `confirmAttendance` | status=ATTENDED/NO_SHOW. 수업 시작 이후, 취소 예약 제외. 기존 차감 유지·추가 차감 없음 |
| 정산 이후 출결 정정 | confirmAttendance의 오류 처리 | LESSON_SETTLED면 처리 불가. 관리자가 정산 폐기 후 다시 처리. 클라이언트 판단만 믿지 않고 서버 검사 |

강사는 **개별 회원의 예약 취소 버튼을 받지 않습니다.** 기존 cancelReservation은 회원 본인·관리자만 허용합니다. 수업 유형의 취소 권한을 가진 강사가 수업 전체를 취소하는 것은 별도의 cancelLesson 업무입니다.

기본 예약 상태는 RESERVED/ATTENDED/NO_SHOW/CANCELED입니다. 기본 화면에는 신청 승인·거절 버튼을 넣지 않았고, 승인 방식은 별도 회의안으로 진입합니다.

#### 6.2 반복 일정 · 제안

현재 API·ERD가 없으므로 실제 등록이 아닌 제안 화면입니다.

- 개설 권한이 있는 유형: 기간·요일·시간·강사·룸 입력 → 생성 회차 목록.
- 수정 권한이 있는 유형: 이번 회차만 / 선택한 회차 / 기준 회차 이후 전체 수정.
- 예시 저장은 최대 30회차, 예약이 없는 제안 회차만 다룸. 이미 예약된 실제 회차의 일괄 수정 정책을 대신하지 않음.
- 실제 단일 수업 목록·예약·회원 화면에는 등록하지 않음.
- 기존/제안 회차의 강사·룸 충돌, 예시 가능시간·승인 부재·퇴사일을 검사하고 실패하면 예시 저장 차단.
- 수정 때 날짜·유형은 유지하고 제목·강사·룸·시간을 변경하는 예시.

개별 createLesson/updateLesson을 여러 번 호출하는 방식으로 API가 준비됐다고 표시하지 않습니다.

#### 대기·자동 승급 · 제안

담당 수업 예약자 화면 → `대기자 · 제안`에서 순번·이용권 자격·대기 상세를 확인할 수 있습니다. 현재 API에 대기 조회는 없습니다.

자동 승급 설정/실행 예시는 관리자에게만 제공합니다. 강사의 예약 취소·대기 취소·강제 승급 권한은 미정이며 기존 담당 출결 권한을 확대 해석하지 않습니다. 기존 회의안의 수동 예약 확정/거절/대기 전환은 `승인 신청 대기`에서 확인합니다.

#### API가 없거나 팀 결정이 필요한 부분

1. 반복 일정의 범위·저장 단위·충돌 시 전체 실패/부분 성공·예약 회차 수정 규칙.
2. 대기 신청·조회·취소·자동 승급 API와 순번·동시성·부적격 대기자 정책.
3. 강사의 개별 예약 취소·신청 승인/거절·대기 처리 권한.
4. 예약 즉시 차감과 회의안 확보/출결 차감 중 운영 기준 선택.
5. 출결 정정 요청→관리자 승인 과정 필요 여부. 현재 API는 직접 정정만 지원.
6. 기본 출결 응답에 정산 포함 여부를 화면에 미리 표시할 추가 데이터가 필요한지. 현재 예약 스키마에는 정산 잠금 플래그가 없음; 저장 시 에러 처리 필요.

#### 확인 순서

1. 강사 로그인 → 수업 목록 → 모닝 리포머 상세 → 예약자·출결 보기.
2. 출결 탭 → 미처리 이수진 예약 → 출결 처리 → 출석/노쇼 저장 → 정정.
3. 다른 강사의 공개 수업은 상세만 조회되는지 확인.
4. 관리자 → 강사 관리 → 김강사 권한 부여 → 강사 로그인 → 개설/수정/공개 버튼 확인.
5. 권한 부여 후 반복 일정 제안 → 금요일 10/16~10/30 생성 → 회차별/선택/이후 수정.

현재 미리보기는 김강사(ID 2), 기준 시각은 2026-10-11 12:00입니다. 현재 API 방식 수업은 회원·회원 관리·강사 부재/인계와 공유합니다. 신청 승인 회의안은 별도 데이터입니다. 서버 호출 없는 예시이고 새로고침하면 초기화됩니다. 실행 테스트·브라우저 검증은 수행하지 않았습니다.


<a id="doc-06-lesson-operations-admin-api"></a>

### 메뉴 6 수업 운영 — 관리자 기준

기준: `docs/menu-structure.md` 6.1~6.3, `api-spec/openapi.yaml`.
화면: 기존 `wireframes.html`에 누적 추가. API·ERD 변경 없음.

#### 화면과 확인 위치

관리자 로그인 → 왼쪽 **수업 운영**.

| 화면 안 버튼·화면 | 작업 내용 |
| --- | --- |
| 수업 회차 | 날짜·유형·강사·룸·상태 필터, 목록·상세, 수업 개설·수정·공개 예약·공개/비공개·취소 |
| 수업 상세 → 예약자·출결 보기 | 선택 수업의 예약 완료·출결·취소 내역·대기 제안 탭 |
| 예약 현황·출결 | 전체 수업의 예약 조회, 예약 상세, 예약 취소, 출석/노쇼·정정 |
| 반복 일정 · 제안 | 반복 생성·회차 목록·이번 회차/선택 회차/이후 전체 수정 예시 |
| 대기자 · 제안 | 대기 순서·상세·자격·대기 취소 예시·빈자리 승급 결과 |
| 승인 신청 대기 | 앞서 만든 승인형 예약·횟수 확보·수동 대기 전환의 별도 회의안 |

기본 화면은 **예약 즉시 확정·예약 시 1회 차감**인 기존 API를 따릅니다. 신청 승인/횟수 확보 방식은 회의안 버튼을 눌러 별도로 확인합니다.

#### 6.1 수업 회차: 화면·버튼과 기존 API

| 화면·행동 | API · operationId | 요청·성공 후 연결 |
| --- | --- | --- |
| 수업 목록·필터·페이지 | `GET /lessons` · `getLessons` | from/to, lessonTypeId, instructorId, roomId, status, page/size, order=ASC. 모든 상태 조회 |
| 수업 상세보기 | `GET /lessons/{lessonId}` · `getLesson` | 목록 ID. 유형·정원·강사·룸·시각·상태·공개 예약 시각·예약 인원 |
| 개설 폼 선택지 | `GET /lesson-types`, `GET /instructors`, `GET /rooms` | getLessonTypes/getInstructors/getRooms. 활성 유형·강사·룸, ID 전달 |
| 수업 개설 → 비공개로 개설 | `POST /lessons` · `createLesson` | title, lessonTypeId, instructorId, roomId, startAt, endAt. 생성은 CREATED. 정원 직접 입력 없음, 유형 정원 복사 |
| 수업 수정 → 저장 | `PATCH /lessons/{lessonId}` · `updateLesson` | 변경 필드만. 유형 변경 불가. RESERVED 예약이 있으면 시간 변경 차단, 제목/강사/룸 변경은 가능 |
| 공개 상태 설정 | `PUT /lessons/{lessonId}/status` · `changeLessonStatus` | status=PUBLISHED/UNPUBLISHED/SCHEDULED, SCHEDULED에만 publishAt. 허용된 전이만 표시 |
| 수업 취소 → 영향 확인 | `POST /lessons/{lessonId}/cancellations` · `cancelLesson` | reason? 최대 200자. 시작 전만. RESERVED 예약 함께 취소·횟수 복구·취소 알림. CANCELED는 재공개 불가 |

##### 공개 상태 규칙

- CREATED → PUBLISHED 또는 SCHEDULED.
- SCHEDULED → PUBLISHED, UNPUBLISHED 또는 SCHEDULED(시각 변경).
- PUBLISHED → UNPUBLISHED.
- UNPUBLISHED → PUBLISHED 또는 SCHEDULED.
- 비공개 전환은 기존 예약 유지·신규 예약 차단.
- 공개 예약은 서버가 publishAt에 공개합니다. HTML은 고정 시각 예시이므로 시간 경과에 따른 자동 공개를 실행하지 않습니다.
- 현재 화면 예시는 publishAt을 기준 시각 이후·수업 시작 이전으로 제한합니다. 실제 API의 과거/시작 이후 조건과 경계 시각 허용 여부는 스펙 기준으로 맞춰야 합니다.

##### 생성·수정 검증

시작/종료 순서, 강사·룸 충돌, 예시 가능시간, 승인 부재, 퇴사일 이후 배정을 검사합니다. 이미 시작한 수업·취소 수업 변경은 제한합니다. 실제 활성 유형/룸, 센터 영업시간·휴무일·서버 동시성 검증은 서버 응답이 최종 기준입니다. 신규 강사는 가능시간 미설정이면 배정 불가입니다.

#### 6.3 예약·출결: 기존 API 연결

| 화면·행동 | API · operationId | 연결 기준 |
| --- | --- | --- |
| 전체 예약 현황 | `GET /reservations` · `getReservations` | memberId, lessonId, status, lessonFrom/lessonTo, page/size, order. 강사 필터와 통합 keyword는 현재 이 API에 없음 |
| 수업별 예약자·출결 | `GET /lessons/{lessonId}/reservations` · `getLessonReservations` | 수업 ID, status/page/size. 예약 인원 전체는 reservedCount/pageInfo 기준 |
| 예약 상세보기 | `GET /reservations/{reservationId}` · `getReservation` | 선택 예약 ID·회원·수업·사용 이용권·상태·취소 주체/사유·출결 시각 |
| 관리자 이용권 잔여 확인 | `GET /passes/{passId}` · `getPass` 또는 회원별 getPasses | 예약 pass.id로 연결한 현재 총/잔여 횟수. 예약 시점 잔여 또는 모든 이용권 합계로 표시하지 않음 |
| 예약 취소 | `POST /reservations/{reservationId}/cancellations` · `cancelReservation` | reason?. 관리자 시작 전 RESERVED 취소, 회원 취소 마감과 무관. 1회 복구·관리자 취소 알림 |
| 출석/노쇼·정정 | `PUT /reservations/{reservationId}/attendance` · `confirmAttendance` | status=ATTENDED/NO_SHOW. 관리자 전체 수업. 시작 이후만, 취소 예약 불가. 추가 차감 없음 |
| 정산 포함 수업의 정정 제한 | confirmAttendance → LESSON_SETTLED | 관리자 정산 폐기 후 정정 가능. 화면 사전 배지용 정산 플래그는 현재 예약 응답에 없음 |

전체 예약 화면의 **강사·통합 검색**은 예시 데이터에 적용한 필터입니다. 실제 getReservations의 지원 필터로 오해하면 안 됩니다. 강사 조건은 강사별 getLessons → 각 getLessonReservations로 구성할지, getReservations에 instructorId를 추가할지 결정해야 합니다. 이름/수업/예약 번호의 전체 검색도 keyword API 보완 또는 조회 범위 내 검색 규칙이 필요합니다. 페이지 일부만 조회해 전체 검색 결과로 표시하지 않습니다.

#### 6.2 반복 일정 — 현재 API 없음·제안 화면

##### 제공한 화면 흐름

1. 반복 일정 목록 → 반복 일정 생성.
2. 제목·유형·강사·룸·기간·반복 요일·시작/종료 시간 입력.
3. 생성 예시 저장 → 만들어진 회차 목록.
4. 특정 행 `이번 회차 수정`, 체크한 `선택 회차 수정`, 기준 행 `이후 전체 수정`.
5. 변경 제목·강사·룸·시간 입력 → 전체 대상 충돌 확인 → 수정 예시 저장.

수정 날짜·유형은 유지합니다. 충돌 실패 시 예시의 일부 회차만 먼저 변경하지 않습니다. 예시는 최대 30회차이며 이는 와이어프레임 제한이지 확정된 운영 정책이 아닙니다.

##### 필요한 API·정책

- 반복 일정 생성/조회/상세와 일정-회차 관계.
- 이번/선택/이후 회차 수정 범위와 기준 회차 포함 여부.
- 회차별 예약 유무·이미 시작한 회차·정산된 회차의 변경 제한.
- 일부 충돌 시 전체 실패/부분 성공, 사용자에게 보여줄 영향 목록.
- 회차별 공개 상태·공개 예약·일괄 취소 여부.
- 일정 수정 후 개별 회차 예외를 유지할지 덮어쓸지.

현재 스펙·ERD에 반복 일정은 없습니다. 단일 createLesson/updateLesson을 여러 번 호출하면 이 기능이 완성된 것으로 표시하지 않습니다. 제안 회차는 operationRepeats에만 저장하며 courseStore·회원 수업 목록·예약에 등록하지 않습니다.

#### 대기·자동 승급 — 현재 API 없음·제안 화면

수업 상세 → 예약자·출결 보기 → **대기자 · 제안**.

- 대기 순번·회원·신청 시각·예약 자격·상세 표시.
- 관리자 대기 취소 예시. 대기는 횟수 차감 없음.
- `자동 승급 실행 예시`: 빈자리와 1순위 확인 후 RESERVED로 전환, 이용권 1회 차감.
- `예약 취소 후 자동 승급 예시 켜기`: 기본은 꺼짐. 켜면 해당 예시 세션의 회원/관리자 예약 취소 후 승급 검사를 실행.
- 1순위의 계정 활성, 기존 예약 중복, 수업일 이용권 유효기간·사용 중 상태·완납·잔여 횟수 검사.
- 1순위 부적격이면 중단하고 결과 표시. 임의로 다음 대기자를 확정하지 않음.
- 수업 전체 취소·비공개·시작 후에는 승급 안 함. 실제 예약 정책과 승급 가능 마감은 별도 결정 필요.

현재 원래 예약 API는 대기 예약이 없다고 명시합니다. 이번 대기/승급은 계약 미지원 예시이며 실제 대기 생성·취소·순번·승급·동시성·승급 알림 API가 추가되어야 합니다. 예시 완납 조건은 allowUnpaidReservation 정책 전체를 구현한 것이 아닙니다. 유형별 이용권 자격·다중 이용권 자동 선택은 서버 계약과 맞춰 보완해야 합니다.

#### 팀이 결정해야 하는 부분

| 항목 | 결정·추가 작업 |
| --- | --- |
| 반복 일정 포함 여부 | 메뉴에서 고려 중. 이번 버전 포함 여부와 생성/수정/공개 범위 |
| 대기 승급 방식 | 자동/강사 수동 확정, 부적격 1순위 중단/건너뛰기, 취소 마감 이후 승급, 이용권 선택 |
| 회의안 승인형 예약 | 신청/확정/거절 상태·좌석과 횟수 확보·승인 대기 만료·권한·알림 |
| 예약 횟수 처리 | 기존 예약 차감/취소 복구와 회의안 확보/출결 차감 중 기준 선택 |
| 강사의 예약 취소 | 현재 회원 본인·관리자만 허용. 강사 권한·범위 추가 여부 |
| 조회 검색 | 전체 예약의 강사/keyword 쿼리 미지원. 조회 전략 또는 계약 추가 |
| 출결 정정 승인 | 현재 직접 정정만 지원. 요청→관리자 승인 과정 필요 여부 |
| 정산 잠금 표시 | 클라이언트 사전 배지에 필요한 정보 추가 여부. 현재는 저장 API 오류가 최종 판단 |
| 수업 종료/실적 확정 | 별도 종료 API 없음. 기존 정산은 시간·예약·출결 기반. 회의안 종료 플래그와 정산을 합칠지 결정 |

#### 확인 순서

1. 수업 운영 → 수업 회차 → `＋ 수업 개설` → 비공개 개설 → 상세 → 공개 상태 설정.
2. 예약자가 있는 `저녁 코어 필라테스` → 정보 수정 → 시간은 잠기고 제목·강사·룸 수정 가능.
3. 예약 현황·출결 → 예약 상세 → 모닝 리포머의 미처리 예약 출석/노쇼 처리·정정.
4. 리포머 밸런스(10/11 14:00) → 예약자·출결 → 대기자 제안 → 자동 승급 예시 켜기.
5. 예약 완료 탭에서 예약 1건 취소 → 대기 1순위 이수진 승급·차감·결과 표시.
6. 한 자리를 더 만들면 다음 김서현의 비활성/만료 이용권 때문에 승급 중단하는 예시 확인.
7. 반복 일정 제안 → 금요일 10/16~10/30 생성 → 3회차 → 이번/선택/이후 전체 수정. 같은 시각의 수업을 이미 개설했다면 충돌 안내 후 시간/룸 조정.
8. 승인 신청 대기 → 앞서 만든 강사 확정/거절·수동 대기 전환·횟수 확보 화면 확인.

#### 예시 데이터·검증 제한

기본 수업·예약·출결은 회원, 회원 관리, 강사 부재·퇴사 인계와 동일한 courseStore를 사용합니다. 유형별 운영 권한은 메뉴 5 강사 permissions 예시에 연결했습니다. 현재 홈 지표도 같은 수업 데이터 기준입니다.

회의안 workflowStore는 별도 승인형 예약 데이터입니다. 반복 회차는 별도 제안 데이터입니다. 대기/승급만 계약 미지원 제안으로 기본 예약 예시에 상태 변화를 보여주며 승급 예약에 proposed 표식을 남깁니다. 지원하지 않는 승급 알림 종류를 생성하지 않습니다.

서버 API·백그라운드 공개/승급 작업은 실행하지 않습니다. 새로고침 시 초기화됩니다. 기준 시각 2026-10-11 12:00. 실행 테스트·브라우저 화면 검증은 수행하지 않았습니다.


<a id="menu-7"></a>

## 메뉴 7. 회원 이용권 — 발급·조정·홀딩·결제

관리자 **회원 이용권**에서 메뉴 7.1~7.5를 확인한다. 회원 관리 → 회원 상세 → 이용권에서도 동일한 상세·관리 화면에 진입한다. 기존 `wireframes.html` 한 파일에 누적했으며 API·ERD는 변경하지 않았다.

| 역할 | 화면 | 역할별 문서 |
| --- | --- | --- |
| 관리자 | 전체/회원별 이용권, 만료 예정·홀딩 중, 발급 후 결제, 잔여·만료일·강사 조정, 홀딩 등록·해제, 결제 기록·수정·환불 표시 | [관리자 API 상세](#doc-07-pass-management-admin-api) |
| 회원 | 내 이용권 목록·상세, 관리자 처리 결과 조회. 관리 버튼 없음 | [회원 API 상세](#doc-07-pass-management-member-api) |
| 강사 | 기존 담당 수업 예약 상세의 이용권 ID·상품·만료일 요약. 전체 이용권 관리 메뉴 없음 | [강사 API 상세](#doc-07-pass-management-instructor-api) |

### 기존 API

- 목록/상세/발급/조정: getPasses, getPass, createPass, updatePass, getPassProducts/getPassProduct, getMembers/getInstructors.
- 홀딩: getPassPauses, createPassPause, terminatePassPause. 수업 예약이 남아 있으면 먼저 cancelReservation으로 개별 취소한다. 시작·정상 종료는 서버 자동 처리다.
- 결제: getPayments, getPassPayments, recordPassPayment, updatePassPayment, setPassPaymentRefund. 상세는 목록 객체로 구성하며 실제 결제·환불은 수행하지 않는다.
- 회원: getMyPasses의 선택 Pass로 상세 표시. 관리자 전용 조회 API를 회원·강사에게 연결하지 않는다.

### API가 없어 추가할 부분

- 만료 예정 전체 조회: getPasses의 만료일 범위 필터 없음. 30일 기준은 예시이며 API 보완 필요.
- 전체 홀딩 예정·상태 목록: 이용권별 이력 API만 존재. 전체 조회 API 필요.
- 홀딩 영향 예약: passId 필터 또는 영향 조회 없음. 회원 예약의 모든 페이지·pass.id·수업일 검사 또는 API 보완 필요.
- 누적 재등록: 현재는 새 이용권 발급, 총 횟수 추가·누적 가격·기간·재등록 이력 API 없음.
- 예약 확보/실제 사용 횟수: Pass에 관련 필드 없음. 기존 잔여를 실제 출석 횟수로 해석하지 않는다.

### 회의와 계약의 차이

**회원 신청 후 강사 확정·출결 시 차감은 브레인스토밍에 논의된 흐름**이다. 기존 즉시 확정·예약 차감 계약을 이 흐름에 맞춰 수정해야 한다. 미정인 제안이라서 운영 방식을 다시 선택하라는 의미가 아니다.

재등록의 기존 횟수 누적은 현재 createPass의 별도 발급과 다르다. 이번 화면은 기존 계약대로 새 이용권을 표시하며 누적 처리 완료로 간주하지 않는다. 선결제 논의와 API의 미결제 발급 허용, 홀딩 자동 예약 취소와 기존 개별 취소 필요 조건도 관리자 문서에 기록했다.

이용권·결제는 memberAdminStore를 공유하고 기본 예약은 정확한 passId를 보관하여 차감·복구한다. ‘승인 신청 대기’의 별도 workflowStore와 통합하지 않았다. 문법 검사만 수행했으며 실행 테스트·브라우저 검증·서버 연동은 수행하지 않았다. 새로고침하면 모든 예시 상태가 초기화된다.

<a id="doc-07-pass-management-member-api"></a>

### 메뉴 7 회원 이용권 — 회원

#### 회원에게 필요한 화면

관리 업무 메뉴를 회원에게 추가하지 않았다. **회원 로그인 → 내 이용권**에서 본인의 이용권 목록·상세를 확인한다.

- 여러 이용권을 각각 표시하며 상품명이 같아도 이용권 ID로 구분한다.
- 총 횟수·남은 횟수·만료일·상태·담당 강사·결제 상태 표시.
- 목록은 잔여 그래프, 상세는 총/차감/남은 횟수 표와 금액·미수금 표시.
- 관리자 발급·잔여 조정·기간 변경·홀딩·결제 기록 결과가 같은 예시 데이터에 반영된다.
- 발급·조정·홀딩 등록·결제 수정·환불 표시 버튼은 회원에게 제공하지 않는다.

#### 1. 화면·버튼의 기존 API

| 화면·버튼 | API / operationId | 연결 기준 |
| --- | --- | --- |
| 내 이용권 목록·상태·페이지 | `GET /members/me/passes` / `getMyPasses` | 로그인한 회원 본인, status/page/size. 만료일 오름차순 |
| 상세보기 | 위 목록의 선택 Pass 객체 | 관리자용 getPass를 호출하지 않는다. Pass에 총/잔여·기간·강사·금액·paidAmount/unpaidAmount/paymentStatus 포함 |
| 수업 예약 | `POST /reservations` / `createReservation` | lessonId. 서버가 수업일에 유효한 이용권 중 만료일 우선으로 선택. 현재 계약은 즉시 확정·1회 차감 |
| 내 예약의 사용 이용권 | `GET /members/me/reservations`, `GET /reservations/{reservationId}` / `getMyReservations`, `getReservation` | 예약 응답 pass.id와 내 이용권 ID 연결. 상품 이름으로만 찾지 않음 |
| 내 예약 취소 | `POST /reservations/{reservationId}/cancellations` / `cancelReservation` | 예약에 사용한 이용권에 1회 복구, 상태·기간은 별도 |

회원 상세는 관리자 결제 기록 목록이나 홀딩 이력 API를 호출하지 않는다. 목록 응답의 결제 합계와 상태만 읽는다. 현재 getMyPasses의 별도 단건 조회는 없으므로 직접 URL 진입 시 본인 목록에서 해당 ID를 찾는 과정이 필요하다.

#### 2. API가 없는 기능

- 이용권 이름 keyword 검색은 getMyPasses에 없다. HTML은 전체 예시 데이터 검색이다. 실제 구현은 전체 페이지를 조회한 범위에서 검색한다고 안내하거나 검색 API를 추가해야 한다.
- 회원 홀딩 신청·해제, 회원 결제 기록 이력 조회는 현재 계약에 없다. 이번 화면에 관리 버튼·예정 홀딩 상세를 추가하지 않았다.
- 실제 사용 횟수/예약 확보 횟수/신청 가능 횟수는 현재 Pass 스키마에 없다. `총 - 잔여`를 출석 횟수라고 설명하지 않는다.

#### 3. 브레인스토밍에 맞춰 수정할 부분

브레인스토밍의 **회원 신청 → 강사 확정 → 출석·노쇼 시 차감** 흐름과 현행 API의 즉시 확정·예약 차감이 다르다. 이 방식은 기록에 논의되어 있으므로 다시 선택하라고 요청할 항목이 아니라 API·ERD를 맞출 작업이다.

재등록의 횟수 누적도 현행 신규 Pass 발급과 다르다. 현재 회원 목록은 새 이용권을 별도 행으로 표시하며 누적 재등록이 구현되었다고 표시하지 않는다. 상세 차이는 관리자 문서에 정리했다.

#### 확인할 순서

1. 회원 → 내 이용권 → 상세보기 → 총 10회/차감 3회/남은 7회 확인.
2. 관리자 → 홍길동 이용권 잔여·기간 조정 → 회원으로 다시 로그인 → 같은 ID에 반영되는지 확인.
3. 관리자 → 홍길동에게 추가 발급 → 회원 내 이용권에서 별도 이용권 행 확인.
4. 관리자 → 홍길동 홀딩 등록 → 회원에서 PAUSED 또는 연장 만료일 확인. 예정 홀딩 상세는 회원 API에서 제공하지 않음.

예시 회원은 홍길동(ID 1). 서버 호출 없음, 새로고침 초기화. 문법 검사만 수행했으며 실행 테스트·브라우저 검증은 수행하지 않았다.


<a id="doc-07-pass-management-instructor-api"></a>

### 메뉴 7 회원 이용권 — 강사

#### 강사에게 필요한 화면

현행 API 기준으로 **회원 이용권 관리 메뉴는 관리자 전용**이다. 강사에게 전체 회원 이용권·발급·잔여 조정·홀딩·결제 메뉴를 새로 추가하지 않았다.

강사 로그인 → 담당 수업 → 예약자·출결 → 예약 상세에서 **해당 예약에 사용한 이용권 요약**을 확인한다. 수업 개설·수정 권한을 받았다고 이용권 관리 권한까지 생기지 않는다.

#### 1. 기존 API 연결

| 화면·버튼 | API / operationId | 표시 범위 |
| --- | --- | --- |
| 담당 수업 예약자 | `GET /lessons/{lessonId}/reservations` / `getLessonReservations` | 본인 담당 수업 |
| 예약 상세보기 | `GET /reservations/{reservationId}` / `getReservation` | 담당 예약의 회원·수업·상태·이용권 요약 |
| 예약에 사용한 이용권 | Reservation.pass / PassSummary | id, passProduct(id/name), endDate. 총/잔여·결제 내역은 포함되지 않음 |
| 출석·노쇼·정정 | `PUT /reservations/{reservationId}/attendance` / `confirmAttendance` | 현행 계약은 예약 때 차감, 출결로 추가 차감 없음 |

getPasses/getPass/createPass/updatePass/홀딩·결제 API는 관리자 전용이므로 강사 화면에 연결하지 않는다. getMyPasses는 일반 회원이 아닌 계정에 빈 목록을 반환한다.

#### 2. 추가 API가 필요한 경우

강사에게 담당 회원의 잔여·결제·홀딩 상세를 보여주려면 조회 권한·담당 회원 범위를 정하고 별도 API 또는 예약 응답을 보완해야 한다. 현재 예약 요약만으로 잔여나 미수금을 표시할 수 없다. 이번 메뉴 7에서 임의로 권한을 추가하지 않았다.

#### 3. 회의 내용에 맞춰 수정할 부분

‘승인 신청 대기’에서는 회의 흐름의 신청 확정·거절과 총/사용/확보/신청 가능 횟수를 별도 예시로 볼 수 있다. 브레인스토밍에 나온 신청 후 강사 확정·출결 시 차감을 실제 서비스에 연결하려면 예약 상태·확보 횟수·Pass 응답·차감 API를 함께 맞춰야 한다. 메뉴 7의 현행 이용권 데이터와 이 별도 화면은 아직 통합되지 않았다.

#### 확인 위치

1. 강사 → 수업별 예약자 → 상세보기: 담당 예약의 사용 이용권 요약.
2. 관리자 → 회원 이용권: 발급·조정·홀딩·결제 업무.
3. 강사에게 회원 이용권 관리 메뉴가 노출되지 않는 역할 구분.

서버 연결 없는 HTML 예시이며 실제 권한 검사는 서버가 담당한다. 문법 검사만 수행했으며 실행 테스트·브라우저 검증은 수행하지 않았다.


<a id="doc-07-pass-management-admin-api"></a>

### 메뉴 7 회원 이용권 — 관리자

기준: `docs/menu-structure.md` 7.1~7.5, `api-spec/openapi.yaml`, 첨부 브레인스토밍 기록.
화면: `wireframes.html`에 누적 추가. 실제 API 호출·결제·환불 없음. API 계약과 ERD는 변경하지 않았다.

#### 어디에서 확인하나요?

**관리자 로그인 → 왼쪽 회원 이용권**.
회원 관리 → 회원 상세 → 이용권 → 상세보기 또는 ‘회원 이용권 메뉴에서 보기’로도 같은 화면에 진입한다.

| 화면 | 할 수 있는 일 |
| --- | --- |
| 이용권 현황 | 전체/회원별 조회, 회원 이름·강사·상품·상태·결제 상태 필터, 정렬·페이지 이동 |
| 만료 예정·홀딩 중 | 30일 내 만료 예정 예시, 현재 홀딩 중 이용권 |
| 이용권 상세 → 기본 정보·조정 | 총 횟수/차감 횟수/남은 횟수, 담당 강사·기간·금액·미수금, 잔여·만료일·강사 조정 |
| 이용권 발급·재등록 | 회원 이력 확인, 상품·가격·기간·강사 선택, 발급 후 결제 기록 |
| 이용권 상세 → 홀딩 | 등록, 영향 예약 확인·개별 취소, 예정 취소·조기 해제, 만료일 변화 확인 |
| 홀딩 예정·이력 | 전체 회원의 홀딩 상태·기간·상세 예시. 전체 조회 API 추가 필요 |
| 이용권 상세 → 결제 내역 | 분할 결제 기록, 기록 상세·수정, 환불 표시·해제 |
| 전체 결제 내역 | 회원·이름·결제일·결제 수단·환불 여부 검색, 상세·수정 |

목록은 이용권별 잔여 그래프를 표시한다. 총/차감/남은 횟수 표는 상세에서만 표시한다. 그래프 채워진 부분은 차감된 횟수이며, 범례의 남은 횟수는 오른쪽에 정렬한다. 현재 계약에서 `총 - 잔여`에는 예약 차감과 관리자 조정도 들어가므로 실제 출석 횟수라고 표시하지 않는다.

#### 1. 화면·버튼에 연결할 기존 API

##### 7.1 현황·상세

| 화면·버튼 | API / operationId | 연결 규칙 |
| --- | --- | --- |
| 이용권 목록·회원별 조회 | `GET /passes` / `getPasses` | memberId, keyword(회원 이름), instructorId, passProductId, status, paymentStatus, sortBy, order, page/size |
| 정렬·페이지 | 동일 getPasses | createdAt/endDate/totalCount/remainingCount, ASC/DESC. 페이지 1부터, content/pageInfo |
| 상세보기 | `GET /passes/{passId}` / `getPass` | 반드시 선택한 이용권 ID. 같은 상품을 여러 번 발급받아도 각각 구분 |
| 홀딩 중 | getPasses(status=PAUSED) | 계정 비활성과 이용권 홀딩을 구분 |
| 발급 회원 선택 | `GET /members` / `getMembers` | role=MEMBER, status=ACTIVE, 이름/이메일·ID로 중복 이름 구분 |
| 발급 이력 확인 | getPasses(memberId) | 진행·만료 모두 조회. 이력이 있으면 재등록 대상으로 표시 |

목록 API는 createdFrom/createdTo(등록 UTC 시각, 시작 포함·끝 미포함)도 지원한다. 이번 화면에는 이 필터를 추가하지 않았다. 만료일 범위와는 다른 필터다.

##### 7.2 발급·재등록

| 화면·버튼 | API / operationId | 연결 규칙 |
| --- | --- | --- |
| 상품 선택·기본 금액/횟수/기간 | `GET /pass-products`, `GET /pass-products/{passProductId}` / `getPassProducts`, `getPassProduct` | 상품 값 확인. 상품 변경 시 기본 가격·기간 미리보기 갱신 |
| 담당 강사 선택 | `GET /instructors` / `getInstructors` | 활성 강사 후보. 퇴사일 등록 여부는 상세 계정 정보 또는 createPass의 INSTRUCTOR_RESIGNING 응답으로 최종 검증 |
| 발급 → 결제 입력으로 이동 | `POST /passes` / `createPass` | passProductId, memberId, instructorId, startDate, price(선택). price 생략 시 상품 가격 |
| 발급 직후 결제 기록 | `POST /passes/{passId}/payments` / `recordPassPayment` | 발급 응답의 ID 사용. 발급과 결제는 별도 요청 |

- 활성 일반 회원·활성 강사만 가능. 퇴사일 등록 강사 지정 불가.
- 총 횟수는 발급 당시 상품 값 복사. 만료일 = 시작일 + 상품 유효일 - 1일.
- 만료일이 이미 지나는 시작일은 불가. 미래 시작이면 UPCOMING.
- 발급 직후 UNPAID, 0원은 결제 기록 없이 PAID. 일부 금액만 기록하면 PARTIAL.
- 화면의 발급 후 결제 창을 닫아도 이미 발급한 이용권은 남는다. 결제 실패 시 같은 이용권에서 다시 기록해야 하며 발급을 중복 요청하지 않는다.
- 현재 API의 재등록은 **새 이용권 발급**이다. 회의의 횟수 누적과의 차이는 아래 수정 항목에 기록했다.

##### 7.3 상태·횟수·기간

| 화면·버튼 | API / operationId | 연결 규칙 |
| --- | --- | --- |
| 잔여 횟수 조정 | `PATCH /passes/{passId}` / `updatePass` | remainingCount 한 필드. 정수 0~총 횟수 |
| 만료일 조정 | 동일 updatePass | endDate 한 필드. 시작일 이후. 홀딩 연장일을 다시 더하지 않음 |
| 담당 강사 변경 | 동일 updatePass | instructorId 한 필드. 활성 강사·퇴사 예정 제외 |
| 만료 처리 | 동일 updatePass(endDate) | 오늘 이전이고 시작일 이후인 날짜 지정. 별도 EXPIRED 상태 변경 API가 아님 |

만료일은 지나면 서버가 자동 만료한다. 잔여 0회도 ACTIVE일 수 있으며 ‘횟수 소진’으로 표시한다. 만료된 이용권의 만료일을 미래로 바꾸면 상태가 재계산된다. 시작일이 오늘·미래인 이용권은 기존 endDate 제약 때문에 위 방법으로 즉시 만료시킬 수 없다. 총 횟수·상품·가격·시작일 수정은 기존 updatePass에 없다.

##### 7.4 홀딩

| 화면·버튼 | API / operationId | 연결 규칙 |
| --- | --- | --- |
| 선택 이용권 홀딩 이력 | `GET /passes/{passId}/pauses` / `getPassPauses` | 페이지, 시작일 내림차순. 취소 이력 포함 |
| 홀딩 기간의 예약 확인 | getReservations(memberId) + 예약 응답의 pass.id와 수업일 비교 | 조회한 일부 페이지만 검사하지 않음. 필요한 모든 페이지 또는 API 보완 필요 |
| 영향 예약 → 예약 취소하기 | `POST /reservations/{reservationId}/cancellations` / `cancelReservation` | 관리자 시작 전 RESERVED만. 1회 복구. 홀딩과 별도 요청 |
| 홀딩 등록 | `POST /passes/{passId}/pauses` / `createPassPause` | startDate, endDate, reason?. 양끝 날짜 포함 |
| 예정 취소·조기 해제 | `POST /passes/{passId}/pauses/{pauseId}/terminations` / `terminatePassPause` | body 없음. 처리 후 이용권·홀딩 목록 재조회 |
| 홀딩 시작·정상 종료 | 추가 호출 없음 | 서버 날짜 기반 자동 전환. 수동 ‘시작’ 버튼을 만들지 않음 |

- 시작일은 오늘 이후이면서 이용권 시작일~현재 만료일 안. 종료일은 시작일 이상.
- 만료된 이용권 등록 불가(PASS_EXPIRED), 다른 취소되지 않은 홀딩과 겹침 불가(PAUSE_PERIOD_OVERLAP).
- 기간에 RESERVED 예약이 있으면 PAUSE_HAS_RESERVATIONS. 예약을 먼저 취소한 뒤 홀딩을 등록한다. 자동·일괄 취소로 표시하지 않았다.
- 등록 시 `종료일 - 시작일 + 1`만큼 만료일 즉시 연장.
- 미래 시작은 SCHEDULED. 예정 취소는 연장 전체 반환.
- 진행 중 해제는 오늘부터 해제, 종료일은 어제로 변경·미사용 일수 반환. 시작일 당일 해제는 사용 0일, CANCELED.
- ENDED/CANCELED 재해제 불가. 취소한 예약은 홀딩 해제 후 자동 복구하지 않는다.
- 날짜 자동 전환은 실제 서버 동작이다. HTML의 기준 시각은 2026-10-11 12:00으로 고정되어 시간 경과를 재현하지 않는다.

##### 7.5 결제

| 화면·버튼 | API / operationId | 연결 규칙 |
| --- | --- | --- |
| 전체 결제 목록 | `GET /payments` / `getPayments` | memberId, keyword(회원 이름), paidFrom/paidTo(현지 날짜 양끝 포함), method, refunded, page/size. 화면은 paidAt DESC |
| 이용권별 결제 | `GET /passes/{passId}/payments` / `getPassPayments` | 페이지, 결제일 내림차순 |
| 상세보기 | 선택 목록의 결제 객체 | 별도 결제 단건 GET 없음. 기록자·금액·수단·날짜·메모·환불 정보를 구조적으로 표시 |
| 결제 기록 | `POST /passes/{passId}/payments` / `recordPassPayment` | method=CARD/CASH/TRANSFER/OTHER, amount>=1, paidAt<=오늘, memo? 최대 200자 |
| 기록 수정 | `PATCH /passes/{passId}/payments/{paymentId}` / `updatePassPayment` | 변경 필드만 전달. 환불 표시 기록은 해제 후 수정 |
| 환불 여부 표시·해제 | `PUT /passes/{passId}/payments/{paymentId}/refund` / `setPassPaymentRefund` | refunded. true이면 refundedAt?(생략 오늘), memo?. 환불일은 결제일 이상·오늘 이하 |

결제 합계는 이용권 금액을 넘을 수 없다(PAYMENT_EXCEEDS_PRICE). 만료 이용권에도 기록 가능. 실제 결제·환불은 센터에서 수행하고 시스템에는 사실만 기록한다. 환불 표시 기록도 paidAmount에 포함되며 미수금·예약·이용권은 자동 변경되지 않는다. 수정은 활동 이력 기록 대상이나 HTML에 서버 감사 로그를 만들지는 않았다.

기존 deletePassPayment API도 있으나 메뉴 7에서 요청한 기록·수정·환불 표시에 맞춰 삭제 버튼은 추가하지 않았다. 환불 대신 결제를 삭제하는 흐름으로 만들지 않는다.

#### 2. 기존 API가 없어 추가할 것

| 기능 | 부족한 계약 | 화면의 현재 상태 |
| --- | --- | --- |
| 만료 예정 전체 조회 | getPasses에 endDateFrom/endDateTo 없음 | 30일 내 만료를 전체 예시 데이터에서 필터. 실제 전체 조회에는 만료일 범위 API 추가 필요 |
| 전체 홀딩 예정·이력 | getPassPauses는 passId 한 건만 지원, 전체/회원/상태 필터 없음 | 전체 예시 데이터 조회. 전체 홀딩 목록 API 또는 완전한 조회 전략 필요 |
| 홀딩 영향 예약 조회 | getReservations에 passId·홀딩 영향 조회 없음 | 회원 예약에서 정확한 pass.id·수업일로 구분. 실제 구현에서 전체 페이지 처리/영향 조회 보완 |
| 즉시 만료·회수 | 별도 만료/회수 API 없음 | endDate 수정 가능한 경우만 제공. 시작 전 이용권·예약 영향의 명시적 회수 계약 필요 |
| 누적 재등록 | createPass는 새 이용권, updatePass에는 totalCount/가격/시작일 없음 | 현재 계약대로 새 이용권 발급. 누적 기능이 완료된 것으로 표시하지 않음 |
| 예약 확보·실제 출결 차감 | 현행 Pass에 확보 횟수·실제 사용 횟수 없음 | 현행 잔여 표시. ‘승인 신청 대기’의 별도 데이터와 통합하지 않음 |

#### 3. 회의 내용과 기존 API가 다른 부분 → 개발자가 맞출 작업

회의에서 이미 논의한 내용을 ‘정하지 않은 제안’으로 취급하지 않는다.

1. **예약 신청 후 강사 확정·출결 시 차감:** 브레인스토밍2 16:16/18:50에 신청 후 강사 확정, 19:37~19:44와 브레인스토밍3 39:49/43:28에 출결 시 실제 차감을 논의했다. 현행 API의 즉시 확정·예약 차감과 차이가 있다. 승인 상태·횟수 확보·출결 차감 API 및 ERD를 회의 흐름에 맞춰 수정하고 회원/운영/이용권 화면을 통합해야 한다. 이번 메뉴 7 작업으로 계약 변경까지 완료한 것은 아니다.
2. **재등록:** 브레인스토밍3 54:39~58:19에서는 기존 이력 확인 후 같은 발급 흐름으로 정리했다. 첨부 보드에는 ‘구매 횟수가 추가됨’, ‘기존 잔여 횟수에 더하고 사전 지정 만료일·단가 적용’이 있다. 현재 createPass의 별도 발급과 누적 표현을 일치시키려면 총 횟수·재등록 이력·가격·기간·기존 예약과의 관계를 계약에 반영해야 한다. 신규/재등록 버튼을 별도 API가 있는 것처럼 매핑하지 않는다.
3. **홀딩 예약 취소:** 메뉴·보드의 기간 내 예약 취소와 기존 API의 ‘예약이 있으면 홀딩 거절’을 연결했다. 현재 화면은 개별 예약을 먼저 취소하고 등록한다. 한 번에 자동 취소·등록하려면 원자성·취소 실패 처리·대기 예약 영향까지 계약 보완이 필요하다.
4. **선결제와 발급:** 브레인스토밍3 2:11:53~2:12:01은 선결제, 2:05:02는 PG 연동 없는 기록을 논의했다. 실제 받은 결제를 바로 이어서 기록하는 화면이다. 현재 API는 미결제 발급도 허용하므로 결제 기록까지 반드시 완료해야 발급이 성립하도록 강제할 경우 계약 보완이 필요하다.

추가 확인 항목은 만료 예정의 기준 일수(화면은 30일), 누적 재등록의 기간 계산, 홀딩 자동 취소의 실패 처리, 조정한 잔여를 향후 예약 취소로 복구할 때 총 횟수 상한 처리다. 이미 논의한 ‘강사 확정’ 방식을 다시 선택하라는 의미가 아니다.

#### 직접 눌러볼 순서

1. 관리자 → 회원 이용권 → 전체/만료 예정/홀딩 중 → 상세보기.
2. 홍길동 상세 → 잔여 횟수 조정·만료일 조정 → 로그아웃 → 회원 로그인 → 내 이용권의 같은 이용권 #1001 확인.
3. 관리자 → 이용권 발급·재등록 → 홍길동 → 기존 이력 → 상품·강사·시작일·금액 → 발급 → 결제 기록. 회원의 내 이용권에 새 이용권이 별도 행으로 나타남.
4. 홍길동 #1001 → 홀딩 → 등록 → 10/12를 포함한 기간 선택 → 저녁 코어 예약 취소 → 홀딩 등록 → 연장 만료일 확인. 예정 취소/당일 조기 해제 후 날짜 확인.
5. 이수진 #1017 → 만료 예정, 이수진 #1018 → 홀딩 중, 최다은 #1013 → 홀딩 예정 이력 확인. 같은 이름은 ID로 구분.
6. 박민호 #1012 → 결제 내역 → 잔금 기록 → 일부 결제에서 완납으로 변경 → 기록 수정 → 환불 표시/해제. 환불 표시 후 결제 합계가 유지되는지 화면에서 확인.
7. 회원 관리 → 회원 상세 → 이용권 → 동일 상세·조정 화면 진입.

#### 예시 데이터와 확인 한계

같은 HTML의 memberAdminStore 이용권·결제, courseStore 예약, 메뉴 5 강사 데이터를 사용한다. 예약은 passId를 보관하므로 같은 상품을 재발급해도 원래 이용권에 차감·복구한다. 기본 초기값은 완납 이용권만 선택한다. 메뉴 8에서 미수 허용 설정을 바꾸면 이후 기본 예약의 이용권 자격에도 반영한다. ‘승인 신청 대기’는 별도 workflowStore로 남아 있어 횟수 확보/출결 차감과 메뉴 7은 아직 연동되지 않았다.

새로고침하면 초기화된다. 자바스크립트 문법 검사만 수행했다. 실제 API 연결·서버 자동 처리·실결제·실환불·브라우저 동작 테스트는 수행하지 않았다.


<a id="menu-8"></a>

## 메뉴 8. 운영 설정 — 상품·유형·룸·영업시간·예약 정책

관리자 로그인 → **운영 설정**의 5개 메뉴에서 확인한다. 같은 HTML에 화면과 버튼 동작을 누적 추가했다.

| 역할 | 화면·연결 | 역할별 문서 |
| --- | --- | --- |
| 관리자 | 상품 등록·수정·영향 확인·판매 상태 예시·삭제, 유형·룸 관리, 영업시간·휴무/보상, 예약 정책 | [관리자 API 상세](#doc-08-operation-settings-admin-api) |
| 회원 | 기존 수업·내 예약·내 이용권에서 변경된 취소 마감과 이용권 결과 확인 | [회원 API 상세](#doc-08-operation-settings-member-api) |
| 강사 | 개설 유형·룸·영업시간·기존 정원·보유 권한 결과 확인. 설정 저장 권한 없음 | [강사 API 상세](#doc-08-operation-settings-instructor-api) |

### 기존 API

- 상품: getPassProducts/getPassProduct/createPassProduct/updatePassProduct/deletePassProduct. 기존 발급 반영 전 getPasses로 대상 확인; 응답 affectedPassCount 표시.
- 수업 유형: getLessonTypes/createLessonType/updateLessonType. 단건 상세는 목록 객체. getPermissions와 강사 권한 화면 갱신.
- 룸: getRooms/getRoom/createRoom/updateRoom/deleteRoom. 시작 전 미취소 수업이 있으면 삭제 차단.
- 영업시간: getBusinessHours/updateBusinessHours. 7개 요일 전체 교체, 현지 HH:mm, 기존 수업 유지.
- 정책: getReservationPolicy/updateReservationPolicy. 기존 예약에도 이후 취소부터 새 마감 적용; 미수 허용은 신규 예약부터.

### 추가 API·계약 보완

상품 판매 중지/재개, 룸 비활성/활성, 날짜별 센터 휴무, 보상 대상 조회·일괄 연장·중복 방지·이력은 현재 계약에 없다. 화면에서는 업무 이름을 유지하고 **API 추가 필요**로 표시했다. 휴무 보상은 대상·일수 선택과 전후 확인 후 해당 이용권 만료일을 바꾸는 예시이며 실제 일괄 서버 처리 완료를 의미하지 않는다.

수업 유형 비활성의 기존 권한 유지와 권한 전체 교체 허용 코드, 룸 수용 인원과 수업 정원 비교, 상품 변경의 PAUSED 발급분 포함 여부, 기존/신규 예약의 취소 정책 선택 가능 여부를 명시해야 한다.

브레인스토밍3 2:16:41~2:17:20의 휴무 보상 일괄 연장, 2:17:32 이후의 기존 예약 적용 정책 논의를 문서 근거로 정리했다. 신청 후 강사 확정·출결 차감은 이미 논의된 흐름이며 정책 두 필드만으로 구현되지 않으므로 관련 API를 회의에 맞춰 수정할 작업이다.

### 화면 공유·확인 범위

상품은 메뉴 7 발급 선택지와 회원 이용권에 연결한다. 기존 수업의 유형 정원은 복사해 새 기준과 구분했다. 유형 비활성은 신규 개설만 제한하며 기존 수업·권한 유지. 기본 신규 개설에는 저장한 영업시간·룸 선택·휴무 예시를, 기본 예약에는 미수 허용과 변경된 취소 마감을 반영한다. 별도 ‘승인 신청 대기’/반복 회의 데이터까지 통합하지 않았다.

API·ERD는 변경하지 않았다. 문법 검사만 수행했으며 실제 API 호출·실행 테스트·브라우저 검증은 수행하지 않았다. 새로고침하면 초기화되며 고정 예시 시각은 2026-10-11 12:00이다.

<a id="doc-08-operation-settings-member-api"></a>

### 메뉴 8 운영 설정 — 회원

#### 회원에게 필요한 화면

운영 설정 관리 메뉴는 관리자 전용이다. 회원은 기존 **수업 목록·상세 / 내 예약·대기·출결 / 내 이용권**에서 결과를 확인한다.

- 예약 상세의 취소 마감은 변경된 정책으로 계산한다. 기존 예약에도 이후 취소 요청부터 새 마감이 적용된다.
- 미수 예약 허용 설정은 신규 예약에서 사용할 이용권을 고를 때 적용한다. 기존 예약을 취소하지 않는다.
- 상품 이름 변경·기존 발급 반영·휴무 보상 예시가 해당 이용권에 적용되면 내 이용권에 표시한다.
- 상품 가격 수정만으로 이미 발급된 이용권 금액은 변경되지 않는다.
- 수업 유형 정원 변경과 영업시간 변경만으로 기존 예약·수업을 취소하지 않는다.

#### 기존 API 연결

| 화면 | API | 사용 범위 |
| --- | --- | --- |
| 수업 상세·예약 마감 안내 | `GET /reservation-policy` / getReservationPolicy | cancelDeadlineHours, allowUnpaidReservation 읽기 |
| 수업 예약 | `POST /reservations` / createReservation | 서버 자동 이용권 선택. 미수 불허면 완납만, 허용이면 미수도 후보 |
| 예약 취소 | `POST /reservations/{reservationId}/cancellations` / cancelReservation | 변경된 마감·본인 예약·시작 전 여부 서버 판단 |
| 내 이용권 결과 | `GET /members/me/passes` / getMyPasses | 본인 이용권 값 재조회. 관리자용 상품/이용권 수정 호출 금지 |
| 수업·룸 정보 | getLessons/getLesson | 회원 노출 범위. 설정 관리 버튼 제공 안 함 |

#### 없는 API·개발자가 맞출 부분

날짜별 휴무·휴무 보상·상품 판매 중지·룸 비활성은 현재 계약에 없다. 관리자 화면의 해당 동작은 예시이며 실제 서버 구현 전 API 추가가 필요하다. 회원에게 상품 구매·결제·센터 설정 변경 UI를 임의로 추가하지 않았다.

브레인스토밍에 논의된 회원 신청 → 강사 확정 → 출결 시 차감은 현행 즉시 예약·예약 차감 API와 다르다. 운영 설정의 두 정책 필드로 이 흐름이 구현된 것은 아니며 관련 예약/이용권 계약을 함께 수정해야 한다.

#### 확인 위치

관리자에서 설정 변경 → 로그아웃 → 회원 로그인 → 수업 상세의 취소 마감, 내 예약, 내 이용권에서 결과 확인. 상품 변경에 기존 발급 반영을 선택하지 않은 경우 횟수·기간이 유지되는 것도 확인한다.

예시 데이터 공유·새로고침 초기화. 문법 검사만 수행했으며 실행 테스트·브라우저 검증·서버 연동은 수행하지 않았다.


<a id="doc-08-operation-settings-instructor-api"></a>

### 메뉴 8 운영 설정 — 강사

#### 강사에게 필요한 화면

운영 설정 관리 메뉴는 관리자 전용이다. 강사는 기존 **수업 목록·수업 개설·담당 수업 상세 / 내 프로필의 보유 권한**에서 설정 결과를 확인한다.

- 활성 유형 중 개설 권한이 있는 유형만 새 수업 개설 가능.
- 새 유형 등록이 권한 선택지에 추가되는 것과 강사에게 권한이 실제로 부여되는 것은 별도다. 관리자가 메뉴 5에서 부여해야 한다.
- 유형 정원을 변경해도 이미 개설된 수업 정원은 유지한다.
- 유형 비활성화는 새 개설을 막으며 기존 수업·보유 권한을 자동 취소/회수하지 않는다.
- 신규 개설에서 룸·영업시간을 확인하며 실제 서버가 충돌·부재·퇴사일·개설 가능 시간을 최종 검증한다.

#### 기존 API 연결

| 화면 | API / operationId | 연결 규칙 |
| --- | --- | --- |
| 보유 권한 | `GET /members/me` / getMyProfile | 실제 보유 permission 확인. 권한 부여는 관리자 전용 |
| 개설 유형 선택 | `GET /lesson-types` / getLessonTypes | active=true + 보유 LESSON_CREATE:{code} |
| 룸 선택·상세 | `GET /rooms`, `GET /rooms/{roomId}` / getRooms, getRoom | 수용 인원·ID 확인 |
| 센터 영업시간 | `GET /business-hours` / getBusinessHours | 7개 요일, 서울 HH:mm. 조회 가능하나 수정은 관리자 |
| 신규 수업 개설 | `POST /lessons` / createLesson | 개설 시 유형 정원 복사, LESSON_TYPE_INACTIVE/OUTSIDE_BUSINESS_HOURS 등 오류 |
| 예약 정책 조회 | `GET /reservation-policy` / getReservationPolicy | 조회만 가능. 강사의 수업 개설·출결 권한을 설정 수정 권한으로 확대하지 않음 |

#### API가 없거나 보완할 부분

룸 비활성, 날짜별 휴무와 신규 배정 차단, 휴무 보상 일괄 연장은 계약 추가가 필요하다. 현재 운영 설정 예시의 새 개설 선택지·요일 시간은 기본 수업 데이터에 연결했으며 ‘승인 신청 대기’의 별도 흐름까지 통합하지 않았다.

유형 비활성 시 보유 권한 유지와 권한 전체 교체 API의 허용 코드 규칙에 차이가 있으므로 기존 권한을 조용히 회수하지 않고 계약을 확인해야 한다. HTML은 해당 권한을 표시·유지하고 관리자의 권한 저장을 임시 제한한다.

예약 신청 후 강사 확정·출결 시 차감은 회의에 논의된 흐름으로 관련 API를 맞출 작업이다. 예약 정책 화면의 마감·미수 허용 설정과 별개다.

#### 확인 위치

관리자 → 운영 설정에서 유형 등록·정원 변경 → 강사 관리에서 권한 부여 → 강사 수업 개설. 비활성 유형은 신규 선택 제외, 기존 담당 수업은 유지. 영업시간 변경 후 신규 개설의 범위 검증 확인.

관리자용 상품 관리/센터 설정 저장 버튼은 강사에게 추가하지 않았다. 문법 검사만 수행했으며 실행 테스트·브라우저 검증·실제 API 연결은 수행하지 않았다.


<a id="doc-08-operation-settings-admin-api"></a>

### 메뉴 8 운영 설정 — 관리자

기준: `docs/menu-structure.md` 8.1~8.5, `api-spec/openapi.yaml`, 첨부 브레인스토밍2/3.
화면은 기존 `wireframes.html`에 누적 추가했다. 실제 서버 호출 없음. API 계약·ERD 변경 없음.

#### 확인 위치와 작업 내용

**관리자 로그인 → 왼쪽 운영 설정**.

| 화면 안 메뉴 | 확인할 동작 |
| --- | --- |
| 이용권 상품 | 검색·목록·상세·등록·수정, 기존 이용권 반영 대상 확인, 판매 중지/재개 예시, 삭제 |
| 수업 유형 | 목록·상태 필터·상세·등록·수정·활성/비활성, 유형별 개설·수정 권한 선택지 연계 |
| 룸 | 목록·상세·등록·수정·수용 인원, 사용 예정 수업 확인, 비활성 예시·삭제 |
| 영업시간·휴무일 | 7개 요일 영업/휴무 설정·저장 확인, 날짜별 휴무 등록·상세, 보상 대상 선택·일괄 연장 예시 |
| 예약 정책 | 현재 정책, 취소 마감 0~720시간, 미수 예약 허용, 기존 예약 적용 범위 확인·저장 |

회원·강사에게 운영 설정 관리 메뉴를 추가하지 않았다. 회원은 예약 취소 마감·이용권 결과를, 강사는 개설 선택지·운영 검증 결과를 기존 화면에서 확인한다.

#### 1. 화면·버튼에 연결할 기존 API

##### 8.1 이용권 상품

| 화면·버튼 | API / operationId | 요청·처리 후 연결 |
| --- | --- | --- |
| 상품 목록·검색·페이지 | `GET /pass-products` / `getPassProducts` | keyword=상품 이름, page/size. 등록 최신순 |
| 상세보기 | `GET /pass-products/{passProductId}` / `getPassProduct` | 선택한 상품 ID |
| 상품 등록 | `POST /pass-products` / `createPassProduct` | name, price, totalCount, validityDays, description? |
| 상품 수정 | `PATCH /pass-products/{passProductId}` / `updatePassProduct` | 변경 필드만, 최소 1개. applyToIssued 기본 false |
| 기존 발급 영향 확인 | `GET /passes` / `getPasses` | passProductId 및 status=UPCOMING/ACTIVE별 pageInfo.totalElements를 합산. 대상 정보는 페이지 전체를 조회하거나 영향 미리보기 API 필요 |
| 상품 삭제 | `DELETE /pass-products/{passProductId}` / `deletePassProduct` | 발급된 이용권이 한 건이라도 있으면 PASS_PRODUCT_IN_USE. 만료 이력도 삭제를 막음 |

- 상품 가격은 0 이상 정수, 총 횟수 1~1000, 유효 기간 1~3650일, 이름 1~100자, 설명 최대 500자.
- 담당 강사는 상품에 포함하지 않고 회원에게 발급할 때 정한다.
- 이름·설명은 표시 정보로 기존 발급분에도 반영. 기존 발급 가격은 유지.
- 총 횟수·유효 기간은 기본적으로 이후 발급부터 적용한다.
- `applyToIssued=true`이면 해당 상품의 UPCOMING/ACTIVE 이용권에 반영. PAUSED/EXPIRED는 현재 명시된 대상에서 제외.
- 총 횟수 변경분만큼 발급분의 총 횟수·잔여를 함께 증감, 잔여는 0 미만이 되지 않음.
- 기간 변경 시 시작일+기간-1일로 만료일 재계산. 개별 조정한 날짜·홀딩으로 늘린 날짜를 덮어쓸 수 있으므로 화면에서 전후 값을 확인한다.
- 화면에서 ‘기존 발급에도 반영’을 선택하면 대상·전후 값·확인란을 표시한다. 응답의 `affectedPassCount`로 처리 결과를 표시하고 목록·회원 이용권을 재조회한다.
- 판매 중지와 상품 삭제는 다른 업무다. 판매 중지는 기존 API에 상태 필드가 없으므로 별도 ‘API 추가 필요’ 표시와 예시 확인 창을 제공한다.

##### 8.2 수업 유형

| 화면·버튼 | API / operationId | 연결 기준 |
| --- | --- | --- |
| 목록·활성 필터 | `GET /lesson-types` / `getLessonTypes` | active?, page/size. 등록순. 필터 없으면 활성/비활성 모두 |
| 상세보기 | 선택한 목록 LessonType 객체 | 별도 GET 단건 API 없음 |
| 유형 등록 | `POST /lesson-types` / `createLessonType` | code, name, capacity. 등록 후 LESSON_CREATE/LESSON_UPDATE 권한 목록에 추가 |
| 이름·정원 수정 | `PATCH /lesson-types/{lessonTypeId}` / `updateLessonType` | name/capacity 변경 필드. code는 수정 불가 |
| 활성/비활성 | 동일 updateLessonType | active 한 필드 |
| 권한 선택지 갱신 | `GET /permissions` / `getPermissions` | 활성 유형의 부여 가능한 권한. 별도 강사 권한 부여는 메뉴 5 |

코드는 대문자로 시작하는 영문 대문자/숫자/밑줄 2~30자, 중복 시 LESSON_TYPE_CODE_DUPLICATED. 이름 최대 50자, 정원 1~100명.

정원은 수업 개설 시 복사된다. 기존 수업은 정원 변경·비활성으로 자동 취소되지 않는다. 비활성 유형으로 새 개설은 불가하며 기존 보유 권한은 유지된다. 이번 예시는 기존 수업의 유형 정원을 별도 복사해 신규 개설 기준과 분리했다.

**기존 계약 확인 필요:** 유형 비활성 후 보유 권한은 유지되지만 getPermissions 목록에서는 제외되고 updateMemberPermissions는 목록에 없는 코드를 금지한다. 다른 권한 수정 시 비활성 권한을 유지해서 전송할 수 있는지 계약을 보완해야 한다. HTML은 기존 권한을 그대로 보존·표시하고 해당 경우 권한 저장을 제한한다. 이는 임시 예시 처리이며 확정된 운영 정책이 아니다.

##### 8.3 룸

| 화면·버튼 | API / operationId | 연결 기준 |
| --- | --- | --- |
| 목록·페이지 | `GET /rooms` / `getRooms` | 이름 오름차순, page/size |
| 상세보기 | `GET /rooms/{roomId}` / `getRoom` | 선택 룸 ID |
| 룸 등록 | `POST /rooms` / `createRoom` | name, capacity. 같은 이름이면 ROOM_NAME_DUPLICATED |
| 이름·수용 인원 수정 | `PATCH /rooms/{roomId}` / `updateRoom` | 변경 필드, 최소 1개 |
| 사용 예정 수업 확인 | `GET /lessons` / `getLessons` | roomId, 시작 이후 범위, 상태/페이지. 취소 수업 제외 |
| 룸 삭제 | `DELETE /rooms/{roomId}` / `deleteRoom` | 시작 전·미취소 수업이 있으면 ROOM_IN_USE. 기존 수업을 먼저 취소/룸 변경 |

이름 1~50자, 수용 인원 1~100명. 룸 수용 인원과 수업 유형 정원은 별개의 값이다. 기존 API에는 수업 정원이 룸 수용 인원을 넘는 경우의 검증과 수용 인원 감소 시 기존 수업 처리 규칙이 명시되지 않았다. 화면은 기존 정원을 자동 변경하지 않으며 추가 규칙을 계약에 적어야 한다.

룸 비활성은 Room/RoomUpdateRequest에 active가 없으므로 API 추가 필요. 현재 화면은 새 개설 선택지에서 제외하는 동작 예시만 제공하며 기존 수업은 유지한다.

##### 8.4 요일별 영업시간

| 화면·버튼 | API / operationId | 연결 기준 |
| --- | --- | --- |
| 요일별 시간 조회 | `GET /business-hours` / `getBusinessHours` | 항상 월~일 7개, 페이지 없음 |
| 영업시간 저장 확인·저장 | `PUT /business-hours` / `updateBusinessHours` | `{businessHours:[7개]}` 전체 교체 |
| 휴무 체크 | 각 BusinessHour.closed | true이면 openTime/closeTime=null. 영업일은 openTime<closeTime |
| 이후 수업 개설 검증 | `POST /lessons` / `createLesson` | OUTSIDE_BUSINESS_HOURS. 설정 저장만으로 기존 수업 변경·취소 안 함 |

dayOfWeek=MON/TUE/WED/THU/FRI/SAT/SUN, 날짜/시각은 이 API의 예외 규칙인 **서울 현지 HH:mm**이다. UTC 시각으로 바꿔 전송하지 않는다. 요일 누락/중복과 시간 순서 오류는 INVALID_BUSINESS_HOURS.

실제 미설정 상태는 모두 closed=true. HTML 초기값은 기존 수업 예시를 유지하기 위해 매일 09:00~21:00으로 설정한 데이터다. 저장은 확인 창을 거쳐 7개 요일을 교체하며 기본 수업의 신규 개설에 적용한다. 이미 개설된 수업이나 ‘승인 신청 대기’의 별도 회의 데이터는 자동 변경하지 않는다.

##### 8.5 예약 정책

| 화면·버튼 | API / operationId | 연결 기준 |
| --- | --- | --- |
| 현재 정책 조회 | `GET /reservation-policy` / `getReservationPolicy` | 로그인한 모든 역할 조회 가능 |
| 정책 변경 확인·저장 | `PUT /reservation-policy` / `updateReservationPolicy` | cancelDeadlineHours, allowUnpaidReservation 두 필드 전체 교체 |
| 회원 취소 버튼·마감 안내 | getReservationPolicy + 예약 수업 시작 시각 | 기존 예약도 이후 취소 요청부터 새 마감 기준. 시작 후는 취소 불가 |
| 미수 이용권 예약 자격 | createReservation 서버 자동 선택 | 이후 신규 예약에 새 정책. 이미 한 예약 유지 |

cancelDeadlineHours=0~720 정수. 0이면 시작 직전까지 회원 취소 가능. 관리자 취소는 별도 규칙으로 시작 전 RESERVED를 취소하며 회원 마감 시간과 무관하다.

저장 확인 창에서 전후 값과 기존 예약 적용 범위를 안내한다. 화면의 기본 예약·대기 승급 예시에 미수 허용 값을 반영했다. 회의의 ‘신청 후 강사 확정’과 횟수 확보는 이 두 필드만으로 구현할 수 없다.

#### 2. 현재 API가 없어서 추가할 기능

| 기능 | 부족한 계약 | 화면 예시 |
| --- | --- | --- |
| 상품 판매 중지·재개 | 상품 판매 상태·목록 필터·발급 금지 규칙 없음 | 확인 후 발급 선택지에서 제외/복원. 기존 발급 유지 |
| 룸 비활성·활성 | Room.active 및 수정·개설 검증 규칙 없음 | 확인 후 신규 개설 룸 선택지 제외/복원 |
| 날짜별 센터 휴무 | 날짜/기간/휴무명 저장·조회 및 개설 검증 API 없음 | 휴무 기간 등록 → 기존 수업 확인. 별도 예시 데이터로 신규 개설 차단 |
| 휴무 보상 일괄 연장 | 대상 조회·일괄 처리·보상 이력·중복 방지·실패/재시도 API 없음 | 겹치는 이용권 후보 → 수동 선택·일수 입력 → 전후 확인 → 연장 예시 |
| 보상 영향 조회 | 자동 선정 규칙·예약/홀딩/만료 영향 정보 없음 | 후보만 표시. 보상 자격을 자동 판정하지 않음 |
| 상품 영향 상세 미리보기 | getPasses 목록의 합계는 가능, 원자적 전후 미리보기 API 없음 | 예시 전체 데이터로 상세 전후 표시. 실제 조회 후 변경 시 재검증 필요 |
| 과거 예약의 정책 고정/신규만 적용 선택 | 현행 정책은 기존 예약에도 취소 마감 일괄 적용 | 화면은 계약대로 적용 범위 읽기만 제공, 없는 선택 필드를 전송하지 않음 |

일괄 연장은 개별 updatePass를 여러 번 호출하면 완성되는 기능으로 간주하지 않는다. 일부 실패, 재실행, 중복 보상, 감사 이력과 동일 휴무 재보상 기준을 먼저 계약에 반영해야 한다.

#### 3. 회의 내용과 API의 차이·추가 확인

- 브레인스토밍2 10:50 설명에 영업시간 내 개설·명절 휴무를 포함했다. 기존 API는 요일별 영업시간만 있다. 날짜별 휴무 API를 추가할 작업이다.
- 브레인스토밍3 **2:16:41~2:17:20**에 휴무 보상 대상을 선택해 이용권 만료일을 한 번에 늘리는 흐름이 나온다. 논의된 기능을 ‘아직 생각하지 않은 제안’으로 취급하지 않는다. 이번 화면은 이 흐름을 표현했으며 실제 일괄 API는 없는 상태다.
- 브레인스토밍3 **2:17:32 이후**에 취소 정책을 기존 예약에도 적용할지 신규에만 적용할지 논의했다. 기존 API는 기존 예약에도 적용하도록 고정되어 있다. 두 방식을 고르는 옵션까지 필요하다면 적용 시점/예약별 정책 기록을 보완해야 한다. 메뉴의 ‘기존 예약 적용 정책 확인’은 현재 규칙 안내로 제공했다.
- **강사 확정·출결 시 차감**은 브레인스토밍에 논의되어 있다. 현행 예약 정책의 취소 마감·미수 허용과 별개로 예약/이용권 계약을 회의 흐름에 맞춰 수정해야 한다.
- 상품 변경의 PAUSED 이용권 반영 여부, 유형 비활성 권한 수정, 룸 수용 인원과 수업 정원의 관계, 휴무 보상 자격(만료/홀딩/미수 포함 여부)·일수·겹치는 휴무 중복 기준은 추가로 명시할 세부 규칙이다.

#### 화면에서 눌러볼 순서

1. 관리자 → 운영 설정 → 이용권 상품 → 상세보기 → 수정. 가격만 바꾼 뒤 기존 회원 이용권 가격 유지 확인, 새 발급 기본 가격 확인.
2. 상품 수정 → 총 횟수·기간 변경 → 기존 발급 반영 선택 → 대상·전후 값 확인 → 확인란 → 저장 → 회원 이용권 상세 확인.
3. 상품 등록 → 상세 → 판매 중지 → 발급 선택지 제외. 발급 이력 없는 상품 삭제 가능/기존 상품 삭제 불가 확인.
4. 수업 유형 → 등록 → 강사 관리 권한 선택지에 새 코드 표시. 정원 변경 후 기존 회차 정원 유지, 신규 회차 정원 변경 확인.
5. 유형 비활성 → 새 개설 유형 제외. 기존 수업과 보유 권한 유지 확인.
6. 룸 등록 → 수정 → 상세. 사용 예정 수업이 있는 룸은 삭제 차단. 새 룸의 비활성 예시도 확인.
7. 영업시간 → 요일 휴무/시간 변경 → 저장 확인 → 신규 수업 개설 검증. 기존 수업은 유지.
8. 휴무일 등록 → 상세·보상 대상 선택 → 연장 일수·이용권 선택 → 전후 확인 → 연장 예시 → 회원 이용권 만료일 확인. 같은 휴무로 이미 처리한 ID는 재선택 불가.
9. 예약 정책 → 취소 마감/미수 허용 → 변경 확인 → 저장. 회원의 기존 예약 취소 마감 안내와 신규 예약 자격에 반영.

#### 구현·검증 범위

관리자 화면이 p7Products/courseTypes/courseRooms 및 기본 이용권·예약 데이터를 공유한다. 상품 표시 이름/기본값·기존 반영, 유형 정원 복사, 기본 수업 개설의 시간 검증, 미수 예약 자격을 연결했다. 날짜별 휴무·보상·판매/룸 상태는 계약 미지원 예시임을 표시했다. ‘승인 신청 대기’와 반복 일정의 별도 데이터까지 동일 정책으로 통합한 것은 아니다.

예시 기준 시각은 기존 화면과 같은 2026-10-11 12:00(Asia/Seoul)으로 고정되어 있다. 현재 날짜를 의미하지 않는다. 새로고침 초기화. 자바스크립트 문법 검사만 수행했고 실행 테스트·브라우저 동작 검증·실제 API 연결은 수행하지 않았다.


<a id="menu-9"></a>

## 메뉴 9. 강사 수당·정산

관리자 로그인 → **강사 수당·정산**. 메뉴 5의 강사 정산 진입도 같은 화면·단가·정산 데이터로 연결했다.

| 역할 | 제공 화면 | 문서 |
| --- | --- | --- |
| 관리자 | 강사별 유형 단가, 전체/강사별 정산 목록, 계산 대상 확인·생성, 항목 상세, 검토·확정·지급, 폐기·재계산, 처리 이력 | [관리자 API 상세](#doc-09-instructor-settlements-admin-api) |
| 강사 | 기존 담당 수업 출결·정정 제한. 정산 조회/검토 API는 현재 관리자 전용 | [강사 API 상세](#doc-09-instructor-settlements-instructor-api) |
| 회원 | 기존 본인 예약·출결·이용권만 조회. 강사 금융 정보 미노출 | [회원 API 상세](#doc-09-instructor-settlements-member-api) |

### 기존 API

- 수당 기준: getMembers(role=INSTRUCTOR), getPayRates, updatePayRates, getLessonTypes. 단가 목록 전체 교체·0원/미설정 구분. 단가 변경은 이후 계산부터 적용.
- 정산 목록/생성/상세: getSettlements, createSettlement, getSettlement. 기간은 양끝 포함·종료일은 오늘보다 과거. 목록 기간 필터는 정산과 조회 범위의 겹침 기준.
- 상태: requestSettlementReview(CALCULATED→REVIEW_REQUESTED), confirmSettlement(→CONFIRMED), recordSettlementPayment(→PAID).
- 수정: 확정 전 discardSettlement → 출결·단가 수정 → createSettlement. 직접 금액 PATCH 없음.
- 처리 이력: getActivityLogs(targetType=SETTLEMENT,targetId), getActivityLogActions. 화면은 서버 감사 기록을 호출하지 않은 메모리 예시.

### 구현한 흐름

계산 미리보기에서 출결 미처리·단가 누락·기간 중복을 안내하고 처리 화면으로 연결한다. 계산 당시 단가를 저장하며 출석 인원 수를 곱하지 않는다. 전원 노쇼도 정산, 예약 없는 회차는 0원·NO_RESERVATION. 계산 순간부터 포함된 수업 출결이 잠기며 확정 전 폐기하면 풀린다.

정산 상태별 4건과 과거 수업·예약·당시 유효했던 만료 이용권을 추가했다. 퇴사 이강사 9/21~9/30의 기존 110,000원 계산 예시도 유지했다. ‘수정·다시 계산’은 폐기 확인 후 같은 강사·기간 입력 화면으로 이동하며 금액을 덮어쓰지 않는다.

### 없는 기능·회의와 차이

확정/지급 후 조정, 원본-정정본 연결, 전용 계산 미리보기, 정기일 자동 생성, 강사 본인 수당/정산 조회·검토 요청, 대표/상위 관리자 구분, 정산 알림은 추가 계약이 필요하다. 기존 활동 이력은 단건 처리 기록에 활용할 수 있지만 정산 버전 연결까지 이미 제공하는 것은 아니다.

브레인스토밍2 1:31~1:35의 강사별 단가·검토/대표 확정·외부 지급 기록, 1:36~1:42의 출결 마감·실적 고정, 1:42~1:44의 정기/조기 정산 흐름을 문서 근거로 정리했다. 현재 API는 모두 ADMIN 처리이고 계산 시점부터 출결 잠금이 적용되어 회의의 역할·마감 규칙과 계약을 맞출 작업이 남아 있다.

API·ERD 변경 없음. 문법 검사만 수행했고 실행 테스트·브라우저 검증·서버 연결·실제 송금은 수행하지 않았다. 같은 HTML에 누적하며 새로고침 시 예시 데이터 초기화.

<a id="doc-09-instructor-settlements-member-api"></a>

### 메뉴 9 강사 수당·정산 — 회원

#### 회원에게 필요한 화면

강사 수당·정산은 회원 업무가 아니므로 **회원 메뉴에 추가하지 않았다**. 회원은 기존 내 예약·대기·출결, 내 이용권에서 본인의 예약·출결·잔여만 확인한다. 강사 단가·수당·정산 금액·지급 정보를 노출하지 않는다.

#### 기존 API 연결

| 회원 화면 | API | 처리 기준 |
| --- | --- | --- |
| 내 예약·출결 | getMyReservations/getReservation | 본인 예약의 출석·노쇼 결과 |
| 내 이용권 | getMyPasses | 본인 이용권 값. 강사 수당 단가 아님 |

회원은 정산·단가 API를 호출하지 않는다. 정산 검토·확정·지급 사실 기록 자체가 회원 예약을 취소하거나 이용권을 추가 차감하지 않는다. 현재 API는 예약 때 차감·출결로 추가 차감 없음이며, 브레인스토밍의 출결 시 차감으로 맞추려면 관련 계약 수정이 필요하다.

#### 정산 이후 출결 정정

정산에 편입된 수업의 출결은 서버가 잠그고, 확정 전 관리자가 정산 폐기 후 정정할 수 있다. 회원에게 출결 수정/정산 폐기 버튼을 제공하지 않는다. 확정 이후 정정·정산 조정 API는 현재 없다.

회원 화면에서는 강사 금융 정보가 보이지 않는 역할 구분을 확인하면 된다. 문법 검사만 수행했으며 실행 테스트·브라우저 검증·서버 연동은 수행하지 않았다.


<a id="doc-09-instructor-settlements-instructor-api"></a>

### 메뉴 9 강사 수당·정산 — 강사

#### 현재 강사에게 제공하는 화면

메뉴 구조의 강사 역할 목록과 현재 API에 따라 **정산 관리 메뉴를 강사에게 추가하지 않았다**. 담당 수업의 예약자·출결 화면은 유지한다. 수업 개설/수정 권한은 정산 조회·확정 권한을 의미하지 않는다.

#### 기존 API 연결

| 강사 화면 | API | 정산과의 관계 |
| --- | --- | --- |
| 담당 수업·예약자·상세 | getLessons/getLesson/getLessonReservations/getReservation | 본인 담당 범위에서 출석·노쇼 확인 |
| 출석·노쇼·정정 | confirmAttendance | 정산 항목에 포함된 수업은 LESSON_SETTLED로 제한. CALCULATED부터 잠김 |
| 정정이 필요한 경우 | 관리자 discardSettlement 후 다시 confirmAttendance | 확정 전 정산만 폐기 가능. 강사는 정산 폐기 호출 불가 |

getPayRates/getSettlements/getSettlement/requestSettlementReview/confirmSettlement/recordSettlementPayment는 현재 모두 관리자 전용이다. 다른 강사의 정산을 숨기는 클라이언트 필터만으로 본인 조회 권한을 구현하지 않는다.

#### 회의 흐름에 맞출 API

브레인스토밍2 1:34:27~1:35:22에 검토 요청 역할과 대표 확정을 논의했다. 강사 본인의 수당·정산 조회와 검토 요청을 실제 화면으로 제공하려면 본인 범위 조회·검토 요청 권한·상태·대표 승인 범위를 계약에 반영해야 한다. 현행 API로 강사에게 관리 버튼을 열어주지 않았다.

현재 알림 종류에 정산 전용 이벤트도 없다. 계산/검토/확정 알림은 별도 계약이 필요하며 이번 작업에서 외부 메시지나 메일을 발송하지 않았다.

회의의 정산 마감 전후 출결 수정 범위와 현재 ‘계산 순간 잠금’의 차이는 관리자 문서에 기록했다. 확정된 정산을 강사가 출결 변경으로 자동 다시 계산하게 하지 않는다.

#### 확인 위치

강사 → 수업별 예약자·출결: 담당 수업의 출결 및 정산 포함 시 정정 제한.
관리자 → 강사 수당·정산: 전체 금융 관리. 강사 관리의 선택 강사 정산도 동일 화면.

예시 데이터 공유·새로고침 초기화. 문법 검사만 수행했으며 브라우저 동작·실제 서버 권한 검증은 수행하지 않았다.


<a id="doc-09-instructor-settlements-admin-api"></a>

### 메뉴 9 강사 수당·정산 — 관리자

기준: `docs/menu-structure.md` 9.1~9.2, `api-spec/openapi.yaml`, 첨부 브레인스토밍2.
기존 `wireframes.html`에 누적 추가. 메뉴 5의 강사 단가·정산 저장소와 같은 데이터 사용. API·ERD 변경 없음.

#### 확인 위치

**관리자 로그인 → 왼쪽 강사 수당·정산**.

| 화면 | 작업 내용 |
| --- | --- |
| 전체 정산 목록 | 강사·상태·기간 필터, 목록·페이지·상세 |
| 강사별 수당 기준 | 강사 이름/이메일·상태 검색, 강사 선택, 유형별 수업당 단가 조회·전체 교체 |
| 정산 계산 | 강사·기간 → 계산 대상 확인 → 출결/단가/기간 중복 안내 → 정산 생성 |
| 정산 상세 | 금액·기간·상태·정산/미정산 수업 수·처리 시각·지급 기록 |
| 수업별 항목 | 계산 시점 단가, 출석/노쇼 인원, 금액, 미정산 사유, 항목 상세 |
| 처리·수정 이력 | 계산·검토·확정·폐기·재계산·지급 기록 예시, 전후 값 상세 |
| 수정·다시 계산 | 확정 전 기존 정산 폐기 → 출결/단가 변경 → 같은 기간 다시 계산 |

강사 관리 → 퇴사·인계 → 강사 정산 보기로도 같은 목록·상세에 진입한다. 퇴사자도 동일한 정산 계산에서 강사와 기간을 지정한다.

#### 1. 화면·버튼의 기존 API

##### 9.1 수당 기준

| 화면·버튼 | API / operationId | 연결 기준 |
| --- | --- | --- |
| 강사 목록·이름/이메일·상태 | `GET /members` / getMembers | role=INSTRUCTOR, keyword/status/page/size. 퇴사·비활성 포함 가능 |
| 선택 강사의 단가 | `GET /members/{memberId}/pay-rates` / getPayRates | 관리자 전용. 설정된 유형만 반환. 미설정과 0원 구분 |
| 수업 유형 선택지 | `GET /lesson-types` / getLessonTypes | 활성/비활성 모두 조회. 과거 수업의 단가 설정에 비활성 유형도 필요할 수 있음 |
| 단가 변경 확인 → 저장 | `PUT /members/{memberId}/pay-rates` / updatePayRates | `{payRates:[{lessonTypeId,unitPrice}]}` 전체 교체. 목록에 없는 유형 삭제, 빈 배열이면 모두 삭제 |

수업당 단가이며 **출석 인원 수를 곱하지 않는다**. 단가 0 이상 정수, 유형 중복/없는 ID는 INVALID_PAY_RATE. 퇴사 강사도 설정 가능. 단가 변경은 이후 계산부터 적용하고 기존 계산·확정 정산의 단가는 유지한다. 화면에서는 기존/변경 값·삭제 대상 확인 후 저장한다.

##### 9.2 목록·계산·상세

| 화면·버튼 | API / operationId | 요청·성공 후 연결 |
| --- | --- | --- |
| 정산 목록·필터·페이지 | `GET /settlements` / getSettlements | instructorId, status, periodFrom, periodTo, page/size. 생성 최신순 |
| 정산 상세보기 | `GET /settlements/{settlementId}` / getSettlement | 선택 ID. 수업별 items 포함 |
| 계산 대상 확인 | getLessons + getLessonReservations + getPayRates + getSettlements | HTML은 전체 예시 데이터로 표시. 전용 계산 미리보기 API는 없음 |
| 정산 생성 | `POST /settlements` / createSettlement | instructorId, periodStart, periodEnd. 응답 SettlementDetail로 상세 이동 |
| 수업별 항목 상세 | getSettlement의 선택 items 객체 | 별도 항목 GET/수정 API 없음. 금액 직접 입력 불가 |

기간 필터는 조회 범위와 **겹치는 정산**을 조회한다. periodFrom은 해당 날짜 이후 끝나는 정산, periodTo는 해당 날짜 이전 시작하는 정산이며 양끝 포함이다. 기간 전체가 범위 안에 있어야 하는 조건이 아니다.

##### 계산 규칙·실패 복구

- 강사 한 명의 기간을 계산하며 종료일은 오늘보다 과거, 시작/종료일 모두 센터 현지 날짜 포함.
- 시작일이 기간에 속하고 취소되지 않았으며 이미 끝난 담당 수업 대상.
- 취소되지 않은 예약이 한 건이라도 있으면 정산. **전원 노쇼도 정산 대상**.
- 취소되지 않은 예약이 없으면 0원·미정산, excludedReason=NO_RESERVATION. 항목에는 보존.
- RESERVED 미처리 예약이 있으면 UNRECORDED_ATTENDANCE_EXISTS. invalidParams의 해당 수업 ID를 표시하고 출결 처리 화면으로 이동.
- 단가가 없으면 PAY_RATE_NOT_SET. 해당 유형을 표시하고 단가 설정으로 이동. 0원으로 설정한 단가는 미설정이 아님.
- 같은 강사의 폐기되지 않은 정산과 기간이 겹치면 SETTLEMENT_PERIOD_OVERLAP. 기존 정산 상세에서 처리.
- 퇴사 강사도 계산 가능. 별도 퇴사자 정산 API를 임의로 만들지 않음.
- **계산 단계부터 수업 실적이 정산에 편입되어 출결 정정이 잠긴다.** 최종 확정할 때 처음 잠기는 것으로 설명하지 않음. 미정산 항목도 settlement_items에 포함되면 잠김.
- 미리보기는 아직 생성/잠금이 아님. 생성 시 서버가 다시 검증하고 계산 당시 단가를 저장한다.

현재 빈 기간 계산의 거절 규칙은 API에 명시되지 않았다. 화면은 대상 없음 안내를 제공한다. 0원 정산을 허용할지, 대상 수업이 없으면 생성하지 않을지는 계약에 명시해야 한다.

##### 검토·확정·지급·수정

| 화면·버튼 | API / operationId | 허용 상태·영향 |
| --- | --- | --- |
| 검토 요청 | `POST /settlements/{settlementId}/review-requests` / requestSettlementReview | CALCULATED → REVIEW_REQUESTED. 관리자 전용 |
| 정산 확정 | `POST /settlements/{settlementId}/confirmations` / confirmSettlement | REVIEW_REQUESTED → CONFIRMED. 금액 변경 불가 |
| 외부 지급 기록 | `POST /settlements/{settlementId}/payments` / recordSettlementPayment | CONFIRMED → PAID. paidAt, memo? 최대 200자 |
| 정산 폐기 | `DELETE /settlements/{settlementId}` / discardSettlement | CALCULATED/REVIEW_REQUESTED만 가능. 포함 수업이 풀려 출결 정정·재계산 가능 |
| 수정·다시 계산 | discardSettlement → 출결/단가 변경 → createSettlement | 직접 PATCH로 금액을 수정하지 않음. 새 정산 ID 발급 |

실제 돈은 시스템 밖에서 지급하고 지급 사실을 기록한다. 지급 금액은 확정 전액으로 고정하며 분할 지급·송금 API가 아니다. 확정·지급 후 폐기/금액 정정/지급일 정정은 현재 API에 없다.

지급일은 date이며 현재 스펙에 ‘미래 지급일 금지’ 등 추가 날짜 검증은 명시되지 않았다. 화면은 날짜 입력만 받고 임의의 계약 제약을 추가하지 않았다. 실제 지급 사실 기록의 날짜 규칙은 스펙에 보완해야 한다.

##### 처리·수정 이력

| 화면 | 기존 API | 연결 기준 |
| --- | --- | --- |
| 선택 정산의 처리 이력 | `GET /activity-logs` / getActivityLogs | targetType=SETTLEMENT, targetId=정산 ID, order=DESC, page/size |
| 행위 이름·카테고리 | `GET /activity-log-actions` / getActivityLogActions | 서버 카탈로그 이름을 사용. 정산 행위 코드를 임의로 API enum처럼 고정하지 않음 |
| 이력 상세 | 선택 ActivityLog 객체 | actor, occurredAt, actionName, summary, changes(before/after). 별도 단건 GET 없음 |

HTML은 서버 활동 이력을 호출하지 않고 계산·검토·확정·폐기·지급의 예시 이력을 메모리에 기록한다. 같은 강사·동일 기간의 재계산 정산을 함께 표시하는 것은 예시 조회다. 원본-수정본 관계가 API에 없으므로 실제 수정 이력 연결이 완성된 것으로 간주하지 않는다. 단가 변경 이력은 PAY_RATE 범주의 별도 활동 이력으로 조회 전략을 정해야 한다.

#### 2. 없는 API·추가 작업

| 필요한 기능 | 현재 부족한 것 |
| --- | --- |
| 확정/지급 후 정산 수정 | 정정·반환·재확정·조정 항목·지급 기록 수정 API 없음. 확정 값을 직접 덮어쓰지 않음 |
| 수정본 연결·금액 차이 이력 | discard 후 새 ID가 만들어짐. 원본 정산/정정 사유/버전 연결 구조 없음 |
| 원자적 정산 미리보기 | 조회 조합으로 계산 예시 가능하나 최종 서버 예상 금액·문제 목록 응답 없음 |
| 정기 정산일/자동 생성 | 예약된 정산 기준일·자동 작업·기간 자동 산출 계약 없음. 화면은 수동 기간 지정 |
| 강사 본인 수당·정산 조회/검토 요청 | 현행 pay-rates/settlements/검토 요청 모두 관리자 전용. 본인 조회·요청 권한 API 없음 |
| 대표/상위 관리자 승인 | 현재 별도 역할·정산 승인 permission 없음. ADMIN 내에서 단계 진행 |
| 정산 관련 알림 | 현재 NotificationType에 정산 전용 이벤트 없음. 강사에게 알림/메일을 임의 발송하지 않음 |
| 수업 사전 정산 잠금 표시 | 예약 기본 응답에 잠금 플래그 없음. HTML은 공유 정산 store로 표시하지만 실제는 저장 오류/추가 조회·응답 보완 필요 |

#### 3. 회의 내용과 API 차이

- 브레인스토밍2 **1:31:28~1:33:07**에 강사별·수업별 단가 설정을 정리했다. 화면은 강사 선택 → 유형별 수업당 단가로 구현했다.
- **1:34:27~1:35:22**에 계산·검토 요청·대표 확정·외부 지급 기록을 논의했다. 현재 API는 모든 단계를 ADMIN만 허용한다. 강사의 검토 요청 역할과 대표/상위 관리자 구분을 실제로 제공하려면 권한·본인 범위를 계약과 맞춰야 한다. 이를 이미 API에 있는 기능이라고 설명하지 않는다.
- **1:36:03~1:42:19**에 출결 수정과 정산 마감, 월 단위 실적 고정·이후 조정 흐름을 논의했다. 현재 API는 createSettlement 시점부터 잠그며 확정 전 폐기 후 정정이 가능하다. 날짜 기반 마감·출결 정정 허용 범위를 회의 흐름과 계약 사이에 명시해야 한다.
- **1:42:30~1:44:52**에 중도 퇴사 정산을 별도 업무 대신 정기/조기 정산으로 정리했다. 화면은 퇴사 강사도 같은 기간 선택으로 계산한다. 정기일 자동 처리는 현재 API가 없다.
- 회원 신청 후 강사 확정·출결 시 실제 이용권 차감은 앞선 브레인스토밍에 논의된 흐름이다. 정산은 이 예약/출결 계약과 일치시켜야 하며 별도 ‘수업 종료’ 버튼을 누른 것만으로 수당을 확정하지 않는다.

#### 눌러볼 순서·예시

1. 관리자 → 강사 수당·정산 → 계산됨/검토 요청/확정/지급 상태별 상세 확인.
2. 김강사 9/1~9/10 계산됨 정산 80,000원 → 항목(그룹 30,000 + 개인 노쇼 50,000) → 검토 요청 → 확정 → 외부 지급 기록.
3. 박강사 9/11~9/20 30,000원 → 전원 노쇼 회차는 30,000원, 예약 없는 회차는 0원·미정산 확인.
4. 강사별 수당 기준 → 강사 선택 → 단가 변경 확인. 기존 정산 항목 단가는 유지되는지 확인.
5. 정산 계산 → 이강사(퇴사) → 9/21~9/30 → 4회차 중 3정산/1미정산, 110,000원 생성.
6. 김강사 → 9/21~9/30 → 출결 미처리 #309 → 출결 처리로 이동 → 기록 후 같은 기간 다시 계산.
7. 정강사 → 9/21~9/30 → 단가 미설정 → 단가 설정 → 다시 계산.
8. 계산됨 정산 상세 → 수정·다시 계산 → 폐기 확인 → 필요하면 출결/단가 수정 → 정산 재계산 → 새 ID의 처리·수정 이력에서 이전 폐기/새 계산 확인.
9. 확정/지급 정산은 수정·폐기 버튼 미제공. 강사 관리 → 강사 정산 보기도 같은 화면 진입.

#### 예시·검증 한계

메뉴 5 instructorMgmtStore 단가·정산, 기본 courseStore 수업/예약과 메뉴 7 이용권을 공유한다. 상태별 정산 4건과 과거 회차·예약, 당시 기간에 유효했던 만료 이용권을 추가했다. 메뉴 5의 퇴사 이강사 과거 4회차 예시도 같은 계산에 사용한다.

HTML은 실제 권한·동시성·감사 로그·금액 계산 서버를 대체하지 않는다. 별도 ‘승인 신청 대기’/회의용 수업 종료 데이터와 통합하지 않았다. 예시 기준 시각은 기존 화면과 같은 2026-10-11 12:00으로 고정, 현재 날짜를 의미하지 않는다. 새로고침 초기화. 문법 검사만 수행했으며 실행 테스트·브라우저 검증·실제 API/송금은 수행하지 않았다.

#### 메뉴 10 연결

정산 상세의 처리·수정 이력에서 ‘이 정산의 활동 이력 보기’로 targetType=SETTLEMENT/targetId 필터의 관리자 활동 이력 화면에 이동한다. 같은 p9Logs를 예시로 공유하며 실제 서버 감사 이력 호출은 아니다.


<a id="menu-10"></a>

## 메뉴 10. 알림·활동 이력

| 역할 | 화면 | 문서 |
| --- | --- | --- |
| 회원 | 본인 알림 목록·미확인 숫자·읽음·전체 읽음·관련 예약 | [회원 API 상세](#doc-10-notifications-activity-member-api) |
| 강사 | 본인 알림·읽음·관련 부재 상세, 관리자 활동 이력 미노출 | [강사 API 상세](#doc-10-notifications-activity-instructor-api) |
| 관리자 | 본인 알림과 전체 활동 이력 조회·필터·변경 전후 상세·관련 관리 화면 | [관리자 API 상세](#doc-10-notifications-activity-admin-api) |

### 기존 API 연결

- 알림 목록: getMyNotifications(page/size, unread?). 상세는 목록 Notification 객체. 별도 단건 GET 없음.
- 제목·행·상세 클릭: readNotification. 이미 읽어도 204. 본인만 가능.
- 전체 읽음: readAllNotifications. 현재 페이지·필터에 한정하지 않고 본인 전체 미확인에 적용.
- 상단 숫자: getMyUnreadNotificationCount. 목록 페이지 길이로 전체 숫자를 대신하지 않음.
- 활동 이력: getActivityLogActions 카탈로그로 필터 구성, getActivityLogs에서 category/action/actorId/actorRole/subjectMemberId/targetType/targetId/from/to/order/page/size 사용.
- 활동 상세는 목록 ActivityLog의 summary/changes(before/after) 사용. 별도 단건 GET 없음.
- relatedType/id 또는 targetType/id와 조회 권한이 확인된 경우 관련 화면 이동. 대상이 없거나 폐기되어도 사건 내용은 유지.

실제 읽음 처리 성공 후 목록·수·readAt을 재조회한다. HTML은 즉시 상태 변경 예시이며 서버 오류를 검증하지 않았다. 활동 기간의 from은 UTC 포함, to는 UTC 미포함, 화면은 서울 시각이다. 행위자와 영향받은 회원은 구분하며 actor=null도 표시한다.

### 추가 API·회의와 차이

현재 5개 종류는 수업 취소·관리자 예약 취소·부재 신청/승인/반려다. 회의에서 논의한 예약 신청·강사 확정/거절·대기 전환·승급 알림과 정산 전용 알림은 계약 추가가 필요하다. 알림 읽음은 예약/부재 승인이 아니다.

알림 삭제/미확인 되돌리기/검색/유형 필터/실시간 push, 관리자 발송·공지, 활동 이력 수정/삭제/내보내기 API는 현재 없다. 화면에서는 받은 알림과 읽기 전용 감사 기록만 제공한다. 모르는 type/category/action/target은 원문 표시하며 허용되지 않은 관련 화면으로 우회하지 않는다.

### 화면 동작·예시

역할별 초기 미확인 10개를 유지하고 5개씩 페이지 이동한다. 일부 알림은 예약·부재 ID를 연결해 관련 상세로 이동하며 조회 불가/정보 없음 안내도 제공한다. 활동 이력은 대표 19건과 메뉴 9 정산 처리 이력을 합쳐 예시 조회한다. 정산 상세에서 해당 정산 활동 이력으로 이동한다. 다른 메뉴의 모든 동작을 실제 감사 기록으로 자동 수집한 것은 아니다.

API·ERD 변경 없음. 문법 검사만 수행했으며 실행 테스트·브라우저 검증·실제 API·외부 알림 발송은 수행하지 않았다. 같은 HTML에 누적하고 새로고침 시 초기화.

<a id="doc-10-notifications-activity-member-api"></a>

### 메뉴 10 알림·활동 이력 — 회원

#### 확인 위치

**회원 로그인 → 상단 알림 또는 왼쪽 알림**.

- 초기 읽지 않은 알림 10개, 한 페이지 5개.
- 제목·행·상세보기를 누르면 읽음으로 변경, 받은/읽은 시각·내용 확인.
- 읽지 않은 것만 조회, 이전/다음 페이지.
- 모든 알림 읽음은 내 전체 미확인에 적용. 다른 역할 알림은 변경하지 않음.
- related 정보와 본인 권한이 있으면 관련 예약 상세로 이동.
- 활동 이력 관리자 메뉴는 회원에게 제공하지 않음.

#### 기존 API 연결

| 화면·버튼 | API / operationId | 연결 규칙 |
| --- | --- | --- |
| 내 알림 목록·미확인·페이지 | `GET /notifications` / getMyNotifications | page/size, unread=true?, 본인·최신순 |
| 상단 숫자 | `GET /notifications/unread-count` / getMyUnreadNotificationCount | unreadCount, 페이지 개수로 대체하지 않음 |
| 상세 클릭 → 읽음 | `PUT /notifications/{notificationId}/read` / readNotification | 본인 ID. 성공 204 후 목록/숫자 재조회. 이미 읽음도 성공 |
| 모두 읽음 | `PUT /notifications/read` / readAllNotifications | 필터/현재 페이지와 무관하게 본인 전체 |
| 상세 내용 | 선택 목록 Notification | 단건 GET 없음. 알 수 없는 type은 원문 표시 |
| 관련 예약 | getReservation | 회원 본인 예약. 취소된 예약도 해당 계약 권한 내 조회 |
| 관련 수업 | getLesson | 회원에게 숨겨진 비공개/취소 수업은 조회가 실패할 수 있음. 알림 내용은 유지 |

실제 readAt은 204에 없으므로 재조회한다. API 실패 때 읽음 성공으로 표시하지 않는다. HTML에서는 서버 호출 없이 즉시 상태를 변경하는 예시다.

#### 없는 API·회의에 맞출 작업

현재 수업 전체 취소(LESSON_CANCELED), 관리자 개별 예약 취소(RESERVATION_CANCELED) 종류가 있다. 회의에서 논의한 신청·강사 확정·거절·대기 전환/승급 알림은 현재 알림 계약에 없으므로 발생 시점·수신자·관련 대상 정보를 추가해야 한다.

알림 읽음은 예약 승인이 아니다. 승인/예약 처리 동작과 분리한다. 알림 삭제·다시 미확인·본문 검색·유형 필터·실시간 push는 현재 API에 없다. 해당 기능을 현재 지원처럼 표시하지 않았다.

#### 눌러볼 예시

첫 취소 알림 → 읽음 → 내 취소 예약 9501 상세. 다음 취소 수업 알림은 회원에게 현재 수업 상세 조회가 제한되면 링크 대신 안내를 표시한다. 관련 정보 없는 알림은 상세 내용만 확인한다. 모두 읽음 후 상단 0건, 관리자·강사 10건 유지.

기존 본인 알림 데이터 사용, 새로고침 초기화. 문법 검사만 수행했으며 브라우저 테스트·실제 API 연결은 수행하지 않았다.


<a id="doc-10-notifications-activity-instructor-api"></a>

### 메뉴 10 알림·활동 이력 — 강사

#### 확인 위치

**강사 로그인 → 상단 알림 또는 왼쪽 알림**.

초기 미확인 10개, 5개씩 페이지 이동. 제목·행·상세보기로 읽음과 상세 표시, 미확인 필터·모든 읽음, 관련 부재 상세 이동을 제공한다. 관리자 활동 이력은 강사에게 제공하지 않는다.

#### 기존 API 연결

| 화면·버튼 | API / operationId | 연결 기준 |
| --- | --- | --- |
| 본인 알림·미확인·페이지 | getMyNotifications | page/size, unread?, 최신순 |
| 미확인 숫자 | getMyUnreadNotificationCount | 본인 전체 숫자 |
| 제목·상세보기 → 읽음 | readNotification | 204 후 재조회. 본인 알림만 |
| 모든 읽음 | readAllNotifications | 내 모든 미확인. 다른 회원/관리자에게 영향 없음 |
| 상세 내용 | 선택 Notification 객체 | 단건 GET 없음. 받은/읽은 시각 표시 |
| 부재 관련 화면 | 기존 getAbsence 등 부재 조회 | 관리자 또는 해당 신청 강사 본인. 다른 강사의 부재 상세로 우회하지 않음 |
| 예약·수업 관련 화면 | getReservation/getLesson | 담당·노출 범위의 권한 서버 검사 |

부재 승인/반려(ABSENCE_APPROVED/ABSENCE_REJECTED)는 신청 강사의 결과 알림이다. 클릭은 읽음 처리만 수행하며 상태를 승인/반려로 바꾸지 않는다. 상세를 열었을 때 관련 부재는 이미 취소되었거나 다른 현재 상태일 수 있다.

getActivityLogs/getActivityLogActions는 ADMIN 전용이며 개설/수정 권한을 활동 이력 조회 권한으로 확대하지 않는다.

#### 추가 API·회의와 차이

예약 신청/대기/확정/거절·정산 전용 알림은 기존 5종에 없다. 회의 흐름에 맞춰 강사가 어떤 신청을 받고 어떤 사건을 알림으로 받는지와 수신 권한·relatedType/id를 계약에 추가해야 한다. 현재 자동으로 발송되는 것처럼 새로운 종류를 만들지 않았다.

실시간 push는 없고 미확인 수 API가 주기 조회용이다. HTML에는 polling을 구현하지 않았다. 알림 삭제/미확인 되돌리기/본문 검색/유형 필터도 계약에 없다.

#### 확인 예시

10월 25일 부재 승인 알림 → 읽음 → 김강사 본인 부재 805 상세. 9월 22일 반려 알림 → 부재 804에서 사유 확인. 모든 읽음 후 강사 0건, 회원/관리자 미확인 수는 유지.

기존 역할별 알림 10개 유지, 새로고침 초기화. 문법 검사만 수행했으며 실행 테스트·브라우저 검증·실제 API 연결은 수행하지 않았다.


<a id="doc-10-notifications-activity-admin-api"></a>

### 메뉴 10 알림·활동 이력 — 관리자

기준: `docs/menu-structure.md` 10번 및 관리자 활동 이력 메뉴, `api-spec/openapi.yaml`, 첨부 브레인스토밍2/3.
기존 `wireframes.html`에 누적 추가. API·ERD 변경 없음. 실제 API 호출·외부 메시지 발송 없음.

#### 화면과 확인 위치

| 위치 | 할 수 있는 일 |
| --- | --- |
| 상단 알림 버튼 또는 왼쪽 알림 | 내 알림·미확인 숫자, 읽지 않은 것만 조회, 5개씩 페이지, 전체 읽음 |
| 알림 제목·행·상세보기 | 읽음 처리 후 내용·분류·받은 시각·읽은 시각 표시 |
| 알림 상세 → 관련 화면 | relatedType/relatedId가 있고 조회 가능한 경우 부재·예약·수업 등으로 이동 |
| 왼쪽 활동 이력 | 기간·카테고리·행위·행위자/역할·영향받은 사람·대상 종류/ID별 필터, 정렬·페이지 |
| 활동 이력 상세 | 누가 무엇을 변경했는지, 변경 전후 필드, 관련 관리 화면 이동 |
| 상세 → 이 대상의 이력만 보기 | 동일 targetType/targetId 필터로 목록 이동 |
| 메뉴 9 정산 상세 → 처리·수정 이력 | ‘이 정산의 활동 이력 보기’로 활동 이력 목록에 연결 |

알림은 **관리자 본인의 받은 알림**이다. 관리자가 다른 회원의 알림을 읽거나 모두 읽음으로 변경하는 기능이 아니다. 활동 이력은 관리자 전용이며 알림과 별개의 데이터다.

#### 1. 각 화면·버튼의 기존 API

##### 내 알림

| 화면·버튼 | API / operationId | 연결 규칙 |
| --- | --- | --- |
| 내 알림 목록·페이지 | `GET /notifications` / getMyNotifications | page/size, 최신순, content/pageInfo. 로그인 본인 |
| 읽지 않은 알림만 | 동일 getMyNotifications | unread=true. 필터 바꾸면 page=1 |
| 상단 미확인 수 | `GET /notifications/unread-count` / getMyUnreadNotificationCount | unreadCount. 현재 목록 페이지 개수로 전체 수를 추측하지 않음 |
| 제목·행·상세보기 → 읽음 | `PUT /notifications/{notificationId}/read` / readNotification | body 없음, 본인 ID. 이미 읽음도 204. 다른 사용자/없는 ID는 404 |
| 모두 읽음 | `PUT /notifications/read` / readAllNotifications | body 없음. 본인의 모든 미확인 알림. 현재 페이지/필터에 한정되지 않음. 이미 모두 읽음도 204 |
| 알림 상세 | 선택한 목록 Notification 객체 | 별도 단건 GET 없음. title/message/type/createdAt/readAt/relatedType/relatedId 사용 |

실제 연결 시 readNotification 성공(204) 후 읽음 상태·목록·상단 수를 갱신한다. 204에는 readAt 응답이 없으므로 재조회한 값을 최종 기준으로 사용한다. 실패를 읽음 성공으로 표시하지 않는다. 읽지 않은 목록에서 읽음으로 이동한 행이 빠지거나 마지막 페이지가 비면 페이지를 조정한다. HTML은 서버 호출 없이 즉시 예시 상태를 갱신한다.

미확인 수 API는 주기 조회용이며 실시간 전송은 현재 계약에 없다. HTML에는 서버 polling/SSE/WebSocket을 구현하지 않았다.

##### 현재 정의된 알림 분류

| 종류 | 의미·수신자 |
| --- | --- |
| LESSON_CANCELED | 예약한 수업 전체 취소, 해당 회원 |
| RESERVATION_CANCELED | 관리자가 개별 예약 취소, 해당 회원 |
| ABSENCE_REQUESTED | 강사의 부재 신청, 관리자 |
| ABSENCE_APPROVED | 부재 승인, 신청 강사 |
| ABSENCE_REJECTED | 부재 반려, 신청 강사 |

type은 고정 enum이 아니라 string이다. 알 수 없는 값은 그대로 표시하며 화면이 깨지거나 알림을 숨기지 않는다. 관리자의 예시는 부재 신청 알림 중심으로 본인 알림 10개가 초기 미확인이다. 일반 회원·강사도 각각 10개를 유지했다.

##### 알림 관련 화면 이동

| relatedType | 연결할 API·화면 | 유의점 |
| --- | --- | --- |
| LESSON | getLesson → 수업 상세 | 관리자 범위, 삭제/조회 실패 안내 |
| RESERVATION | getReservation → 예약 상세 | 예약 본인/담당/관리자 권한 서버 검증 |
| ABSENCE | getAbsence 등 부재 관리 API → 부재 상세 | 관리자 처리 화면. 기존 역할별 부재 문서 참조 |
| 기타/없음 | 현재 연결 가능한 대상만 | 정보가 없으면 링크 없음, 모르는 값으로 임의 경로를 만들지 않음 |

알림은 과거 사건이며 링크한 화면은 현재 상태다. 이미 승인된 부재의 ‘접수 알림’을 열면 현재 승인 상태를 볼 수 있다. 삭제·권한 변경으로 관련 상세를 볼 수 없어도 알림 내용과 읽음 상태는 유지한다.

##### 관리자 활동 이력

| 화면·버튼 | API / operationId | 연결 규칙 |
| --- | --- | --- |
| 필터 선택지 | `GET /activity-log-actions` / getActivityLogActions | categories[].code/name/actions[].code/name. 페이지 없음. 서버 카탈로그 기준 |
| 목록·조회·정렬·페이지 | `GET /activity-logs` / getActivityLogs | category, action, actorId, actorRole, subjectMemberId, targetType, targetId, from/to, order, page/size |
| 특정 대상의 이력만 | 동일 getActivityLogs | targetType+targetId. 정산은 SETTLEMENT, 이용권은 PASS, 수업은 LESSON |
| 상세보기 | 선택 ActivityLog 객체 | 별도 이력 단건 GET 없음. summary, actor, subjectMember, target, occurredAt, changes |
| 관련 관리 화면 | 대상별 기존 API | 아래 표의 관리 화면. 대상이 없어도 이력은 읽기 가능 |

- `actorId`는 행동한 사람, `subjectMemberId`는 영향을 받은 사람. ‘김강사가 홍길동 출결 기록’에서 서로 다르다.
- actor=null은 시스템 또는 행위자 미확인. 특정 actorRole/actorId 필터에는 포함되지 않고 전체 조회에는 포함된다.
- targetId는 targetType과 함께 전송한다. 숫자 ID만으로 대상 종류를 추정하지 않는다.
- from은 포함, to는 미포함 **UTC date-time**. 입력은 서울 현지 시각으로 받고 UTC 변환, 표시는 다시 서울 시간으로 표시한다.
- DESC 최신순/ASC 오래된 순. 알 수 없는 category/action/role/targetType은 원문으로 표시한다.
- 변경 전후는 당시 기록이다. 현재 값을 조회해 과거 before/after를 재구성하지 않는다. 변경 값이 없는 이벤트는 ‘변경 값 없음’으로 표시한다.
- 개인정보는 서버 마스킹을 유지하며 비밀번호/토큰을 수집하거나 UI에 기록하지 않는다. HTML 예시 연락처도 마스킹된 문자열이다.

##### 활동 이력의 관련 화면

| targetType | 현재 화면 연결 |
| --- | --- |
| MEMBER | 회원 상세 또는 강사 상세 |
| LESSON / RESERVATION | 수업 상세 / 예약 상세 |
| PASS / PASS_PAYMENT / PASS_PAUSE | 이용권 상세 / 결제 상세 / 해당 이용권의 홀딩 탭 |
| PASS_PRODUCT / LESSON_TYPE / ROOM | 운영 설정 상품 상세 / 유형 목록 / 룸 상세 |
| BUSINESS_HOURS / RESERVATION_POLICY | 영업시간 / 예약 정책 |
| SETTLEMENT | 정산 상세. 폐기된 정산이면 이력만 조회 |

실제 상세 진입은 대상별 서버 조회 권한·404/403/폐기 상태를 다시 검사해야 한다. PASS_PAYMENT/PASS_PAUSE는 목록에서 관련 이용권 ID를 알 수 있어야 한다. 활동 이력의 targetId만으로 부모 passId가 없는 경우 연결 정보 보완이나 조회 전략이 필요하다. 유형은 단건 GET이 없으므로 목록에서 객체를 찾는다.

#### 2. API가 없어서 추가할 기능

| 요구 | 현재 빠진 것 |
| --- | --- |
| 수업 예약 신청/승인/거절 알림 | 관련 notification type·발생 시점·수신자·relatedType/id 정의 없음 |
| 대기 신청/취소/승급 확정 알림 | 대기 API와 알림 이벤트·권한·순번·만료 정책 없음 |
| 정산 계산/검토/확정/지급 알림 | 정산 전용 알림 종류·수신 권한·관련 정산 조회 API 부족 |
| 센터 공지·알림 작성/발송 | 관리자 발송·수신자 선택·공지 API 없음. 이번 화면은 받은 알림 조회만 제공 |
| 알림 삭제·다시 미확인으로 | 기존 API 없음. 버튼 추가하지 않음 |
| 실시간 알림 | 서버 push/SSE/WebSocket 계약 없음. 기존 unread-count 주기 조회와 구분 |
| 활동 이력 수정·삭제·내보내기 | 기존 API 없음. 조회용으로만 구성 |
| 삭제/폐기 대상 상세 | 원래 대상이 조회 불가할 수 있음. 이력과 대상 조회의 계약을 분리 |

알림 유형 필터·이름/본문 검색은 getMyNotifications에 없어서 임의의 type/keyword 쿼리를 추가하지 않았다. 현재 목록에는 API가 지원하는 unread 필터만 제공한다. activity keyword 검색도 기존 API에 없어 추가하지 않았다.

#### 3. 회의 내용과 기존 API의 차이

브레인스토밍2에서 예약 확정·대기 전환·취소 알림을 논의했다. 브레인스토밍3 2:17 이후에는 정책 변경·운영 영향을 논의했고 부재 처리에도 알림이 포함된다. 현재 정의된 5개 유형만으로 예약 승인·대기 관련 알림이 모두 제공된 것은 아니다. 회의에서 논의된 흐름에 맞춰 **누가 어떤 사건에서 무엇을 받는지**와 연결할 대상 정보를 API에 추가해야 한다.

‘알림을 읽었다’와 ‘예약/부재를 승인했다’는 다른 동작이다. 상세 클릭은 읽음 처리만 하며, 관련 관리 화면에서 별도로 승인·취소를 처리한다. 목록의 모든 읽음으로 업무가 승인/완료되는 기능으로 만들지 않았다.

메뉴 구조에는 10.1 알림만 적혀 있었지만 상위 제목 및 관리자 역할에 활동 이력이 포함되어 있다. 이번 작업에서 10.2 활동 이력의 화면 목록을 문서에 추가했다.

#### 직접 확인할 순서

1. 관리자 → 알림: 초기 미확인 10개, 5개씩 2페이지.
2. 제목/상세보기 클릭 → 읽음·읽은 시간·상단 숫자 감소. 관련 부재 상세로 이동해 실제 처리 버튼 확인.
3. 읽지 않은 것만 → 모두 읽음 → 본인 전체 0개. 강사·회원 알림 개수는 그대로 유지.
4. 관리자 → 활동 이력 → 변경한 사람/영향받은 사람을 각각 선택해 차이 확인.
5. 카테고리 선택 → 해당 행위 선택지 → 시간 범위·대상 종류/ID → 조회·페이지 이동.
6. 상세 → before/after 확인 → 관련 이용권/수업/결제 등으로 이동.
7. 상세 → 이 대상의 이력만 보기. actor=null 자동 만료 예시도 전체 조회에서 확인.
8. 메뉴 9에서 검토·확정·폐기·지급 처리 → 정산 이력 또는 활동 이력에서 새 예시 기록 확인.
9. 폐기된 정산은 관련 상세 링크가 없어도 기록 내용이 유지되는 예시 확인.

#### 데이터·검증 범위

기존 notificationStore 역할별 10개 미확인을 유지했다. 일부 알림만 실제로 존재하는 예시 예약·부재 ID를 연결했고, 그 외 related 정보 없는 알림은 내용 조회만 제공한다. 회원 관련 취소 예약 9501, 강사 본인 승인 부재 805를 추가했다.

활동 이력은 대표 사건 19건과 메뉴 9의 p9Logs를 함께 표시한다. 정산 이후 새 처리 기록은 공유되지만 다른 메뉴의 모든 버튼을 자동 감사 기록하는 시스템을 구현한 것은 아니다. 정산 행위 코드 SETTLEMENT_EVENT와 다른 대표 코드도 화면 카탈로그 예시이며 실제 서버 카탈로그의 확정 코드로 간주하지 않는다.

예시 시각은 기존 화면과 같은 2026-10-11 12:00에 고정, 현재 날짜를 의미하지 않는다. 새로고침 초기화. 문법 검사만 수행했으며 실행 테스트·브라우저 검증·서버 연동·실시간 전송은 수행하지 않았다.


<a id="menu-11"></a>

## 메뉴 11. 역할별 메뉴 요약 — 내 메뉴 안내

11번은 역할별 메뉴를 모아 설명하는 장이다. 기존 업무 화면을 복제하지 않고 **내 메뉴 안내** 화면에서 역할별 카드의 ‘화면 열기’로 진입하도록 연결했다. 각 역할의 홈에 ‘내 메뉴 전체 보기’, 왼쪽 메뉴에 ‘내 메뉴 안내’를 추가했다.

| 문서 | 내용 |
| --- | --- |
| [공통 화면·권한 안내](#doc-11-role-menu-overview) | 공통 역할 비교·진입 경로·메뉴 구성 기준·대표/상위 관리자 권한 후보 |
| [회원 API 상세](#doc-11-role-menu-member-api) | 회원 메뉴별 기존 API·본인 범위·내 계정 예시의 현재 한계 |
| [강사 API 상세](#doc-11-role-menu-instructor-api) | 강사 메뉴·현재 개설/수정 가능 유형·담당 수업 범위 |
| [관리자 API 상세](#doc-11-role-menu-admin-api) | 관리자 업무 메뉴·현재 없는 대표 역할/관리자 세부 permission |

내 메뉴 안내는 별도 API가 없고 login/getMyProfile의 role·name과 permissions를 기준으로 프론트에서 구성한다. 강사 개설 범위는 getLessonTypes의 활성 상태와 LESSON_CREATE:{code}, 수정은 LESSON_UPDATE:{code}를 별도로 판단한다. 각 카드 진입 후 기존 업무 화면의 API 매핑을 적용한다.

‘승인 신청 대기’는 기존 요청대로 강사/관리자 카드에 포함했다. 안내 연결은 미지원 신청/확정/대기 API의 구현 완료가 아니다. 실제 대표·상위 관리자 구분은 현행 역할/permission에 없으므로 새로운 역할 전환 버튼이나 대표 로그인 계정을 만들지 않았다.

회원 내 계정의 기존 화면은 기본 정보·일반 예시 모달 수준이다. 실제 프로필 저장/비밀번호/탈퇴 연동의 부족한 부분도 문서에 기록했다. 메뉴 안내 작업으로 해당 구현까지 완료한 것으로 간주하지 않는다.

API·ERD 변경 없음. 기존 HTML 한 파일에 누적하며 새로고침 초기화. 문법 검사만 수행했고 실행 테스트·브라우저 검증·실제 API 호출은 수행하지 않았다.

<a id="doc-11-role-menu-overview"></a>

### 메뉴 11 역할별 메뉴 요약 — 와이어프레임·API 안내

기준: `docs/menu-structure.md` 11번, `api-spec/openapi.yaml`, 기존 메뉴 1~10 와이어프레임.

#### 11번은 무엇인가요?

11번은 새 업무 기능이 아니라 **회원·강사·관리자별로 보이는 메뉴를 모은 요약**이다. 이번 화면은 ‘내 메뉴 안내’로 구성해 역할에 맞는 기존 화면을 실제 버튼으로 열도록 연결했다. 별도의 역할 변경·권한 부여·대표 계정을 임의로 추가하지 않았다.

#### 화면 확인 위치

1. `wireframes.html` → 로그인 화면의 역할 미리보기 선택 → 로그인.
2. 홈의 **내 메뉴 전체 보기** 또는 왼쪽 **내 메뉴 안내**.
3. 메뉴 카드의 **화면 열기** → 기존 화면 진입.
4. 다른 역할 확인은 프로필 메뉴 → 로그아웃 → 로그인 화면에서 해당 역할 미리보기 선택.

로그인 화면의 역할 선택은 HTML 미리보기용이다. 실제 서비스에서는 서버 로그인 결과와 내 정보의 role/permissions를 사용해야 한다. 로그인 후 사용자가 화면에서 역할을 변경한다고 서버 권한이 바뀌는 방식으로 구현하지 않는다.

#### 역할별 화면

| 역할 | 메뉴 안내의 내용 | 역할별 상세 문서 |
| --- | --- | --- |
| 회원 | 홈·수업·내 이용권·내 예약/대기/출결·알림·내 계정 | [회원 API 상세](#doc-11-role-menu-member-api) |
| 강사 | 홈·내 수업·예약자·출결·부재·프로필·알림, 현재 수업 유형별 개설/수정 가능 범위 | [강사 API 상세](#doc-11-role-menu-instructor-api) |
| 관리자 | 회원·강사·수업 운영·이용권·설정·정산·알림·활동 이력 등 기존 관리 메뉴 | [관리자 API 상세](#doc-11-role-menu-admin-api) |

실제 왼쪽 메뉴와 같은 목록에서 카드를 만든다. 앞서 요청한 ‘승인 신청 대기’ 메뉴도 강사·관리자의 안내에 포함해 기존 화면으로 연결한다. 이 연결이 해당 기능의 기존 API 지원을 의미하지는 않는다.

#### 화면·버튼에 연결할 API

| 화면·행동 | 기존 API 또는 처리 |
| --- | --- |
| 로그인 후 역할/이름 확인 | `POST /auth/login` / login, `GET /members/me` / getMyProfile |
| 역할별 사이드바·메뉴 카드 | getMyProfile의 role를 기준으로 프론트 메뉴 구성. 별도 메뉴 API 없음 |
| 강사 개설/수정 범위 | getMyProfile.permissions + getLessonTypes의 유형 코드·활성 상태. LESSON_CREATE와 LESSON_UPDATE 별도 판단 |
| 내 메뉴 전체 보기·홈으로 | 로컬 화면 이동. 서버 변경 요청 없음 |
| 화면 열기 | 기존 해당 화면으로 이동한 뒤 그 화면의 조회 API 사용. 역할별 문서의 표 참조 |
| 다른 역할 미리보기 | HTML의 로그아웃/로그인 역할 선택. 실제 계정 역할 변경 API로 연결하지 않음 |

메뉴 가시성과 업무 권한은 다르다. 메뉴를 숨기는 것만으로 보안이 완성되지 않으며 실제 조회·저장은 서버의 역할·본인·담당 범위를 따른다. MEMBER_READ 등 개별 권한으로 특정 조회가 추가로 허용되는 경우 전체 관리자 메뉴를 자동 열어주는 의미가 아니다.

#### 역할별 범위 비교

| 업무 | 회원 | 강사 | 관리자 |
| --- | --- | --- | --- |
| 수업·예약 | 공개 수업 예약, 본인 내역 | 담당 수업 예약자·출결, 유형별 권한으로 개설/수정 | 전체 운영·예약·출결 |
| 이용권·결제 | 본인 이용권 조회 | 담당 예약의 이용권 요약 | 발급·조정·홀딩·결제 기록 |
| 부재 | 관리 메뉴 없음 | 본인 신청·조회 | 전체 승인·반려·조정 |
| 계정·권한 | 본인 계정 | 본인 프로필·보유 권한 조회 | 회원·강사 계정·강사 권한 설정 |
| 운영 설정 | 결과/정책 안내 조회 | 개설 기준/정책 결과 확인 | 등록·수정 |
| 정산 | 금융 관리 메뉴 없음 | 현재 정산 API는 관리자 전용 | 단가·계산·검토·확정·지급 기록 |
| 알림 | 본인 | 본인 | 본인 |
| 활동 이력 | 메뉴 없음 | 메뉴 없음 | 전체 조회 |

#### API가 없거나 기존 계약과 맞출 내용

1. **대표·상위 관리자:** MemberRole은 MEMBER/INSTRUCTOR/ADMIN이다. 별도 대표 역할 및 부재 승인·정산 확정·전체 권한 설정·결제 환불 기록 등의 전용 관리자 permission은 없다. 11번에 적힌 권한 후보를 별도 계정이 구현된 것으로 표시하지 않는다. 담당자별로 구분하려면 역할/permission·서버 승인 범위를 먼저 계약에 반영해야 한다.
2. **신청·승인·대기:** 회의에 논의된 신청 후 강사 확정과 출결 시 차감은 현재 즉시 예약·예약 차감 API와 다르다. ‘승인 신청 대기’ 화면 연결과 실제 API/ERD 통합을 구분한다. 다시 운영 방식을 고르라는 의미가 아니라 회의에 맞춰 API를 수정할 작업이다.
3. **출결 정정 요청:** 기존 confirmAttendance는 직접 정정이며 요청→관리자 승인 API는 없다. 이번 안내는 기존 출결 처리 화면으로 연결한다.
4. **강사 본인 정산 조회·검토 요청:** 현재 관리자 전용 계약과 회의 역할 논의의 차이는 메뉴 9 문서에 기록했다. 안내에 임의의 강사 금융 메뉴를 추가하지 않았다.
5. **회원 내 계정:** 기존 회원 계정 화면은 기본 정보·일반 예시 모달 수준이다. 실제 updateMyProfile/changeMyPassword/withdrawMyAccount에 맞는 정규 입력·에러·재로그인/탈퇴 연동까지 이번 메뉴 요약 작업에서 완료한 것은 아니다. 역할별 문서에 현재 범위를 명시했다.

반복 일정·누적 재등록·휴무 보상·판매/룸 상태·신청/대기 알림 등 이전 메뉴의 API 부족 사항은 각 역할별 메뉴 6~10 문서가 기준이다. 메뉴 요약 버튼을 만들었다고 미지원 기능이 서버에 구현된 것은 아니다.

#### 결과물·검증

기존 `wireframes.html` 한 파일에 메뉴 안내를 추가했고 각 업무 화면을 별도로 복제하지 않았다. 메뉴 안내의 권한 표시는 기존 메뉴 5 강사 permissions 및 메뉴 8 유형 정보를 읽는다. API·ERD 변경 없음, 서버 호출 없음. 문법 검사만 수행했으며 실행 테스트·브라우저 검증은 수행하지 않았다. 새로고침하면 예시 데이터가 초기화된다.


<a id="doc-11-role-menu-member-api"></a>

### 메뉴 11 역할별 메뉴 요약 — 회원

#### 확인 화면

회원 로그인 → **내 메뉴 안내** 또는 홈 → **내 메뉴 전체 보기**.
본인 역할의 카드에서 ‘화면 열기’로 기존 화면에 진입한다. 새 회원 업무 화면을 복제하지 않았다.

| 카드 | 진입 화면 | 주요 기존 API |
| --- | --- | --- |
| 홈 | 회원 대시보드 | getMyProfile, getMyReservations, getMyPasses, getMyUnreadNotificationCount |
| 수업 목록 | 공개 수업·상세·예약 | getLessons, getLesson, createReservation |
| 내 이용권 | 본인 이용권 목록·상세 | getMyPasses. 상세는 선택 목록 Pass |
| 내 예약·대기·출결 | 본인 예약·취소·출결 내역 | getMyReservations, getReservation, cancelReservation. 대기 API 없음 |
| 알림 | 본인 알림·읽음·페이지 | getMyNotifications, getMyUnreadNotificationCount, readNotification, readAllNotifications |
| 내 계정 | 기존 본인 정보 예시 | getMyProfile. 아래 현재 범위 참조 |

메뉴 안내 자체는 getMyProfile의 role/name을 기준으로 구성하며 별도 API가 없다. 카드 클릭은 화면 이동이고 API는 진입한 화면의 기존 매핑을 따른다.

#### 회원 범위

회원·강사 관리, 전체 이용권·결제, 운영 설정 저장, 강사 정산, 관리자 활동 이력 메뉴는 회원 안내에 넣지 않았다. 본인 예약/이용권/알림을 선택한다. 다른 사람의 ID를 넣는 것으로 조회 권한을 얻지 않는다.

#### 현재 부족한 것

- 대기 신청·취소·승급과 예약 신청 후 강사 확정은 현재 API 미지원. 메뉴 6/10 MD에 추가 작업 기록.
- 회원 내 계정은 기존 기본 정보·일반 예시 모달 수준이다. 실제 정보 저장은 PATCH /members/me(updateMyProfile), 비밀번호 변경은 PUT /members/me/password(changeMyPassword), 탈퇴는 DELETE /members/me(withdrawMyAccount)가 기준이나 그 정규 폼·서버 연동은 이번 메뉴 요약의 작업 범위가 아니다.
- 실제 비밀번호 변경은 현재 비밀번호·새 비밀번호 입력 및 성공 후 재로그인, 탈퇴는 미래 예약 확인·이력 보존·토큰 만료가 필요하다. 일반 예시 모달을 이 연동이 완료된 것으로 표시하지 않는다.

#### 확인 순서

회원 → 내 메뉴 안내 → 수업 목록/내 이용권/내 예약/알림의 화면 열기 → 해당 화면에서 기존 버튼 사용. 홈으로 버튼과 왼쪽 내 메뉴 안내로 돌아올 수 있다.

API·ERD 변경 없음. 문법 검사만 수행했으며 브라우저 동작 테스트·실제 API 연결은 수행하지 않았다.


<a id="doc-11-role-menu-instructor-api"></a>

### 메뉴 11 역할별 메뉴 요약 — 강사

#### 확인 화면

강사 로그인 → **내 메뉴 안내** 또는 홈 → **내 메뉴 전체 보기**.
역할 메뉴 카드와 현재 수업 유형별 개설/수정 가능 범위를 표시한다.

| 카드 | 진입 화면 | 주요 기존 API |
| --- | --- | --- |
| 홈 | 담당 수업 대시보드 | getMyProfile, getLessons, getLessonReservations, getMyUnreadNotificationCount |
| 수업 목록 | 담당 수업·상세, 권한별 개설/수정 | getLessons/getLesson, createLesson/updateLesson/changeLessonStatus/cancelLesson |
| 승인 신청 대기 | 기존 신청·확정·대기 흐름 예시 | 현행 예약 승인·대기 API 없음. 별도 회의 데이터 |
| 수업별 예약자 | 담당 수업 예약자·예약 상세 | getLessonReservations, getReservation |
| 출결 처리 | 담당 수업 출석·노쇼·직접 정정 | confirmAttendance. 정산 포함 수업은 LESSON_SETTLED 제한 |
| 부재 신청 | 본인 신청·조회·철회 | getAbsences/getAbsence/createAbsence/cancelAbsence |
| 내 프로필 | 본인 프로필·보유 권한 | getMyProfile/updateMyProfile |
| 알림 | 본인 알림·읽음·관련 부재 | getMyNotifications/readNotification/readAllNotifications/getMyUnreadNotificationCount |

#### 권한 표시

getMyProfile.permissions와 getLessonTypes의 현재 유형을 사용한다. LESSON_CREATE:{code}와 LESSON_UPDATE:{code}는 별도다.

- 개설: 활성 유형+해당 개설 권한.
- 수정: 해당 수정 권한, 기존 수업의 운영 가능 상태를 추가 확인.
- 담당 예약자·출결: 본인 담당 수업. 개설/수정 권한을 받았다고 다른 강사의 예약자·출결 처리 범위까지 넓어지지 않는다.

예시 김강사는 초기 개설/수정 권한 없음으로 표시한다. 관리자 → 강사 관리 → 김강사 권한 부여 → 강사로 다시 로그인 → 내 메뉴 안내에서 가능 유형을 확인한다. 비활성 유형의 기존 수정 권한은 유지될 수 있으나 신규 개설은 제외한다.

#### 현재 없는 기능·계약 차이

승인·대기 및 출결 시 차감은 회의 흐름에 맞춰 API/ERD를 수정할 작업이다. 출결 정정 요청→승인 과정은 기존 직접 confirmAttendance와 다르다. 강사 본인 수당/정산 조회·검토 요청도 현재 관리자 전용 계약과 권한 차이가 있으며 메뉴 9 MD에 정리했다.

회원 관리·전체 이용권/결제·센터 설정 저장·관리자 활동 이력·정산 관리 카드를 강사에게 추가하지 않았다. 안내 화면에서 역할/권한을 변경하는 버튼을 제공하지 않는다.

API·ERD 변경 없음. 문법 검사만 수행했으며 실행 테스트·브라우저 검증·서버 연결은 수행하지 않았다.


<a id="doc-11-role-menu-admin-api"></a>

### 메뉴 11 역할별 메뉴 요약 — 관리자

#### 확인 화면

관리자 로그인 → **내 메뉴 안내** 또는 홈 → **내 메뉴 전체 보기**.
전체 관리 메뉴 카드에서 기존 화면으로 이동한다. 주요 관리 업무 버튼으로 강사 관리·정산·이용권/결제도 바로 연다.

| 카드 | 기존 업무 화면 | 주요 기존 API |
| --- | --- | --- |
| 홈 | 전체 수업·예약·출결·알림 | getLessons/getReservations/getMyUnreadNotificationCount |
| 회원 관리 | 목록·상세·정보·상태 | getMembers/getMember/updateMember/changeMemberStatus |
| 강사 관리 | 계정·권한·부재·퇴사·인계 | getMembers/createMember/getMember, 권한·부재·퇴사 관련 API(메뉴 5 MD) |
| 수업 운영 | 회차·공개·취소·예약·출결 | getLessons/getLesson/createLesson/updateLesson/changeLessonStatus/cancelLesson, getReservations/confirmAttendance |
| 승인 신청 대기 | 기존 승인형 신청·대기 예시 | 현재 해당 상태/처리 API 없음 |
| 회원 이용권 | 발급·조정·홀딩·결제 기록 | getPasses/getPass/createPass/updatePass, 홀딩·결제 API(메뉴 7 MD) |
| 운영 설정 | 상품·유형·룸·시간·정책 | getPassProducts/createPassProduct/updatePassProduct, 유형/룸/business-hours/reservation-policy API(메뉴 8 MD) |
| 강사 수당·정산 | 단가·계산·검토·확정·외부 지급 | getPayRates/updatePayRates/getSettlements/createSettlement/getSettlement/requestSettlementReview/confirmSettlement/recordSettlementPayment/discardSettlement |
| 알림 | 관리자 본인의 받은 알림 | getMyNotifications/readNotification/readAllNotifications/getMyUnreadNotificationCount |
| 활동 이력 | 전체 행위·대상·변경 전후 | getActivityLogs/getActivityLogActions |

메뉴 진입은 서버 변경 요청이 아니다. 해당 화면의 실제 요청·권한·실패 처리는 이전 메뉴별 MD가 기준이다. 역할별 메뉴 안내에는 별도 API를 추가하지 않았다.

#### 대표·상위 관리자 권한 후보

메뉴 구조에 후보로 적힌 부재 승인·반려, 정산 확정, 퇴사자 정산, 전체 권한 설정, 결제·환불 기록 관리는 현재 ADMIN 업무다.

현재 MemberRole은 MEMBER/INSTRUCTOR/ADMIN이고 별도 대표·상위 관리자 역할은 없다. 기존 permission도 MEMBER_READ와 유형별 개설/수정 중심이며 위 주요 관리자 업무의 전용 permission이 정의되어 있지 않다. 새로운 대표 로그인·권한 스위치·승인자를 이번 화면에서 만들어 실제로 구분된 것처럼 표시하지 않았다.

담당자별 승인/조회/변경 범위를 나누려면 역할 또는 관리자 permission, 서버 정책·승인 이력·권한 부여 범위를 계약에 먼저 반영해야 한다. 기존 관리자 업무 버튼으로 해당 화면에 진입하도록 안내한다.

#### 현재 계약 부족 사항

승인 신청 대기·반복 일정·누적 재등록·날짜별 휴무/일괄 보상·판매 중지/룸 비활성·정산 확정 후 정정·예약/대기 알림은 이전 메뉴별 MD에 정리되어 있다. 메뉴 카드가 있다고 해당 API가 구현된 것은 아니다.

#### 확인 순서

관리자 → 내 메뉴 안내 → 회원/강사/수업/이용권/운영 설정/정산/알림/활동 이력의 화면 열기. 강사 관리에서 권한 변경 후 강사 메뉴 안내를 열어 표시 범위 확인. 역할별 화면 비교는 기존 로그인 미리보기에서 수행한다.

API·ERD 변경 없음. 문법 검사만 수행했으며 브라우저 테스트·실제 API 연결은 수행하지 않았다.
