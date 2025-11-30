/**
 * CATUI Mobile - Navigation Module
 * @module navigation
 * @description 모바일 네비게이션 컴포넌트 (Tab Bar, Swipe Tabs, App Bar 등)
 */

/**
 * TabBar 클래스 - 하단 탭 네비게이션
 * @class TabBar
 */
class TabBar {
  /**
   * @constructor
   * @param {Object} options
   * @param {string|HTMLElement} options.container - 컨테이너 요소
   * @param {Array} options.tabs - 탭 배열 [{icon, label, badge?, onClick?}]
   * @param {number} [options.activeIndex=0] - 활성 탭 인덱스
   * @param {boolean} [options.showLabels=true] - 라벨 표시 여부
   * @param {Function} [options.onChange] - 탭 변경 콜백
   */
  constructor(options = {}) {
    this.options = {
      container: null,
      tabs: [],
      activeIndex: 0,
      showLabels: true,
      onChange: null,
      ...options
    };

    this._container = typeof this.options.container === 'string' 
      ? document.querySelector(this.options.container) 
      : this.options.container;
    
    this._activeIndex = this.options.activeIndex;
    this._clickHandler = null;
    
    if (this._container) {
      this._render();
      this._bindEvents();
    }
  }

  /**
   * 렌더링
   * @private
   */
  _render() {
    this._container.className = 'catui-tabbar';
    this._container.innerHTML = this.options.tabs.map((tab, index) => `
      <div class="catui-tabbar-item${index === this._activeIndex ? ' is-active' : ''}" data-index="${index}">
        <span class="catui-tabbar-icon">
          <span class="material-icons${tab.outlined ? '-outlined' : ''}">${tab.icon}</span>
          ${tab.badge ? `<span class="catui-tabbar-badge">${tab.badge}</span>` : ''}
        </span>
        ${this.options.showLabels ? `<span class="catui-tabbar-label">${tab.label}</span>` : ''}
      </div>
    `).join('');
  }

  /**
   * 이벤트 바인딩
   * @private
   */
  _bindEvents() {
    this._clickHandler = (e) => {
      const item = e.target.closest('.catui-tabbar-item');
      if (item) {
        const index = parseInt(item.dataset.index, 10);
        this.setActive(index);
      }
    };
    this._container.addEventListener('click', this._clickHandler);
  }

  /**
   * 정리
   */
  destroy() {
    if (this._clickHandler) {
      this._container.removeEventListener('click', this._clickHandler);
    }
    this._container = null;
    this._clickHandler = null;
    this.options = null;
  }

  /**
   * 활성 탭 설정
   * @param {number} index
   */
  setActive(index) {
    if (index === this._activeIndex || index < 0 || index >= this.options.tabs.length) return;

    const items = this._container.querySelectorAll('.catui-tabbar-item');
    items[this._activeIndex]?.classList.remove('is-active');
    items[index]?.classList.add('is-active');

    this._activeIndex = index;

    // 콜백 실행
    const tab = this.options.tabs[index];
    if (tab.onClick) tab.onClick(index, tab);
    if (this.options.onChange) this.options.onChange(index, tab);
  }

  /**
   * 배지 업데이트
   * @param {number} index - 탭 인덱스
   * @param {string|number|null} badge - 배지 값 (null이면 제거)
   */
  setBadge(index, badge) {
    const item = this._container.querySelectorAll('.catui-tabbar-item')[index];
    if (!item) return;

    let badgeEl = item.querySelector('.catui-tabbar-badge');
    
    if (badge === null || badge === undefined) {
      badgeEl?.remove();
    } else {
      if (!badgeEl) {
        badgeEl = document.createElement('span');
        badgeEl.className = 'catui-tabbar-badge';
        item.querySelector('.catui-tabbar-icon').appendChild(badgeEl);
      }
      badgeEl.textContent = badge;
    }
  }

  /**
   * 현재 활성 인덱스
   * @returns {number}
   */
  get activeIndex() {
    return this._activeIndex;
  }
}

/**
 * SwipeTabs 클래스 - 스와이프 가능한 탭
 * @class SwipeTabs
 */
class SwipeTabs {
  /**
   * @constructor
   * @param {Object} options
   * @param {string|HTMLElement} options.container - 컨테이너
   * @param {Array} options.tabs - 탭 배열 [{title, content}]
   * @param {number} [options.activeIndex=0] - 활성 탭
   * @param {boolean} [options.swipeable=true] - 스와이프 가능 여부
   * @param {Function} [options.onChange] - 변경 콜백
   */
  constructor(options = {}) {
    this.options = {
      container: null,
      tabs: [],
      activeIndex: 0,
      swipeable: true,
      animationDuration: 300,
      onChange: null,
      ...options
    };

    this._container = typeof this.options.container === 'string'
      ? document.querySelector(this.options.container)
      : this.options.container;

    this._activeIndex = this.options.activeIndex;
    this._startX = 0;
    this._currentX = 0;
    this._isDragging = false;
    this._handlers = {};

    if (this._container) {
      this._render();
      this._bindEvents();
    }
  }

  /**
   * 렌더링
   * @private
   */
  _render() {
    this._container.className = 'catui-swipe-tabs';
    this._container.innerHTML = `
      <div class="catui-swipe-tabs-header">
        ${this.options.tabs.map((tab, i) => `
          <div class="catui-swipe-tabs-tab${i === this._activeIndex ? ' is-active' : ''}" data-index="${i}">
            ${tab.title}
          </div>
        `).join('')}
        <div class="catui-swipe-tabs-indicator"></div>
      </div>
      <div class="catui-swipe-tabs-content">
        <div class="catui-swipe-tabs-panels" style="transform: translateX(-${this._activeIndex * 100}%);">
          ${this.options.tabs.map((tab, i) => `
            <div class="catui-swipe-tabs-panel">${tab.content}</div>
          `).join('')}
        </div>
      </div>
    `;

    this._updateIndicator();
  }

  /**
   * 이벤트 바인딩
   * @private
   */
  _bindEvents() {
    // 탭 클릭
    this._container.querySelectorAll('.catui-swipe-tabs-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        this.setActive(parseInt(tab.dataset.index, 10));
      });
    });

    // 스와이프
    if (this.options.swipeable) {
      this._panels = this._container.querySelector('.catui-swipe-tabs-panels');
      
      this._handlers.touchstart = (e) => {
        this._startX = e.touches[0].clientX;
        this._isDragging = true;
        this._panels.style.transition = 'none';
      };

      this._handlers.touchmove = (e) => {
        if (!this._isDragging) return;
        this._currentX = e.touches[0].clientX;
        const diff = this._currentX - this._startX;
        const offset = -this._activeIndex * 100 + (diff / this._container.offsetWidth) * 100;
        this._panels.style.transform = `translateX(${offset}%)`;
      };

      this._handlers.touchend = () => {
        if (!this._isDragging) return;
        this._isDragging = false;
        
        const diff = this._currentX - this._startX;
        const threshold = this._container.offsetWidth * 0.2;
        
        this._panels.style.transition = `transform ${this.options.animationDuration}ms ease`;
        
        if (diff > threshold && this._activeIndex > 0) {
          this.setActive(this._activeIndex - 1);
        } else if (diff < -threshold && this._activeIndex < this.options.tabs.length - 1) {
          this.setActive(this._activeIndex + 1);
        } else {
          this._panels.style.transform = `translateX(-${this._activeIndex * 100}%)`;
        }
      };

      this._panels.addEventListener('touchstart', this._handlers.touchstart, { passive: true });
      this._panels.addEventListener('touchmove', this._handlers.touchmove, { passive: true });
      this._panels.addEventListener('touchend', this._handlers.touchend);
    }
  }

  /**
   * 인디케이터 업데이트
   * @private
   */
  _updateIndicator() {
    const indicator = this._container.querySelector('.catui-swipe-tabs-indicator');
    const tabs = this._container.querySelectorAll('.catui-swipe-tabs-tab');
    const activeTab = tabs[this._activeIndex];
    
    if (indicator && activeTab) {
      indicator.style.width = `${activeTab.offsetWidth}px`;
      indicator.style.transform = `translateX(${activeTab.offsetLeft}px)`;
    }
  }

  /**
   * 활성 탭 설정
   * @param {number} index
   */
  setActive(index) {
    if (index < 0 || index >= this.options.tabs.length) return;

    const tabs = this._container.querySelectorAll('.catui-swipe-tabs-tab');
    const panels = this._container.querySelector('.catui-swipe-tabs-panels');

    tabs[this._activeIndex]?.classList.remove('is-active');
    tabs[index]?.classList.add('is-active');

    this._activeIndex = index;
    panels.style.transform = `translateX(-${index * 100}%)`;
    this._updateIndicator();

    if (this.options.onChange) {
      this.options.onChange(index, this.options.tabs[index]);
    }
  }

  /**
   * 현재 인덱스
   * @returns {number}
   */
  get activeIndex() {
    return this._activeIndex;
  }

  /**
   * 정리
   */
  destroy() {
    if (this._panels && this._handlers) {
      this._panels.removeEventListener('touchstart', this._handlers.touchstart);
      this._panels.removeEventListener('touchmove', this._handlers.touchmove);
      this._panels.removeEventListener('touchend', this._handlers.touchend);
    }
    if (this._container) {
      this._container.innerHTML = '';
    }
    this._container = null;
    this._panels = null;
    this._handlers = null;
    this.options = null;
  }
}

/**
 * AppBar 클래스 - 모바일 앱 헤더
 * @class AppBar
 */
class AppBar {
  /**
   * @constructor
   * @param {Object} options
   * @param {string|HTMLElement} options.container - 컨테이너
   * @param {string} [options.title] - 제목
   * @param {Array} [options.leading] - 왼쪽 액션들
   * @param {Array} [options.trailing] - 오른쪽 액션들
   * @param {string} [options.variant='default'] - 스타일 (default, primary, transparent)
   * @param {boolean} [options.fixed=true] - 고정 여부
   * @param {Function} [options.onBack] - 뒤로가기 콜백
   */
  constructor(options = {}) {
    this.options = {
      container: null,
      title: '',
      leading: [],
      trailing: [],
      variant: 'default',
      fixed: true,
      showBack: false,
      onBack: null,
      ...options
    };

    this._container = typeof this.options.container === 'string'
      ? document.querySelector(this.options.container)
      : this.options.container;

    if (this._container) {
      this._render();
      this._bindEvents();
    }
  }

  /**
   * 렌더링
   * @private
   */
  _render() {
    const variantClass = this.options.variant !== 'default' 
      ? ` catui-appbar-${this.options.variant}` 
      : '';
    const fixedClass = this.options.fixed ? ' catui-appbar-fixed' : '';

    this._container.className = `catui-appbar${variantClass}${fixedClass}`;
    this._container.innerHTML = `
      <div class="catui-appbar-leading">
        ${this.options.showBack ? `
          <button class="catui-appbar-btn catui-appbar-back">
            <span class="material-icons">arrow_back</span>
          </button>
        ` : ''}
        ${this.options.leading.map(item => `
          <button class="catui-appbar-btn" data-action="${item.action || ''}">
            <span class="material-icons${item.outlined ? '-outlined' : ''}">${item.icon}</span>
          </button>
        `).join('')}
      </div>
      <div class="catui-appbar-title">${this.options.title}</div>
      <div class="catui-appbar-trailing">
        ${this.options.trailing.map(item => `
          <button class="catui-appbar-btn" data-action="${item.action || ''}">
            <span class="material-icons${item.outlined ? '-outlined' : ''}">${item.icon}</span>
          </button>
        `).join('')}
      </div>
    `;
  }

  /**
   * 이벤트 바인딩
   * @private
   */
  _bindEvents() {
    // 뒤로가기 버튼
    const backBtn = this._container.querySelector('.catui-appbar-back');
    if (backBtn && this.options.onBack) {
      backBtn.addEventListener('click', () => this.options.onBack());
    }

    // 액션 버튼들
    this._container.querySelectorAll('.catui-appbar-btn[data-action]').forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.dataset.action;
        if (action) {
          this._container.dispatchEvent(new CustomEvent('action', { detail: { action } }));
        }
      });
    });
  }

  /**
   * 제목 설정
   * @param {string} title
   */
  setTitle(title) {
    const titleEl = this._container.querySelector('.catui-appbar-title');
    if (titleEl) titleEl.textContent = title;
  }

  /**
   * 액션 이벤트 리스너
   * @param {Function} callback
   */
  onAction(callback) {
    this._actionHandler = (e) => callback(e.detail.action);
    this._container.addEventListener('action', this._actionHandler);
  }

  /**
   * 정리
   */
  destroy() {
    if (this._actionHandler) {
      this._container.removeEventListener('action', this._actionHandler);
    }
    if (this._container) {
      this._container.innerHTML = '';
    }
    this._container = null;
    this._actionHandler = null;
    this.options = null;
  }
}

/**
 * PullToRefresh 클래스 - 당겨서 새로고침
 * @class PullToRefresh
 */
class PullToRefresh {
  /**
   * @constructor
   * @param {Object} options
   * @param {string|HTMLElement} options.container - 스크롤 컨테이너
   * @param {Function} options.onRefresh - 새로고침 콜백 (done 콜백 전달)
   * @param {number} [options.threshold=80] - 트리거 거리
   * @param {number} [options.maxPull=120] - 최대 당김 거리
   */
  constructor(options = {}) {
    this.options = {
      container: null,
      onRefresh: null,
      threshold: 80,
      maxPull: 120,
      ...options
    };

    this._container = typeof this.options.container === 'string'
      ? document.querySelector(this.options.container)
      : this.options.container;

    this._indicator = null;
    this._startY = 0;
    this._pullDistance = 0;
    this._isRefreshing = false;
    this._handlers = {};

    if (this._container) {
      this._createIndicator();
      this._bindEvents();
    }
  }

  /**
   * 인디케이터 생성
   * @private
   */
  _createIndicator() {
    this._indicator = document.createElement('div');
    this._indicator.className = 'catui-ptr-indicator';
    this._indicator.innerHTML = `
      <div class="catui-ptr-spinner">
        <span class="material-icons">refresh</span>
      </div>
    `;
    this._indicator.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 0;
      overflow: hidden;
      transition: height 0.2s ease;
      color: var(--text-tertiary, #9CA3AF);
    `;
    
    this._container.style.position = 'relative';
    this._container.insertBefore(this._indicator, this._container.firstChild);
  }

  /**
   * 이벤트 바인딩
   * @private
   */
  _bindEvents() {
    this._canPull = false;

    this._handlers.touchstart = (e) => {
      if (this._isRefreshing) return;
      if (this._container.scrollTop <= 0) {
        this._canPull = true;
        this._startY = e.touches[0].clientY;
      }
    };

    this._handlers.touchmove = (e) => {
      if (!this._canPull || this._isRefreshing) return;
      
      const currentY = e.touches[0].clientY;
      this._pullDistance = Math.min(currentY - this._startY, this.options.maxPull);
      
      if (this._pullDistance > 0) {
        this._indicator.style.height = `${this._pullDistance}px`;
        
        const icon = this._indicator.querySelector('.material-icons');
        const rotation = Math.min(this._pullDistance / this.options.threshold * 180, 180);
        icon.style.transform = `rotate(${rotation}deg)`;
        
        if (this._pullDistance >= this.options.threshold) {
          this._indicator.classList.add('is-ready');
        } else {
          this._indicator.classList.remove('is-ready');
        }
      }
    };

    this._handlers.touchend = () => {
      if (!this._canPull || this._isRefreshing) return;
      this._canPull = false;

      if (this._pullDistance >= this.options.threshold) {
        this._startRefresh();
      } else {
        this._reset();
      }
    };

    this._container.addEventListener('touchstart', this._handlers.touchstart, { passive: true });
    this._container.addEventListener('touchmove', this._handlers.touchmove, { passive: true });
    this._container.addEventListener('touchend', this._handlers.touchend);
  }

  /**
   * 새로고침 시작
   * @private
   */
  _startRefresh() {
    this._isRefreshing = true;
    this._indicator.style.height = `${this.options.threshold}px`;
    this._indicator.classList.add('is-refreshing');
    
    const icon = this._indicator.querySelector('.material-icons');
    icon.style.animation = 'catui-ptr-spin 1s linear infinite';

    if (this.options.onRefresh) {
      this.options.onRefresh(() => this._endRefresh());
    }
  }

  /**
   * 새로고침 종료
   * @private
   */
  _endRefresh() {
    this._isRefreshing = false;
    this._indicator.classList.remove('is-refreshing', 'is-ready');
    
    const icon = this._indicator.querySelector('.material-icons');
    icon.style.animation = '';
    
    this._reset();
  }

  /**
   * 리셋
   * @private
   */
  _reset() {
    this._pullDistance = 0;
    this._indicator.style.height = '0';
    
    const icon = this._indicator.querySelector('.material-icons');
    icon.style.transform = '';
  }

  /**
   * 프로그래매틱 새로고침
   */
  refresh() {
    this._pullDistance = this.options.threshold;
    this._indicator.style.height = `${this.options.threshold}px`;
    this._startRefresh();
  }

  /**
   * 정리
   */
  destroy() {
    if (this._container && this._handlers) {
      this._container.removeEventListener('touchstart', this._handlers.touchstart);
      this._container.removeEventListener('touchmove', this._handlers.touchmove);
      this._container.removeEventListener('touchend', this._handlers.touchend);
    }
    if (this._indicator) {
      this._indicator.remove();
    }
    this._container = null;
    this._indicator = null;
    this._handlers = null;
    this.options = null;
  }
}

/**
 * ScrollSpy 클래스 - 스크롤 감지 네비게이션
 * @class ScrollSpy
 */
class ScrollSpy {
  /**
   * @constructor
   * @param {Object} options
   * @param {string|HTMLElement} options.container - 스크롤 컨테이너
   * @param {string} options.sections - 섹션 선택자
   * @param {string} options.nav - 네비게이션 링크 선택자
   * @param {number} [options.offset=0] - 오프셋
   * @param {Function} [options.onChange] - 변경 콜백
   */
  constructor(options = {}) {
    this.options = {
      container: window,
      sections: '[data-spy-section]',
      nav: '[data-spy-nav]',
      offset: 0,
      onChange: null,
      ...options
    };

    this._container = typeof this.options.container === 'string'
      ? document.querySelector(this.options.container)
      : this.options.container;

    this._sections = document.querySelectorAll(this.options.sections);
    this._navItems = document.querySelectorAll(this.options.nav);
    this._activeId = null;
    this._scrollHandler = null;

    this._bindEvents();
  }

  /**
   * 이벤트 바인딩
   * @private
   */
  _bindEvents() {
    this._scrollHandler = () => this._onScroll();
    
    if (this._container === window) {
      window.addEventListener('scroll', this._scrollHandler, { passive: true });
    } else {
      this._container.addEventListener('scroll', this._scrollHandler, { passive: true });
    }

    // 초기 체크
    this._onScroll();
  }

  /**
   * 스크롤 핸들러
   * @private
   */
  _onScroll() {
    const scrollTop = this._container === window 
      ? window.scrollY 
      : this._container.scrollTop;

    let activeSection = null;

    this._sections.forEach(section => {
      const top = section.offsetTop - this.options.offset;
      const bottom = top + section.offsetHeight;

      if (scrollTop >= top && scrollTop < bottom) {
        activeSection = section;
      }
    });

    if (activeSection) {
      const id = activeSection.id || activeSection.dataset.spySection;
      if (id !== this._activeId) {
        this._activeId = id;
        this._updateNav(id);
        
        if (this.options.onChange) {
          this.options.onChange(id, activeSection);
        }
      }
    }
  }

  /**
   * 네비게이션 업데이트
   * @private
   * @param {string} activeId
   */
  _updateNav(activeId) {
    this._navItems.forEach(item => {
      const href = item.getAttribute('href');
      const target = item.dataset.spyNav;
      
      if (href === `#${activeId}` || target === activeId) {
        item.classList.add('is-active');
      } else {
        item.classList.remove('is-active');
      }
    });
  }

  /**
   * 섹션으로 스크롤
   * @param {string} id - 섹션 ID
   * @param {boolean} [smooth=true] - 부드러운 스크롤
   */
  scrollTo(id, smooth = true) {
    const section = document.getElementById(id) || 
                    document.querySelector(`[data-spy-section="${id}"]`);
    
    if (section) {
      const top = section.offsetTop - this.options.offset;
      
      if (this._container === window) {
        window.scrollTo({ top, behavior: smooth ? 'smooth' : 'auto' });
      } else {
        this._container.scrollTo({ top, behavior: smooth ? 'smooth' : 'auto' });
      }
    }
  }

  /**
   * 정리
   */
  destroy() {
    if (this._scrollHandler) {
      if (this._container === window) {
        window.removeEventListener('scroll', this._scrollHandler);
      } else if (this._container) {
        this._container.removeEventListener('scroll', this._scrollHandler);
      }
    }
    this._container = null;
    this._scrollHandler = null;
    this._sections = null;
    this._navItems = null;
    this.options = null;
  }
}

/**
 * Collapse 클래스 - 단일 접기/펼치기
 * @class Collapse
 */
class Collapse {
  /**
   * @constructor
   * @param {Object} options
   * @param {string|HTMLElement} options.trigger - 트리거 요소
   * @param {string|HTMLElement} options.content - 콘텐츠 요소
   * @param {boolean} [options.expanded=false] - 초기 펼침 상태
   * @param {number} [options.duration=300] - 애니메이션 시간 (ms)
   * @param {Function} [options.onToggle] - 토글 콜백
   */
  constructor(options = {}) {
    this.options = {
      trigger: null,
      content: null,
      expanded: false,
      duration: 300,
      onToggle: null,
      ...options
    };

    this._trigger = typeof this.options.trigger === 'string'
      ? document.querySelector(this.options.trigger)
      : this.options.trigger;

    this._content = typeof this.options.content === 'string'
      ? document.querySelector(this.options.content)
      : this.options.content;

    this._expanded = this.options.expanded;
    this._clickHandler = null;
    this._isAnimating = false;

    if (this._trigger && this._content) {
      this._init();
      this._bindEvents();
    }
  }

  /**
   * 초기화
   * @private
   */
  _init() {
    this._content.classList.add('catui-collapse-content');
    this._trigger.classList.add('catui-collapse-trigger');
    
    // 초기 상태 설정
    if (this._expanded) {
      this._content.style.height = 'auto';
      this._content.classList.add('is-expanded');
      this._trigger.classList.add('is-expanded');
      this._trigger.setAttribute('aria-expanded', 'true');
    } else {
      this._content.style.height = '0';
      this._content.style.overflow = 'hidden';
      this._trigger.setAttribute('aria-expanded', 'false');
    }

    this._content.style.transition = `height ${this.options.duration}ms ease`;
  }

  /**
   * 이벤트 바인딩
   * @private
   */
  _bindEvents() {
    this._clickHandler = (e) => {
      e.preventDefault();
      this.toggle();
    };
    this._trigger.addEventListener('click', this._clickHandler);
  }

  /**
   * 토글
   */
  toggle() {
    if (this._isAnimating) return;
    
    if (this._expanded) {
      this.collapse();
    } else {
      this.expand();
    }
  }

  /**
   * 펼치기
   */
  expand() {
    if (this._expanded || this._isAnimating) return;
    
    this._isAnimating = true;
    this._expanded = true;

    // 높이 계산을 위해 임시로 auto 설정
    this._content.style.height = 'auto';
    const height = this._content.scrollHeight;
    this._content.style.height = '0';
    
    // 리플로우 강제
    this._content.offsetHeight;
    
    this._content.style.overflow = 'hidden';
    this._content.style.height = `${height}px`;
    this._content.classList.add('is-expanded');
    this._trigger.classList.add('is-expanded');
    this._trigger.setAttribute('aria-expanded', 'true');

    setTimeout(() => {
      this._content.style.height = 'auto';
      this._content.style.overflow = '';
      this._isAnimating = false;
      
      if (this.options.onToggle) {
        this.options.onToggle(true, this);
      }
    }, this.options.duration);
  }

  /**
   * 접기
   */
  collapse() {
    if (!this._expanded || this._isAnimating) return;
    
    this._isAnimating = true;
    this._expanded = false;

    // 현재 높이 설정
    const height = this._content.scrollHeight;
    this._content.style.height = `${height}px`;
    this._content.style.overflow = 'hidden';
    
    // 리플로우 강제
    this._content.offsetHeight;
    
    this._content.style.height = '0';
    this._content.classList.remove('is-expanded');
    this._trigger.classList.remove('is-expanded');
    this._trigger.setAttribute('aria-expanded', 'false');

    setTimeout(() => {
      this._isAnimating = false;
      
      if (this.options.onToggle) {
        this.options.onToggle(false, this);
      }
    }, this.options.duration);
  }

  /**
   * 펼침 상태
   * @returns {boolean}
   */
  get isExpanded() {
    return this._expanded;
  }

  /**
   * 정리
   */
  destroy() {
    if (this._clickHandler && this._trigger) {
      this._trigger.removeEventListener('click', this._clickHandler);
    }
    
    if (this._content) {
      this._content.classList.remove('catui-collapse-content', 'is-expanded');
      this._content.style.height = '';
      this._content.style.overflow = '';
      this._content.style.transition = '';
    }
    
    if (this._trigger) {
      this._trigger.classList.remove('catui-collapse-trigger', 'is-expanded');
      this._trigger.removeAttribute('aria-expanded');
    }

    this._trigger = null;
    this._content = null;
    this._clickHandler = null;
    this.options = null;
  }
}

/**
 * Accordion 클래스 - 아코디언 (하나만 펼침)
 * @class Accordion
 */
class Accordion {
  /**
   * @constructor
   * @param {Object} options
   * @param {string|HTMLElement} options.container - 컨테이너 요소
   * @param {Array} [options.items] - 아이템 배열 [{title, content, expanded?, icon?}]
   * @param {boolean} [options.multiple=false] - 다중 펼침 허용
   * @param {number} [options.activeIndex=-1] - 초기 활성 인덱스 (-1: 모두 닫힘)
   * @param {number} [options.duration=300] - 애니메이션 시간 (ms)
   * @param {string} [options.iconPosition='right'] - 아이콘 위치 (left, right)
   * @param {Function} [options.onChange] - 변경 콜백
   */
  constructor(options = {}) {
    this.options = {
      container: null,
      items: [],
      multiple: false,
      activeIndex: -1,
      duration: 300,
      iconPosition: 'right',
      onChange: null,
      ...options
    };

    this._container = typeof this.options.container === 'string'
      ? document.querySelector(this.options.container)
      : this.options.container;

    this._items = [];
    this._clickHandler = null;

    if (this._container) {
      this._render();
      this._bindEvents();
    }
  }

  /**
   * 렌더링
   * @private
   */
  _render() {
    this._container.className = 'catui-accordion';
    
    if (this.options.items.length > 0) {
      // 옵션으로 전달된 아이템 렌더링
      this._container.innerHTML = this.options.items.map((item, index) => {
        const isExpanded = item.expanded || index === this.options.activeIndex;
        return this._renderItem(item, index, isExpanded);
      }).join('');
    }

    // 아이템 참조 저장
    this._items = Array.from(this._container.querySelectorAll('.catui-accordion-item'));
    
    // 초기 펼침 상태 적용
    this._items.forEach((item, index) => {
      const content = item.querySelector('.catui-accordion-content');
      const header = item.querySelector('.catui-accordion-header');
      
      if (item.classList.contains('is-expanded')) {
        content.style.height = 'auto';
        header.setAttribute('aria-expanded', 'true');
      } else {
        content.style.height = '0';
        header.setAttribute('aria-expanded', 'false');
      }
      
      content.style.transition = `height ${this.options.duration}ms ease`;
      content.style.overflow = 'hidden';
    });
  }

  /**
   * 아이템 렌더링
   * @private
   */
  _renderItem(item, index, isExpanded) {
    const iconLeft = this.options.iconPosition === 'left';
    const expandedClass = isExpanded ? ' is-expanded' : '';
    
    return `
      <div class="catui-accordion-item${expandedClass}" data-index="${index}">
        <div class="catui-accordion-header${iconLeft ? ' icon-left' : ''}">
          ${iconLeft ? '<span class="catui-accordion-icon"><span class="material-icons">expand_more</span></span>' : ''}
          <span class="catui-accordion-title">${item.title}</span>
          ${item.subtitle ? `<span class="catui-accordion-subtitle">${item.subtitle}</span>` : ''}
          ${!iconLeft ? '<span class="catui-accordion-icon"><span class="material-icons">expand_more</span></span>' : ''}
        </div>
        <div class="catui-accordion-content">
          <div class="catui-accordion-body">${item.content}</div>
        </div>
      </div>
    `;
  }

  /**
   * 이벤트 바인딩
   * @private
   */
  _bindEvents() {
    this._clickHandler = (e) => {
      const header = e.target.closest('.catui-accordion-header');
      if (!header) return;
      
      const item = header.closest('.catui-accordion-item');
      if (!item) return;
      
      const index = parseInt(item.dataset.index, 10);
      this.toggle(index);
    };
    
    this._container.addEventListener('click', this._clickHandler);
  }

  /**
   * 토글
   * @param {number} index
   */
  toggle(index) {
    const item = this._items[index];
    if (!item) return;

    const isExpanded = item.classList.contains('is-expanded');
    
    if (isExpanded) {
      this.collapse(index);
    } else {
      this.expand(index);
    }
  }

  /**
   * 펼치기
   * @param {number} index
   */
  expand(index) {
    const item = this._items[index];
    if (!item || item.classList.contains('is-expanded')) return;

    // 다중 펼침이 비활성화면 다른 것들 접기
    if (!this.options.multiple) {
      this._items.forEach((otherItem, i) => {
        if (i !== index && otherItem.classList.contains('is-expanded')) {
          this.collapse(i);
        }
      });
    }

    const content = item.querySelector('.catui-accordion-content');
    const header = item.querySelector('.catui-accordion-header');
    
    // 높이 계산
    content.style.height = 'auto';
    const height = content.scrollHeight;
    content.style.height = '0';
    
    // 리플로우 강제
    content.offsetHeight;
    
    content.style.height = `${height}px`;
    item.classList.add('is-expanded');
    header.setAttribute('aria-expanded', 'true');

    setTimeout(() => {
      content.style.height = 'auto';
    }, this.options.duration);

    if (this.options.onChange) {
      this.options.onChange(index, true, this.options.items[index]);
    }
  }

  /**
   * 접기
   * @param {number} index
   */
  collapse(index) {
    const item = this._items[index];
    if (!item || !item.classList.contains('is-expanded')) return;

    const content = item.querySelector('.catui-accordion-content');
    const header = item.querySelector('.catui-accordion-header');
    
    // 현재 높이 설정
    content.style.height = `${content.scrollHeight}px`;
    
    // 리플로우 강제
    content.offsetHeight;
    
    content.style.height = '0';
    item.classList.remove('is-expanded');
    header.setAttribute('aria-expanded', 'false');

    if (this.options.onChange) {
      this.options.onChange(index, false, this.options.items[index]);
    }
  }

  /**
   * 모두 펼치기
   */
  expandAll() {
    if (!this.options.multiple) return;
    this._items.forEach((_, index) => this.expand(index));
  }

  /**
   * 모두 접기
   */
  collapseAll() {
    this._items.forEach((_, index) => this.collapse(index));
  }

  /**
   * 아이템 추가
   * @param {Object} item - {title, content, subtitle?}
   * @param {boolean} [expanded=false]
   */
  addItem(item, expanded = false) {
    const index = this._items.length;
    this.options.items.push(item);
    
    const html = this._renderItem(item, index, expanded);
    this._container.insertAdjacentHTML('beforeend', html);
    
    const newItem = this._container.querySelector(`.catui-accordion-item[data-index="${index}"]`);
    const content = newItem.querySelector('.catui-accordion-content');
    
    if (expanded) {
      content.style.height = 'auto';
    } else {
      content.style.height = '0';
    }
    content.style.transition = `height ${this.options.duration}ms ease`;
    content.style.overflow = 'hidden';
    
    this._items.push(newItem);
  }

  /**
   * 아이템 제거
   * @param {number} index
   */
  removeItem(index) {
    const item = this._items[index];
    if (!item) return;

    item.remove();
    this._items.splice(index, 1);
    this.options.items.splice(index, 1);

    // 인덱스 재정렬
    this._items.forEach((item, i) => {
      item.dataset.index = i;
    });
  }

  /**
   * 정리
   */
  destroy() {
    if (this._clickHandler) {
      this._container.removeEventListener('click', this._clickHandler);
    }
    
    this._container = null;
    this._items = [];
    this._clickHandler = null;
    this.options = null;
  }
}

/**
 * BackButton 클래스 - 모바일 뒤로가기 처리
 * @class BackButton
 */
class BackButton {
  static _handlers = [];
  static _initialized = false;

  /**
   * 초기화
   */
  static init() {
    if (this._initialized) return;
    
    window.addEventListener('popstate', (e) => {
      if (this._handlers.length > 0) {
        e.preventDefault();
        const handler = this._handlers.pop();
        handler();
        
        // 히스토리 다시 추가
        if (this._handlers.length > 0) {
          history.pushState({ backButton: true }, '');
        }
      }
    });

    this._initialized = true;
  }

  /**
   * 핸들러 등록
   * @param {Function} handler
   * @returns {Function} 해제 함수
   */
  static register(handler) {
    this.init();
    
    if (this._handlers.length === 0) {
      history.pushState({ backButton: true }, '');
    }
    
    this._handlers.push(handler);

    return () => this.unregister(handler);
  }

  /**
   * 핸들러 해제
   * @param {Function} handler
   */
  static unregister(handler) {
    const index = this._handlers.indexOf(handler);
    if (index !== -1) {
      this._handlers.splice(index, 1);
      
      if (this._handlers.length === 0) {
        history.back();
      }
    }
  }

  /**
   * 모든 핸들러 해제
   */
  static clear() {
    this._handlers = [];
  }
}

export { TabBar, SwipeTabs, AppBar, PullToRefresh, ScrollSpy, BackButton, Collapse, Accordion };
export default { TabBar, SwipeTabs, AppBar, PullToRefresh, ScrollSpy, BackButton, Collapse, Accordion };
