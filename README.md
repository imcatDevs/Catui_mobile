# CATUI Mobile

모바일 우선, 터치 최적화 UI 프레임워크

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)]()
[![License](https://img.shields.io/badge/license-MIT-green.svg)]()

## 📱 개요

CATUI Mobile은 IMCAT UI 코어를 기반으로 한 모바일 전문 프레임워크입니다.
터치 이벤트, 제스처 인식, 뷰포트 관리 등 모바일 환경에 특화된 기능을 제공합니다.

## 🎯 핵심 특징

### 1. **터치 최적화**

- 탭, 더블탭, 롱프레스 감지
- 스와이프 제스처 (상하좌우)
- 핀치 줌 지원
- 회전 제스처

### 2. **모바일 네이티브 경험**

- Pull-to-Refresh
- 가상 키보드 감지
- 세이프 에어리어 지원 (노치 대응)
- 100vh 문제 자동 해결

### 3. **제로 빌드**

- 빌드 도구 불필요
- CSS/JS 파일만 로드하면 즉시 사용
- ES6+ 네이티브 모듈

### 4. **경량화**

- 코어 < 15KB (minified + gzipped)
- 필요한 모듈만 동적 로드

## 🚀 빠른 시작

```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <link rel="stylesheet" href="dist/catui-mobile.css">
</head>
<body>
  <div id="app"></div>
  
  <script type="module">
    import CATUI from './dist/catui-mobile.js';
    
    // 터치 이벤트
    const touch = CATUI.touch('#app');
    touch.on('swipeleft', () => console.log('왼쪽 스와이프!'));
    touch.on('swiperight', () => console.log('오른쪽 스와이프!'));
    
    // 디바이스 정보
    console.log('iOS:', CATUI.device.isIOS);
    console.log('Android:', CATUI.device.isAndroid);
    console.log('PWA:', CATUI.device.isPWA);
  </script>
</body>
</html>
```

## 📚 API 레퍼런스

> 📖 **상세 문서**: [docs/API.md](./docs/API.md)

### 터치 이벤트

```javascript
// TouchManager 생성
const touch = CATUI.touch('#element', {
  swipeThreshold: 50,      // 스와이프 인식 거리
  swipeVelocity: 0.3,      // 스와이프 인식 속도
  tapTimeout: 200,         // 탭 인식 시간
  longPressTimeout: 500,   // 롱프레스 인식 시간
  doubleTapTimeout: 300    // 더블탭 인식 시간
});

// 이벤트 리스너
touch.on('tap', (data) => { /* x, y, target */ });
touch.on('doubletap', (data) => { /* x, y, target */ });
touch.on('longpress', (data) => { /* x, y, target */ });
touch.on('swipe', (data) => { /* direction, deltaX, deltaY, velocity */ });
touch.on('swipeleft', (data) => { });
touch.on('swiperight', (data) => { });
touch.on('swipeup', (data) => { });
touch.on('swipedown', (data) => { });
touch.on('pinch', (data) => { /* scale, center */ });
touch.on('pan', (data) => { /* deltaX, deltaY, x, y */ });

// 정리
touch.destroy();
```

### 제스처 인식

```javascript
// GestureRecognizer 생성
const gesture = CATUI.gesture('#element');

gesture.on('rotate', (data) => { /* angle, direction */ });
gesture.on('dragstart', (data) => { /* x, y */ });
gesture.on('drag', (data) => { /* x, y, deltaX, deltaY */ });
gesture.on('dragend', (data) => { /* x, y */ });

gesture.destroy();
```

### Pull-to-Refresh

```javascript
const ptr = CATUI.pullToRefresh('#scrollable', {
  threshold: 80,
  onRefresh: async () => {
    // 데이터 새로고침
    await fetchData();
  }
});

ptr.destroy();
```

### 뷰포트 관리

```javascript
// 뷰포트 정보
console.log(CATUI.viewport.width);
console.log(CATUI.viewport.height);
console.log(CATUI.viewport.orientation); // 'portrait' | 'landscape'

// 세이프 에어리어
const insets = CATUI.viewport.safeAreaInsets;
console.log(insets.top, insets.bottom);

// 이벤트
CATUI.viewport.on('resize', (data) => { });
CATUI.viewport.on('orientationchange', (data) => { });
```

### 디바이스 감지

```javascript
CATUI.device.isIOS          // iOS 여부
CATUI.device.isAndroid      // Android 여부
CATUI.device.isMobile       // 모바일 여부
CATUI.device.isTablet       // 태블릿 여부
CATUI.device.hasTouch       // 터치 지원 여부
CATUI.device.isPWA          // PWA 모드 여부
CATUI.device.pixelRatio     // 디바이스 픽셀 비율
CATUI.device.prefersDarkMode    // 다크모드 선호
CATUI.device.prefersReducedMotion // 모션 감소 선호
CATUI.device.networkInfo    // 네트워크 정보

// 전체 요약
const info = CATUI.device.getSummary();
```

### 키보드 관리

```javascript
// 가상 키보드 감지
CATUI.keyboard.on('show', (data) => {
  console.log('키보드 높이:', data.height);
});

CATUI.keyboard.on('hide', () => {
  console.log('키보드 숨김');
});

console.log(CATUI.keyboard.isVisible);
console.log(CATUI.keyboard.height);
```

### 기존 IMCAT UI API

모든 IMCAT UI 코어 기능을 그대로 사용할 수 있습니다:

```javascript
// DOM 조작
CATUI('#app').addClass('active').text('Hello');

// 모듈 로드
const Modal = await CATUI.use('modal');

// SPA 라우팅
<a catui-href="views/home.html">홈</a>

// 이벤트 버스
CATUI.on('event', handler);
CATUI.emit('event', data);

// 상태 관리
const state = CATUI.state.create({ count: 0 });

// 보안
CATUI.escape(userInput);
CATUI.sanitize(html);
```

## 📂 프로젝트 구조

```text
catui-mobile/
├── src/
│   ├── core/
│   │   ├── index.js      # 메인 진입점
│   │   ├── touch.js      # 터치/제스처 시스템
│   │   ├── viewport.js   # 뷰포트/디바이스 관리
│   │   ├── dom.js        # DOM 유틸리티
│   │   ├── router.js     # SPA 라우터
│   │   └── ...           # 기타 코어 모듈
│   ├── modules/          # 확장 모듈
│   └── styles/           # SCSS 스타일
├── dist/                 # 빌드 결과물
├── examples/             # 예제
├── docs/                 # 문서
└── tests/                # 테스트
```

## 🔧 빌드

```bash
# 의존성 설치
npm install

# 개발 모드
npm run dev

# 프로덕션 빌드
npm run build

# 로컬 서버
npm run serve
```

## 📱 모바일 모범 사례

### 1. 뷰포트 설정

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
```

### 2. PWA 지원

```html
<link rel="manifest" href="manifest.json">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
```

### 3. 100vh 문제 해결

```css
/* CATUI가 자동으로 --vh 변수 설정 */
.full-height {
  height: calc(var(--vh, 1vh) * 100);
}
```

### 4. 세이프 에어리어 대응

```css
/* CATUI가 자동으로 CSS 변수 설정 */
.header {
  padding-top: var(--sat);
}
.footer {
  padding-bottom: var(--sab);
}
```

## 🤝 IMCAT UI와의 관계

| 특성 | IMCAT UI | CATUI Mobile |
|------|----------|--------------|
| 대상 | 웹 전반 | 모바일 전문 |
| 터치 | 기본 지원 | 고급 제스처 |
| 뷰포트 | 표준 | 노치/키보드 대응 |
| PWA | 선택적 | 최적화 |
| 코어 | 동일 | 모바일 확장 |

## 📄 라이선스

MIT License

## 🔗 관련 링크

- [IMCAT UI 메인](https://imcat.dev)
- [API 문서](./docs/API_레퍼런스.md)
- [예제](./examples/)
