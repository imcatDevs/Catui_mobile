/**
 * CATUI Mobile - Overlays Module
 * @module overlays
 * @description 모달, 팝업, 토스트 등 오버레이 컴포넌트
 */

/**
 * 오버레이 기본 클래스
 * @class Overlay
 */
class Overlay {
  /**
   * @constructor
   * @param {Object} options - 옵션
   */
  constructor(options = {}) {
    this.options = {
      zIndex: 1050,
      closeOnBackdrop: true,
      closeOnEscape: false, // 모바일에서는 기본 비활성
      animation: true,
      animationDuration: 200,
      ...options
    };

    this._element = null;
    this._backdrop = null;
    this._isOpen = false;
    this._onCloseCallback = null;
  }

  /**
   * 백드롭 생성
   * @protected
   * @returns {HTMLElement}
   */
  _createBackdrop() {
    const backdrop = document.createElement('div');
    backdrop.className = 'catui-overlay-backdrop';
    backdrop.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      z-index: ${this.options.zIndex - 1};
      opacity: 0;
      transition: opacity ${this.options.animationDuration}ms ease;
    `;

    if (this.options.closeOnBackdrop) {
      backdrop.addEventListener('click', () => this.close());
    }

    return backdrop;
  }

  /**
   * 열기
   * @returns {Promise<void>}
   */
  async open() {
    if (this._isOpen) return;

    // 백드롭 추가
    this._backdrop = this._createBackdrop();
    document.body.appendChild(this._backdrop);

    // 요소 추가
    if (this._element) {
      document.body.appendChild(this._element);
    }

    // 스크롤 잠금
    document.body.style.overflow = 'hidden';

    // 애니메이션
    await this._nextFrame();
    this._backdrop.style.opacity = '1';
    
    if (this._element) {
      this._element.classList.add('is-open');
    }

    this._isOpen = true;
  }

  /**
   * 닫기
   * @returns {Promise<void>}
   */
  async close() {
    if (!this._isOpen) return;

    // 애니메이션
    this._backdrop.style.opacity = '0';
    
    if (this._element) {
      this._element.classList.remove('is-open');
    }

    await this._wait(this.options.animationDuration);

    // 요소 제거
    this._backdrop?.remove();
    this._element?.remove();

    // 스크롤 복원
    document.body.style.overflow = '';

    this._isOpen = false;

    // 콜백 실행
    if (this._onCloseCallback) {
      this._onCloseCallback();
    }
  }

  /**
   * 다음 프레임 대기
   * @protected
   */
  _nextFrame() {
    return new Promise(resolve => requestAnimationFrame(resolve));
  }

  /**
   * 대기
   * @protected
   * @param {number} ms
   */
  _wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 닫힘 콜백 설정
   * @param {Function} callback
   */
  onClose(callback) {
    this._onCloseCallback = callback;
  }

  /**
   * 열림 상태
   * @returns {boolean}
   */
  get isOpen() {
    return this._isOpen;
  }

  /**
   * 정리
   */
  destroy() {
    this.close();
    this._element = null;
    this._backdrop = null;
    this._onCloseCallback = null;
  }
}

/**
 * Modal 클래스
 * @class Modal
 * @extends Overlay
 */
class Modal extends Overlay {
  /**
   * @constructor
   * @param {Object} options
   * @param {string} [options.title] - 제목
   * @param {string} [options.content] - 내용 (HTML)
   * @param {boolean} [options.showClose=true] - 닫기 버튼 표시
   */
  constructor(options = {}) {
    super(options);
    
    this.options = {
      title: '',
      content: '',
      showClose: true,
      width: '90%',
      maxWidth: '400px',
      ...this.options
    };

    this._element = this._createElement();
  }

  /**
   * 요소 생성
   * @private
   */
  _createElement() {
    const modal = document.createElement('div');
    modal.className = 'catui-modal';
    modal.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) scale(0.9);
      width: ${this.options.width};
      max-width: ${this.options.maxWidth};
      max-height: 90vh;
      background: var(--bg-primary, #fff);
      border-radius: 12px;
      box-shadow: 0 20px 25px rgba(0,0,0,0.15);
      z-index: ${this.options.zIndex};
      opacity: 0;
      transition: all ${this.options.animationDuration}ms ease;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    `;

    // 헤더
    if (this.options.title || this.options.showClose) {
      const header = document.createElement('div');
      header.className = 'catui-modal-header';
      header.style.cssText = `
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 16px;
        border-bottom: 1px solid var(--border-color, #e5e7eb);
        flex-shrink: 0;
      `;

      if (this.options.title) {
        const title = document.createElement('h3');
        title.className = 'catui-modal-title';
        title.textContent = this.options.title;
        title.style.cssText = 'margin: 0; font-size: 18px; font-weight: 600;';
        header.appendChild(title);
      }

      if (this.options.showClose) {
        const closeBtn = document.createElement('button');
        closeBtn.className = 'catui-modal-close';
        closeBtn.innerHTML = '&times;';
        closeBtn.style.cssText = `
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          padding: 0;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-secondary, #666);
        `;
        closeBtn.addEventListener('click', () => this.close());
        header.appendChild(closeBtn);
      }

      modal.appendChild(header);
    }

    // 콘텐츠
    const content = document.createElement('div');
    content.className = 'catui-modal-content';
    content.style.cssText = `
      padding: 16px;
      overflow-y: auto;
      -webkit-overflow-scrolling: touch;
    `;
    content.innerHTML = this.options.content;
    modal.appendChild(content);

    return modal;
  }

  /**
   * 열기 (오버라이드)
   */
  async open() {
    await super.open();
    
    // 모달 애니메이션
    await this._nextFrame();
    this._element.style.opacity = '1';
    this._element.style.transform = 'translate(-50%, -50%) scale(1)';
  }

  /**
   * 닫기 (오버라이드)
   */
  async close() {
    this._element.style.opacity = '0';
    this._element.style.transform = 'translate(-50%, -50%) scale(0.9)';
    await super.close();
  }

  /**
   * 콘텐츠 업데이트
   * @param {string} html
   */
  setContent(html) {
    const content = this._element.querySelector('.catui-modal-content');
    if (content) {
      content.innerHTML = html;
    }
  }
}

/**
 * Toast 클래스
 * @class Toast
 */
class Toast {
  /**
   * @constructor
   * @param {Object} options
   */
  constructor(options = {}) {
    this.options = {
      message: '',
      type: 'info', // 'success', 'error', 'warning', 'info'
      duration: 3000,
      position: 'bottom', // 'top', 'bottom', 'center'
      ...options
    };

    this._element = null;
    this._timeout = null;
  }

  /**
   * 표시
   */
  show() {
    this._element = this._createElement();
    document.body.appendChild(this._element);

    // 애니메이션
    requestAnimationFrame(() => {
      this._element.style.opacity = '1';
      this._element.style.transform = 'translateX(-50%) translateY(0)';
    });

    // 자동 숨김
    if (this.options.duration > 0) {
      this._timeout = setTimeout(() => this.hide(), this.options.duration);
    }
  }

  /**
   * 숨김
   */
  hide() {
    if (this._timeout) {
      clearTimeout(this._timeout);
    }

    if (this._element) {
      this._element.style.opacity = '0';
      setTimeout(() => this._element?.remove(), 200);
    }
  }

  /**
   * 요소 생성
   * @private
   */
  _createElement() {
    const toast = document.createElement('div');
    toast.className = `catui-toast catui-toast--${this.options.type}`;

    const positions = {
      top: 'top: calc(var(--sat, 0px) + 20px);',
      center: 'top: 50%; transform: translateX(-50%) translateY(-50%);',
      bottom: 'bottom: calc(var(--sab, 0px) + 20px);'
    };

    const colors = {
      success: '#10b981',
      error: '#ef4444',
      warning: '#f59e0b',
      info: '#3b82f6'
    };

    toast.style.cssText = `
      position: fixed;
      left: 50%;
      ${positions[this.options.position] || positions.bottom}
      transform: translateX(-50%) translateY(20px);
      padding: 12px 20px;
      background: ${colors[this.options.type] || colors.info};
      color: white;
      border-radius: 8px;
      font-size: 14px;
      z-index: 1100;
      opacity: 0;
      transition: all 200ms ease;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      max-width: 90%;
      text-align: center;
    `;

    toast.textContent = this.options.message;

    return toast;
  }

  /**
   * 정적 메서드: 성공 토스트
   */
  static success(message, options = {}) {
    const toast = new Toast({ message, type: 'success', ...options });
    toast.show();
    return toast;
  }

  /**
   * 정적 메서드: 에러 토스트
   */
  static error(message, options = {}) {
    const toast = new Toast({ message, type: 'error', ...options });
    toast.show();
    return toast;
  }

  /**
   * 정적 메서드: 경고 토스트
   */
  static warning(message, options = {}) {
    const toast = new Toast({ message, type: 'warning', ...options });
    toast.show();
    return toast;
  }

  /**
   * 정적 메서드: 정보 토스트
   */
  static info(message, options = {}) {
    const toast = new Toast({ message, type: 'info', ...options });
    toast.show();
    return toast;
  }
}

export { Overlay, Modal, Toast };
export default { Overlay, Modal, Toast };
