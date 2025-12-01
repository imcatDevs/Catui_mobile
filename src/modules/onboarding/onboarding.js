/**
 * CATUI Mobile - Onboarding Module
 * IntroSlider, FeatureSpotlight, PermissionGuide, Coachmark 컴포넌트
 * @module onboarding
 */

/**
 * IntroSlider 클래스 - 앱 소개 슬라이더
 * @class IntroSlider
 */
class IntroSlider {
  /**
   * @constructor
   * @param {Object} options
   * @param {string|HTMLElement} options.container - 컨테이너
   * @param {Array} options.slides - 슬라이드 배열 [{image, title, description, background}]
   * @param {boolean} [options.showSkip=true] - 건너뛰기 버튼 표시
   * @param {string} [options.skipText='건너뛰기'] - 건너뛰기 텍스트
   * @param {string} [options.nextText='다음'] - 다음 텍스트
   * @param {string} [options.doneText='시작하기'] - 완료 텍스트
   * @param {string} [options.pagination='dots'] - 페이지네이션 (dots, progress, fraction)
   * @param {string} [options.animation='slide'] - 애니메이션 (slide, fade)
   * @param {boolean} [options.autoplay=false] - 자동 재생
   * @param {number} [options.autoplayDelay=3000] - 자동 재생 딜레이
   * @param {Function} [options.onSlideChange] - 슬라이드 변경 콜백
   * @param {Function} [options.onSkip] - 건너뛰기 콜백
   * @param {Function} [options.onDone] - 완료 콜백
   */
  constructor(options = {}) {
    this.options = {
      container: null,
      slides: [],
      showSkip: true,
      skipText: '건너뛰기',
      nextText: '다음',
      doneText: '시작하기',
      pagination: 'dots',
      animation: 'slide',
      autoplay: false,
      autoplayDelay: 3000,
      onSlideChange: null,
      onSkip: null,
      onDone: null,
      ...options
    };

    this._container = typeof this.options.container === 'string'
      ? document.querySelector(this.options.container)
      : this.options.container;

    this._handlers = {};
    this._timers = [];
    this._currentIndex = 0;
    this._startX = 0;
    this._isDragging = false;

    if (this._container) {
      this._render();
      this._bindEvents();
      
      if (this.options.autoplay) {
        this._startAutoplay();
      }
    }
  }

  /**
   * 렌더링
   * @private
   */
  _render() {
    const { slides, showSkip, skipText, pagination, animation } = this.options;
    
    this._container.className = `catui-intro-slider is-${animation}`;
    this._container.innerHTML = `
      <div class="catui-intro-slides">
        ${slides.map((slide, i) => `
          <div class="catui-intro-slide ${i === 0 ? 'is-active' : ''}" 
               style="${slide.background ? `background: ${slide.background}` : ''}">
            ${slide.image ? `<img class="catui-intro-image" src="${slide.image}" alt="">` : ''}
            <div class="catui-intro-content">
              ${slide.icon ? `<span class="material-icons catui-intro-icon">${slide.icon}</span>` : ''}
              <h2 class="catui-intro-title">${slide.title || ''}</h2>
              <p class="catui-intro-desc">${slide.description || ''}</p>
            </div>
          </div>
        `).join('')}
      </div>
      ${showSkip ? `<button class="catui-intro-skip" type="button">${skipText}</button>` : ''}
      <div class="catui-intro-footer">
        ${this._renderPagination()}
        <button class="catui-intro-btn" type="button">${this.options.nextText}</button>
      </div>
    `;
  }

  /**
   * 페이지네이션 렌더링
   * @private
   */
  _renderPagination() {
    const { slides, pagination } = this.options;
    
    if (pagination === 'dots') {
      return `
        <div class="catui-intro-dots">
          ${slides.map((_, i) => `
            <div class="catui-intro-dot ${i === 0 ? 'is-active' : ''}" data-index="${i}"></div>
          `).join('')}
        </div>
      `;
    } else if (pagination === 'progress') {
      return `
        <div class="catui-intro-progress">
          <div class="catui-intro-progress-bar" style="width: ${100 / slides.length}%"></div>
        </div>
      `;
    } else if (pagination === 'fraction') {
      return `
        <div class="catui-intro-fraction">
          <span class="catui-intro-current">1</span>
          <span>/</span>
          <span class="catui-intro-total">${slides.length}</span>
        </div>
      `;
    }
    return '';
  }

  /**
   * 이벤트 바인딩
   * @private
   */
  _bindEvents() {
    // 버튼 클릭
    this._handlers.btnClick = () => {
      if (this._currentIndex === this.options.slides.length - 1) {
        this._done();
      } else {
        this.next();
      }
    };

    // 건너뛰기
    this._handlers.skipClick = () => {
      if (this.options.onSkip) this.options.onSkip();
      this._done();
    };

    // 닷 클릭
    this._handlers.dotClick = (e) => {
      const dot = e.target.closest('.catui-intro-dot');
      if (dot) {
        this.goTo(parseInt(dot.dataset.index));
      }
    };

    // 스와이프
    this._handlers.touchstart = (e) => {
      this._startX = e.touches[0].clientX;
      this._isDragging = true;
      this._stopAutoplay();
    };

    this._handlers.touchmove = (e) => {
      if (!this._isDragging) return;
      // 스크롤 방지는 필요시 추가
    };

    this._handlers.touchend = (e) => {
      if (!this._isDragging) return;
      this._isDragging = false;
      
      const endX = e.changedTouches[0].clientX;
      const diff = this._startX - endX;
      
      if (Math.abs(diff) > 50) {
        if (diff > 0) {
          this.next();
        } else {
          this.prev();
        }
      }
      
      if (this.options.autoplay) {
        this._startAutoplay();
      }
    };

    // 이벤트 등록
    this._container.querySelector('.catui-intro-btn')?.addEventListener('click', this._handlers.btnClick);
    this._container.querySelector('.catui-intro-skip')?.addEventListener('click', this._handlers.skipClick);
    this._container.querySelector('.catui-intro-dots')?.addEventListener('click', this._handlers.dotClick);
    
    const slides = this._container.querySelector('.catui-intro-slides');
    slides?.addEventListener('touchstart', this._handlers.touchstart, { passive: true });
    slides?.addEventListener('touchmove', this._handlers.touchmove, { passive: true });
    slides?.addEventListener('touchend', this._handlers.touchend);
  }

  /**
   * 자동 재생 시작
   * @private
   */
  _startAutoplay() {
    this._stopAutoplay();
    const timer = setInterval(() => {
      if (this._currentIndex < this.options.slides.length - 1) {
        this.next();
      } else {
        this._stopAutoplay();
      }
    }, this.options.autoplayDelay);
    this._timers.push(timer);
  }

  /**
   * 자동 재생 정지
   * @private
   */
  _stopAutoplay() {
    this._timers.forEach(id => clearInterval(id));
    this._timers = [];
  }

  /**
   * 슬라이드 업데이트
   * @private
   */
  _updateSlide() {
    const slides = this._container.querySelectorAll('.catui-intro-slide');
    const dots = this._container.querySelectorAll('.catui-intro-dot');
    const btn = this._container.querySelector('.catui-intro-btn');
    
    // 슬라이드 활성화
    slides.forEach((slide, i) => {
      slide.classList.toggle('is-active', i === this._currentIndex);
      if (this.options.animation === 'slide') {
        slide.style.transform = `translateX(${(i - this._currentIndex) * 100}%)`;
      }
    });
    
    // 닷 활성화
    dots.forEach((dot, i) => {
      dot.classList.toggle('is-active', i === this._currentIndex);
    });
    
    // 프로그레스 바
    const progressBar = this._container.querySelector('.catui-intro-progress-bar');
    if (progressBar) {
      progressBar.style.width = `${((this._currentIndex + 1) / this.options.slides.length) * 100}%`;
    }
    
    // 분수
    const currentEl = this._container.querySelector('.catui-intro-current');
    if (currentEl) {
      currentEl.textContent = this._currentIndex + 1;
    }
    
    // 버튼 텍스트
    if (btn) {
      btn.textContent = this._currentIndex === this.options.slides.length - 1 
        ? this.options.doneText 
        : this.options.nextText;
    }
    
    // 콜백
    if (this.options.onSlideChange) {
      this.options.onSlideChange(this._currentIndex);
    }
  }

  /**
   * 완료 처리
   * @private
   */
  _done() {
    if (this.options.onDone) {
      this.options.onDone();
    }
    // 슬라이더 닫기
    this.close();
  }

  /**
   * 슬라이더 닫기
   */
  close() {
    if (!this._container) return;
    
    const container = this._container;
    
    // 페이드 아웃 애니메이션
    container.style.opacity = '0';
    container.style.transition = 'opacity 0.3s';
    
    setTimeout(() => {
      // DOM에서 제거
      container.remove();
      this.destroy();
    }, 300);
  }

  /**
   * 다음 슬라이드
   */
  next() {
    if (this._currentIndex < this.options.slides.length - 1) {
      this._currentIndex++;
      this._updateSlide();
    }
  }

  /**
   * 이전 슬라이드
   */
  prev() {
    if (this._currentIndex > 0) {
      this._currentIndex--;
      this._updateSlide();
    }
  }

  /**
   * 특정 슬라이드로 이동
   * @param {number} index
   */
  goTo(index) {
    if (index >= 0 && index < this.options.slides.length) {
      this._currentIndex = index;
      this._updateSlide();
    }
  }

  /**
   * 현재 인덱스 가져오기
   * @returns {number}
   */
  getCurrentIndex() {
    return this._currentIndex;
  }

  /**
   * 정리
   */
  destroy() {
    this._stopAutoplay();
    
    if (this._container) {
      this._container.querySelector('.catui-intro-btn')?.removeEventListener('click', this._handlers?.btnClick);
      this._container.querySelector('.catui-intro-skip')?.removeEventListener('click', this._handlers?.skipClick);
      this._container.querySelector('.catui-intro-dots')?.removeEventListener('click', this._handlers?.dotClick);
      
      const slides = this._container.querySelector('.catui-intro-slides');
      slides?.removeEventListener('touchstart', this._handlers?.touchstart);
      slides?.removeEventListener('touchmove', this._handlers?.touchmove);
      slides?.removeEventListener('touchend', this._handlers?.touchend);

      this._container.innerHTML = '';
      this._container.className = '';
    }
    
    this._container = null;
    this._handlers = null;
    this.options = null;
  }
}

/**
 * FeatureSpotlight 클래스 - 기능 하이라이트
 * @class FeatureSpotlight
 */
class FeatureSpotlight {
  /**
   * @constructor
   * @param {Object} options
   * @param {string|HTMLElement} options.target - 하이라이트할 요소
   * @param {string} [options.title] - 제목
   * @param {string} [options.description] - 설명
   * @param {string} [options.position='bottom'] - 위치 (top, bottom, left, right)
   * @param {string} [options.shape='circle'] - 모양 (circle, rectangle)
   * @param {number} [options.padding=8] - 패딩
   * @param {Array} [options.buttons] - 버튼 배열 [{text, primary}]
   * @param {boolean} [options.closeOnBackdrop=true] - 배경 클릭 시 닫기
   * @param {Function} [options.onShow] - 표시 콜백
   * @param {Function} [options.onClose] - 닫기 콜백
   * @param {Function} [options.onAction] - 액션 콜백
   */
  constructor(options = {}) {
    this.options = {
      target: null,
      title: '',
      description: '',
      position: 'bottom',
      shape: 'circle',
      padding: 8,
      buttons: [{ text: '확인', primary: true }],
      closeOnBackdrop: true,
      onShow: null,
      onClose: null,
      onAction: null,
      ...options
    };

    this._target = typeof this.options.target === 'string'
      ? document.querySelector(this.options.target)
      : this.options.target;

    this._handlers = {};
    this._element = null;
    this._isOpen = false;
  }

  /**
   * 표시
   */
  show() {
    if (this._isOpen || !this._target) return;
    this._isOpen = true;

    const rect = this._target.getBoundingClientRect();
    const { padding, shape, position, title, description, buttons, closeOnBackdrop } = this.options;

    // 오버레이 생성
    this._element = document.createElement('div');
    this._element.className = 'catui-spotlight';
    
    // 하이라이트 영역 계산
    const highlightStyle = shape === 'circle' 
      ? `
          left: ${rect.left - padding}px;
          top: ${rect.top - padding}px;
          width: ${rect.width + padding * 2}px;
          height: ${rect.height + padding * 2}px;
          border-radius: 50%;
        `
      : `
          left: ${rect.left - padding}px;
          top: ${rect.top - padding}px;
          width: ${rect.width + padding * 2}px;
          height: ${rect.height + padding * 2}px;
          border-radius: 8px;
        `;

    // 툴팁 위치 계산
    let tooltipStyle = '';
    const gap = 16;
    
    switch (position) {
      case 'top':
        tooltipStyle = `bottom: ${window.innerHeight - rect.top + gap}px; left: ${rect.left}px;`;
        break;
      case 'bottom':
        tooltipStyle = `top: ${rect.bottom + gap}px; left: ${rect.left}px;`;
        break;
      case 'left':
        tooltipStyle = `top: ${rect.top}px; right: ${window.innerWidth - rect.left + gap}px;`;
        break;
      case 'right':
        tooltipStyle = `top: ${rect.top}px; left: ${rect.right + gap}px;`;
        break;
    }

    this._element.innerHTML = `
      <div class="catui-spotlight-backdrop"></div>
      <div class="catui-spotlight-highlight" style="${highlightStyle}"></div>
      <div class="catui-spotlight-tooltip is-${position}" style="${tooltipStyle}">
        ${title ? `<h4 class="catui-spotlight-title">${title}</h4>` : ''}
        ${description ? `<p class="catui-spotlight-desc">${description}</p>` : ''}
        <div class="catui-spotlight-actions">
          ${buttons.map((btn, i) => `
            <button class="catui-spotlight-btn ${btn.primary ? 'is-primary' : ''}" 
                    data-index="${i}" type="button">${btn.text}</button>
          `).join('')}
        </div>
      </div>
    `;

    document.body.appendChild(this._element);

    // 이벤트 바인딩
    this._handlers.backdropClick = (e) => {
      if (closeOnBackdrop && e.target.classList.contains('catui-spotlight-backdrop')) {
        this.close();
      }
    };

    this._handlers.buttonClick = (e) => {
      const btn = e.target.closest('.catui-spotlight-btn');
      if (btn) {
        const index = parseInt(btn.dataset.index);
        if (this.options.onAction) {
          this.options.onAction(index);
        }
        this.close();
      }
    };

    this._element.addEventListener('click', this._handlers.backdropClick);
    this._element.querySelector('.catui-spotlight-actions')?.addEventListener('click', this._handlers.buttonClick);

    // 콜백
    if (this.options.onShow) this.options.onShow();

    // 애니메이션
    requestAnimationFrame(() => {
      this._element.classList.add('is-visible');
    });
  }

  /**
   * 닫기
   */
  close() {
    if (!this._isOpen) return;
    this._isOpen = false;

    this._element?.classList.remove('is-visible');
    
    setTimeout(() => {
      this._element?.removeEventListener('click', this._handlers.backdropClick);
      this._element?.querySelector('.catui-spotlight-actions')?.removeEventListener('click', this._handlers.buttonClick);
      this._element?.remove();
      this._element = null;
      
      if (this.options.onClose) this.options.onClose();
    }, 200);
  }

  /**
   * 타겟 변경
   * @param {string|HTMLElement} target
   */
  setTarget(target) {
    this._target = typeof target === 'string'
      ? document.querySelector(target)
      : target;
  }

  /**
   * 정리
   */
  destroy() {
    this.close();
    this._target = null;
    this._handlers = null;
    this.options = null;
  }
}

/**
 * Coachmark 클래스 - 단계별 가이드
 * @class Coachmark
 */
class Coachmark {
  /**
   * @constructor
   * @param {Object} options
   * @param {Array} options.steps - 단계 배열 [{target, title, description, position}]
   * @param {boolean} [options.showProgress=true] - 진행률 표시
   * @param {boolean} [options.showSkip=true] - 건너뛰기 표시
   * @param {string} [options.nextText='다음'] - 다음 텍스트
   * @param {string} [options.prevText='이전'] - 이전 텍스트
   * @param {string} [options.doneText='완료'] - 완료 텍스트
   * @param {string} [options.skipText='건너뛰기'] - 건너뛰기 텍스트
   * @param {Function} [options.onStepChange] - 단계 변경 콜백
   * @param {Function} [options.onComplete] - 완료 콜백
   * @param {Function} [options.onSkip] - 건너뛰기 콜백
   */
  constructor(options = {}) {
    this.options = {
      steps: [],
      showProgress: true,
      showSkip: true,
      nextText: '다음',
      prevText: '이전',
      doneText: '완료',
      skipText: '건너뛰기',
      onStepChange: null,
      onComplete: null,
      onSkip: null,
      ...options
    };

    this._handlers = {};
    this._element = null;
    this._currentStep = 0;
    this._isActive = false;
  }

  /**
   * 시작
   */
  start() {
    if (this._isActive || this.options.steps.length === 0) return;
    this._isActive = true;
    this._currentStep = 0;
    
    this._createOverlay();
    this._showStep(0);
  }

  /**
   * 오버레이 생성
   * @private
   */
  _createOverlay() {
    this._element = document.createElement('div');
    this._element.className = 'catui-coachmark';
    document.body.appendChild(this._element);

    // 이벤트 바인딩
    this._handlers.click = (e) => {
      const action = e.target.dataset.action;
      if (action === 'next') this.next();
      else if (action === 'prev') this.prev();
      else if (action === 'skip') this.skip();
      else if (action === 'done') this.complete();
    };

    this._element.addEventListener('click', this._handlers.click);
  }

  /**
   * 단계 표시
   * @private
   */
  _showStep(index) {
    const step = this.options.steps[index];
    if (!step) return;

    const target = typeof step.target === 'string'
      ? document.querySelector(step.target)
      : step.target;

    if (!target) {
      console.warn('Coachmark target not found:', step.target);
      return;
    }

    const rect = target.getBoundingClientRect();
    const position = step.position || 'bottom';
    const padding = step.padding || 8;
    const { showProgress, showSkip, nextText, prevText, doneText, skipText } = this.options;
    const isFirst = index === 0;
    const isLast = index === this.options.steps.length - 1;

    // 하이라이트 스타일
    const highlightStyle = `
      left: ${rect.left - padding}px;
      top: ${rect.top - padding}px;
      width: ${rect.width + padding * 2}px;
      height: ${rect.height + padding * 2}px;
    `;

    // 툴팁 위치
    let tooltipStyle = '';
    const gap = 16;
    
    switch (position) {
      case 'top':
        tooltipStyle = `bottom: ${window.innerHeight - rect.top + gap}px; left: ${rect.left}px;`;
        break;
      case 'bottom':
        tooltipStyle = `top: ${rect.bottom + gap}px; left: ${rect.left}px;`;
        break;
      case 'left':
        tooltipStyle = `top: ${rect.top}px; right: ${window.innerWidth - rect.left + gap}px;`;
        break;
      case 'right':
        tooltipStyle = `top: ${rect.top}px; left: ${rect.right + gap}px;`;
        break;
    }

    this._element.innerHTML = `
      <div class="catui-coachmark-backdrop"></div>
      <div class="catui-coachmark-highlight" style="${highlightStyle}"></div>
      <div class="catui-coachmark-tooltip is-${position}" style="${tooltipStyle}">
        ${showProgress ? `
          <div class="catui-coachmark-progress">
            ${index + 1} / ${this.options.steps.length}
          </div>
        ` : ''}
        ${step.title ? `<h4 class="catui-coachmark-title">${step.title}</h4>` : ''}
        ${step.description ? `<p class="catui-coachmark-desc">${step.description}</p>` : ''}
        <div class="catui-coachmark-footer">
          <div class="catui-coachmark-left">
            ${showSkip && !isLast ? `<button class="catui-coachmark-skip" data-action="skip" type="button">${skipText}</button>` : ''}
          </div>
          <div class="catui-coachmark-right">
            ${!isFirst ? `<button class="catui-coachmark-btn" data-action="prev" type="button">${prevText}</button>` : ''}
            ${isLast 
              ? `<button class="catui-coachmark-btn is-primary" data-action="done" type="button">${doneText}</button>`
              : `<button class="catui-coachmark-btn is-primary" data-action="next" type="button">${nextText}</button>`
            }
          </div>
        </div>
      </div>
    `;

    // 스크롤 to target
    target.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // 애니메이션
    requestAnimationFrame(() => {
      this._element.classList.add('is-visible');
    });

    // 콜백
    if (this.options.onStepChange) {
      this.options.onStepChange(index, step);
    }
  }

  /**
   * 다음 단계
   */
  next() {
    if (this._currentStep < this.options.steps.length - 1) {
      this._currentStep++;
      this._showStep(this._currentStep);
    }
  }

  /**
   * 이전 단계
   */
  prev() {
    if (this._currentStep > 0) {
      this._currentStep--;
      this._showStep(this._currentStep);
    }
  }

  /**
   * 특정 단계로 이동
   * @param {number} index
   */
  goTo(index) {
    if (index >= 0 && index < this.options.steps.length) {
      this._currentStep = index;
      this._showStep(index);
    }
  }

  /**
   * 건너뛰기
   */
  skip() {
    if (this.options.onSkip) this.options.onSkip();
    this._close();
  }

  /**
   * 완료
   */
  complete() {
    if (this.options.onComplete) this.options.onComplete();
    this._close();
  }

  /**
   * 닫기
   * @private
   */
  _close() {
    this._isActive = false;
    this._element?.classList.remove('is-visible');
    
    setTimeout(() => {
      this._element?.removeEventListener('click', this._handlers.click);
      this._element?.remove();
      this._element = null;
    }, 200);
  }

  /**
   * 현재 단계 가져오기
   * @returns {number}
   */
  getCurrentStep() {
    return this._currentStep;
  }

  /**
   * 정리
   */
  destroy() {
    this._close();
    this._handlers = null;
    this.options = null;
  }
}

/**
 * PermissionGuide 클래스 - 권한 요청 안내
 * @class PermissionGuide
 */
class PermissionGuide {
  /**
   * @constructor
   * @param {Object} options
   * @param {string|HTMLElement} options.container - 컨테이너 (모달 내부용)
   * @param {Array} options.permissions - 권한 배열 [{icon, name, description, required}]
   * @param {string} [options.title='권한 안내'] - 제목
   * @param {string} [options.description] - 설명
   * @param {string} [options.buttonText='권한 허용하기'] - 버튼 텍스트
   * @param {boolean} [options.showAsModal=true] - 모달로 표시
   * @param {Function} [options.onAllow] - 허용 콜백
   * @param {Function} [options.onDeny] - 거부 콜백
   */
  constructor(options = {}) {
    this.options = {
      container: null,
      permissions: [],
      title: '권한 안내',
      description: '서비스 이용을 위해 다음 권한이 필요합니다.',
      buttonText: '권한 허용하기',
      skipText: '나중에',
      showAsModal: true,
      onAllow: null,
      onDeny: null,
      ...options
    };

    this._handlers = {};
    this._element = null;
    this._isOpen = false;

    if (!this.options.showAsModal && this.options.container) {
      this._container = typeof this.options.container === 'string'
        ? document.querySelector(this.options.container)
        : this.options.container;
      this._render();
    }
  }

  /**
   * 렌더링
   * @private
   */
  _render() {
    const { title, description, permissions, buttonText, skipText } = this.options;
    
    const html = `
      <div class="catui-permission-header">
        <h3 class="catui-permission-title">${title}</h3>
        ${description ? `<p class="catui-permission-desc">${description}</p>` : ''}
      </div>
      <div class="catui-permission-list">
        ${permissions.map(p => `
          <div class="catui-permission-item">
            <div class="catui-permission-icon">
              <span class="material-icons">${p.icon || 'security'}</span>
            </div>
            <div class="catui-permission-info">
              <div class="catui-permission-name">
                ${p.name}
                ${p.required ? '<span class="catui-permission-required">필수</span>' : '<span class="catui-permission-optional">선택</span>'}
              </div>
              <div class="catui-permission-text">${p.description || ''}</div>
            </div>
          </div>
        `).join('')}
      </div>
      <div class="catui-permission-actions">
        <button class="catui-permission-btn is-primary" data-action="allow" type="button">${buttonText}</button>
        <button class="catui-permission-btn is-text" data-action="deny" type="button">${skipText}</button>
      </div>
    `;

    if (this._container) {
      this._container.className = 'catui-permission';
      this._container.innerHTML = html;
      this._bindEvents(this._container);
    }

    return html;
  }

  /**
   * 이벤트 바인딩
   * @private
   */
  _bindEvents(element) {
    this._handlers.click = (e) => {
      const action = e.target.dataset.action;
      if (action === 'allow') {
        if (this.options.onAllow) this.options.onAllow();
        if (this.options.showAsModal) this.close();
      } else if (action === 'deny') {
        if (this.options.onDeny) this.options.onDeny();
        if (this.options.showAsModal) this.close();
      }
    };

    element.addEventListener('click', this._handlers.click);
  }

  /**
   * 모달로 표시
   */
  show() {
    if (this._isOpen || !this.options.showAsModal) return;
    this._isOpen = true;

    this._element = document.createElement('div');
    this._element.className = 'catui-permission-modal';
    this._element.innerHTML = `
      <div class="catui-permission-overlay"></div>
      <div class="catui-permission">
        ${this._render()}
      </div>
    `;

    document.body.appendChild(this._element);
    this._bindEvents(this._element.querySelector('.catui-permission'));

    requestAnimationFrame(() => {
      this._element.classList.add('is-visible');
    });
  }

  /**
   * 닫기
   */
  close() {
    if (!this._isOpen) return;
    this._isOpen = false;

    this._element?.classList.remove('is-visible');
    
    setTimeout(() => {
      this._element?.remove();
      this._element = null;
    }, 200);
  }

  /**
   * 정리
   */
  destroy() {
    this.close();
    
    if (this._container) {
      this._container.removeEventListener('click', this._handlers.click);
      this._container.innerHTML = '';
      this._container.className = '';
      this._container = null;
    }

    this._handlers = null;
    this.options = null;
  }
}

export { IntroSlider, FeatureSpotlight, Coachmark, PermissionGuide };
export default { IntroSlider, FeatureSpotlight, Coachmark, PermissionGuide };
