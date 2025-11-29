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
      zIndex: 1300, // $z-index-modal
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
      border-radius: var(--radius-lg, 12px);
      box-shadow: var(--shadow-lg, 0 20px 25px rgba(0,0,0,0.15));
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
        padding: var(--spacing-4, 16px);
        border-bottom: 1px solid var(--border-color, #e5e7eb);
        flex-shrink: 0;
      `;

      if (this.options.title) {
        const title = document.createElement('h3');
        title.className = 'catui-modal-title';
        title.textContent = this.options.title;
        title.style.cssText = 'margin: 0; font-size: var(--font-size-lg, 18px); font-weight: 600; color: var(--text-primary, #111827);';
        header.appendChild(title);
      }

      if (this.options.showClose) {
        const closeBtn = document.createElement('button');
        closeBtn.className = 'catui-modal-close';
        closeBtn.innerHTML = '&times;';
        closeBtn.style.cssText = `
          background: none;
          border: none;
          font-size: var(--icon-size-md, 24px);
          cursor: pointer;
          padding: 0;
          width: 2.5rem;
          height: 2.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-tertiary, #9CA3AF);
          border-radius: var(--radius-default, 8px);
          transition: background 150ms ease;
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
      padding: var(--spacing-4, 16px);
      overflow-y: auto;
      -webkit-overflow-scrolling: touch;
      color: var(--text-primary, #111827);
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
      success: 'var(--success, #22C55E)',
      error: 'var(--danger, #EF4444)',
      warning: 'var(--warning, #EAB308)',
      info: 'var(--primary, #3B82F6)'
    };

    toast.style.cssText = `
      position: fixed;
      left: 50%;
      ${positions[this.options.position] || positions.bottom}
      transform: translateX(-50%) translateY(20px);
      padding: var(--spacing-3, 12px) var(--spacing-5, 20px);
      background: ${colors[this.options.type] || colors.info};
      color: white;
      border-radius: var(--radius-default, 8px);
      font-size: var(--font-size-sm, 14px);
      z-index: 1500;
      opacity: 0;
      transition: all var(--duration-base, 200ms) ease;
      box-shadow: var(--shadow-lg, 0 4px 12px rgba(0,0,0,0.15));
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

/**
 * Drawer 클래스 (Left/Right 슬라이드 패널)
 * @class Drawer
 * @extends Overlay
 */
class Drawer extends Overlay {
  /**
   * @constructor
   * @param {Object} options
   * @param {string} [options.position='left'] - 위치 (left, right)
   * @param {string} [options.width='280px'] - 너비
   * @param {string} [options.title] - 제목
   * @param {string|HTMLElement} [options.content] - 내용
   */
  constructor(options = {}) {
    super(options);
    
    this.options = {
      position: 'left',
      width: '280px',
      title: '',
      content: '',
      ...this.options
    };

    this._element = this._createElement();
  }

  /**
   * 요소 생성
   * @private
   */
  _createElement() {
    const drawer = document.createElement('div');
    drawer.className = `catui-drawer catui-drawer-${this.options.position}`;
    
    const isLeft = this.options.position === 'left';
    const translateX = isLeft ? '-100%' : '100%';
    
    drawer.style.cssText = `
      position: fixed;
      top: 0;
      ${isLeft ? 'left: 0' : 'right: 0'};
      width: ${this.options.width};
      max-width: 85vw;
      height: 100%;
      background: var(--bg-primary, #fff);
      z-index: ${this.options.zIndex};
      transform: translateX(${translateX});
      transition: transform ${this.options.animationDuration}ms var(--ease-in-out, cubic-bezier(0.4, 0, 0.2, 1));
      display: flex;
      flex-direction: column;
      box-shadow: var(--shadow-lg, ${isLeft ? '4px' : '-4px'} 0 20px rgba(0,0,0,0.15));
    `;

    // 헤더
    if (this.options.title) {
      const header = document.createElement('div');
      header.className = 'catui-drawer-header';
      header.style.cssText = `
        display: flex;
        align-items: center;
        padding: var(--spacing-4, 16px) var(--spacing-5, 20px);
        border-bottom: 1px solid var(--border-color, #e5e7eb);
        flex-shrink: 0;
        background: linear-gradient(135deg, var(--primary, #3B82F6) 0%, var(--secondary, #6B7280) 100%);
        color: white;
      `;

      const title = document.createElement('h3');
      title.className = 'catui-drawer-title';
      title.textContent = this.options.title;
      title.style.cssText = 'margin: 0; font-size: var(--font-size-lg, 18px); font-weight: 600;';
      header.appendChild(title);

      drawer.appendChild(header);
    }

    // 컨텐츠
    const content = document.createElement('div');
    content.className = 'catui-drawer-content';
    content.style.cssText = `
      flex: 1;
      overflow-y: auto;
      -webkit-overflow-scrolling: touch;
    `;
    
    if (typeof this.options.content === 'string') {
      content.innerHTML = this.options.content;
    } else if (this.options.content instanceof HTMLElement) {
      content.appendChild(this.options.content);
    }
    
    drawer.appendChild(content);

    return drawer;
  }

  /**
   * 열기 (오버라이드)
   */
  async open() {
    if (this._isOpen) return;

    this._backdrop = this._createBackdrop();
    document.body.appendChild(this._backdrop);
    document.body.appendChild(this._element);
    document.body.style.overflow = 'hidden';

    await this._nextFrame();
    this._backdrop.style.opacity = '1';
    this._element.style.transform = 'translateX(0)';

    this._isOpen = true;
  }

  /**
   * 닫기 (오버라이드)
   */
  async close() {
    if (!this._isOpen) return;

    const isLeft = this.options.position === 'left';
    const translateX = isLeft ? '-100%' : '100%';
    
    this._backdrop.style.opacity = '0';
    this._element.style.transform = `translateX(${translateX})`;

    await this._wait(this.options.animationDuration);

    this._backdrop?.remove();
    this._element?.remove();
    document.body.style.overflow = '';

    this._isOpen = false;

    if (this._onCloseCallback) {
      this._onCloseCallback();
    }
  }

  /**
   * 컨텐츠 업데이트
   * @param {string|HTMLElement} content
   */
  setContent(content) {
    const contentEl = this._element.querySelector('.catui-drawer-content');
    if (contentEl) {
      if (typeof content === 'string') {
        contentEl.innerHTML = content;
      } else if (content instanceof HTMLElement) {
        contentEl.innerHTML = '';
        contentEl.appendChild(content);
      }
    }
  }
}

/**
 * Tooltip 클래스
 * @class Tooltip
 */
class Tooltip {
  static _activeTooltip = null;
  
  /**
   * 툴팁 표시
   * @param {HTMLElement} target - 타겟 요소
   * @param {Object} options - 옵션
   */
  static show(target, options = {}) {
    this.hide();
    
    const text = options.text || target.getAttribute('data-tooltip');
    const pos = options.position || target.getAttribute('data-tooltip-pos') || 'top';
    
    if (!text) return;
    
    const tooltip = document.createElement('div');
    tooltip.className = 'catui-tooltip';
    tooltip.textContent = text;
    tooltip.style.cssText = `
      position: fixed;
      z-index: 1500;
      padding: var(--spacing-1, 4px) var(--spacing-2, 8px);
      background: var(--bg-inverse, #111827);
      color: var(--text-inverse, #fff);
      font-size: var(--font-size-xs, 12px);
      border-radius: var(--radius-sm, 4px);
      white-space: nowrap;
      pointer-events: none;
      opacity: 0;
      transition: opacity var(--duration-fast, 150ms) ease;
    `;
    
    document.body.appendChild(tooltip);
    
    // 위치 계산
    const rect = target.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();
    
    let top, left;
    
    switch (pos) {
      case 'top':
        top = rect.top - tooltipRect.height - 8;
        left = rect.left + (rect.width - tooltipRect.width) / 2;
        break;
      case 'bottom':
        top = rect.bottom + 8;
        left = rect.left + (rect.width - tooltipRect.width) / 2;
        break;
      case 'left':
        top = rect.top + (rect.height - tooltipRect.height) / 2;
        left = rect.left - tooltipRect.width - 8;
        break;
      case 'right':
        top = rect.top + (rect.height - tooltipRect.height) / 2;
        left = rect.right + 8;
        break;
    }
    
    // 화면 경계 체크
    left = Math.max(8, Math.min(left, window.innerWidth - tooltipRect.width - 8));
    top = Math.max(8, top);
    
    tooltip.style.top = `${top}px`;
    tooltip.style.left = `${left}px`;
    
    // 표시 애니메이션
    requestAnimationFrame(() => {
      tooltip.style.opacity = '1';
    });
    
    this._activeTooltip = tooltip;
  }
  
  /**
   * 툴팁 숨기기
   */
  static hide() {
    if (this._activeTooltip) {
      this._activeTooltip.remove();
      this._activeTooltip = null;
    }
  }
  
  /**
   * 자동 바인딩 (data-tooltip 속성이 있는 요소들)
   * @param {string} selector - 선택자 (기본: [data-tooltip])
   */
  static init(selector = '[data-tooltip]') {
    document.querySelectorAll(selector).forEach(el => {
      el.addEventListener('mouseenter', (e) => this.show(e.currentTarget));
      el.addEventListener('mouseleave', () => this.hide());
      el.addEventListener('touchstart', (e) => this.show(e.currentTarget), { passive: true });
      el.addEventListener('touchend', () => this.hide(), { passive: true });
    });
  }
}

export { Overlay, Modal, Toast, Drawer, Tooltip };
export default { Overlay, Modal, Toast, Drawer, Tooltip };
