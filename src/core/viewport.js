/**
 * Viewport & Device Utilities for Mobile
 * @module core/viewport
 * @description 뷰포트 관리 및 디바이스 감지 유틸리티
 */

/**
 * 뷰포트 관리자
 * @class ViewportManager
 */
export class ViewportManager {
  constructor() {
    this._handlers = new Map();
    this._currentOrientation = this._getOrientation();
    this._viewportMeta = null;
    
    this._onResize = this._handleResize.bind(this);
    this._onOrientationChange = this._handleOrientationChange.bind(this);
    
    window.addEventListener('resize', this._onResize);
    window.addEventListener('orientationchange', this._onOrientationChange);
  }

  /**
   * 뷰포트 너비 반환
   * @returns {number}
   */
  get width() {
    return window.innerWidth || document.documentElement.clientWidth;
  }

  /**
   * 뷰포트 높이 반환
   * @returns {number}
   */
  get height() {
    return window.innerHeight || document.documentElement.clientHeight;
  }

  /**
   * 현재 방향 반환
   * @returns {string} 'portrait' | 'landscape'
   */
  get orientation() {
    return this._currentOrientation;
  }

  /**
   * 세이프 에어리어 인셋 반환 (노치 대응)
   * @returns {Object}
   */
  get safeAreaInsets() {
    const computedStyle = getComputedStyle(document.documentElement);
    return {
      top: parseInt(computedStyle.getPropertyValue('--sat') || 
           computedStyle.getPropertyValue('env(safe-area-inset-top)') || '0'),
      right: parseInt(computedStyle.getPropertyValue('--sar') || 
             computedStyle.getPropertyValue('env(safe-area-inset-right)') || '0'),
      bottom: parseInt(computedStyle.getPropertyValue('--sab') || 
              computedStyle.getPropertyValue('env(safe-area-inset-bottom)') || '0'),
      left: parseInt(computedStyle.getPropertyValue('--sal') || 
            computedStyle.getPropertyValue('env(safe-area-inset-left)') || '0')
    };
  }

  /**
   * 뷰포트 메타 태그 설정
   * @param {Object} options - 뷰포트 옵션
   */
  setViewportMeta(options = {}) {
    const defaults = {
      width: 'device-width',
      initialScale: 1,
      minimumScale: 1,
      maximumScale: 1,
      userScalable: 'no',
      viewportFit: 'cover'
    };

    const settings = { ...defaults, ...options };
    
    let meta = document.querySelector('meta[name="viewport"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'viewport';
      document.head.appendChild(meta);
    }

    const content = [
      `width=${settings.width}`,
      `initial-scale=${settings.initialScale}`,
      `minimum-scale=${settings.minimumScale}`,
      `maximum-scale=${settings.maximumScale}`,
      `user-scalable=${settings.userScalable}`,
      `viewport-fit=${settings.viewportFit}`
    ].join(', ');

    meta.content = content;
    this._viewportMeta = meta;
  }

  /**
   * 100vh 문제 해결 (모바일 주소창 대응)
   */
  fixVhUnit() {
    // 중복 호출 방지
    if (this._vhHandler) return;
    
    this._vhHandler = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };
    
    this._vhHandler();
    window.addEventListener('resize', this._vhHandler);
  }

  /**
   * 세이프 에어리어 CSS 변수 설정
   */
  setupSafeAreaVariables() {
    // 중복 호출 방지
    if (document.getElementById('catui-safe-area-vars')) return;
    
    const style = document.createElement('style');
    style.id = 'catui-safe-area-vars';
    style.textContent = `
      :root {
        --sat: env(safe-area-inset-top);
        --sar: env(safe-area-inset-right);
        --sab: env(safe-area-inset-bottom);
        --sal: env(safe-area-inset-left);
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * 방향 확인
   * @private
   */
  _getOrientation() {
    if (window.screen?.orientation?.type) {
      return window.screen.orientation.type.includes('portrait') ? 'portrait' : 'landscape';
    }
    return this.width < this.height ? 'portrait' : 'landscape';
  }

  /**
   * 리사이즈 핸들러
   * @private
   */
  _handleResize() {
    this._emit('resize', {
      width: this.width,
      height: this.height
    });
  }

  /**
   * 방향 변경 핸들러
   * @private
   */
  _handleOrientationChange() {
    const newOrientation = this._getOrientation();
    if (newOrientation !== this._currentOrientation) {
      this._currentOrientation = newOrientation;
      this._emit('orientationchange', {
        orientation: newOrientation
      });
    }
  }

  /**
   * 이벤트 등록
   */
  on(event, handler) {
    if (!this._handlers.has(event)) {
      this._handlers.set(event, []);
    }
    this._handlers.get(event).push(handler);
    return () => this.off(event, handler);
  }

  /**
   * 이벤트 해제
   */
  off(event, handler) {
    if (!this._handlers.has(event)) return;
    if (handler) {
      const handlers = this._handlers.get(event);
      const index = handlers.indexOf(handler);
      if (index !== -1) handlers.splice(index, 1);
    } else {
      this._handlers.delete(event);
    }
  }

  /**
   * 이벤트 발생
   * @private
   */
  _emit(event, data) {
    if (!this._handlers.has(event)) return;
    this._handlers.get(event).forEach(handler => {
      try {
        handler(data);
      } catch (error) {
        console.error(`ViewportManager: Error in ${event} handler:`, error);
      }
    });
  }

  /**
   * 리소스 정리
   */
  destroy() {
    window.removeEventListener('resize', this._onResize);
    window.removeEventListener('orientationchange', this._onOrientationChange);
    
    // fixVhUnit 리스너 제거
    if (this._vhHandler) {
      window.removeEventListener('resize', this._vhHandler);
      this._vhHandler = null;
    }
    
    this._handlers.clear();
  }
}

/**
 * 디바이스 감지기
 * @class DeviceDetector
 */
export class DeviceDetector {
  constructor() {
    this._ua = navigator.userAgent.toLowerCase();
    this._platform = navigator.platform?.toLowerCase() || '';
  }

  /**
   * iOS 여부
   * @returns {boolean}
   */
  get isIOS() {
    return /iphone|ipad|ipod/.test(this._ua) || 
           (this._platform === 'macintel' && navigator.maxTouchPoints > 1);
  }

  /**
   * Android 여부
   * @returns {boolean}
   */
  get isAndroid() {
    return /android/.test(this._ua);
  }

  /**
   * 모바일 여부
   * @returns {boolean}
   */
  get isMobile() {
    return this.isIOS || this.isAndroid || /mobile/.test(this._ua);
  }

  /**
   * 태블릿 여부
   * @returns {boolean}
   */
  get isTablet() {
    return /tablet|ipad/.test(this._ua) || 
           (this.isAndroid && !/mobile/.test(this._ua));
  }

  /**
   * 터치 지원 여부
   * @returns {boolean}
   */
  get hasTouch() {
    return 'ontouchstart' in window || 
           navigator.maxTouchPoints > 0 ||
           navigator.msMaxTouchPoints > 0;
  }

  /**
   * PWA 모드 여부
   * @returns {boolean}
   */
  get isPWA() {
    return window.matchMedia('(display-mode: standalone)').matches ||
           window.navigator.standalone === true;
  }

  /**
   * 네트워크 연결 상태
   * @returns {Object}
   */
  get networkInfo() {
    const connection = navigator.connection || 
                       navigator.mozConnection || 
                       navigator.webkitConnection;
    
    if (connection) {
      return {
        type: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt,
        saveData: connection.saveData
      };
    }
    
    return {
      type: 'unknown',
      online: navigator.onLine
    };
  }

  /**
   * 다크모드 선호 여부
   * @returns {boolean}
   */
  get prefersDarkMode() {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  /**
   * 모션 감소 선호 여부
   * @returns {boolean}
   */
  get prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  /**
   * 디바이스 픽셀 비율
   * @returns {number}
   */
  get pixelRatio() {
    return window.devicePixelRatio || 1;
  }

  /**
   * 배터리 정보 (지원 시)
   * @returns {Promise<Object>}
   */
  async getBatteryInfo() {
    if ('getBattery' in navigator) {
      try {
        const battery = await navigator.getBattery();
        return {
          level: battery.level,
          charging: battery.charging,
          chargingTime: battery.chargingTime,
          dischargingTime: battery.dischargingTime
        };
      } catch {
        return null;
      }
    }
    return null;
  }

  /**
   * 디바이스 정보 요약
   * @returns {Object}
   */
  getSummary() {
    return {
      isIOS: this.isIOS,
      isAndroid: this.isAndroid,
      isMobile: this.isMobile,
      isTablet: this.isTablet,
      hasTouch: this.hasTouch,
      isPWA: this.isPWA,
      pixelRatio: this.pixelRatio,
      prefersDarkMode: this.prefersDarkMode,
      prefersReducedMotion: this.prefersReducedMotion,
      network: this.networkInfo
    };
  }
}

/**
 * 키보드 관리자
 * @class KeyboardManager
 * @description 가상 키보드 이벤트 감지 및 처리
 */
export class KeyboardManager {
  constructor() {
    this._handlers = new Map();
    this._isKeyboardVisible = false;
    this._keyboardHeight = 0;
    this._initialViewportHeight = window.innerHeight;

    if ('visualViewport' in window) {
      this._onViewportResize = this._handleViewportResize.bind(this);
      window.visualViewport.addEventListener('resize', this._onViewportResize);
    } else {
      // Fallback for older browsers
      this._onResize = this._handleResize.bind(this);
      window.addEventListener('resize', this._onResize);
    }
  }

  /**
   * 키보드 표시 여부
   * @returns {boolean}
   */
  get isVisible() {
    return this._isKeyboardVisible;
  }

  /**
   * 키보드 높이
   * @returns {number}
   */
  get height() {
    return this._keyboardHeight;
  }

  /**
   * visualViewport 리사이즈 핸들러
   * @private
   */
  _handleViewportResize() {
    const currentHeight = window.visualViewport.height;
    const keyboardHeight = this._initialViewportHeight - currentHeight;
    
    if (keyboardHeight > 100) {
      if (!this._isKeyboardVisible) {
        this._isKeyboardVisible = true;
        this._keyboardHeight = keyboardHeight;
        this._emit('show', { height: keyboardHeight });
      }
    } else {
      if (this._isKeyboardVisible) {
        this._isKeyboardVisible = false;
        this._keyboardHeight = 0;
        this._emit('hide', { height: 0 });
      }
    }
  }

  /**
   * Fallback 리사이즈 핸들러
   * @private
   */
  _handleResize() {
    const currentHeight = window.innerHeight;
    const heightDiff = this._initialViewportHeight - currentHeight;
    
    if (heightDiff > 100) {
      if (!this._isKeyboardVisible) {
        this._isKeyboardVisible = true;
        this._keyboardHeight = heightDiff;
        this._emit('show', { height: heightDiff });
      }
    } else {
      if (this._isKeyboardVisible) {
        this._isKeyboardVisible = false;
        this._keyboardHeight = 0;
        this._emit('hide', { height: 0 });
      }
    }
  }

  on(event, handler) {
    if (!this._handlers.has(event)) {
      this._handlers.set(event, []);
    }
    this._handlers.get(event).push(handler);
    return () => this.off(event, handler);
  }

  off(event, handler) {
    if (!this._handlers.has(event)) return;
    if (handler) {
      const handlers = this._handlers.get(event);
      const index = handlers.indexOf(handler);
      if (index !== -1) handlers.splice(index, 1);
    } else {
      this._handlers.delete(event);
    }
  }

  _emit(event, data) {
    if (!this._handlers.has(event)) return;
    this._handlers.get(event).forEach(handler => {
      try {
        handler(data);
      } catch (error) {
        console.error(`KeyboardManager: Error in ${event} handler:`, error);
      }
    });
  }

  destroy() {
    if ('visualViewport' in window) {
      window.visualViewport.removeEventListener('resize', this._onViewportResize);
    } else {
      window.removeEventListener('resize', this._onResize);
    }
    this._handlers.clear();
  }
}

export default {
  ViewportManager,
  DeviceDetector,
  KeyboardManager
};
