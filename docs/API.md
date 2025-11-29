# CATUI Mobile API Reference

> 🐱 **모바일 전용** 터치 최적화 UI 프레임워크

## 목차

- [시작하기](#시작하기)
- [Core API](#core-api)
- [Mobile API](#mobile-api)
- [State Management](#state-management)
- [SPA Router](#spa-router)
- [Event Bus](#event-bus)
- [Utilities](#utilities)

---

## 시작하기

### CDN 사용

```html
<link rel="stylesheet" href="dist/catui-mobile.css">
<script src="dist/catui-mobile.js"></script>
```

### 기본 사용법

```javascript
// DOM 조작 (jQuery 스타일)
CATUI('#app').addClass('active').text('Hello');

// 터치 이벤트
CATUI.touch('#card').on('swipeleft', () => console.log('Swiped!'));

// 디바이스 정보
if (CATUI.device.isMobile) {
  console.log('모바일 기기입니다');
}
```

---

## Core API

### DOM 조작

```javascript
// 요소 선택
CATUI('#selector')
CATUI('.class-name')
CATUI(element)

// 체이닝
CATUI('#app')
  .addClass('active')
  .removeClass('hidden')
  .toggleClass('visible')
  .text('Hello World')
  .html('<span>Safe HTML</span>')  // 자동 XSS 필터링
  .css({ color: 'red', padding: '10px' })
  .attr('data-id', '123')
  .on('click', handler);
```

| 메서드 | 설명 | 반환값 |
|--------|------|--------|
| `addClass(name)` | 클래스 추가 | `DOMElement` |
| `removeClass(name)` | 클래스 제거 | `DOMElement` |
| `toggleClass(name)` | 클래스 토글 | `DOMElement` |
| `hasClass(name)` | 클래스 포함 여부 | `boolean` |
| `text([value])` | 텍스트 설정/조회 | `string\|DOMElement` |
| `html([value])` | HTML 설정/조회 (자동 새니타이징) | `string\|DOMElement` |
| `attr(name, [value])` | 속성 설정/조회 | `string\|DOMElement` |
| `css(prop, [value])` | 스타일 설정/조회 | `string\|DOMElement` |
| `on(event, [selector], handler)` | 이벤트 등록 | `DOMElement` |
| `off(event, handler)` | 이벤트 해제 | `DOMElement` |
| `show()` / `hide()` / `toggle()` | 표시/숨김 | `DOMElement` |
| `append(content)` | 자식 추가 | `DOMElement` |
| `prepend(content)` | 자식 앞에 추가 | `DOMElement` |
| `remove()` | 요소 제거 | `DOMElement` |
| `find(selector)` | 하위 요소 검색 | `DOMElement` |
| `parent()` | 부모 요소 | `DOMElement` |
| `closest(selector)` | 가장 가까운 조상 | `DOMElement` |

### 요소 생성

```javascript
CATUI.create('div', {
  class: 'card',
  text: 'Hello',
  'data-id': '123'
}).appendTo('#container');
```

---

## Mobile API

### 터치 이벤트 (TouchManager)

```javascript
const touch = CATUI.touch('#element', {
  swipeThreshold: 50,      // 스와이프 최소 거리 (px)
  swipeVelocity: 0.3,      // 스와이프 최소 속도
  tapTimeout: 200,         // 탭 최대 시간 (ms)
  longPressTimeout: 500,   // 롱프레스 시간 (ms)
  doubleTapTimeout: 300,   // 더블탭 인식 시간 (ms)
  preventScroll: false     // 스크롤 방지
});

// 이벤트 등록
touch.on('tap', (data) => console.log('탭!', data.x, data.y));
touch.on('doubletap', (data) => console.log('더블탭!'));
touch.on('longpress', (data) => console.log('롱프레스!'));
touch.on('swipe', (data) => console.log('스와이프:', data.direction));
touch.on('swipeleft', () => console.log('왼쪽 스와이프'));
touch.on('swiperight', () => console.log('오른쪽 스와이프'));
touch.on('swipeup', () => console.log('위로 스와이프'));
touch.on('swipedown', () => console.log('아래로 스와이프'));
touch.on('pan', (data) => console.log('패닝:', data.deltaX, data.deltaY));
touch.on('pinch', (data) => console.log('핀치:', data.scale));

// 정리
touch.destroy();
```

#### 터치 이벤트 데이터

| 이벤트 | 데이터 |
|--------|--------|
| `tap` | `{ x, y, target }` |
| `doubletap` | `{ x, y, target }` |
| `longpress` | `{ x, y, target }` |
| `swipe*` | `{ direction, deltaX, deltaY, velocity, distance }` |
| `pan` | `{ deltaX, deltaY, x, y }` |
| `pinch` | `{ scale, center: { x, y } }` |

### 제스처 인식 (GestureRecognizer)

```javascript
const gesture = CATUI.gesture('#element', {
  rotationThreshold: 15,   // 회전 최소 각도
  dragThreshold: 10        // 드래그 최소 거리
});

gesture.on('dragstart', (data) => console.log('드래그 시작'));
gesture.on('drag', (data) => console.log('드래그:', data.deltaX, data.deltaY));
gesture.on('dragend', (data) => console.log('드래그 종료'));
gesture.on('rotate', (data) => console.log('회전:', data.angle, data.direction));

gesture.destroy();
```

### Pull-to-Refresh

```javascript
const ptr = CATUI.pullToRefresh('#scroll-container', {
  threshold: 80,           // 트리거 거리 (px)
  resistance: 2.5,         // 당김 저항
  refreshTimeout: 2000,    // 최대 새로고침 시간
  onRefresh: async () => {
    await fetchData();
  }
});

ptr.destroy();
```

### 뷰포트 관리 (ViewportManager)

```javascript
// 뷰포트 정보
console.log(CATUI.viewport.width);       // 뷰포트 너비
console.log(CATUI.viewport.height);      // 뷰포트 높이
console.log(CATUI.viewport.orientation); // 'portrait' | 'landscape'
console.log(CATUI.viewport.safeAreaInsets); // { top, right, bottom, left }

// 이벤트
CATUI.viewport.on('resize', ({ width, height }) => {
  console.log('리사이즈:', width, height);
});

CATUI.viewport.on('orientationchange', ({ orientation }) => {
  console.log('방향 변경:', orientation);
});
```

#### CSS 변수 (자동 설정)

```css
/* 100vh 문제 해결 */
.full-height {
  height: calc(var(--vh, 1vh) * 100);
}

/* 세이프 에어리어 (노치 대응) */
.safe-padding {
  padding-top: var(--sat);    /* safe-area-inset-top */
  padding-bottom: var(--sab); /* safe-area-inset-bottom */
  padding-left: var(--sal);   /* safe-area-inset-left */
  padding-right: var(--sar);  /* safe-area-inset-right */
}
```

### 디바이스 감지 (DeviceDetector)

```javascript
const device = CATUI.device;

// 플랫폼
device.isIOS          // iOS 여부
device.isAndroid      // Android 여부
device.isMobile       // 모바일 여부
device.isTablet       // 태블릿 여부

// 기능
device.hasTouch       // 터치 지원 여부
device.isPWA          // PWA 모드 여부
device.pixelRatio     // 디바이스 픽셀 비율

// 사용자 선호
device.prefersDarkMode       // 다크모드 선호
device.prefersReducedMotion  // 모션 감소 선호

// 네트워크
device.networkInfo    // { type, downlink, rtt, saveData }

// 전체 요약
device.getSummary()   // 모든 정보 객체
```

### 키보드 관리 (KeyboardManager)

```javascript
const keyboard = CATUI.keyboard;

// 상태
keyboard.isVisible    // 키보드 표시 여부
keyboard.height       // 키보드 높이 (px)

// 이벤트
keyboard.on('show', ({ height }) => {
  console.log('키보드 열림:', height);
});

keyboard.on('hide', () => {
  console.log('키보드 닫힘');
});
```

---

## State Management

### 상태 생성 및 관리

```javascript
// 상태 생성
const state = CATUI.state.create({
  count: 0,
  user: null
});

// 상태 읽기
console.log(state.count);      // 0
console.log(state.get());      // { count: 0, user: null }

// 상태 변경
state.count = 5;               // 직접 변경
state.set({ count: 10 });      // 객체로 변경

// 상태 감시
const unwatch = state.watch('count', (newVal, oldVal) => {
  console.log(`count: ${oldVal} → ${newVal}`);
});

// 전체 상태 구독
state.subscribe((currentState) => {
  console.log('상태 변경:', currentState);
});

// 배치 업데이트 (한 번만 알림)
state.batch(() => {
  state.count = 1;
  state.user = { name: 'John' };
});

// 리셋
state.reset({ count: 0 });

// 정리
state.destroy();
```

### 전역 상태

```javascript
// 전역 스토어 생성/조회
const userStore = CATUI.globalState.use('user', { id: null, name: '' });
const appStore = CATUI.globalState.use('app', { theme: 'light' });

// 스토어 제거
CATUI.globalState.remove('user');

// 모두 제거
CATUI.globalState.clear();
```

---

## SPA Router

### 기본 사용법

```html
<!-- 메인 페이지 -->
<div id="app-content"></div>

<!-- 네비게이션 -->
<a catui-href="views/home.html">홈</a>
<a catui-href="views/about.html">소개</a>
```

### 프로그래매틱 네비게이션

```javascript
// 페이지 이동
await CATUI.view.navigate('views/home.html');

// 히스토리 교체 (뒤로가기 불가)
await CATUI.view.navigate('views/login.html', true);

// 뒤로/앞으로
CATUI.view.back();
CATUI.view.forward();

// 현재 경로
console.log(CATUI.view.current()); // 'views/home.html'

// URL 파라미터
// URL: #views/product.html?id=123&color=red
const params = CATUI.view.params();
console.log(params.id);    // '123'
console.log(params.color); // 'red'
```

### 라우터 훅

```javascript
// 페이지 로드 전
CATUI.view.beforeLoad((path, from) => {
  console.log(`${from} → ${path}`);
  // 인증 체크 등
});

// 페이지 로드 후
CATUI.view.afterLoad((path) => {
  console.log('로드 완료:', path);
  // 애널리틱스 등
});

// 에러 발생 시
CATUI.view.onError((error) => {
  console.error('로드 실패:', error);
});
```

### 인스턴스 관리 (메모리 누수 방지)

```javascript
// 뷰 내에서 생성한 인스턴스 등록
// → 뷰 전환 시 자동으로 destroy() 호출됨
const modal = new Modal();
CATUI.view.registerInstance(modal);
```

---

## Event Bus

```javascript
// 이벤트 구독
const unsubscribe = CATUI.on('user:login', (user) => {
  console.log('로그인:', user);
});

// 일회성 구독
CATUI.once('data:loaded', (data) => {
  console.log('데이터 로드됨 (1회만)');
});

// 이벤트 발행
CATUI.emit('user:login', { id: 1, name: 'John' });

// 구독 취소
unsubscribe();
// 또는
CATUI.off('user:login', handler);
```

---

## Utilities

### 타입 체크

```javascript
CATUI.isString('hello')   // true
CATUI.isNumber(123)       // true
CATUI.isArray([1, 2, 3])  // true
CATUI.isObject({})        // true
CATUI.isFunction(fn)      // true
```

### 함수 유틸

```javascript
// 디바운스 (마지막 호출만 실행)
const debouncedSearch = CATUI.debounce((query) => {
  fetchResults(query);
}, 300);

// 스로틀 (일정 간격으로 실행)
const throttledScroll = CATUI.throttle(() => {
  updatePosition();
}, 100);
```

### 객체 유틸

```javascript
// 깊은 복사
const copy = CATUI.clone(original);

// 객체 병합
const merged = CATUI.extend({}, defaults, options);

// 랜덤 ID 생성
const id = CATUI.randomId('item'); // 'item_abc123def'
```

### 보안

```javascript
// HTML 이스케이프
CATUI.escape('<script>alert("XSS")</script>');
// → '&lt;script&gt;alert("XSS")&lt;/script&gt;'

// HTML 새니타이징 (위험 요소 제거)
CATUI.sanitize(userInput);

// 경로 검증
CATUI.validatePath('views/home.html'); // true
CATUI.validatePath('../etc/passwd');   // false
```

### DOM Ready

```javascript
CATUI.ready(() => {
  console.log('DOM 준비 완료');
});
```

---

## 로딩 인디케이터

```javascript
// 표시
CATUI.loading.show('로딩 중...');

// 숨김
CATUI.loading.hide();

// 프로그레스 바 스타일
CATUI.loading.setConfig({
  style: 'bar',    // 'spinner' | 'bar' | 'dots'
  position: 'top', // 'center' | 'top'
  color: '#007bff',
  delay: 200       // 지연 시간 (빠른 로딩은 표시 안함)
});

// 진행률 설정 (bar 스타일)
CATUI.loading.progress(50); // 50%
```

---

## API 요청

```javascript
// GET
const users = await CATUI.api.get('/api/users');

// POST
const user = await CATUI.api.post('/api/users', { name: 'John' });

// PUT
await CATUI.api.put('/api/users/1', { name: 'Jane' });

// DELETE
await CATUI.api.delete('/api/users/1');

// 인터셉터
CATUI.api.interceptors.request.use((config) => {
  config.headers['Authorization'] = `Bearer ${token}`;
  return config;
});

CATUI.api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.status === 401) {
      CATUI.view.navigate('views/login.html');
    }
    throw error;
  }
);
```

---

## 폼 검증

```javascript
const validator = CATUI.form.create('#login-form', {
  email: { required: true, email: true },
  password: { required: true, minLength: 8 }
}, {
  validateOnBlur: true,
  showErrorMessages: true
});

// 수동 검증
const isValid = validator.validate();

// 특정 필드 검증
validator.validateField('email');

// 에러 조회
console.log(validator.errors); // { email: '이메일 형식이 올바르지 않습니다' }

// 리셋
validator.reset();

// 정리
validator.destroy();
```

### 검증 규칙

| 규칙 | 설명 | 예시 |
|------|------|------|
| `required` | 필수 입력 | `{ required: true }` |
| `email` | 이메일 형식 | `{ email: true }` |
| `minLength` | 최소 길이 | `{ minLength: 8 }` |
| `maxLength` | 최대 길이 | `{ maxLength: 100 }` |
| `min` | 최소값 | `{ min: 0 }` |
| `max` | 최대값 | `{ max: 100 }` |
| `pattern` | 정규식 | `{ pattern: /^[0-9]+$/ }` |
| `custom` | 커스텀 함수 | `{ custom: (value) => value === 'ok' }` |

---

## 애니메이션

```javascript
// 기본 애니메이션
await CATUI.animate('#box').fadeIn(300);
await CATUI.animate('#box').fadeOut(300);
await CATUI.animate('#box').slideDown(400);
await CATUI.animate('#box').slideUp(400);

// 이동
await CATUI.animate('#box').bounceIn(600);
await CATUI.animate('#box').zoomIn(400);

// 커스텀
await CATUI.animate('#box').custom(
  { opacity: 0, transform: 'scale(0.5)' },
  { opacity: 1, transform: 'scale(1)' },
  500,
  'easeOutElastic'
);
```

### 이징 함수

`linear`, `easeIn`, `easeOut`, `easeInOut`, `easeInCubic`, `easeOutCubic`, `easeInOutCubic`, `easeInQuart`, `easeOutQuart`, `easeInOutQuart`, `easeInQuint`, `easeOutQuint`, `easeInOutQuint`, `easeInElastic`, `easeOutElastic`, `easeInBounce`, `easeOutBounce`

---

## 정리 (메모리 누수 방지)

```javascript
// 앱 종료 시
CATUI.destroy();
```

모든 이벤트 리스너, 타이머, 인스턴스가 정리됩니다.

---

## 버전

```javascript
console.log(CATUI.version); // '1.0.0'
```
