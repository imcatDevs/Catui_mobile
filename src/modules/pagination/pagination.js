/**
 * CATUI Mobile - Pagination Module
 * 범용 페이지네이션 컴포넌트
 * @module pagination
 */

/**
 * Pagination 클래스 - 범용 페이지네이션
 * 이미지 리스트, 데이터 리스트, 테이블 등에서 사용 가능
 * @class Pagination
 */
class Pagination {
  constructor(options = {}) {
    this.options = {
      container: null,          // 페이지네이션을 렌더링할 컨테이너
      totalItems: 0,            // 전체 아이템 수
      itemsPerPage: 10,         // 페이지당 아이템 수
      currentPage: 1,           // 현재 페이지
      maxVisiblePages: 3,       // 표시할 최대 페이지 수 (모바일 최적화)
      style: 'default',         // default, simple, dots, minimal, loadmore
      showFirstLast: true,      // 처음/마지막 버튼 표시
      showPrevNext: true,       // 이전/다음 버튼 표시
      showInfo: false,          // 페이지 정보 표시 (1-10 of 100)
      showPerPageSelector: false, // 페이지당 개수 선택기
      perPageOptions: [10, 20, 50, 100],
      infinite: false,          // 무한 스크롤 모드
      infiniteThreshold: 200,   // 무한 스크롤 트리거 거리 (px)
      scrollContainer: null,    // 무한 스크롤 감지 컨테이너
      loadMoreText: '더 보기',
      loadingText: '로딩 중...',
      prevText: '',
      nextText: '',
      firstText: '',
      lastText: '',
      onChange: null,           // 페이지 변경 콜백 (page, itemsPerPage) => {}
      onLoadMore: null,         // 더 보기/무한 스크롤 콜백 (page) => Promise
      ...options
    };

    this._container = null;
    this._element = null;
    this._isLoading = false;
    this._hasMore = true;
    this._handlers = {};
    this._scrollContainer = null;
    this._throttleTimer = null;

    this._init();
  }

  _init() {
    this._container = typeof this.options.container === 'string'
      ? document.querySelector(this.options.container)
      : this.options.container;

    if (!this._container) {
      console.error('[Pagination] Container not found');
      return;
    }

    this._render();
    this._bindEvents();

    // 무한 스크롤 모드
    if (this.options.infinite) {
      this._initInfiniteScroll();
    }
  }

  _render() {
    const { style } = this.options;

    this._element = document.createElement('div');
    this._element.className = `catui-pagination catui-pagination--${style}`;

    this._updatePagination();
    this._container.appendChild(this._element);
  }

  _updatePagination() {
    const { style, totalItems, itemsPerPage, currentPage, showInfo, showPerPageSelector } = this.options;
    const totalPages = this.getTotalPages();

    let html = '';

    // 페이지 정보
    if (showInfo) {
      const start = (currentPage - 1) * itemsPerPage + 1;
      const end = Math.min(currentPage * itemsPerPage, totalItems);
      html += `<div class="catui-pagination-info">${start}-${end} / ${totalItems}</div>`;
    }

    // 스타일별 렌더링
    switch (style) {
      case 'simple':
        html += this._renderSimple(totalPages);
        break;
      case 'dots':
        html += this._renderDots(totalPages);
        break;
      case 'minimal':
        html += this._renderMinimal(totalPages);
        break;
      case 'loadmore':
        html += this._renderLoadMore();
        break;
      default:
        html += this._renderDefault(totalPages);
    }

    // 페이지당 개수 선택기
    if (showPerPageSelector && style !== 'loadmore') {
      html += this._renderPerPageSelector();
    }

    this._element.innerHTML = html;
  }

  _renderDefault(totalPages) {
    const { currentPage, maxVisiblePages, showFirstLast, showPrevNext, firstText, lastText, prevText, nextText } = this.options;
    let html = '<div class="catui-pagination-nav">';

    // 처음
    if (showFirstLast) {
      html += `<button class="catui-pagination-btn catui-pagination-first" ${currentPage === 1 ? 'disabled' : ''} data-page="1">
        ${firstText || '<span class="material-icons">first_page</span>'}
      </button>`;
    }

    // 이전
    if (showPrevNext) {
      html += `<button class="catui-pagination-btn catui-pagination-prev" ${currentPage === 1 ? 'disabled' : ''} data-page="${currentPage - 1}">
        ${prevText || '<span class="material-icons">chevron_left</span>'}
      </button>`;
    }

    // 페이지 번호
    const pages = this._getVisiblePages(totalPages);
    pages.forEach(page => {
      if (page === '...') {
        html += '<span class="catui-pagination-ellipsis">...</span>';
      } else {
        html += `<button class="catui-pagination-btn catui-pagination-page ${page === currentPage ? 'is-active' : ''}" data-page="${page}">${page}</button>`;
      }
    });

    // 다음
    if (showPrevNext) {
      html += `<button class="catui-pagination-btn catui-pagination-next" ${currentPage === totalPages ? 'disabled' : ''} data-page="${currentPage + 1}">
        ${nextText || '<span class="material-icons">chevron_right</span>'}
      </button>`;
    }

    // 마지막
    if (showFirstLast) {
      html += `<button class="catui-pagination-btn catui-pagination-last" ${currentPage === totalPages ? 'disabled' : ''} data-page="${totalPages}">
        ${lastText || '<span class="material-icons">last_page</span>'}
      </button>`;
    }

    html += '</div>';
    return html;
  }

  _renderSimple(totalPages) {
    const { currentPage, prevText, nextText } = this.options;
    return `
      <div class="catui-pagination-nav catui-pagination-nav--simple">
        <button class="catui-pagination-btn catui-pagination-prev" ${currentPage === 1 ? 'disabled' : ''} data-page="${currentPage - 1}">
          ${prevText || '<span class="material-icons">chevron_left</span>'}
        </button>
        <span class="catui-pagination-current">${currentPage} / ${totalPages}</span>
        <button class="catui-pagination-btn catui-pagination-next" ${currentPage === totalPages ? 'disabled' : ''} data-page="${currentPage + 1}">
          ${nextText || '<span class="material-icons">chevron_right</span>'}
        </button>
      </div>
    `;
  }

  _renderDots(totalPages) {
    const { currentPage } = this.options;
    let html = '<div class="catui-pagination-dots">';
    for (let i = 1; i <= totalPages; i++) {
      html += `<button class="catui-pagination-dot ${i === currentPage ? 'is-active' : ''}" data-page="${i}" aria-label="Page ${i}"></button>`;
    }
    html += '</div>';
    return html;
  }

  _renderMinimal(totalPages) {
    const { currentPage } = this.options;
    return `
      <div class="catui-pagination-minimal">
        <span class="catui-pagination-current">${currentPage}</span>
        <span class="catui-pagination-separator">/</span>
        <span class="catui-pagination-total">${totalPages}</span>
      </div>
    `;
  }

  _renderLoadMore() {
    const { loadMoreText, loadingText } = this.options;
    if (!this._hasMore) {
      return '<div class="catui-pagination-end">모든 항목을 불러왔습니다</div>';
    }
    return `
      <button class="catui-pagination-loadmore ${this._isLoading ? 'is-loading' : ''}" ${this._isLoading ? 'disabled' : ''}>
        ${this._isLoading ? `<span class="catui-pagination-spinner"></span> ${loadingText}` : loadMoreText}
      </button>
    `;
  }

  _renderPerPageSelector() {
    const { itemsPerPage, perPageOptions } = this.options;
    let html = '<div class="catui-pagination-perpage">';
    html += '<span>표시:</span>';
    html += '<select class="catui-pagination-select">';
    perPageOptions.forEach(option => {
      html += `<option value="${option}" ${option === itemsPerPage ? 'selected' : ''}>${option}개</option>`;
    });
    html += '</select>';
    html += '</div>';
    return html;
  }

  _getVisiblePages(totalPages) {
    const { currentPage, maxVisiblePages } = this.options;
    const pages = [];

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      const half = Math.floor(maxVisiblePages / 2);
      let start = currentPage - half;
      let end = currentPage + half;

      if (start < 1) {
        start = 1;
        end = maxVisiblePages;
      }
      if (end > totalPages) {
        end = totalPages;
        start = totalPages - maxVisiblePages + 1;
      }

      if (start > 1) {
        pages.push(1);
        if (start > 2) pages.push('...');
      }

      for (let i = start; i <= end; i++) {
        if (i > 1 && i < totalPages) {
          pages.push(i);
        }
      }

      if (end < totalPages) {
        if (end < totalPages - 1) pages.push('...');
        pages.push(totalPages);
      }
    }

    return pages;
  }

  _bindEvents() {
    // 페이지 버튼 클릭
    this._handlers.click = (e) => {
      const btn = e.target.closest('[data-page]');
      if (btn && !btn.disabled) {
        const page = parseInt(btn.dataset.page, 10);
        this.goToPage(page);
      }

      // 더 보기 버튼
      const loadMore = e.target.closest('.catui-pagination-loadmore');
      if (loadMore && !this._isLoading) {
        this._loadMore();
      }
    };
    this._element.addEventListener('click', this._handlers.click);

    // 페이지당 개수 변경
    this._handlers.change = (e) => {
      if (e.target.classList.contains('catui-pagination-select')) {
        const newItemsPerPage = parseInt(e.target.value, 10);
        this.setItemsPerPage(newItemsPerPage);
      }
    };
    this._element.addEventListener('change', this._handlers.change);
  }

  _initInfiniteScroll() {
    this._scrollContainer = this.options.scrollContainer
      ? (typeof this.options.scrollContainer === 'string'
        ? document.querySelector(this.options.scrollContainer)
        : this.options.scrollContainer)
      : window;

    this._handlers.scroll = this._throttle(() => {
      if (this._isLoading || !this._hasMore) return;

      const { infiniteThreshold } = this.options;
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

      if (scrollHeight - scrollTop - clientHeight < infiniteThreshold) {
        this._loadMore();
      }
    }, 100);

    this._scrollContainer.addEventListener('scroll', this._handlers.scroll, { passive: true });
  }

  async _loadMore() {
    if (this._isLoading || !this._hasMore) return;

    this._isLoading = true;
    this._updatePagination();

    try {
      const nextPage = this.options.currentPage + 1;
      const result = await this.options.onLoadMore?.(nextPage);
      
      // result가 false면 더 이상 데이터 없음
      if (result === false) {
        this._hasMore = false;
      } else {
        this.options.currentPage = nextPage;
      }
    } catch (error) {
      console.error('[Pagination] Load more failed:', error);
    } finally {
      this._isLoading = false;
      this._updatePagination();
    }
  }

  _throttle(func, limit) {
    let inThrottle;
    const self = this;
    return function(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        self._throttleTimer = setTimeout(() => {
          inThrottle = false;
          self._throttleTimer = null;
        }, limit);
      }
    };
  }

  // ========================================
  // Public API
  // ========================================

  /**
   * 특정 페이지로 이동
   * @param {number} page - 페이지 번호
   */
  goToPage(page) {
    const totalPages = this.getTotalPages();
    if (page < 1 || page > totalPages || page === this.options.currentPage) return;

    this.options.currentPage = page;
    this._updatePagination();
    this.options.onChange?.(page, this.options.itemsPerPage);
  }

  /**
   * 다음 페이지로 이동
   */
  next() {
    this.goToPage(this.options.currentPage + 1);
  }

  /**
   * 이전 페이지로 이동
   */
  prev() {
    this.goToPage(this.options.currentPage - 1);
  }

  /**
   * 첫 페이지로 이동
   */
  first() {
    this.goToPage(1);
  }

  /**
   * 마지막 페이지로 이동
   */
  last() {
    this.goToPage(this.getTotalPages());
  }

  /**
   * 전체 페이지 수 반환
   * @returns {number}
   */
  getTotalPages() {
    return Math.ceil(this.options.totalItems / this.options.itemsPerPage) || 1;
  }

  /**
   * 현재 페이지 반환
   * @returns {number}
   */
  getCurrentPage() {
    return this.options.currentPage;
  }

  /**
   * 현재 페이지의 아이템 범위 반환
   * @returns {{ start: number, end: number }}
   */
  getPageRange() {
    const { currentPage, itemsPerPage, totalItems } = this.options;
    const start = (currentPage - 1) * itemsPerPage;
    const end = Math.min(start + itemsPerPage, totalItems);
    return { start, end };
  }

  /**
   * 전체 아이템 수 설정
   * @param {number} total - 전체 아이템 수
   */
  setTotalItems(total) {
    this.options.totalItems = total;
    // 현재 페이지가 전체 페이지를 초과하면 조정
    const totalPages = this.getTotalPages();
    if (this.options.currentPage > totalPages) {
      this.options.currentPage = totalPages;
    }
    this._updatePagination();
  }

  /**
   * 페이지당 아이템 수 설정
   * @param {number} itemsPerPage - 페이지당 아이템 수
   */
  setItemsPerPage(itemsPerPage) {
    // 현재 첫 번째 아이템의 인덱스 유지
    const firstItemIndex = (this.options.currentPage - 1) * this.options.itemsPerPage;
    this.options.itemsPerPage = itemsPerPage;
    // 새 페이지 계산
    this.options.currentPage = Math.floor(firstItemIndex / itemsPerPage) + 1;
    this._updatePagination();
    this.options.onChange?.(this.options.currentPage, itemsPerPage);
  }

  /**
   * 더 많은 데이터가 있는지 설정 (loadmore/infinite 모드)
   * @param {boolean} hasMore
   */
  setHasMore(hasMore) {
    this._hasMore = hasMore;
    this._updatePagination();
  }

  /**
   * 페이지네이션 새로고침
   */
  refresh() {
    this._updatePagination();
  }

  /**
   * 리소스 정리
   */
  destroy() {
    // Throttle timer 정리
    if (this._throttleTimer) {
      clearTimeout(this._throttleTimer);
      this._throttleTimer = null;
    }

    // 이벤트 리스너 제거
    if (this._element) {
      this._element.removeEventListener('click', this._handlers.click);
      this._element.removeEventListener('change', this._handlers.change);
    }

    // 무한 스크롤 이벤트 제거
    if (this._scrollContainer && this._handlers.scroll) {
      this._scrollContainer.removeEventListener('scroll', this._handlers.scroll);
    }

    // DOM 제거
    this._element?.remove();

    // 참조 정리
    this._element = null;
    this._container = null;
    this._scrollContainer = null;
    this._handlers = null;
    this.options = null;
  }
}

/**
 * DataList 클래스 - 페이지네이션이 포함된 데이터 리스트
 * @class DataList
 */
class DataList {
  constructor(options = {}) {
    this.options = {
      container: null,
      data: [],                    // 전체 데이터 또는 현재 페이지 데이터
      itemsPerPage: 10,
      currentPage: 1,
      fetchData: null,             // 서버에서 데이터 가져오기 (page, itemsPerPage) => Promise<{items, total}>
      renderItem: null,            // 아이템 렌더링 함수 (item, index) => HTML
      emptyText: '데이터가 없습니다',
      loadingText: '로딩 중...',
      paginationStyle: 'default',  // default, simple, dots, loadmore
      paginationPosition: 'bottom', // top, bottom, both
      showInfo: true,
      layout: 'list',              // list, grid, table
      gridColumns: 2,
      onItemClick: null,
      ...options
    };

    this._container = null;
    this._listElement = null;
    this._pagination = null;
    this._isLoading = false;
    this._totalItems = this.options.data.length;
    this._handlers = {};

    this._init();
  }

  _init() {
    this._container = typeof this.options.container === 'string'
      ? document.querySelector(this.options.container)
      : this.options.container;

    if (!this._container) {
      console.error('[DataList] Container not found');
      return;
    }

    this._render();
    this._loadData();
  }

  _render() {
    this._container.className = 'catui-datalist';
    this._container.innerHTML = `
      ${this.options.paginationPosition !== 'bottom' ? '<div class="catui-datalist-pagination-top"></div>' : ''}
      <div class="catui-datalist-content"></div>
      ${this.options.paginationPosition !== 'top' ? '<div class="catui-datalist-pagination-bottom"></div>' : ''}
    `;

    this._listElement = this._container.querySelector('.catui-datalist-content');
    
    // 레이아웃 클래스
    this._listElement.classList.add(`catui-datalist-${this.options.layout}`);
    if (this.options.layout === 'grid') {
      this._listElement.style.setProperty('--grid-columns', this.options.gridColumns);
    }

    // 페이지네이션 초기화
    const paginationContainer = this._container.querySelector(
      this.options.paginationPosition === 'top' 
        ? '.catui-datalist-pagination-top' 
        : '.catui-datalist-pagination-bottom'
    );

    if (paginationContainer) {
      this._pagination = new Pagination({
        container: paginationContainer,
        totalItems: this._totalItems,
        itemsPerPage: this.options.itemsPerPage,
        currentPage: this.options.currentPage,
        style: this.options.paginationStyle,
        showInfo: this.options.showInfo,
        onChange: (page, itemsPerPage) => this._onPageChange(page, itemsPerPage),
        onLoadMore: this.options.paginationStyle === 'loadmore' 
          ? (page) => this._onLoadMore(page) 
          : null
      });
    }

    this._bindEvents();
  }

  _bindEvents() {
    // 아이템 클릭
    if (this.options.onItemClick) {
      this._handlers.click = (e) => {
        const item = e.target.closest('.catui-datalist-item');
        if (item) {
          const index = parseInt(item.dataset.index, 10);
          const data = this._getCurrentPageData()[index];
          this.options.onItemClick(data, index, item);
        }
      };
      this._listElement.addEventListener('click', this._handlers.click);
    }
  }

  async _loadData() {
    this._showLoading();

    try {
      if (this.options.fetchData) {
        // 서버에서 데이터 가져오기
        const result = await this.options.fetchData(
          this.options.currentPage,
          this.options.itemsPerPage
        );
        this.options.data = result.items || [];
        this._totalItems = result.total || 0;
        this._pagination?.setTotalItems(this._totalItems);
      }
      
      this._renderItems();
    } catch (error) {
      console.error('[DataList] Load failed:', error);
      this._showError();
    }
  }

  _getCurrentPageData() {
    // 서버 페이지네이션이면 data가 이미 현재 페이지 데이터
    if (this.options.fetchData) {
      return this.options.data;
    }
    
    // 클라이언트 페이지네이션
    const { currentPage, itemsPerPage } = this.options;
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return this.options.data.slice(start, end);
  }

  _renderItems() {
    const items = this._getCurrentPageData();
    
    if (items.length === 0) {
      this._listElement.innerHTML = `<div class="catui-datalist-empty">${this.options.emptyText}</div>`;
      return;
    }

    const html = items.map((item, index) => {
      const content = this.options.renderItem 
        ? this.options.renderItem(item, index)
        : `<div>${JSON.stringify(item)}</div>`;
      return `<div class="catui-datalist-item" data-index="${index}">${content}</div>`;
    }).join('');

    this._listElement.innerHTML = html;
  }

  _showLoading() {
    this._isLoading = true;
    this._listElement.innerHTML = `<div class="catui-datalist-loading">${this.options.loadingText}</div>`;
  }

  _showError() {
    this._listElement.innerHTML = `<div class="catui-datalist-error">데이터를 불러오는데 실패했습니다</div>`;
  }

  async _onPageChange(page, itemsPerPage) {
    this.options.currentPage = page;
    this.options.itemsPerPage = itemsPerPage;
    await this._loadData();
  }

  async _onLoadMore(page) {
    if (this.options.fetchData) {
      try {
        const result = await this.options.fetchData(page, this.options.itemsPerPage);
        if (!result.items || result.items.length === 0) {
          return false; // 더 이상 데이터 없음
        }
        // 기존 데이터에 추가
        this.options.data = [...this.options.data, ...result.items];
        this._appendItems(result.items, this.options.data.length - result.items.length);
        return true;
      } catch (error) {
        console.error('[DataList] Load more failed:', error);
        return false;
      }
    }
    return false;
  }

  _appendItems(items, startIndex) {
    const html = items.map((item, i) => {
      const content = this.options.renderItem 
        ? this.options.renderItem(item, startIndex + i)
        : `<div>${JSON.stringify(item)}</div>`;
      return `<div class="catui-datalist-item" data-index="${startIndex + i}">${content}</div>`;
    }).join('');

    // 빈 메시지 제거
    this._listElement.querySelector('.catui-datalist-empty')?.remove();
    this._listElement.insertAdjacentHTML('beforeend', html);
  }

  // ========================================
  // Public API
  // ========================================

  /**
   * 데이터 새로고침
   */
  async refresh() {
    await this._loadData();
  }

  /**
   * 데이터 설정
   * @param {Array} data - 새 데이터
   */
  setData(data) {
    this.options.data = data;
    this._totalItems = data.length;
    this.options.currentPage = 1;
    this._pagination?.setTotalItems(this._totalItems);
    this._pagination?.goToPage(1);
    this._renderItems();
  }

  /**
   * 페이지네이션 인스턴스 반환
   * @returns {Pagination}
   */
  getPagination() {
    return this._pagination;
  }

  /**
   * 리소스 정리
   */
  destroy() {
    if (this._handlers.click) {
      this._listElement?.removeEventListener('click', this._handlers.click);
    }
    this._pagination?.destroy();
    this._container.innerHTML = '';
    this._container = null;
    this._listElement = null;
    this._pagination = null;
    this._handlers = null;
    this.options = null;
  }
}

/**
 * ImageGallery 클래스 - 페이지네이션이 포함된 이미지 갤러리
 * @class ImageGallery
 */
class ImageGallery extends DataList {
  constructor(options = {}) {
    super({
      layout: 'grid',
      gridColumns: 3,
      paginationStyle: 'loadmore',
      renderItem: (item) => `
        <div class="catui-gallery-image" style="background-image: url('${item.thumb || item.src}')">
          ${item.title ? `<div class="catui-gallery-title">${item.title}</div>` : ''}
        </div>
      `,
      ...options
    });

    this._lightbox = null;
  }

  _bindEvents() {
    super._bindEvents();

    // 이미지 클릭 시 라이트박스
    this._handlers.imageClick = async (e) => {
      const item = e.target.closest('.catui-datalist-item');
      if (item) {
        const index = parseInt(item.dataset.index, 10);
        await this._openLightbox(index);
      }
    };
    this._listElement.addEventListener('click', this._handlers.imageClick);
  }

  async _openLightbox(startIndex) {
    try {
      const Overlays = await CATUI.use('carousel');
      if (Overlays.Lightbox) {
        const images = this.options.data.map(item => ({
          src: item.src,
          thumb: item.thumb || item.src,
          title: item.title,
          description: item.description
        }));
        
        this._lightbox = new Overlays.Lightbox({
          images,
          startIndex,
          showThumbs: true
        });
        this._lightbox.open(startIndex);
      }
    } catch (e) {
      console.warn('[ImageGallery] Carousel module not available');
    }
  }

  destroy() {
    if (this._handlers.imageClick) {
      this._listElement?.removeEventListener('click', this._handlers.imageClick);
    }
    this._lightbox?.destroy();
    super.destroy();
  }
}

export { Pagination, DataList, ImageGallery };
export default { Pagination, DataList, ImageGallery };
