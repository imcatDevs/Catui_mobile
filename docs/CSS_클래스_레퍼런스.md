# CATUI Mobile CSS 클래스 레퍼런스

> 전체 CSS 클래스 목록 (카테고리별)

---

## 목차

1. [레이아웃](#1-레이아웃)
2. [타이포그래피](#2-타이포그래피)
3. [색상](#3-색상)
4. [간격](#4-간격-spacing)
5. [버튼](#5-버튼)
6. [카드](#6-카드)
7. [폼 요소](#7-폼-요소)
8. [리스트](#8-리스트)
9. [네비게이션](#9-네비게이션)
10. [데이터 표시](#10-데이터-표시)
11. [피드백](#11-피드백)
12. [미디어](#12-미디어)
13. [오버레이](#13-오버레이)
14. [그리드 메뉴](#14-그리드-메뉴)
15. [유틸리티](#15-유틸리티)

---

## 1. 레이아웃

### Container

| 클래스 | 설명 |
|--------|------|
| `.container` | 기본 컨테이너 |
| `.container-sm` | max-width: 540px |
| `.container-md` | max-width: 720px |
| `.container-lg` | max-width: 960px |
| `.container-xl` | max-width: 1140px |
| `.container-fluid` | 전체 너비 |

### Grid (12-column)

| 클래스 | 설명 |
|--------|------|
| `.row` | 행 컨테이너 |
| `.row-dense` | 좁은 간격 행 |
| `.row-gap-0` ~ `.row-gap-4` | 행 간격 |
| `.col` | 자동 너비 컬럼 |
| `.col-auto` | 내용에 맞춤 |
| `.col-1` ~ `.col-12` | 고정 너비 (1/12 ~ 12/12) |
| `.col-sm-1` ~ `.col-sm-12` | 576px 이상 |
| `.col-md-1` ~ `.col-md-12` | 768px 이상 |

### Flexbox

| 클래스 | 설명 |
|--------|------|
| `.flex` | display: flex |
| `.inline-flex` | display: inline-flex |
| `.flex-row` | 가로 방향 |
| `.flex-col` | 세로 방향 |
| `.flex-row-reverse` | 가로 역순 |
| `.flex-col-reverse` | 세로 역순 |
| `.flex-wrap` | 줄바꿈 |
| `.flex-nowrap` | 줄바꿈 없음 |
| `.justify-start` | 시작점 정렬 |
| `.justify-end` | 끝점 정렬 |
| `.justify-center` | 중앙 정렬 |
| `.justify-between` | 양끝 정렬 |
| `.justify-around` | 균등 분배 |
| `.justify-evenly` | 동일 간격 |
| `.items-start` | 상단 정렬 |
| `.items-end` | 하단 정렬 |
| `.items-center` | 중앙 정렬 |
| `.items-baseline` | 베이스라인 |
| `.items-stretch` | 늘리기 |
| `.content-start` ~ `.content-stretch` | align-content |
| `.self-auto` ~ `.self-stretch` | align-self |
| `.flex-1` | flex: 1 1 0% |
| `.flex-auto` | flex: 1 1 auto |
| `.flex-none` | flex: none |
| `.grow` | flex-grow: 1 |
| `.grow-0` | flex-grow: 0 |
| `.shrink` | flex-shrink: 1 |
| `.shrink-0` | flex-shrink: 0 |
| `.order-first` | order: -9999 |
| `.order-last` | order: 9999 |
| `.order-1` ~ `.order-12` | 순서 지정 |

### Gap

| 클래스 | 값 |
|--------|-----|
| `.gap-0` ~ `.gap-8` | 전체 방향 |
| `.gap-x-0` ~ `.gap-x-4` | 가로 간격 |
| `.gap-y-0` ~ `.gap-y-4` | 세로 간격 |

### Stack

| 클래스 | 설명 |
|--------|------|
| `.stack` | 수직 스택 |
| `.stack-0` ~ `.stack-8` | 수직 간격 |
| `.hstack` | 수평 스택 |
| `.hstack-0` ~ `.hstack-4` | 수평 간격 |

### Width & Height

| 클래스 | 설명 |
|--------|------|
| `.w-full` | width: 100% |
| `.w-screen` | width: 100vw |
| `.w-auto` | width: auto |
| `.w-1\/2` | width: 50% |
| `.w-1\/3` | width: 33.33% |
| `.w-2\/3` | width: 66.67% |
| `.w-1\/4` | width: 25% |
| `.w-3\/4` | width: 75% |
| `.min-w-0` | min-width: 0 |
| `.min-w-full` | min-width: 100% |
| `.max-w-full` | max-width: 100% |
| `.h-full` | height: 100% |
| `.h-screen` | height: 100vh |
| `.h-auto` | height: auto |
| `.min-h-0` | min-height: 0 |
| `.min-h-full` | min-height: 100% |
| `.min-h-screen` | min-height: 100vh |
| `.min-h-screen-safe` | 안전 영역 포함 |

### Position

| 클래스 | 설명 |
|--------|------|
| `.relative` | position: relative |
| `.absolute` | position: absolute |
| `.fixed` | position: fixed |
| `.sticky` | position: sticky |
| `.static` | position: static |
| `.inset-0` | 전체 방향 0 |
| `.inset-x-0` | 좌우 0 |
| `.inset-y-0` | 상하 0 |
| `.top-0` | top: 0 |
| `.right-0` | right: 0 |
| `.bottom-0` | bottom: 0 |
| `.left-0` | left: 0 |
| `.z-0` ~ `.z-50` | z-index |
| `.z-auto` | z-index: auto |

### Display

| 클래스 | 설명 |
|--------|------|
| `.block` | display: block |
| `.inline-block` | display: inline-block |
| `.inline` | display: inline |
| `.hidden` | display: none |
| `.contents` | display: contents |

### Overflow

| 클래스 | 설명 |
|--------|------|
| `.overflow-auto` | overflow: auto |
| `.overflow-hidden` | overflow: hidden |
| `.overflow-visible` | overflow: visible |
| `.overflow-scroll` | overflow: scroll |
| `.overflow-x-auto` | 가로만 auto |
| `.overflow-x-hidden` | 가로만 hidden |
| `.overflow-y-auto` | 세로만 auto |
| `.overflow-y-hidden` | 세로만 hidden |
| `.scroll-smooth` | 부드러운 스크롤 |

### Aspect Ratio

| 클래스 | 비율 |
|--------|------|
| `.aspect-auto` | auto |
| `.aspect-square` | 1:1 |
| `.aspect-video` | 16:9 |
| `.aspect-4\/3` | 4:3 |
| `.aspect-3\/2` | 3:2 |
| `.aspect-2\/1` | 2:1 |

### Object Fit

| 클래스 | 설명 |
|--------|------|
| `.object-contain` | object-fit: contain |
| `.object-cover` | object-fit: cover |
| `.object-fill` | object-fit: fill |
| `.object-none` | object-fit: none |
| `.object-center` | object-position: center |
| `.object-top` | object-position: top |
| `.object-bottom` | object-position: bottom |

### Float & Clear

| 클래스 | 설명 |
|--------|------|
| `.float-left` | float: left |
| `.float-right` | float: right |
| `.float-none` | float: none |
| `.clear-left` ~ `.clear-both` | clear |
| `.clearfix` | clearfix hack |

### Safe Area (iOS)

| 클래스 | 설명 |
|--------|------|
| `.safe-top` | 상단 노치 영역 |
| `.safe-bottom` | 하단 홈바 영역 |
| `.safe-left` | 왼쪽 안전 영역 |
| `.safe-right` | 오른쪽 안전 영역 |
| `.safe-all` | 전체 안전 영역 |

### Center

| 클래스 | 설명 |
|--------|------|
| `.center` | flex 중앙 정렬 |
| `.center-x` | 가로만 중앙 |
| `.center-y` | 세로만 중앙 |
| `.center-absolute` | 절대 위치 중앙 |

---

## 2. 타이포그래피

### 제목

| 클래스 | 크기 |
|--------|------|
| `.h1` | 26px |
| `.h2` | 22px |
| `.h3` | 19px |
| `.h4` | 17px |
| `.h5` | 15px |
| `.h6` | 13px |

### 텍스트 크기

| 클래스 | 크기 |
|--------|------|
| `.text-xs` | 12px |
| `.text-sm` | 13px |
| `.text-base` | 15px |
| `.text-lg` | 17px |
| `.text-xl` | 19px |
| `.text-2xl` | 22px |
| `.text-3xl` | 26px |

### 텍스트 정렬

| 클래스 | 설명 |
|--------|------|
| `.text-left` | 왼쪽 정렬 |
| `.text-center` | 중앙 정렬 |
| `.text-right` | 오른쪽 정렬 |
| `.text-justify` | 양쪽 정렬 |

### 폰트 굵기

| 클래스 | 굵기 |
|--------|------|
| `.font-light` | 300 |
| `.font-normal` | 400 |
| `.font-medium` | 500 |
| `.font-semibold` | 600 |
| `.font-bold` | 700 |

### 줄 높이

| 클래스 | 값 |
|--------|-----|
| `.leading-none` | 1 |
| `.leading-tight` | 1.25 |
| `.leading-snug` | 1.375 |
| `.leading-normal` | 1.5 |
| `.leading-relaxed` | 1.625 |
| `.leading-loose` | 2 |

### 자간

| 클래스 | 값 |
|--------|-----|
| `.tracking-tighter` | -0.05em |
| `.tracking-tight` | -0.025em |
| `.tracking-normal` | 0 |
| `.tracking-wide` | 0.025em |
| `.tracking-wider` | 0.05em |

### 텍스트 변환

| 클래스 | 설명 |
|--------|------|
| `.uppercase` | 대문자 |
| `.lowercase` | 소문자 |
| `.capitalize` | 첫글자 대문자 |
| `.normal-case` | 기본 |

### 텍스트 꾸미기

| 클래스 | 설명 |
|--------|------|
| `.underline` | 밑줄 |
| `.line-through` | 취소선 |
| `.no-underline` | 밑줄 제거 |

### 말줄임

| 클래스 | 설명 |
|--------|------|
| `.truncate` | 한 줄 말줄임 |
| `.line-clamp-1` | 1줄 |
| `.line-clamp-2` | 2줄 |
| `.line-clamp-3` | 3줄 |
| `.line-clamp-4` | 4줄 |

### 공백 처리

| 클래스 | 설명 |
|--------|------|
| `.whitespace-nowrap` | 줄바꿈 없음 |
| `.whitespace-normal` | 기본 |
| `.break-words` | 단어 줄바꿈 |
| `.break-all` | 글자 단위 줄바꿈 |

### 폰트 패밀리

| 클래스 | 설명 |
|--------|------|
| `.font-sans` | 시스템 산세리프 |
| `.font-mono` | 모노스페이스 |

---

## 3. 색상

### 텍스트 색상

| 클래스 | 용도 |
|--------|------|
| `.text-primary` | 기본 텍스트 |
| `.text-secondary` | 보조 텍스트 |
| `.text-tertiary` | 비활성 텍스트 |
| `.text-muted` | 흐린 텍스트 |
| `.text-disabled` | 비활성화 |
| `.text-inverse` | 반전 텍스트 |
| `.text-brand` | 브랜드 색상 |
| `.text-success` | 성공 (초록) |
| `.text-warning` | 경고 (주황) |
| `.text-danger` | 위험 (빨강) |
| `.text-error` | 오류 (빨강) |
| `.text-info` | 정보 (파랑) |

### 배경 색상

| 클래스 | 용도 |
|--------|------|
| `.bg-primary` | 기본 배경 |
| `.bg-secondary` | 보조 배경 |
| `.bg-tertiary` | 3차 배경 |
| `.bg-inverse` | 반전 배경 |
| `.bg-brand` | 브랜드 색상 |
| `.bg-brand-light` | 브랜드 연한색 |
| `.bg-success` | 성공 |
| `.bg-success-light` | 성공 연한색 |
| `.bg-warning` | 경고 |
| `.bg-warning-light` | 경고 연한색 |
| `.bg-danger` | 위험 |
| `.bg-danger-light` | 위험 연한색 |

---

## 4. 간격 (Spacing)

값: `0`=0, `1`=4px, `2`=8px, `3`=12px, `4`=16px, `5`=20px, `6`=24px, `8`=32px, `10`=40px, `12`=48px

### Margin

| 클래스 | 방향 |
|--------|------|
| `.m-{0-12}` | 전체 |
| `.mx-{0-12,auto}` | 좌우 |
| `.my-{0-12}` | 상하 |
| `.mt-{0-12}` | 상단 |
| `.mr-{0-12}` | 오른쪽 |
| `.mb-{0-12}` | 하단 |
| `.ml-{0-12}` | 왼쪽 |

### Padding

| 클래스 | 방향 |
|--------|------|
| `.p-{0-12}` | 전체 |
| `.px-{0-12}` | 좌우 |
| `.py-{0-12}` | 상하 |
| `.pt-{0-12}` | 상단 |
| `.pr-{0-12}` | 오른쪽 |
| `.pb-{0-12}` | 하단 |
| `.pl-{0-12}` | 왼쪽 |

---

## 5. 버튼

### 기본

| 클래스 | 설명 |
|--------|------|
| `.btn` | 기본 버튼 |
| `.btn-primary` | 주요 액션 |
| `.btn-secondary` | 보조 액션 |
| `.btn-outline` | 테두리만 |
| `.btn-ghost` | 배경 없음 |
| `.btn-danger` | 위험/삭제 |
| `.btn-success` | 성공 |
| `.btn-warning` | 경고 |
| `.btn-link` | 링크 스타일 |

### 크기

| 클래스 | 높이 |
|--------|------|
| `.btn-sm` | 36px |
| (기본) | 44px |
| `.btn-lg` | 52px |

### 옵션

| 클래스 | 설명 |
|--------|------|
| `.btn-block` | 전체 너비 |
| `.btn-icon` | 아이콘만 |
| `.btn-rounded` | 둥근 모서리 |
| `.btn-pill` | 알약 형태 |
| `.is-loading` | 로딩 상태 |
| `.is-disabled` | 비활성화 |

### 그룹

| 클래스 | 설명 |
|--------|------|
| `.btn-group` | 버튼 그룹 |
| `.btn-group-vertical` | 수직 그룹 |

---

## 6. 카드

### 기본

| 클래스 | 설명 |
|--------|------|
| `.card` | 기본 카드 |
| `.card-flat` | 테두리/그림자 없음 |
| `.card-outlined` | 그림자 없음 |
| `.card-elevated` | 그림자 강조 |
| `.card-hover` | hover 효과 |
| `.card-overflow` | overflow visible |

### 크기

| 클래스 | padding |
|--------|---------|
| `.card-sm` | 12px |
| (기본) | 16px |
| `.card-lg` | 24px |

### 구조

| 클래스 | 설명 |
|--------|------|
| `.card-header` | 헤더 영역 |
| `.card-header-title` | 헤더 제목 |
| `.card-header-subtitle` | 헤더 부제목 |
| `.card-header-action` | 헤더 액션 |
| `.card-header-compact` | 컴팩트 헤더 |
| `.card-body` | 본문 영역 |
| `.card-footer` | 푸터 영역 |
| `.card-image` | 이미지 영역 |
| `.card-title` | 제목 (legacy) |
| `.card-subtitle` | 부제목 |
| `.card-text` | 텍스트 |

---

## 7. 폼 요소

### 컨테이너

| 클래스 | 설명 |
|--------|------|
| `.form` | 폼 컨테이너 |
| `.form-group` | 폼 그룹 |
| `.form-row` | 가로 배치 |

### 레이블

| 클래스 | 설명 |
|--------|------|
| `.form-label` | 레이블 |
| `.required` | 필수 표시 (*) |

### 입력

| 클래스 | 설명 |
|--------|------|
| `.form-input` | 텍스트 입력 |
| `.form-input-sm` | 작은 입력 |
| `.form-input-lg` | 큰 입력 |
| `.form-textarea` | 텍스트 영역 |
| `.form-select` | 셀렉트 |

### 상태

| 클래스 | 설명 |
|--------|------|
| `.is-valid` | 유효 |
| `.is-invalid` | 오류 |
| `disabled` | 비활성화 |
| `readonly` | 읽기 전용 |

### 체크박스 & 라디오

| 클래스 | 설명 |
|--------|------|
| `.form-checkbox` | 체크박스 |
| `.form-checkbox-sm` | 작은 체크박스 |
| `.form-checkbox-lg` | 큰 체크박스 |
| `.form-radio` | 라디오 |
| `.form-radio-group` | 라디오 그룹 |

### 스위치

| 클래스 | 설명 |
|--------|------|
| `.form-switch` | 스위치 |
| `.form-switch-sm` | 작은 스위치 |
| `.form-switch-lg` | 큰 스위치 |

### 기타

| 클래스 | 설명 |
|--------|------|
| `.form-helper` | 도움말 텍스트 |
| `.form-error` | 오류 메시지 |
| `.form-counter` | 글자수 카운터 |
| `.form-search` | 검색 입력 |
| `.form-password` | 비밀번호 입력 |
| `.form-file` | 파일 업로드 |
| `.form-otp` | OTP 입력 |
| `.form-range` | 범위 슬라이더 |
| `.form-number` | 숫자 입력 |
| `.form-rating` | 별점 |
| `.form-color` | 색상 선택 |
| `.form-date` | 날짜 입력 |
| `.form-time` | 시간 입력 |
| `.form-chips` | 칩 선택 |
| `.form-segmented` | 세그먼트 |
| `.input-group` | 입력 그룹 |
| `.input-group-text` | 그룹 텍스트 |

---

## 8. 리스트

### 기본

| 클래스 | 설명 |
|--------|------|
| `.list` | 리스트 컨테이너 |
| `.list-item` | 리스트 아이템 |
| `.list-item-clickable` | 클릭 가능 |
| `.is-selected` | 선택됨 |
| `.is-disabled` | 비활성화 |

### 아이템 구성

| 클래스 | 설명 |
|--------|------|
| `.list-item-icon` | 아이콘 |
| `.list-item-avatar` | 아바타 |
| `.list-item-content` | 내용 |
| `.list-item-title` | 제목 |
| `.list-item-subtitle` | 부제목 |
| `.list-item-action` | 액션 |
| `.item-icon` | 아이콘 (간략) |
| `.item-content` | 내용 (간략) |
| `.item-label` | 레이블 |
| `.item-value` | 값 |

### 그룹

| 클래스 | 설명 |
|--------|------|
| `.list-group` | 리스트 그룹 |
| `.list-group-title` | 그룹 제목 |
| `.list-inset` | 들여쓰기 |
| `.list-divider` | 구분선 |

---

## 9. 네비게이션

### Navbar

| 클래스 | 설명 |
|--------|------|
| `.navbar` | 네비게이션 바 |
| `.navbar-sticky` | 고정 (sticky) |
| `.navbar-fixed` | 고정 (fixed) |
| `.navbar-transparent` | 투명 |
| `.navbar-brand` | 브랜드/로고 |
| `.navbar-title` | 제목 |
| `.navbar-title-left` | 왼쪽 정렬 제목 |
| `.navbar-action` | 액션 영역 |
| `.navbar-btn` | 네비게이션 버튼 |

### Tab Bar

| 클래스 | 설명 |
|--------|------|
| `.tab-bar` | 탭 바 |
| `.tab-bar-item` | 탭 아이템 |
| `.tab-bar-icon` | 탭 아이콘 |
| `.tab-bar-label` | 탭 레이블 |
| `.is-active` | 활성 탭 |

### Tabs

| 클래스 | 설명 |
|--------|------|
| `.tabs` | 탭 컨테이너 |
| `.tab-item` | 탭 아이템 |
| `.tab-content` | 탭 내용 |
| `.tab-pane` | 탭 패널 |

### Breadcrumb

| 클래스 | 설명 |
|--------|------|
| `.breadcrumb` | 브레드크럼 |
| `.breadcrumb-item` | 브레드크럼 아이템 |

### Pagination

| 클래스 | 설명 |
|--------|------|
| `.pagination` | 페이지네이션 |
| `.page-item` | 페이지 아이템 |
| `.page-link` | 페이지 링크 |

---

## 10. 데이터 표시

### Avatar

| 클래스 | 설명 |
|--------|------|
| `.avatar` | 기본 아바타 |
| `.avatar-xs` | 24px |
| `.avatar-sm` | 32px |
| `.avatar-lg` | 48px |
| `.avatar-xl` | 64px |
| `.avatar-square` | 사각형 |
| `.avatar-wrapper` | 상태 포함 래퍼 |
| `.avatar-status` | 상태 표시 |
| `.status-online` | 온라인 |
| `.status-offline` | 오프라인 |
| `.status-busy` | 바쁨 |
| `.status-away` | 자리비움 |
| `.avatar-group` | 아바타 그룹 |
| `.avatar-more` | 더보기 |

### Table

| 클래스 | 설명 |
|--------|------|
| `.table` | 테이블 |
| `.table-striped` | 줄무늬 |
| `.table-bordered` | 테두리 |
| `.table-responsive` | 반응형 래퍼 |

### Timeline

| 클래스 | 설명 |
|--------|------|
| `.timeline` | 타임라인 |
| `.timeline-item` | 타임라인 아이템 |
| `.timeline-marker` | 마커 |
| `.timeline-content` | 내용 |

### Accordion

| 클래스 | 설명 |
|--------|------|
| `.accordion` | 아코디언 |
| `.accordion-item` | 아코디언 아이템 |
| `.accordion-header` | 헤더 |
| `.accordion-body` | 본문 |

---

## 11. 피드백

### Alert

| 클래스 | 설명 |
|--------|------|
| `.alert` | 기본 알림 |
| `.alert-info` | 정보 |
| `.alert-success` | 성공 |
| `.alert-warning` | 경고 |
| `.alert-error` | 오류 |
| `.alert-danger` | 위험 |
| `.alert-icon` | 아이콘 |
| `.alert-content` | 내용 |
| `.alert-title` | 제목 |
| `.alert-text` | 텍스트 |
| `.alert-close` | 닫기 버튼 |

### Badge

| 클래스 | 설명 |
|--------|------|
| `.badge` | 기본 뱃지 |
| `.badge-primary` | 주요 |
| `.badge-secondary` | 보조 |
| `.badge-success` | 성공 |
| `.badge-warning` | 경고 |
| `.badge-danger` | 위험 |
| `.badge-sm` | 작은 |
| `.badge-lg` | 큰 |
| `.badge-dot` | 점 형태 |
| `.badge-pill` | 알약 형태 |

### Progress

| 클래스 | 설명 |
|--------|------|
| `.progress` | 진행바 컨테이너 |
| `.progress-bar` | 진행바 |
| `.progress-sm` | 작은 |
| `.progress-lg` | 큰 |

### Spinner

| 클래스 | 설명 |
|--------|------|
| `.spinner` | 스피너 |
| `.spinner-sm` | 작은 |
| `.spinner-lg` | 큰 |

### Skeleton

| 클래스 | 설명 |
|--------|------|
| `.skeleton` | 스켈레톤 |
| `.skeleton-text` | 텍스트 |
| `.skeleton-circle` | 원형 |
| `.skeleton-rect` | 사각형 |

### Empty State

| 클래스 | 설명 |
|--------|------|
| `.empty-state` | 빈 상태 |
| `.empty-icon` | 아이콘 |
| `.empty-title` | 제목 |
| `.empty-text` | 설명 |
| `.empty-action` | 액션 |

---

## 12. 미디어

### Image

| 클래스 | 설명 |
|--------|------|
| `.img` | 기본 이미지 |
| `.img-fluid` | 반응형 |
| `.img-cover` | cover |
| `.img-contain` | contain |
| `.img-rounded` | 둥근 모서리 |
| `.img-circle` | 원형 |
| `.img-shadow` | 그림자 |
| `.img-placeholder` | 플레이스홀더 |

### Figure

| 클래스 | 설명 |
|--------|------|
| `.figure` | 피규어 |
| `.figure-caption` | 캡션 |

### Gallery

| 클래스 | 설명 |
|--------|------|
| `.gallery` | 갤러리 그리드 |
| `.gallery-item` | 갤러리 아이템 |

### Icon

| 클래스 | 설명 |
|--------|------|
| `.icon` | 기본 아이콘 |
| `.icon-sm` | 작은 |
| `.icon-lg` | 큰 |
| `.icon-primary` | 주요 색상 |
| `.icon-secondary` | 보조 색상 |

---

## 13. 오버레이

### Modal

| 클래스 | 설명 |
|--------|------|
| `.modal` | 모달 컨테이너 |
| `.modal-backdrop` | 배경 |
| `.modal-content` | 내용 |
| `.modal-header` | 헤더 |
| `.modal-title` | 제목 |
| `.modal-close` | 닫기 |
| `.modal-body` | 본문 |
| `.modal-footer` | 푸터 |
| `.modal-sm` | 작은 |
| `.modal-lg` | 큰 |
| `.modal-full` | 전체 화면 |
| `.is-active` | 활성 |

### Drawer

| 클래스 | 설명 |
|--------|------|
| `.drawer` | 드로어 |
| `.drawer-left` | 왼쪽 |
| `.drawer-right` | 오른쪽 |
| `.drawer-bottom` | 하단 |
| `.drawer-header` | 헤더 |
| `.drawer-body` | 본문 |
| `.drawer-footer` | 푸터 |

### Dropdown

| 클래스 | 설명 |
|--------|------|
| `.dropdown` | 드롭다운 |
| `.dropdown-toggle` | 토글 |
| `.dropdown-menu` | 메뉴 |
| `.dropdown-item` | 아이템 |
| `.dropdown-divider` | 구분선 |

### Tooltip

| 클래스 | 설명 |
|--------|------|
| `.tooltip` | 툴팁 |
| `.tooltip-top` | 상단 |
| `.tooltip-bottom` | 하단 |
| `.tooltip-left` | 왼쪽 |
| `.tooltip-right` | 오른쪽 |

### Popover

| 클래스 | 설명 |
|--------|------|
| `.popover` | 팝오버 |
| `.popover-header` | 헤더 |
| `.popover-body` | 본문 |

### Backdrop

| 클래스 | 설명 |
|--------|------|
| `.backdrop` | 배경 오버레이 |
| `.is-active` | 활성 |

---

## 14. 그리드 메뉴

### 컨테이너

| 클래스 | 설명 |
|--------|------|
| `.catui-grid-menu` | 기본 컨테이너 |
| `.catui-grid-menu--9` | 9궁 (3x3) |
| `.catui-grid-menu--6` | 6궁 (3x2) |
| `.catui-grid-menu--4` | 4궁 (2x2) |
| `.catui-grid-menu--5` | 5궁 (특수) |
| `.catui-grid-menu--8` | 8궁 (4x2) |
| `.catui-grid-menu--compact` | 컴팩트 |
| `.catui-grid-menu--flush` | 패딩 없음 |
| `.catui-grid-menu--card` | 카드 스타일 |
| `.catui-grid-menu--bordered` | 테두리 스타일 |

### 아이템

| 클래스 | 설명 |
|--------|------|
| `.catui-grid-item` | 그리드 아이템 |
| `.catui-grid-item-icon` | 아이콘 |
| `.catui-grid-item-icon--primary` | 주요 색상 |
| `.catui-grid-item-icon--success` | 성공 |
| `.catui-grid-item-icon--warning` | 경고 |
| `.catui-grid-item-icon--error` | 오류 |
| `.catui-grid-item-label` | 레이블 |
| `.catui-grid-item-badge` | 뱃지 |
| `.catui-grid-item-new` | NEW 표시 |

### 섹션

| 클래스 | 설명 |
|--------|------|
| `.catui-grid-section` | 섹션 컨테이너 |
| `.catui-grid-section-header` | 섹션 헤더 |
| `.catui-grid-section-title` | 섹션 제목 |
| `.catui-grid-section-more` | 더보기 |

---

## 15. 유틸리티

### 테두리

| 클래스 | 설명 |
|--------|------|
| `.border` | 1px 테두리 |
| `.border-0` | 테두리 없음 |
| `.border-top` | 상단만 |
| `.border-right` | 오른쪽만 |
| `.border-bottom` | 하단만 |
| `.border-left` | 왼쪽만 |
| `.border-primary` | 주요 색상 |
| `.border-success` | 성공 |
| `.border-warning` | 경고 |
| `.border-danger` | 위험 |

### 둥글기

| 클래스 | 값 |
|--------|-----|
| `.rounded-none` | 0 |
| `.rounded-sm` | 4px |
| `.rounded` | 8px |
| `.rounded-lg` | 12px |
| `.rounded-xl` | 16px |
| `.rounded-full` | 9999px |

### 그림자

| 클래스 | 설명 |
|--------|------|
| `.shadow-none` | 없음 |
| `.shadow-sm` | 작은 |
| `.shadow` | 기본 |
| `.shadow-lg` | 큰 |

### 투명도

| 클래스 | 값 |
|--------|-----|
| `.opacity-0` | 0% |
| `.opacity-25` | 25% |
| `.opacity-50` | 50% |
| `.opacity-75` | 75% |
| `.opacity-100` | 100% |

### 커서

| 클래스 | 설명 |
|--------|------|
| `.cursor-pointer` | 포인터 |
| `.cursor-not-allowed` | 금지 |
| `.cursor-default` | 기본 |
| `.cursor-move` | 이동 |

### 포인터 이벤트

| 클래스 | 설명 |
|--------|------|
| `.pointer-events-none` | 이벤트 없음 |
| `.pointer-events-auto` | 이벤트 자동 |

### 선택

| 클래스 | 설명 |
|--------|------|
| `.select-none` | 선택 불가 |
| `.select-text` | 텍스트만 |
| `.select-all` | 전체 선택 |
| `.select-auto` | 자동 |

### 트랜지션

| 클래스 | 속도 |
|--------|------|
| `.transition-none` | 없음 |
| `.transition-fast` | 150ms |
| `.transition` | 200ms |
| `.transition-slow` | 300ms |

### 변환

| 클래스 | 설명 |
|--------|------|
| `.rotate-0` ~ `.rotate-180` | 회전 |
| `.-rotate-45` ~ `.-rotate-90` | 역회전 |
| `.scale-0` ~ `.scale-110` | 크기 |

### 애니메이션

| 클래스 | 효과 |
|--------|------|
| `.animate-none` | 없음 |
| `.animate-spin` | 회전 |
| `.animate-ping` | 핑 |
| `.animate-pulse` | 펄스 |
| `.animate-bounce` | 바운스 |
| `.animate-fade-in` | 페이드인 |
| `.animate-slide-up` | 슬라이드업 |
| `.animate-slide-down` | 슬라이드다운 |

### 가시성

| 클래스 | 설명 |
|--------|------|
| `.visible` | 보임 |
| `.invisible` | 숨김 (공간 유지) |
| `.sr-only` | 스크린리더 전용 |
| `.not-sr-only` | 스크린리더 전용 해제 |

### 반응형

| 클래스 | 설명 |
|--------|------|
| `.hide-mobile` | 모바일 숨김 (<768px) |
| `.show-mobile` | 모바일만 표시 |
| `.sm\:hidden` | 576px 이상 숨김 |
| `.sm\:block` | 576px 이상 block |
| `.sm\:flex` | 576px 이상 flex |
| `.md\:hidden` | 768px 이상 숨김 |
| `.md\:block` | 768px 이상 block |
| `.md\:flex` | 768px 이상 flex |
| `.print\:hidden` | 인쇄 시 숨김 |
| `.print\:block` | 인쇄 시 block |

### 호버/액티브 상태

| 클래스 | 설명 |
|--------|------|
| `.hover\:opacity-80` | hover 시 80% |
| `.hover\:opacity-100` | hover 시 100% |
| `.hover\:scale-105` | hover 시 105% |
| `.active\:scale-95` | active 시 95% |
| `.active\:opacity-80` | active 시 80% |

### 포커스 링

| 클래스 | 설명 |
|--------|------|
| `.focus-ring` | 포커스 링 (외부) |
| `.focus-ring-inset` | 포커스 링 (내부) |

### Divider

| 클래스 | 설명 |
|--------|------|
| `.divider` | 수평 구분선 |
| `.divider-sm` | 작은 마진 |
| `.divider-lg` | 큰 마진 |
| `.divider-dashed` | 점선 |
| `.divider-dotted` | 점선 (dotted) |
| `.divider-vertical` | 수직 구분선 |
| `.divider-text` | 텍스트 구분선 |

### Section

| 클래스 | 설명 |
|--------|------|
| `.section` | 섹션 |
| `.section-sm` | 작은 패딩 |
| `.section-lg` | 큰 패딩 |
| `.section-xl` | 더 큰 패딩 |
| `.section-header` | 섹션 헤더 |
| `.section-title` | 섹션 제목 |
| `.section-subtitle` | 섹션 부제목 |

---

## 다크모드

```html
<html data-theme="dark">
```

모든 색상은 CSS 변수를 사용하여 자동 전환됩니다.

---

*CATUI Mobile CSS Reference - Generated from SCSS source*
