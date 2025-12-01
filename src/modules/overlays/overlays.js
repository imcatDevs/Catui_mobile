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
    this._backdropClickHandler = null;
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
      this._backdropClickHandler = () => this.close();
      backdrop.addEventListener('click', this._backdropClickHandler);
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
    if (this._backdrop && this._backdropClickHandler) {
      this._backdrop.removeEventListener('click', this._backdropClickHandler);
    }
    this.close();
    this._element = null;
    this._backdrop = null;
    this._onCloseCallback = null;
    this._backdropClickHandler = null;
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

  /**
   * 정리
   */
  destroy() {
    this.hide();
    this._element = null;
    this._timeout = null;
    this.options = null;
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
  static _boundElements = new WeakMap();

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
      if (this._boundElements.has(el)) return; // 이미 바인딩됨

      const handlers = {
        mouseenter: (e) => this.show(e.currentTarget),
        mouseleave: () => this.hide(),
        touchstart: (e) => this.show(e.currentTarget),
        touchend: () => this.hide()
      };

      el.addEventListener('mouseenter', handlers.mouseenter);
      el.addEventListener('mouseleave', handlers.mouseleave);
      el.addEventListener('touchstart', handlers.touchstart, { passive: true });
      el.addEventListener('touchend', handlers.touchend, { passive: true });

      this._boundElements.set(el, handlers);
    });
  }

  /**
   * 바인딩 해제
   * @param {HTMLElement} el - 요소 (없으면 전체 해제 불가, WeakMap 특성상)
   */
  static unbind(el) {
    const handlers = this._boundElements.get(el);
    if (handlers) {
      el.removeEventListener('mouseenter', handlers.mouseenter);
      el.removeEventListener('mouseleave', handlers.mouseleave);
      el.removeEventListener('touchstart', handlers.touchstart);
      el.removeEventListener('touchend', handlers.touchend);
      this._boundElements.delete(el);
    }
  }
}

/**
 * Popover 클래스 - 팝오버 (클릭으로 열리는 풍부한 콘텐츠 툴팁)
 * @class Popover
 */
class Popover {
  constructor(options = {}) {
    this.options = {
      trigger: null,        // 트리거 요소 (필수)
      content: '',          // 콘텐츠 (HTML 문자열 또는 요소)
      title: '',            // 제목
      placement: 'bottom',  // top, bottom, left, right
      offset: 8,            // 트리거와의 간격
      showArrow: true,      // 화살표 표시
      closeOnClickOutside: true,
      closeButton: true,
      width: 'auto',        // auto 또는 px 값
      maxWidth: 300,
      onOpen: null,
      onClose: null,
      ...options
    };

    this._element = null;
    this._isOpen = false;
    this._handlers = {};

    this._init();
  }

  _init() {
    const trigger = typeof this.options.trigger === 'string'
      ? document.querySelector(this.options.trigger)
      : this.options.trigger;

    if (!trigger) {
      console.error('[Popover] Trigger element not found');
      return;
    }

    this._trigger = trigger;
    this._handlers.click = (e) => {
      e.stopPropagation();
      this.toggle();
    };
    this._handlers.clickOutside = (e) => {
      if (this._isOpen && this.options.closeOnClickOutside &&
          !this._element?.contains(e.target) && !this._trigger.contains(e.target)) {
        this.close();
      }
    };

    this._trigger.addEventListener('click', this._handlers.click);
    document.addEventListener('click', this._handlers.clickOutside);
  }

  _createElement() {
    const popover = document.createElement('div');
    popover.className = 'catui-popover';
    popover.style.cssText = `
      position: fixed;
      z-index: 1050;
      background: var(--bg-primary, #fff);
      border-radius: 12px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.15);
      opacity: 0;
      transform: scale(0.95);
      transition: opacity 0.2s ease, transform 0.2s ease;
      width: ${this.options.width === 'auto' ? 'auto' : this.options.width + 'px'};
      max-width: ${this.options.maxWidth}px;
    `;

    let html = '';

    if (this.options.title || this.options.closeButton) {
      html += `<div class="catui-popover-header" style="display:flex;align-items:center;padding:12px 16px;border-bottom:1px solid var(--border-color,#E5E7EB);">
        ${this.options.title ? `<div class="catui-popover-title" style="flex:1;font-weight:600;color:var(--text-primary,#111827);">${this.options.title}</div>` : '<div style="flex:1;"></div>'}
        ${this.options.closeButton ? `<button class="catui-popover-close" style="display:flex;padding:4px;background:none;border:none;cursor:pointer;color:var(--text-tertiary,#9CA3AF);border-radius:4px;">
          <span class="material-icons" style="font-size:18px;">close</span>
        </button>` : ''}
      </div>`;
    }

    html += `<div class="catui-popover-body" style="padding:16px;color:var(--text-secondary,#4B5563);font-size:14px;line-height:1.5;">
      ${typeof this.options.content === 'string' ? this.options.content : ''}
    </div>`;

    if (this.options.showArrow) {
      html += '<div class="catui-popover-arrow" style="position:absolute;width:12px;height:12px;background:var(--bg-primary,#fff);transform:rotate(45deg);box-shadow:-2px -2px 4px rgba(0,0,0,0.05);"></div>';
    }

    popover.innerHTML = html;

    if (typeof this.options.content !== 'string' && this.options.content instanceof HTMLElement) {
      popover.querySelector('.catui-popover-body').appendChild(this.options.content);
    }

    if (this.options.closeButton) {
      popover.querySelector('.catui-popover-close').addEventListener('click', () => this.close());
    }

    return popover;
  }

  _position() {
    if (!this._element || !this._trigger) return;

    const triggerRect = this._trigger.getBoundingClientRect();
    const popoverRect = this._element.getBoundingClientRect();
    const arrow = this._element.querySelector('.catui-popover-arrow');
    const offset = this.options.offset;

    let top, left, arrowTop, arrowLeft;
    const arrowSize = 6;

    switch (this.options.placement) {
      case 'top':
        top = triggerRect.top - popoverRect.height - offset;
        left = triggerRect.left + (triggerRect.width - popoverRect.width) / 2;
        if (arrow) {
          arrowTop = popoverRect.height - arrowSize;
          arrowLeft = popoverRect.width / 2 - arrowSize;
        }
        break;
      case 'bottom':
        top = triggerRect.bottom + offset;
        left = triggerRect.left + (triggerRect.width - popoverRect.width) / 2;
        if (arrow) {
          arrowTop = -arrowSize;
          arrowLeft = popoverRect.width / 2 - arrowSize;
        }
        break;
      case 'left':
        top = triggerRect.top + (triggerRect.height - popoverRect.height) / 2;
        left = triggerRect.left - popoverRect.width - offset;
        if (arrow) {
          arrowTop = popoverRect.height / 2 - arrowSize;
          arrowLeft = popoverRect.width - arrowSize;
        }
        break;
      case 'right':
        top = triggerRect.top + (triggerRect.height - popoverRect.height) / 2;
        left = triggerRect.right + offset;
        if (arrow) {
          arrowTop = popoverRect.height / 2 - arrowSize;
          arrowLeft = -arrowSize;
        }
        break;
    }

    // 화면 경계 체크
    left = Math.max(8, Math.min(left, window.innerWidth - popoverRect.width - 8));
    top = Math.max(8, Math.min(top, window.innerHeight - popoverRect.height - 8));

    this._element.style.top = `${top}px`;
    this._element.style.left = `${left}px`;

    if (arrow) {
      arrow.style.top = `${arrowTop}px`;
      arrow.style.left = `${arrowLeft}px`;
    }
  }

  open() {
    if (this._isOpen) return;

    this._element = this._createElement();
    document.body.appendChild(this._element);

    // 위치 계산을 위해 잠시 보이게 함
    requestAnimationFrame(() => {
      this._position();
      this._element.style.opacity = '1';
      this._element.style.transform = 'scale(1)';
    });

    this._isOpen = true;
    this.options.onOpen?.();
  }

  close() {
    if (!this._isOpen || !this._element) return;

    this._element.style.opacity = '0';
    this._element.style.transform = 'scale(0.95)';

    setTimeout(() => {
      this._element?.remove();
      this._element = null;
    }, 200);

    this._isOpen = false;
    this.options.onClose?.();
  }

  toggle() {
    this._isOpen ? this.close() : this.open();
  }

  destroy() {
    this.close();
    if (this._trigger) {
      this._trigger.removeEventListener('click', this._handlers.click);
    }
    document.removeEventListener('click', this._handlers.clickOutside);
    this._trigger = null;
    this._handlers = null;
    this.options = null;
  }
}

/**
 * Notice 클래스 - 공지/팝업 (하루 동안 안 보기 지원)
 * @class Notice
 */
class Notice {
  constructor(options = {}) {
    this.options = {
      id: 'default',        // 공지 식별자 (localStorage 키로 사용)
      title: '',
      content: '',          // HTML 콘텐츠
      image: null,          // 이미지 URL
      imageHeight: 200,
      showDontShowToday: true,  // "하루 동안 안 보기" 체크박스 표시
      confirmText: '확인',
      closeOnOverlay: true,
      onConfirm: null,
      onClose: null,
      ...options
    };

    this._element = null;
    this._overlay = null;
    this._handlers = {};
  }

  /**
   * 오늘 표시 여부 체크
   */
  _shouldShow() {
    const storageKey = `catui-notice-hide-${this.options.id}`;
    const hideUntil = localStorage.getItem(storageKey);

    if (hideUntil) {
      const hideDate = new Date(parseInt(hideUntil, 10));
      if (new Date() < hideDate) {
        return false;
      }
      localStorage.removeItem(storageKey);
    }
    return true;
  }

  /**
   * 하루 동안 안 보기 설정
   */
  _setDontShowToday() {
    const storageKey = `catui-notice-hide-${this.options.id}`;
    const tomorrow = new Date();
    tomorrow.setHours(24, 0, 0, 0); // 오늘 자정
    localStorage.setItem(storageKey, tomorrow.getTime().toString());
  }

  _createElement() {
    // 오버레이
    this._overlay = document.createElement('div');
    this._overlay.className = 'catui-notice-overlay';
    this._overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.5);
      z-index: 2000;
      opacity: 0;
      transition: opacity 0.3s ease;
    `;

    // 공지 컨테이너
    this._element = document.createElement('div');
    this._element.className = 'catui-notice';
    this._element.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) scale(0.9);
      width: calc(100% - 48px);
      max-width: 360px;
      background: var(--bg-primary, #fff);
      border-radius: 16px;
      overflow: hidden;
      z-index: 2001;
      opacity: 0;
      transition: opacity 0.3s ease, transform 0.3s ease;
    `;

    let html = '';

    // 이미지
    if (this.options.image) {
      html += `<div class="catui-notice-image" style="width:100%;height:${this.options.imageHeight}px;overflow:hidden;">
        <img src="${this.options.image}" alt="" style="width:100%;height:100%;object-fit:cover;">
      </div>`;
    }

    // 콘텐츠
    html += '<div class="catui-notice-content" style="padding:24px;">';

    if (this.options.title) {
      html += `<h3 class="catui-notice-title" style="margin:0 0 12px;font-size:18px;font-weight:600;color:var(--text-primary,#111827);">${this.options.title}</h3>`;
    }

    if (this.options.content) {
      html += `<div class="catui-notice-body" style="font-size:14px;line-height:1.6;color:var(--text-secondary,#4B5563);">${this.options.content}</div>`;
    }

    // 하루 동안 안 보기 체크박스
    if (this.options.showDontShowToday) {
      html += `<label class="catui-notice-checkbox" style="display:flex;align-items:center;gap:8px;margin-top:16px;cursor:pointer;font-size:13px;color:var(--text-tertiary,#6B7280);">
        <input type="checkbox" id="catui-notice-dontshow-${this.options.id}" style="width:18px;height:18px;accent-color:var(--primary,#3B82F6);">
        <span>오늘 하루 보지 않기</span>
      </label>`;
    }

    html += '</div>';

    // 버튼
    html += `<div class="catui-notice-footer" style="padding:0 24px 24px;">
      <button class="catui-notice-btn" style="width:100%;padding:14px;background:var(--primary,#3B82F6);color:#fff;border:none;border-radius:10px;font-size:15px;font-weight:600;cursor:pointer;">
        ${this.options.confirmText}
      </button>
    </div>`;

    this._element.innerHTML = html;

    // 이벤트
    this._handlers.confirm = () => {
      if (this.options.showDontShowToday) {
        const checkbox = this._element.querySelector(`#catui-notice-dontshow-${this.options.id}`);
        if (checkbox?.checked) {
          this._setDontShowToday();
        }
      }
      this.options.onConfirm?.();
      this.close();
    };

    this._handlers.overlayClick = () => {
      if (this.options.closeOnOverlay) {
        this.close();
      }
    };

    this._element.querySelector('.catui-notice-btn').addEventListener('click', this._handlers.confirm);
    this._overlay.addEventListener('click', this._handlers.overlayClick);

    return this._element;
  }

  /**
   * 공지 표시
   * @returns {boolean} 표시 여부
   */
  show() {
    if (!this._shouldShow()) {
      return false;
    }

    this._createElement();
    document.body.appendChild(this._overlay);
    document.body.appendChild(this._element);

    requestAnimationFrame(() => {
      this._overlay.style.opacity = '1';
      this._element.style.opacity = '1';
      this._element.style.transform = 'translate(-50%, -50%) scale(1)';
    });

    return true;
  }

  /**
   * 공지 닫기
   */
  close() {
    if (this._overlay) {
      this._overlay.style.opacity = '0';
    }
    if (this._element) {
      this._element.style.opacity = '0';
      this._element.style.transform = 'translate(-50%, -50%) scale(0.9)';
    }

    setTimeout(() => {
      this._overlay?.remove();
      this._element?.remove();
      this._overlay = null;
      this._element = null;
      this.options.onClose?.();
    }, 300);
  }

  /**
   * 하루 동안 안 보기 설정 초기화
   */
  static resetDontShow(id) {
    localStorage.removeItem(`catui-notice-hide-${id}`);
  }

  destroy() {
    this.close();
    this._handlers = null;
    this.options = null;
  }
}

export { Overlay, Modal, Toast, Drawer, Tooltip, Popover, Notice };
export default { Overlay, Modal, Toast, Drawer, Tooltip, Popover, Notice };
