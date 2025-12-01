# CATUI Mobile CSS 사용 가이드

> 모바일 최적화 유틸리티 클래스 레퍼런스

---

## 목차

1. [레이아웃](#1-레이아웃)
2. [타이포그래피](#2-타이포그래피)
3. [색상](#3-색상)
4. [간격 (Spacing)](#4-간격-spacing)
5. [버튼](#5-버튼)
6. [카드](#6-카드)
7. [폼 요소](#7-폼-요소)
8. [유틸리티](#8-유틸리티)

---

## 1. 레이아웃

### 1.1 Container

| 클래스 | 설명 |
|--------|------|
| `.container` | 기본 컨테이너 (좌우 패딩 16px) |
| `.container-sm` | max-width: 540px |
| `.container-md` | max-width: 720px |
| `.container-lg` | max-width: 960px |
| `.container-fluid` | 전체 너비 |

### 1.2 Grid System (12-column)

```html
<div class="row">
  <div class="col-6">반</div>
  <div class="col-6">반</div>
</div>

<div class="row">
  <div class="col-4">1/3</div>
  <div class="col-4">1/3</div>
  <div class="col-4">1/3</div>
</div>
```

| 클래스 | 너비 |
|--------|------|
| `.col` | 자동 (flex: 1) |
| `.col-auto` | 내용에 맞춤 |
| `.col-1` ~ `.col-12` | 1/12 ~ 12/12 |
| `.col-sm-*` | 576px 이상 |
| `.col-md-*` | 768px 이상 |

**Row 옵션:**

- `.row-dense` - 좁은 간격
- `.row-gap-1` ~ `.row-gap-4` - 행 간격

### 1.3 Flexbox

```html
<div class="flex justify-between items-center gap-3">
  <div>왼쪽</div>
  <div>오른쪽</div>
</div>
```

**컨테이너:**

| 클래스 | 설명 |
|--------|------|
| `.flex` | display: flex |
| `.inline-flex` | display: inline-flex |

**방향:**

| 클래스 | 설명 |
|--------|------|
| `.flex-row` | 가로 (기본) |
| `.flex-col` | 세로 |
| `.flex-row-reverse` | 가로 역순 |
| `.flex-col-reverse` | 세로 역순 |

**정렬 (justify-content):**

| 클래스 | 설명 |
|--------|------|
| `.justify-start` | 시작점 |
| `.justify-end` | 끝점 |
| `.justify-center` | 중앙 |
| `.justify-between` | 양끝 정렬 |
| `.justify-around` | 균등 분배 |
| `.justify-evenly` | 동일 간격 |

**정렬 (align-items):**

| 클래스 | 설명 |
|--------|------|
| `.items-start` | 상단 |
| `.items-end` | 하단 |
| `.items-center` | 중앙 |
| `.items-baseline` | 베이스라인 |
| `.items-stretch` | 늘리기 |

**Gap:**

| 클래스 | 크기 |
|--------|------|
| `.gap-0` | 0 |
| `.gap-1` | 4px |
| `.gap-2` | 8px |
| `.gap-3` | 12px |
| `.gap-4` | 16px |
| `.gap-6` | 24px |
| `.gap-8` | 32px |

### 1.4 Stack

```html
<!-- 수직 스택 -->
<div class="stack stack-3">
  <div>Item 1</div>
  <div>Item 2</div>
</div>

<!-- 수평 스택 -->
<div class="hstack hstack-2">
  <div>Item 1</div>
  <div>Item 2</div>
</div>
```

### 1.5 Position

| 클래스 | 설명 |
|--------|------|
| `.relative` | position: relative |
| `.absolute` | position: absolute |
| `.fixed` | position: fixed |
| `.sticky` | position: sticky |

**위치:**

| 클래스 | 설명 |
|--------|------|
| `.inset-0` | 모든 방향 0 |
| `.top-0` | top: 0 |
| `.right-0` | right: 0 |
| `.bottom-0` | bottom: 0 |
| `.left-0` | left: 0 |

**Z-index:**

| 클래스 | 값 |
|--------|-----|
| `.z-0` | 0 |
| `.z-10` | 10 |
| `.z-20` | 20 |
| `.z-30` | 30 |
| `.z-40` | 40 |
| `.z-50` | 50 |

### 1.6 Width & Height

| 클래스 | 설명 |
|--------|------|
| `.w-full` | width: 100% |
| `.w-screen` | width: 100vw |
| `.w-auto` | width: auto |
| `.w-1\/2` | width: 50% |
| `.w-1\/3` | width: 33.33% |
| `.h-full` | height: 100% |
| `.h-screen` | height: 100vh |
| `.min-h-screen` | min-height: 100vh |

### 1.7 Display

| 클래스 | 설명 |
|--------|------|
| `.block` | display: block |
| `.inline-block` | display: inline-block |
| `.inline` | display: inline |
| `.hidden` | display: none |

### 1.8 Overflow

| 클래스 | 설명 |
|--------|------|
| `.overflow-auto` | auto |
| `.overflow-hidden` | hidden |
| `.overflow-scroll` | scroll |
| `.overflow-x-auto` | 가로만 auto |
| `.overflow-y-auto` | 세로만 auto |

---

## 2. 타이포그래피

### 2.1 제목

| 클래스 | 크기 |
|--------|------|
| `.h1` | 26px |
| `.h2` | 22px |
| `.h3` | 19px |
| `.h4` | 17px |
| `.h5` | 15px |
| `.h6` | 13px |

### 2.2 텍스트 크기

| 클래스 | 크기 |
|--------|------|
| `.text-xs` | 12px |
| `.text-sm` | 13px |
| `.text-base` | 15px |
| `.text-lg` | 17px |
| `.text-xl` | 19px |
| `.text-2xl` | 22px |
| `.text-3xl` | 26px |

### 2.3 텍스트 정렬

| 클래스 | 설명 |
|--------|------|
| `.text-left` | 왼쪽 |
| `.text-center` | 중앙 |
| `.text-right` | 오른쪽 |
| `.text-justify` | 양쪽 정렬 |

### 2.4 폰트 굵기

| 클래스 | 굵기 |
|--------|------|
| `.font-light` | 300 |
| `.font-normal` | 400 |
| `.font-medium` | 500 |
| `.font-semibold` | 600 |
| `.font-bold` | 700 |

### 2.5 줄 높이

| 클래스 | 값 |
|--------|-----|
| `.leading-none` | 1 |
| `.leading-tight` | 1.25 |
| `.leading-snug` | 1.375 |
| `.leading-normal` | 1.5 |
| `.leading-relaxed` | 1.625 |

### 2.6 텍스트 말줄임

```html
<!-- 한 줄 말줄임 -->
<p class="truncate">긴 텍스트...</p>

<!-- 여러 줄 말줄임 -->
<p class="line-clamp-2">2줄까지 표시...</p>
<p class="line-clamp-3">3줄까지 표시...</p>
```

### 2.7 텍스트 변환

| 클래스 | 설명 |
|--------|------|
| `.uppercase` | 대문자 |
| `.lowercase` | 소문자 |
| `.capitalize` | 첫글자 대문자 |
| `.underline` | 밑줄 |
| `.line-through` | 취소선 |
| `.no-underline` | 밑줄 제거 |

---

## 3. 색상

### 3.1 텍스트 색상

| 클래스 | 용도 |
|--------|------|
| `.text-primary` | 기본 텍스트 |
| `.text-secondary` | 보조 텍스트 |
| `.text-tertiary` | 비활성 텍스트 |
| `.text-muted` | 흐린 텍스트 |

**시맨틱 색상:**

| 클래스 | 색상 |
|--------|------|
| `.text-brand` | 브랜드 (파랑) |
| `.text-success` | 성공 (초록) |
| `.text-warning` | 경고 (주황) |
| `.text-danger` | 위험 (빨강) |
| `.text-info` | 정보 (하늘) |

### 3.2 배경 색상

| 클래스 | 용도 |
|--------|------|
| `.bg-primary` | 기본 배경 |
| `.bg-secondary` | 보조 배경 |
| `.bg-tertiary` | 3차 배경 |

**시맨틱 배경:**

| 클래스 | 설명 |
|--------|------|
| `.bg-brand` | 브랜드 색 |
| `.bg-brand-light` | 브랜드 연한색 (10%) |
| `.bg-success` | 성공 |
| `.bg-success-light` | 성공 연한색 |
| `.bg-warning` | 경고 |
| `.bg-danger` | 위험 |

---

## 4. 간격 (Spacing)

### 4.1 Margin

| 클래스 | 값 |
|--------|-----|
| `.m-0` ~ `.m-12` | 전체 방향 |
| `.mx-*` | 좌우 |
| `.my-*` | 상하 |
| `.mt-*` | 상단 |
| `.mr-*` | 오른쪽 |
| `.mb-*` | 하단 |
| `.ml-*` | 왼쪽 |
| `.mx-auto` | 좌우 자동 (중앙 정렬) |

**값:**

- `0` = 0px
- `1` = 4px
- `2` = 8px
- `3` = 12px
- `4` = 16px
- `5` = 20px
- `6` = 24px
- `8` = 32px
- `10` = 40px
- `12` = 48px

### 4.2 Padding

| 클래스 | 값 |
|--------|-----|
| `.p-0` ~ `.p-12` | 전체 방향 |
| `.px-*` | 좌우 |
| `.py-*` | 상하 |
| `.pt-*` | 상단 |
| `.pr-*` | 오른쪽 |
| `.pb-*` | 하단 |
| `.pl-*` | 왼쪽 |

```html
<div class="p-4 mx-auto">
  패딩 16px, 좌우 자동 마진
</div>
```

---

## 5. 버튼

### 5.1 기본 버튼

```html
<button class="btn btn-primary">Primary</button>
<button class="btn btn-secondary">Secondary</button>
<button class="btn btn-outline">Outline</button>
<button class="btn btn-ghost">Ghost</button>
```

### 5.2 버튼 변형

| 클래스 | 설명 |
|--------|------|
| `.btn-primary` | 주요 액션 (파랑) |
| `.btn-secondary` | 보조 액션 (회색) |
| `.btn-outline` | 테두리만 |
| `.btn-ghost` | 배경 없음 |
| `.btn-danger` | 위험/삭제 (빨강) |
| `.btn-success` | 성공/확인 (초록) |
| `.btn-warning` | 경고 (주황) |
| `.btn-link` | 링크 스타일 |

### 5.3 버튼 크기

| 클래스 | 높이 |
|--------|------|
| `.btn-sm` | 36px |
| (기본) | 44px |
| `.btn-lg` | 52px |

### 5.4 버튼 옵션

```html
<!-- 전체 너비 -->
<button class="btn btn-primary btn-block">전체 너비</button>

<!-- 아이콘만 -->
<button class="btn btn-primary btn-icon">
  <span class="material-icons">add</span>
</button>

<!-- 둥근 버튼 -->
<button class="btn btn-primary btn-rounded">둥글게</button>

<!-- 비활성화 -->
<button class="btn btn-primary" disabled>비활성화</button>
```

### 5.5 버튼 그룹

```html
<div class="btn-group">
  <button class="btn btn-outline">왼쪽</button>
  <button class="btn btn-outline">가운데</button>
  <button class="btn btn-outline">오른쪽</button>
</div>
```

---

## 6. 카드

### 6.1 기본 카드

```html
<div class="card">
  <div class="card-header">
    <h3 class="card-header-title">
      <span class="material-icons" style="color: var(--primary);">icon</span>
      제목
    </h3>
  </div>
  <div class="card-body">
    내용
  </div>
  <div class="card-footer">
    푸터
  </div>
</div>
```

### 6.2 카드 변형

| 클래스 | 설명 |
|--------|------|
| `.card-flat` | 테두리/그림자 없음 |
| `.card-outlined` | 그림자 없음 |
| `.card-elevated` | 그림자 강조 |
| `.card-hover` | hover 시 그림자 |

### 6.3 카드 크기

| 클래스 | padding |
|--------|---------|
| `.card-sm` | 12px |
| (기본) | 16px |
| `.card-lg` | 24px |

---

## 7. 폼 요소

### 7.1 입력 필드

```html
<div class="form-group">
  <label class="form-label required">이름</label>
  <input type="text" class="form-input" placeholder="입력하세요">
  <span class="form-helper">도움말 텍스트</span>
</div>
```

### 7.2 입력 크기

| 클래스 | 높이 |
|--------|------|
| `.form-input-sm` | 36px |
| `.form-input` | 44px |
| `.form-input-lg` | 56px |

### 7.3 입력 상태

| 클래스 | 설명 |
|--------|------|
| `.is-valid` | 유효 (초록 테두리) |
| `.is-invalid` | 오류 (빨강 테두리) |
| `disabled` | 비활성화 |
| `readonly` | 읽기 전용 |

### 7.4 Textarea & Select

```html
<textarea class="form-textarea" rows="3"></textarea>

<select class="form-select">
  <option>선택하세요</option>
</select>
```

### 7.5 체크박스 & 라디오

```html
<label class="form-checkbox">
  <input type="checkbox">
  <span>체크박스</span>
</label>

<label class="form-radio">
  <input type="radio" name="group">
  <span>라디오</span>
</label>
```

### 7.6 스위치

```html
<label class="form-switch">
  <input type="checkbox">
</label>

<!-- 크기 -->
<label class="form-switch form-switch-sm">...</label>
<label class="form-switch form-switch-lg">...</label>
```

---

## 8. 유틸리티

### 8.1 테두리

| 클래스 | 설명 |
|--------|------|
| `.border` | 1px 테두리 |
| `.border-0` | 테두리 없음 |
| `.border-top` | 상단만 |
| `.border-bottom` | 하단만 |

### 8.2 둥글기

| 클래스 | 값 |
|--------|-----|
| `.rounded-none` | 0 |
| `.rounded-sm` | 4px |
| `.rounded` | 8px |
| `.rounded-lg` | 12px |
| `.rounded-xl` | 16px |
| `.rounded-full` | 9999px |

### 8.3 그림자

| 클래스 | 설명 |
|--------|------|
| `.shadow-none` | 없음 |
| `.shadow-sm` | 작은 그림자 |
| `.shadow` | 기본 그림자 |
| `.shadow-lg` | 큰 그림자 |

### 8.4 투명도

| 클래스 | 값 |
|--------|-----|
| `.opacity-0` | 0% |
| `.opacity-25` | 25% |
| `.opacity-50` | 50% |
| `.opacity-75` | 75% |
| `.opacity-100` | 100% |

### 8.5 커서

| 클래스 | 설명 |
|--------|------|
| `.cursor-pointer` | 포인터 |
| `.cursor-not-allowed` | 금지 |
| `.cursor-default` | 기본 |
| `.cursor-move` | 이동 |

### 8.6 트랜지션

| 클래스 | 속도 |
|--------|------|
| `.transition-none` | 없음 |
| `.transition-fast` | 150ms |
| `.transition` | 200ms |
| `.transition-slow` | 300ms |

### 8.7 애니메이션

| 클래스 | 효과 |
|--------|------|
| `.animate-spin` | 회전 |
| `.animate-ping` | 핑 |
| `.animate-pulse` | 펄스 |
| `.animate-bounce` | 바운스 |
| `.animate-fade-in` | 페이드인 |
| `.animate-slide-up` | 슬라이드업 |

### 8.8 반응형

| 클래스 | 설명 |
|--------|------|
| `.hide-mobile` | 모바일에서 숨김 |
| `.show-mobile` | 모바일에서만 표시 |
| `.sm\:hidden` | 576px 이상 숨김 |
| `.md\:hidden` | 768px 이상 숨김 |

### 8.9 Safe Area (iOS)

| 클래스 | 설명 |
|--------|------|
| `.safe-top` | 상단 노치 영역 |
| `.safe-bottom` | 하단 홈바 영역 |
| `.safe-all` | 전체 안전 영역 |

### 8.10 센터링

```html
<!-- Flex 중앙 -->
<div class="center">중앙</div>

<!-- 절대 위치 중앙 -->
<div class="relative">
  <div class="center-absolute">절대 중앙</div>
</div>
```

### 8.11 Divider

```html
<hr class="divider">
<hr class="divider divider-dashed">
<hr class="divider divider-dotted">

<div class="divider-text">또는</div>

<div class="divider-vertical"></div>
```

### 8.12 Aspect Ratio

| 클래스 | 비율 |
|--------|------|
| `.aspect-square` | 1:1 |
| `.aspect-video` | 16:9 |
| `.aspect-4\/3` | 4:3 |
| `.aspect-3\/2` | 3:2 |

---

## 다크모드

CATUI는 자동으로 다크모드를 지원합니다.

```html
<!-- 다크모드 활성화 -->
<html data-theme="dark">
```

모든 색상 클래스는 CSS 변수를 사용하여 테마에 따라 자동 전환됩니다.

---

## 예제

### 카드 레이아웃

```html
<div class="card">
  <div class="card-header">
    <h3 class="card-header-title">
      <span class="material-icons" style="color: var(--primary);">star</span>
      제목
    </h3>
  </div>
  <div class="card-body">
    <p class="text-sm text-secondary mb-3">설명 텍스트</p>
    <div class="flex gap-2">
      <button class="btn btn-primary">확인</button>
      <button class="btn btn-outline">취소</button>
    </div>
  </div>
</div>
```

### 폼 레이아웃

```html
<form class="form">
  <div class="form-group">
    <label class="form-label required">이메일</label>
    <input type="email" class="form-input" placeholder="email@example.com">
  </div>
  
  <div class="form-row">
    <div class="form-group">
      <label class="form-label">이름</label>
      <input type="text" class="form-input">
    </div>
    <div class="form-group">
      <label class="form-label">전화번호</label>
      <input type="tel" class="form-input">
    </div>
  </div>
  
  <button type="submit" class="btn btn-primary btn-block">제출</button>
</form>
```

---

*Generated from CATUI Mobile SCSS source*
