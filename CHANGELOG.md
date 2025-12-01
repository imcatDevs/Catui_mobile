# Changelog

CATUI Mobile 변경 이력

## [1.1.0] - 2024-12-01

### ✨ 새로운 기능

#### Theme 모듈 전환 효과

- **View Transitions API 지원**: Chrome 111+ 브라우저에서 자연스러운 테마 전환
- **Fade 효과**: 부드러운 크로스페이드 전환
- **Slide 효과**: 화면이 위로 슬라이드되며 전환
- **Circle 효과**: 클릭 위치에서 원형으로 확대되며 전환
  - `circle` / `circle-bottom-right`: 우하단에서 시작
  - `circle-top-left`: 좌상단에서 시작
  - `circle-top-right`: 우상단에서 시작
  - `circle-bottom-left`: 좌하단에서 시작
  - `circle-center`: 중앙에서 시작

#### 새로운 API

- `theme.setTransition(type, duration)`: 런타임 전환 효과 설정
- `theme.setWithCircleAt(theme, x, y)`: 특정 좌표에서 원형 전환
- `theme.toggleWithEvent(event)`: 클릭 이벤트 위치 기반 전환
- `theme.register(name, vars)`: 커스텀 브랜드 테마 등록

### 📄 예제 페이지

- `theme-demo.html`: 테마 전환 효과 데모 페이지 추가
  - 전환 효과 선택 UI
  - 전환 시간 조절 슬라이더
  - 클릭 위치 기반 전환 테스트 영역
  - 커스텀 브랜드 테마 예제 (Ocean, Forest, Sunset, Purple)

### 🔧 변경사항

- 기본 전환 시간 800ms로 설정
- theme.scss 추가 및 빌드 스크립트 통합
- 다크모드 변수 추가 (`$dark-text-tertiary`, `$dark-text-inverse` 등)

### 🐛 버그 수정

- theme 모듈 export 형식 수정 (객체 export로 통일)
- SCSS 변수 참조 오류 수정

---

## [1.0.0] - 2024-11-01

### 🎉 초기 릴리즈

#### Core

- CATUI DOM API (`CATUI()` 선택자)
- 모듈 시스템 (`CATUI.use()`)
- SPA 라우터
- 상태 관리

#### 모듈

- **theme**: 테마 관리 (Light/Dark/System)
- **overlays**: Modal, Toast, Drawer, Tooltip, Popover, Notice
- **navigation**: TabBar, SwipeTabs, AppBar, PullToRefresh, ScrollSpy, BackButton, Collapse, Accordion
- **pickers**: DatePicker, TimePicker, ColorPicker, Countdown, DDay
- **selectors**: Autocomplete, MultiSelect, RangeSlider, TagInput
- **forms**: FileUpload, Rating, SignaturePad, FormWizard
- **feedback**: Notification, ProgressTracker, Skeleton, Loading
- **carousel**: Slider, Lightbox
- **pagination**: Pagination, DataList, ImageGallery
- **scroll**: VirtualScroll, InfiniteScroll, BackToTop, ScrollProgress, StickyHeader, ParallaxScroll
- **social**: ChatUI, Comments, ShareButtons, Reactions
- **wordcloud**: WordCloud, TagCloud
- **list**: DataList, SortableList
- **auth**: LoginForm, AuthGuard
- **search**: SearchBar, SearchSuggestions
- **media**: MediaPlayer, AudioPlayer
- **onboarding**: Onboarding, Tutorial
- **payment**: PaymentForm, CardInput
- **calendar**: MonthCalendar, WeekCalendar

#### 스타일

- 모바일 최적화 CSS
- 터치 친화적 컴포넌트
- 다크모드 지원
- CSS 변수 기반 테마 시스템
