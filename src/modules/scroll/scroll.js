/**
 * CATUI Mobile - Scroll Module
 * VirtualScroll, InfiniteScroll, BackToTop, ScrollProgress, StickyHeader
 * @module scroll
 */

/**
 * VirtualScroll 클래스 - 대량 데이터 가상 스크롤
 * DOM에 보이는 아이템만 렌더링하여 성능 최적화
 * @class VirtualScroll
 */
class VirtualScroll {
  constructor(options = {}) {
    this.options = {
      container: null,          // 스크롤 컨테이너
      items: [],                // 전체 아이템 데이터
      itemHeight: 50,           // 아이템 높이 (고정 또는 추정값)
      buffer: 5,                // 위아래 버퍼 아이템 수
      renderItem: null,         // 아이템 렌더링 함수 (item, index) => HTML
      onItemClick: null,
      onScroll: null,
      ...options
    };

    this._container = null;
    this._viewport = null;
    this._content = null;
    this._startIndex = 0;
    this._endIndex = 0;
    this._scrollTop = 0;
    this._handlers = {};
    this._rafId = null;

    this._init();
  }

  _init() {
    this._container = typeof this.options.container === 'string'
      ? document.querySelector(this.options.container)
      : this.options.container;

    if (!this._container) {
      console.error('[VirtualScroll] Container not found');
      return;
    }

    this._render();
    this._bindEvents();
    this._updateVisibleItems();
  }

  _render() {
    this._container.className = 'catui-virtual-scroll';
    this._container.innerHTML = `
      <div class="catui-virtual-scroll-viewport">
        <div class="catui-virtual-scroll-content"></div>
      </div>
    `;

    this._viewport = this._container.querySelector('.catui-virtual-scroll-viewport');
    this._content = this._container.querySelector('.catui-virtual-scroll-content');

    // 전체 높이 설정
    const totalHeight = this.options.items.length * this.options.itemHeight;
    this._content.style.height = `${totalHeight}px`;
  }

  _bindEvents() {
    this._handlers.scroll = () => {
      if (this._rafId) return;
      this._rafId = requestAnimationFrame(() => {
        this._scrollTop = this._viewport.scrollTop;
        this._updateVisibleItems();
        this.options.onScroll?.(this._scrollTop);
        this._rafId = null;
      });
    };
    this._viewport.addEventListener('scroll', this._handlers.scroll, { passive: true });

    // 아이템 클릭
    if (this.options.onItemClick) {
      this._handlers.click = (e) => {
        const item = e.target.closest('.catui-virtual-scroll-item');
        if (item) {
          const index = parseInt(item.dataset.index, 10);
          this.options.onItemClick(this.options.items[index], index, item);
        }
      };
      this._content.addEventListener('click', this._handlers.click);
    }
  }

  _updateVisibleItems() {
    const { items, itemHeight, buffer, renderItem } = this.options;
    const viewportHeight = this._viewport.clientHeight;

    // 보이는 범위 계산
    const startIndex = Math.max(0, Math.floor(this._scrollTop / itemHeight) - buffer);
    const endIndex = Math.min(
      items.length,
      Math.ceil((this._scrollTop + viewportHeight) / itemHeight) + buffer
    );

    // 변경 없으면 스킵
    if (startIndex === this._startIndex && endIndex === this._endIndex) return;

    this._startIndex = startIndex;
    this._endIndex = endIndex;

    // 보이는 아이템만 렌더링
    const visibleItems = items.slice(startIndex, endIndex);

    let html = '';
    visibleItems.forEach((item, i) => {
      const index = startIndex + i;
      const content = renderItem ? renderItem(item, index) : `<div>${JSON.stringify(item)}</div>`;
      html += `
        <div class="catui-virtual-scroll-item" 
             data-index="${index}" 
             style="position:absolute;top:${index * itemHeight}px;left:0;right:0;height:${itemHeight}px;">
          ${content}
        </div>
      `;
    });

    this._content.innerHTML = html;
  }

  // Public API
  scrollToIndex(index) {
    const top = index * this.options.itemHeight;
    this._viewport.scrollTo({ top, behavior: 'smooth' });
  }

  scrollToTop() {
    this._viewport.scrollTo({ top: 0, behavior: 'smooth' });
  }

  refresh() {
    const totalHeight = this.options.items.length * this.options.itemHeight;
    this._content.style.height = `${totalHeight}px`;
    this._updateVisibleItems();
  }

  setItems(items) {
    this.options.items = items;
    this.refresh();
  }

  getVisibleRange() {
    return { start: this._startIndex, end: this._endIndex };
  }

  destroy() {
    if (this._rafId) cancelAnimationFrame(this._rafId);
    this._viewport?.removeEventListener('scroll', this._handlers.scroll);
    if (this._handlers.click) {
      this._content?.removeEventListener('click', this._handlers.click);
    }
    this._container.innerHTML = '';
    this._container = null;
    this._viewport = null;
    this._content = null;
    this._handlers = null;
    this.options = null;
  }
}

/**
 * InfiniteScroll 클래스 - 무한 스크롤
 * @class InfiniteScroll
 */
class InfiniteScroll {
  constructor(options = {}) {
    this.options = {
      container: null,          // 스크롤 감지 컨테이너 (null이면 window)
      contentContainer: null,   // 콘텐츠가 추가될 컨테이너
      threshold: 200,           // 하단에서 트리거 거리 (px)
      throttle: 200,            // 스크롤 이벤트 쓰로틀 (ms)
      loadMore: null,           // 데이터 로드 함수 () => Promise<boolean>
      onLoading: null,
      onLoaded: null,
      onEnd: null,
      ...options
    };

    this._scrollContainer = null;
    this._contentContainer = null;
    this._isLoading = false;
    this._hasMore = true;
    this._handlers = {};
    this._throttleTimer = null;

    this._init();
  }

  _init() {
    this._scrollContainer = this.options.container
      ? (typeof this.options.container === 'string'
        ? document.querySelector(this.options.container)
        : this.options.container)
      : window;

    this._contentContainer = this.options.contentContainer
      ? (typeof this.options.contentContainer === 'string'
        ? document.querySelector(this.options.contentContainer)
        : this.options.contentContainer)
      : null;

    this._bindEvents();
  }

  _bindEvents() {
    this._handlers.scroll = () => {
      if (this._throttleTimer) return;

      this._throttleTimer = setTimeout(() => {
        this._throttleTimer = null;
        this._checkScroll();
      }, this.options.throttle);
    };

    this._scrollContainer.addEventListener('scroll', this._handlers.scroll, { passive: true });
  }

  _checkScroll() {
    if (this._isLoading || !this._hasMore) return;

    const { threshold } = this.options;
    let scrollTop, scrollHeight, clientHeight;

    if (this._scrollContainer === window) {
      scrollTop = window.scrollY;
      scrollHeight = document.documentElement.scrollHeight;
      clientHeight = window.innerHeight;
    } else {
      scrollTop = this._scrollContainer.scrollTop;
      scrollHeight = this._scrollContainer.scrollHeight;
      clientHeight = this._scrollContainer.clientHeight;
    }

    if (scrollHeight - scrollTop - clientHeight < threshold) {
      this._loadMore();
    }
  }

  async _loadMore() {
    if (this._isLoading || !this._hasMore) return;

    this._isLoading = true;
    this.options.onLoading?.();

    try {
      const hasMore = await this.options.loadMore?.();

      if (hasMore === false) {
        this._hasMore = false;
        this.options.onEnd?.();
      } else {
        this.options.onLoaded?.();
      }
    } catch (error) {
      console.error('[InfiniteScroll] Load failed:', error);
    } finally {
      this._isLoading = false;
    }
  }

  // Public API
  reset() {
    this._hasMore = true;
    this._isLoading = false;
  }

  setHasMore(hasMore) {
    this._hasMore = hasMore;
  }

  isLoading() {
    return this._isLoading;
  }

  destroy() {
    if (this._throttleTimer) clearTimeout(this._throttleTimer);
    this._scrollContainer?.removeEventListener('scroll', this._handlers.scroll);
    this._scrollContainer = null;
    this._contentContainer = null;
    this._handlers = null;
    this.options = null;
  }
}

/**
 * BackToTop 클래스 - 맨 위로 버튼
 * @class BackToTop
 */
class BackToTop {
  constructor(options = {}) {
    this.options = {
      container: null,          // 스크롤 감지 컨테이너 (null이면 window)
      threshold: 300,           // 버튼 표시 스크롤 위치
      position: 'right',        // left, right, center
      offset: { bottom: 100, side: 16 }, // 위치 오프셋 (하단 네비 고려)
      icon: 'keyboard_arrow_up',
      smooth: true,
      showProgress: false,      // 스크롤 진행률 표시
      onClick: null,
      ...options
    };

    this._scrollContainer = null;
    this._button = null;
    this._isVisible = false;
    this._handlers = {};
    this._rafId = null;

    this._init();
  }

  _init() {
    this._scrollContainer = this.options.container
      ? (typeof this.options.container === 'string'
        ? document.querySelector(this.options.container)
        : this.options.container)
      : window;

    this._render();
    this._bindEvents();
  }

  _render() {
    this._button = document.createElement('button');
    this._button.className = `catui-back-to-top catui-back-to-top--${this.options.position}`;
    this._button.setAttribute('aria-label', 'Back to top');

    const { bottom, side } = this.options.offset;
    this._button.style.cssText = `
      position: fixed;
      bottom: ${bottom}px;
      ${this.options.position === 'left' ? `left: ${side}px;` : ''}
      ${this.options.position === 'right' ? `right: ${side}px;` : ''}
      ${this.options.position === 'center' ? 'left: 50%; transform: translateX(-50%);' : ''}
      z-index: 1000;
      opacity: 0;
      visibility: hidden;
      transition: opacity 0.3s, visibility 0.3s, transform 0.3s;
    `;

    if (this.options.showProgress) {
      this._button.innerHTML = `
        <svg class="catui-back-to-top-progress" viewBox="0 0 36 36">
          <circle class="catui-back-to-top-progress-bg" cx="18" cy="18" r="16"/>
          <circle class="catui-back-to-top-progress-bar" cx="18" cy="18" r="16"/>
        </svg>
        <span class="material-icons">${this.options.icon}</span>
      `;
    } else {
      this._button.innerHTML = `<span class="material-icons">${this.options.icon}</span>`;
    }

    document.body.appendChild(this._button);
  }

  _bindEvents() {
    // 스크롤 이벤트
    this._handlers.scroll = () => {
      if (this._rafId) return;
      this._rafId = requestAnimationFrame(() => {
        this._updateVisibility();
        this._rafId = null;
      });
    };
    this._scrollContainer.addEventListener('scroll', this._handlers.scroll, { passive: true });

    // 클릭 이벤트
    this._handlers.click = () => {
      this.scrollToTop();
      this.options.onClick?.();
    };
    this._button.addEventListener('click', this._handlers.click);

    // 초기 상태 체크
    this._updateVisibility();
  }

  _updateVisibility() {
    const scrollTop = this._scrollContainer === window
      ? window.scrollY
      : this._scrollContainer.scrollTop;

    const shouldShow = scrollTop > this.options.threshold;

    if (shouldShow !== this._isVisible) {
      this._isVisible = shouldShow;
      this._button.style.opacity = shouldShow ? '1' : '0';
      this._button.style.visibility = shouldShow ? 'visible' : 'hidden';
      if (this.options.position !== 'center') {
        this._button.style.transform = shouldShow ? 'translateY(0)' : 'translateY(20px)';
      }
    }

    // 진행률 업데이트
    if (this.options.showProgress && shouldShow) {
      const scrollHeight = this._scrollContainer === window
        ? document.documentElement.scrollHeight - window.innerHeight
        : this._scrollContainer.scrollHeight - this._scrollContainer.clientHeight;

      const progress = Math.min(scrollTop / scrollHeight, 1);
      const circle = this._button.querySelector('.catui-back-to-top-progress-bar');
      if (circle) {
        const circumference = 2 * Math.PI * 16;
        circle.style.strokeDasharray = circumference;
        circle.style.strokeDashoffset = circumference * (1 - progress);
      }
    }
  }

  // Public API
  scrollToTop() {
    if (this._scrollContainer === window) {
      window.scrollTo({ top: 0, behavior: this.options.smooth ? 'smooth' : 'auto' });
    } else {
      this._scrollContainer.scrollTo({ top: 0, behavior: this.options.smooth ? 'smooth' : 'auto' });
    }
  }

  show() {
    this._button.style.opacity = '1';
    this._button.style.visibility = 'visible';
    this._isVisible = true;
  }

  hide() {
    this._button.style.opacity = '0';
    this._button.style.visibility = 'hidden';
    this._isVisible = false;
  }

  destroy() {
    if (this._rafId) cancelAnimationFrame(this._rafId);
    this._scrollContainer?.removeEventListener('scroll', this._handlers.scroll);
    this._button?.removeEventListener('click', this._handlers.click);
    this._button?.remove();
    this._button = null;
    this._scrollContainer = null;
    this._handlers = null;
    this.options = null;
  }
}

/**
 * ScrollProgress 클래스 - 스크롤 진행률 표시
 * @class ScrollProgress
 */
class ScrollProgress {
  constructor(options = {}) {
    this.options = {
      container: null,          // 스크롤 감지 컨테이너 (null이면 window)
      position: 'top',          // top, bottom
      height: 3,
      color: null,              // null이면 primary 색상
      zIndex: 1000,
      onChange: null,
      ...options
    };

    this._scrollContainer = null;
    this._bar = null;
    this._progress = 0;
    this._handlers = {};
    this._rafId = null;

    this._init();
  }

  _init() {
    this._scrollContainer = this.options.container
      ? (typeof this.options.container === 'string'
        ? document.querySelector(this.options.container)
        : this.options.container)
      : window;

    this._render();
    this._bindEvents();
  }

  _render() {
    this._bar = document.createElement('div');
    this._bar.className = 'catui-scroll-progress';
    this._bar.style.cssText = `
      position: fixed;
      ${this.options.position === 'top' ? 'top: 0;' : 'bottom: 0;'}
      left: 0;
      width: 0%;
      height: ${this.options.height}px;
      background: ${this.options.color || 'var(--primary, #3B82F6)'};
      z-index: ${this.options.zIndex};
      transition: width 0.1s linear;
    `;

    document.body.appendChild(this._bar);
  }

  _bindEvents() {
    this._handlers.scroll = () => {
      if (this._rafId) return;
      this._rafId = requestAnimationFrame(() => {
        this._updateProgress();
        this._rafId = null;
      });
    };

    this._scrollContainer.addEventListener('scroll', this._handlers.scroll, { passive: true });

    // 초기 상태
    this._updateProgress();
  }

  _updateProgress() {
    let scrollTop, scrollHeight, clientHeight;

    if (this._scrollContainer === window) {
      scrollTop = window.scrollY;
      scrollHeight = document.documentElement.scrollHeight;
      clientHeight = window.innerHeight;
    } else {
      scrollTop = this._scrollContainer.scrollTop;
      scrollHeight = this._scrollContainer.scrollHeight;
      clientHeight = this._scrollContainer.clientHeight;
    }

    const maxScroll = scrollHeight - clientHeight;
    this._progress = maxScroll > 0 ? (scrollTop / maxScroll) * 100 : 0;
    this._bar.style.width = `${this._progress}%`;

    this.options.onChange?.(this._progress);
  }

  // Public API
  getProgress() {
    return this._progress;
  }

  setColor(color) {
    this._bar.style.background = color;
  }

  destroy() {
    if (this._rafId) cancelAnimationFrame(this._rafId);
    this._scrollContainer?.removeEventListener('scroll', this._handlers.scroll);
    this._bar?.remove();
    this._bar = null;
    this._scrollContainer = null;
    this._handlers = null;
    this.options = null;
  }
}

/**
 * StickyHeader 클래스 - 스크롤 시 헤더 고정/숨김
 * @class StickyHeader
 */
class StickyHeader {
  constructor(options = {}) {
    this.options = {
      header: null,             // 헤더 요소
      container: null,          // 스크롤 컨테이너 (null이면 window)
      hideOnScroll: true,       // 스크롤 다운 시 숨김
      showOnScrollUp: true,     // 스크롤 업 시 표시
      threshold: 50,            // 숨김 시작 스크롤 위치
      delta: 10,                // 방향 전환 감지 최소 거리
      onShow: null,
      onHide: null,
      ...options
    };

    this._header = null;
    this._scrollContainer = null;
    this._lastScrollTop = 0;
    this._isHidden = false;
    this._headerHeight = 0;
    this._handlers = {};
    this._rafId = null;

    this._init();
  }

  _init() {
    this._header = typeof this.options.header === 'string'
      ? document.querySelector(this.options.header)
      : this.options.header;

    if (!this._header) {
      console.error('[StickyHeader] Header not found');
      return;
    }

    this._scrollContainer = this.options.container
      ? (typeof this.options.container === 'string'
        ? document.querySelector(this.options.container)
        : this.options.container)
      : window;

    this._headerHeight = this._header.offsetHeight;
    this._setupStyles();
    this._bindEvents();
  }

  _setupStyles() {
    // 헤더 스타일 설정
    this._header.style.position = 'fixed';
    this._header.style.top = '0';
    this._header.style.left = '0';
    this._header.style.right = '0';
    this._header.style.zIndex = '100';
    this._header.style.transition = 'transform 0.3s ease';
  }

  _bindEvents() {
    this._handlers.scroll = () => {
      if (this._rafId) return;
      this._rafId = requestAnimationFrame(() => {
        this._handleScroll();
        this._rafId = null;
      });
    };

    this._scrollContainer.addEventListener('scroll', this._handlers.scroll, { passive: true });
  }

  _handleScroll() {
    const scrollTop = this._scrollContainer === window
      ? window.scrollY
      : this._scrollContainer.scrollTop;

    const delta = scrollTop - this._lastScrollTop;

    // 최소 이동 거리 체크
    if (Math.abs(delta) < this.options.delta) return;

    // 상단 근처면 항상 표시
    if (scrollTop < this.options.threshold) {
      this._show();
    } else if (delta > 0 && this.options.hideOnScroll) {
      // 스크롤 다운 - 숨김
      this._hide();
    } else if (delta < 0 && this.options.showOnScrollUp) {
      // 스크롤 업 - 표시
      this._show();
    }

    this._lastScrollTop = scrollTop;
  }

  _show() {
    if (!this._isHidden) return;
    this._isHidden = false;
    this._header.style.transform = 'translateY(0)';
    this.options.onShow?.();
  }

  _hide() {
    if (this._isHidden) return;
    this._isHidden = true;
    this._header.style.transform = 'translateY(-100%)';
    this.options.onHide?.();
  }

  // Public API
  show() {
    this._show();
  }

  hide() {
    this._hide();
  }

  isHidden() {
    return this._isHidden;
  }

  destroy() {
    if (this._rafId) cancelAnimationFrame(this._rafId);
    this._scrollContainer?.removeEventListener('scroll', this._handlers.scroll);

    // 스타일 복원
    if (this._header) {
      this._header.style.position = '';
      this._header.style.top = '';
      this._header.style.left = '';
      this._header.style.right = '';
      this._header.style.zIndex = '';
      this._header.style.transition = '';
      this._header.style.transform = '';
    }

    this._header = null;
    this._scrollContainer = null;
    this._handlers = null;
    this.options = null;
  }
}

/**
 * ParallaxScroll 클래스 - 패럴랙스 스크롤 효과
 * @class ParallaxScroll
 */
class ParallaxScroll {
  constructor(options = {}) {
    this.options = {
      elements: [],             // [{ selector, speed, direction }]
      container: null,          // 스크롤 컨테이너
      ...options
    };

    this._scrollContainer = null;
    this._elements = [];
    this._handlers = {};
    this._rafId = null;

    this._init();
  }

  _init() {
    this._scrollContainer = this.options.container
      ? (typeof this.options.container === 'string'
        ? document.querySelector(this.options.container)
        : this.options.container)
      : window;

    // 요소 수집
    this.options.elements.forEach(config => {
      const els = document.querySelectorAll(config.selector);
      els.forEach(el => {
        this._elements.push({
          element: el,
          speed: config.speed || 0.5,
          direction: config.direction || 'vertical' // vertical, horizontal
        });
      });
    });

    this._bindEvents();
  }

  _bindEvents() {
    this._handlers.scroll = () => {
      if (this._rafId) return;
      this._rafId = requestAnimationFrame(() => {
        this._updateParallax();
        this._rafId = null;
      });
    };

    this._scrollContainer.addEventListener('scroll', this._handlers.scroll, { passive: true });

    // 초기 상태
    this._updateParallax();
  }

  _updateParallax() {
    const scrollTop = this._scrollContainer === window
      ? window.scrollY
      : this._scrollContainer.scrollTop;

    this._elements.forEach(({ element, speed, direction }) => {
      const rect = element.getBoundingClientRect();
      const viewportHeight = window.innerHeight;

      // 뷰포트에 보이는 경우에만 업데이트
      if (rect.bottom > 0 && rect.top < viewportHeight) {
        const offset = scrollTop * speed;

        if (direction === 'vertical') {
          element.style.transform = `translateY(${offset}px)`;
        } else {
          element.style.transform = `translateX(${offset}px)`;
        }
      }
    });
  }

  destroy() {
    if (this._rafId) cancelAnimationFrame(this._rafId);
    this._scrollContainer?.removeEventListener('scroll', this._handlers.scroll);

    // 스타일 복원
    this._elements.forEach(({ element }) => {
      element.style.transform = '';
    });

    this._elements = null;
    this._scrollContainer = null;
    this._handlers = null;
    this.options = null;
  }
}

export { VirtualScroll, InfiniteScroll, BackToTop, ScrollProgress, StickyHeader, ParallaxScroll };
export default { VirtualScroll, InfiniteScroll, BackToTop, ScrollProgress, StickyHeader, ParallaxScroll };
