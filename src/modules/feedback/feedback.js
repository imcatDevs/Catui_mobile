/**
 * CATUI Mobile - Feedback Module
 * Notification, ProgressTracker, Skeleton, Loading 컴포넌트
 * Toast는 overlays 모듈 사용
 * @module feedback
 */

/**
 * Notification 클래스 - 알림 센터
 * @class Notification
 */
class Notification {
  constructor(options = {}) {
    this.options = {
      container: null,
      position: 'top-right', // top-left, top-right, bottom-left, bottom-right
      maxItems: 5,
      autoClose: true,
      autoCloseDelay: 5000,
      onClose: null,
      onClick: null,
      ...options
    };

    this._container = typeof this.options.container === 'string'
      ? document.querySelector(this.options.container)
      : this.options.container;

    this._notifications = [];
    this._handlers = {};

    if (!this._container) {
      this._createContainer();
    }
  }

  _createContainer() {
    this._container = document.createElement('div');
    this._container.className = `catui-notification-container catui-notification-${this.options.position}`;
    document.body.appendChild(this._container);
  }

  show(options = {}) {
    const config = {
      id: `notification-${Date.now()}`,
      title: '',
      message: '',
      type: 'default', // default, success, error, warning, info
      icon: null,
      avatar: null,
      timestamp: new Date(),
      actions: [], // [{ text: '', onClick: () => {}, primary: false }]
      closable: true,
      ...options
    };

    // 최대 개수 초과 시 가장 오래된 것 제거
    if (this._notifications.length >= this.options.maxItems) {
      this.dismiss(this._notifications[0].id);
    }

    const notification = this._createNotification(config);
    this._container.appendChild(notification);
    this._notifications.push({ id: config.id, element: notification, config });

    // 애니메이션
    requestAnimationFrame(() => {
      notification.classList.add('is-visible');
    });

    // 자동 닫기
    if (this.options.autoClose) {
      notification._timeout = setTimeout(() => {
        this.dismiss(config.id);
      }, this.options.autoCloseDelay);
    }

    return config.id;
  }

  _createNotification(config) {
    const notification = document.createElement('div');
    notification.className = `catui-notification catui-notification-${config.type}`;
    notification.dataset.id = config.id;

    const iconMap = {
      success: 'check_circle',
      error: 'error',
      warning: 'warning',
      info: 'info'
    };

    const icon = config.icon || iconMap[config.type];
    const timeAgo = this._getTimeAgo(config.timestamp);

    notification.innerHTML = `
      <div class="catui-notification-header">
        ${config.avatar 
          ? `<img class="catui-notification-avatar" src="${config.avatar}" alt="">` 
          : icon 
            ? `<span class="catui-notification-icon material-icons">${icon}</span>` 
            : ''
        }
        <div class="catui-notification-content">
          ${config.title ? `<div class="catui-notification-title">${config.title}</div>` : ''}
          <div class="catui-notification-message">${config.message}</div>
          <div class="catui-notification-time">${timeAgo}</div>
        </div>
        ${config.closable ? `<button class="catui-notification-close"><span class="material-icons">close</span></button>` : ''}
      </div>
      ${config.actions.length > 0 ? `
        <div class="catui-notification-actions">
          ${config.actions.map((action, i) => 
            `<button class="catui-notification-action${action.primary ? ' is-primary' : ''}" data-index="${i}">${action.text}</button>`
          ).join('')}
        </div>
      ` : ''}
    `;

    // 이벤트
    if (config.closable) {
      notification.querySelector('.catui-notification-close').addEventListener('click', (e) => {
        e.stopPropagation();
        this.dismiss(config.id);
      });
    }

    notification.querySelectorAll('.catui-notification-action').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const index = parseInt(btn.dataset.index);
        config.actions[index].onClick?.();
        if (!config.actions[index].keepOpen) {
          this.dismiss(config.id);
        }
      });
    });

    notification.addEventListener('click', () => {
      this.options.onClick?.(config);
    });

    // 마우스 오버 시 자동 닫기 일시 중지
    notification.addEventListener('mouseenter', () => {
      if (notification._timeout) {
        clearTimeout(notification._timeout);
      }
    });

    notification.addEventListener('mouseleave', () => {
      if (this.options.autoClose) {
        notification._timeout = setTimeout(() => {
          this.dismiss(config.id);
        }, this.options.autoCloseDelay);
      }
    });

    return notification;
  }

  _getTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 60) return '방금 전';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}분 전`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}시간 전`;
    return `${Math.floor(seconds / 86400)}일 전`;
  }

  dismiss(id) {
    const index = this._notifications.findIndex(n => n.id === id);
    if (index === -1) return;

    const { element, config } = this._notifications[index];
    if (element._timeout) clearTimeout(element._timeout);

    element.classList.remove('is-visible');
    element.classList.add('is-hiding');

    setTimeout(() => {
      element.remove();
      this._notifications.splice(index, 1);
      this.options.onClose?.(config);
    }, 300);
  }

  dismissAll() {
    [...this._notifications].forEach(n => this.dismiss(n.id));
  }

  destroy() {
    this.dismissAll();
    if (this._container && !this.options.container) {
      this._container.remove();
    }
    this._container = null;
    this._notifications = [];
    this.options = null;
  }
}

/**
 * ProgressTracker 클래스 - 단계별 진행 상태
 * @class ProgressTracker
 */
class ProgressTracker {
  constructor(options = {}) {
    this.options = {
      container: null,
      steps: [], // [{ title: '', description: '', icon: '' }]
      currentStep: 0,
      orientation: 'horizontal', // horizontal, vertical
      showDescription: true,
      clickable: false,
      onStepClick: null,
      ...options
    };

    this._container = typeof this.options.container === 'string'
      ? document.querySelector(this.options.container)
      : this.options.container;

    this._handlers = {};

    if (this._container) {
      this._render();
      this._bindEvents();
    }
  }

  _render() {
    this._container.className = `catui-progress-tracker catui-progress-tracker-${this.options.orientation}`;
    const isHorizontal = this.options.orientation === 'horizontal';
    
    const stepsHtml = this.options.steps.map((step, index) => {
      const status = index < this.options.currentStep ? 'completed' 
        : index === this.options.currentStep ? 'active' 
        : 'pending';

      // 세로형일 때만 step 사이에 커넥터 추가
      const connector = !isHorizontal && index < this.options.steps.length - 1 
        ? '<div class="catui-progress-connector"><div class="catui-progress-connector-fill"></div></div>' 
        : '';

      return `
        <div class="catui-progress-step is-${status}" data-step="${index}" ${this.options.clickable && index <= this.options.currentStep ? 'role="button" tabindex="0"' : ''}>
          <div class="catui-progress-step-indicator">
            ${status === 'completed' 
              ? '<span class="material-icons">check</span>' 
              : step.icon 
                ? `<span class="material-icons">${step.icon}</span>`
                : `<span class="catui-progress-step-number">${index + 1}</span>`
            }
          </div>
          <div class="catui-progress-step-content">
            <div class="catui-progress-step-title">${step.title}</div>
            ${this.options.showDescription && step.description ? `<div class="catui-progress-step-description">${step.description}</div>` : ''}
          </div>
        </div>
        ${connector}
      `;
    }).join('');

    // 가로형은 배경 커넥터 라인을 먼저 추가
    const horizontalConnector = isHorizontal 
      ? '<div class="catui-progress-connector"><div class="catui-progress-connector-fill"></div></div>'
      : '';

    this._container.innerHTML = horizontalConnector + stepsHtml;
    this._updateConnectors();
  }

  _bindEvents() {
    if (!this.options.clickable) return;

    this._handlers.click = (e) => {
      const stepEl = e.target.closest('.catui-progress-step[role="button"]');
      if (stepEl) {
        const stepIndex = parseInt(stepEl.dataset.step);
        this.options.onStepClick?.(stepIndex);
      }
    };

    this._container.addEventListener('click', this._handlers.click);
  }

  _updateConnectors() {
    const isHorizontal = this.options.orientation === 'horizontal';
    const connectors = this._container.querySelectorAll('.catui-progress-connector-fill');
    
    if (isHorizontal && connectors.length > 0) {
      // 가로형: 단일 커넥터의 너비를 진행률로 계산
      const totalSteps = this.options.steps.length - 1;
      const progress = totalSteps > 0 ? (this.options.currentStep / totalSteps) * 100 : 0;
      connectors[0].style.width = `${progress}%`;
    } else {
      // 세로형: 각 커넥터별로 완료 여부 체크
      connectors.forEach((connector, index) => {
        if (index < this.options.currentStep) {
          connector.style.width = '100%';
          connector.style.height = '100%';
        } else {
          connector.style.width = '0';
          connector.style.height = '0';
        }
      });
    }
  }

  setStep(step) {
    if (step < 0 || step >= this.options.steps.length) return;
    this.options.currentStep = step;
    this._render();
    this._bindEvents();
  }

  next() {
    if (this.options.currentStep < this.options.steps.length - 1) {
      this.setStep(this.options.currentStep + 1);
      return true;
    }
    return false;
  }

  prev() {
    if (this.options.currentStep > 0) {
      this.setStep(this.options.currentStep - 1);
      return true;
    }
    return false;
  }

  getCurrentStep() {
    return this.options.currentStep;
  }

  destroy() {
    if (this._handlers.click) {
      this._container.removeEventListener('click', this._handlers.click);
    }
    this._container.innerHTML = '';
    this._container.className = '';
    this._container = null;
    this._handlers = null;
    this.options = null;
  }
}

/**
 * Skeleton 클래스 - 스켈레톤 로딩
 * @class Skeleton
 */
class Skeleton {
  constructor(options = {}) {
    this.options = {
      container: null,
      type: 'text', // text, avatar, card, list, custom
      lines: 3,
      animated: true,
      width: '100%',
      height: null,
      borderRadius: null,
      template: null, // 커스텀 템플릿
      ...options
    };

    this._container = typeof this.options.container === 'string'
      ? document.querySelector(this.options.container)
      : this.options.container;

    this._originalContent = null;

    if (this._container) {
      this._render();
    }
  }

  _render() {
    this._originalContent = this._container.innerHTML;
    this._container.classList.add('catui-skeleton-wrapper');

    let html = '';

    switch (this.options.type) {
      case 'text':
        html = this._renderText();
        break;
      case 'avatar':
        html = this._renderAvatar();
        break;
      case 'card':
        html = this._renderCard();
        break;
      case 'list':
        html = this._renderList();
        break;
      case 'custom':
        html = this.options.template || '';
        break;
      default:
        html = this._renderRect();
    }

    this._container.innerHTML = html;
  }

  _renderText() {
    const lines = [];
    for (let i = 0; i < this.options.lines; i++) {
      const width = i === this.options.lines - 1 ? '60%' : '100%';
      lines.push(`<div class="catui-skeleton catui-skeleton-text${this.options.animated ? ' is-animated' : ''}" style="width: ${width}"></div>`);
    }
    return lines.join('');
  }

  _renderAvatar() {
    const size = this.options.height || '48px';
    return `<div class="catui-skeleton catui-skeleton-avatar${this.options.animated ? ' is-animated' : ''}" style="width: ${size}; height: ${size}"></div>`;
  }

  _renderCard() {
    return `
      <div class="catui-skeleton-card${this.options.animated ? ' is-animated' : ''}">
        <div class="catui-skeleton catui-skeleton-image"></div>
        <div class="catui-skeleton-card-content">
          <div class="catui-skeleton catui-skeleton-text" style="width: 80%"></div>
          <div class="catui-skeleton catui-skeleton-text" style="width: 60%"></div>
          <div class="catui-skeleton catui-skeleton-text" style="width: 40%"></div>
        </div>
      </div>
    `;
  }

  _renderList() {
    const items = [];
    for (let i = 0; i < this.options.lines; i++) {
      items.push(`
        <div class="catui-skeleton-list-item${this.options.animated ? ' is-animated' : ''}">
          <div class="catui-skeleton catui-skeleton-avatar" style="width: 40px; height: 40px"></div>
          <div class="catui-skeleton-list-content">
            <div class="catui-skeleton catui-skeleton-text" style="width: 70%"></div>
            <div class="catui-skeleton catui-skeleton-text" style="width: 50%"></div>
          </div>
        </div>
      `);
    }
    return items.join('');
  }

  _renderRect() {
    const style = [];
    if (this.options.width) style.push(`width: ${this.options.width}`);
    if (this.options.height) style.push(`height: ${this.options.height}`);
    if (this.options.borderRadius) style.push(`border-radius: ${this.options.borderRadius}`);

    return `<div class="catui-skeleton catui-skeleton-rect${this.options.animated ? ' is-animated' : ''}" style="${style.join('; ')}"></div>`;
  }

  hide() {
    if (this._originalContent !== null) {
      this._container.innerHTML = this._originalContent;
      this._container.classList.remove('catui-skeleton-wrapper');
    }
  }

  show() {
    this._render();
  }

  destroy() {
    this.hide();
    this._container = null;
    this._originalContent = null;
    this.options = null;
  }
}

/**
 * Loading 클래스 - 로딩 인디케이터
 * @class Loading
 */
class Loading {
  static _instance = null;

  constructor(options = {}) {
    this.options = {
      container: null, // null이면 전체 화면
      type: 'spinner', // spinner, dots, bar, pulse
      size: 'md', // sm, md, lg
      color: null,
      text: '',
      overlay: true,
      overlayColor: 'rgba(255, 255, 255, 0.8)',
      zIndex: 9999,
      ...options
    };

    this._container = typeof this.options.container === 'string'
      ? document.querySelector(this.options.container)
      : this.options.container;

    this._element = null;
    this._isVisible = false;
  }

  show() {
    if (this._isVisible) return;

    this._element = document.createElement('div');
    this._element.className = `catui-loading catui-loading-${this.options.type} catui-loading-${this.options.size}`;

    if (this.options.overlay) {
      this._element.classList.add('has-overlay');
      this._element.style.backgroundColor = this.options.overlayColor;
    }

    this._element.style.zIndex = this.options.zIndex;

    const loaderHtml = this._getLoaderHtml();
    this._element.innerHTML = `
      <div class="catui-loading-content">
        ${loaderHtml}
        ${this.options.text ? `<div class="catui-loading-text">${this.options.text}</div>` : ''}
      </div>
    `;

    if (this._container) {
      this._container.style.position = 'relative';
      this._container.appendChild(this._element);
    } else {
      document.body.appendChild(this._element);
      this._element.classList.add('is-fullscreen');
    }

    // 애니메이션
    requestAnimationFrame(() => {
      this._element.classList.add('is-visible');
    });

    this._isVisible = true;
  }

  _getLoaderHtml() {
    switch (this.options.type) {
      case 'spinner':
        return `
          <div class="catui-loading-spinner">
            <svg viewBox="0 0 50 50">
              <circle cx="25" cy="25" r="20" fill="none" stroke-width="4"></circle>
            </svg>
          </div>
        `;
      case 'dots':
        return `
          <div class="catui-loading-dots">
            <span></span><span></span><span></span>
          </div>
        `;
      case 'bar':
        return `
          <div class="catui-loading-bar">
            <div class="catui-loading-bar-progress"></div>
          </div>
        `;
      case 'pulse':
        return `
          <div class="catui-loading-pulse">
            <span></span><span></span>
          </div>
        `;
      default:
        return '';
    }
  }

  hide() {
    if (!this._isVisible || !this._element) return;

    this._element.classList.remove('is-visible');
    this._element.classList.add('is-hiding');

    setTimeout(() => {
      this._element?.remove();
      this._element = null;
      this._isVisible = false;
    }, 300);
  }

  setText(text) {
    this.options.text = text;
    if (this._element) {
      const textEl = this._element.querySelector('.catui-loading-text');
      if (textEl) {
        textEl.textContent = text;
      } else if (text) {
        const content = this._element.querySelector('.catui-loading-content');
        content.insertAdjacentHTML('beforeend', `<div class="catui-loading-text">${text}</div>`);
      }
    }
  }

  destroy() {
    this.hide();
    this._container = null;
    this.options = null;
  }

  // 전역 인스턴스 (편의 메서드)
  static show(options = {}) {
    if (!this._instance) {
      this._instance = new Loading(options);
    }
    this._instance.show();
    return this._instance;
  }

  static hide() {
    if (this._instance) {
      this._instance.hide();
    }
  }

  static setText(text) {
    if (this._instance) {
      this._instance.setText(text);
    }
  }
}

export { Notification, ProgressTracker, Skeleton, Loading };
export default { Notification, ProgressTracker, Skeleton, Loading };
