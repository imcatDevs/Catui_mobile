/**
 * CATUI Mobile - Theme Module
 * @module theme
 * @description 라이트/다크 모드 및 커스텀 테마 관리
 */

/**
 * 테마 관리 클래스
 * @class Theme
 */
class Theme {
  /**
   * @constructor
   * @param {Object} options - 테마 옵션
   * @param {string} [options.defaultTheme='system'] - 기본 테마 ('light', 'dark', 'system')
   * @param {string} [options.storageKey='catui-theme'] - localStorage 키
   * @param {Object} [options.themes] - 커스텀 테마 정의
   */
  constructor(options = {}) {
    this.options = {
      defaultTheme: 'system',
      storageKey: 'catui-theme',
      themes: {},
      ...options
    };

    this._currentTheme = null;
    this._listeners = new Set();
    this._mediaQuery = null;
    this._mediaQueryHandler = null;

    // 빌트인 테마
    this._builtInThemes = {
      light: {
        '--text-primary': '#111827',
        '--text-secondary': '#4b5563',
        '--text-muted': '#9ca3af',
        '--text-inverse': '#ffffff',
        '--bg-primary': '#ffffff',
        '--bg-secondary': '#f9fafb',
        '--bg-tertiary': '#f3f4f6',
        '--border-color': '#e5e7eb',
        '--border-color-dark': '#d1d5db'
      },
      dark: {
        '--text-primary': '#f3f4f6',
        '--text-secondary': '#9ca3af',
        '--text-muted': '#6b7280',
        '--text-inverse': '#111827',
        '--bg-primary': '#111827',
        '--bg-secondary': '#1f2937',
        '--bg-tertiary': '#374151',
        '--border-color': '#374151',
        '--border-color-dark': '#4b5563'
      }
    };

    this._init();
  }

  /**
   * 초기화
   * @private
   */
  _init() {
    // 저장된 테마 또는 기본값 로드
    const saved = this._getSavedTheme();
    const theme = saved || this.options.defaultTheme;

    // 시스템 테마 감지 설정
    this._setupSystemThemeDetection();

    // 테마 적용
    this.set(theme, false); // 초기화 시에는 저장하지 않음
  }

  /**
   * 시스템 테마 감지 설정
   * @private
   */
  _setupSystemThemeDetection() {
    if (typeof window === 'undefined' || !window.matchMedia) return;

    this._mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    this._mediaQueryHandler = (e) => {
      // 'system' 모드일 때만 자동 변경
      if (this._currentTheme === 'system') {
        this._applyTheme(e.matches ? 'dark' : 'light');
        this._notifyListeners();
      }
    };

    // 이벤트 리스너 등록
    if (this._mediaQuery.addEventListener) {
      this._mediaQuery.addEventListener('change', this._mediaQueryHandler);
    } else {
      // Safari 13 이하 호환
      this._mediaQuery.addListener(this._mediaQueryHandler);
    }
  }

  /**
   * 저장된 테마 가져오기
   * @private
   * @returns {string|null}
   */
  _getSavedTheme() {
    if (typeof localStorage === 'undefined') return null;
    try {
      return localStorage.getItem(this.options.storageKey);
    } catch {
      return null;
    }
  }

  /**
   * 테마 저장
   * @private
   * @param {string} theme
   */
  _saveTheme(theme) {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(this.options.storageKey, theme);
    } catch {
      // Storage 에러 무시
    }
  }

  /**
   * 테마 CSS 변수 적용
   * @private
   * @param {string} themeName - 실제 적용할 테마 ('light' 또는 'dark')
   */
  _applyTheme(themeName) {
    const root = document.documentElement;
    
    // 모든 테마 클래스 제거
    root.classList.remove('theme-light', 'theme-dark');
    
    // 새 테마 클래스 추가
    root.classList.add(`theme-${themeName}`);
    
    // data 속성도 설정 (CSS 선택자용)
    root.dataset.theme = themeName;

    // 커스텀 테마 또는 빌트인 테마의 CSS 변수 적용
    const themeVars = this.options.themes[themeName] || this._builtInThemes[themeName];
    
    if (themeVars) {
      Object.entries(themeVars).forEach(([key, value]) => {
        root.style.setProperty(key, value);
      });
    }

    // meta theme-color 업데이트 (모바일 브라우저 상태바)
    this._updateMetaThemeColor(themeName);
  }

  /**
   * meta theme-color 업데이트
   * @private
   * @param {string} themeName
   */
  _updateMetaThemeColor(themeName) {
    let meta = document.querySelector('meta[name="theme-color"]');
    
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'theme-color';
      document.head.appendChild(meta);
    }

    const colors = {
      light: '#ffffff',
      dark: '#111827'
    };

    meta.content = colors[themeName] || colors.light;
  }

  /**
   * 리스너에게 변경 알림
   * @private
   */
  _notifyListeners() {
    const resolved = this.getResolved();
    this._listeners.forEach(listener => {
      try {
        listener(resolved, this._currentTheme);
      } catch (e) {
        console.error('[Theme] Listener error:', e);
      }
    });
  }

  /**
   * 시스템 테마 가져오기
   * @returns {string} 'light' 또는 'dark'
   */
  getSystemTheme() {
    if (typeof window === 'undefined' || !window.matchMedia) return 'light';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  /**
   * 현재 테마 가져오기 (설정값)
   * @returns {string} 'light', 'dark', 또는 'system'
   */
  get() {
    return this._currentTheme;
  }

  /**
   * 실제 적용된 테마 가져오기
   * @returns {string} 'light' 또는 'dark'
   */
  getResolved() {
    if (this._currentTheme === 'system') {
      return this.getSystemTheme();
    }
    return this._currentTheme;
  }

  /**
   * 테마 설정
   * @param {string} theme - 'light', 'dark', 또는 'system'
   * @param {boolean} [save=true] - localStorage에 저장 여부
   */
  set(theme, save = true) {
    const validThemes = ['light', 'dark', 'system', ...Object.keys(this.options.themes)];
    
    if (!validThemes.includes(theme)) {
      console.warn(`[Theme] Invalid theme: ${theme}. Using 'light'.`);
      theme = 'light';
    }

    this._currentTheme = theme;

    // 실제 테마 적용
    const resolvedTheme = theme === 'system' ? this.getSystemTheme() : theme;
    this._applyTheme(resolvedTheme);

    // 저장
    if (save) {
      this._saveTheme(theme);
    }

    // 리스너 알림
    this._notifyListeners();
  }

  /**
   * 테마 토글 (light ↔ dark)
   */
  toggle() {
    const current = this.getResolved();
    this.set(current === 'dark' ? 'light' : 'dark');
  }

  /**
   * 테마 변경 리스너 등록
   * @param {Function} listener - 콜백 (resolvedTheme, settingTheme) => void
   * @returns {Function} 구독 해제 함수
   */
  onChange(listener) {
    this._listeners.add(listener);
    return () => this._listeners.delete(listener);
  }

  /**
   * 커스텀 테마 등록
   * @param {string} name - 테마 이름
   * @param {Object} vars - CSS 변수 객체
   */
  register(name, vars) {
    this.options.themes[name] = vars;
  }

  /**
   * 다크 모드 여부
   * @returns {boolean}
   */
  isDark() {
    return this.getResolved() === 'dark';
  }

  /**
   * 라이트 모드 여부
   * @returns {boolean}
   */
  isLight() {
    return this.getResolved() === 'light';
  }

  /**
   * 정리 (메모리 누수 방지)
   */
  destroy() {
    // 미디어 쿼리 리스너 제거
    if (this._mediaQuery && this._mediaQueryHandler) {
      if (this._mediaQuery.removeEventListener) {
        this._mediaQuery.removeEventListener('change', this._mediaQueryHandler);
      } else {
        this._mediaQuery.removeListener(this._mediaQueryHandler);
      }
    }

    // 리스너 정리
    this._listeners.clear();

    this._mediaQuery = null;
    this._mediaQueryHandler = null;
  }
}

// 싱글톤 인스턴스
let themeInstance = null;

/**
 * Theme 모듈 팩토리
 * @param {Object} options - 테마 옵션
 * @returns {Theme}
 */
function createTheme(options = {}) {
  if (!themeInstance) {
    themeInstance = new Theme(options);
  }
  return themeInstance;
}

/**
 * 싱글톤 인스턴스 가져오기
 * @returns {Theme|null}
 */
function getTheme() {
  return themeInstance;
}

/**
 * 싱글톤 초기화 (새 옵션으로)
 * @param {Object} options
 * @returns {Theme}
 */
function initTheme(options = {}) {
  if (themeInstance) {
    themeInstance.destroy();
  }
  themeInstance = new Theme(options);
  return themeInstance;
}

export { Theme, createTheme, getTheme, initTheme };
export default createTheme;
