/**
 * CATUI Mobile - List Module
 * SwipeableList, ReorderableList 컴포넌트
 * @module list
 */

/**
 * SwipeableList 클래스 - 스와이프 액션 리스트 (Vant SwipeCell 스타일)
 * @class SwipeableList
 */
class SwipeableList {
  /**
   * @constructor
   * @param {Object} options
   * @param {string|HTMLElement} options.container - 컨테이너
   * @param {Array} options.items - 아이템 배열 [{id, content, data?}]
   * @param {Array} [options.leftActions] - 왼쪽 스와이프 액션 (오른쪽에서 나타남)
   * @param {Array} [options.rightActions] - 오른쪽 스와이프 액션 (왼쪽에서 나타남)
   * @param {number} [options.threshold=0.3] - 액션 트리거 임계값 (비율)
   * @param {Function} [options.onOpen] - 열림 콜백
   * @param {Function} [options.onClose] - 닫힘 콜백
   * @param {Function} [options.onItemClick] - 아이템 클릭 콜백
   * @param {Function} [options.onDelete] - 삭제 콜백
   * @param {Function} [options.renderItem] - 커스텀 렌더러
   */
  constructor(options = {}) {
    this.options = {
      container: null,
      items: [],
      leftActions: [],
      rightActions: [],
      threshold: 0.3,
      onOpen: null,
      onClose: null,
      onItemClick: null,
      onDelete: null,
      renderItem: null,
      ...options
    };

    this._container = typeof this.options.container === 'string'
      ? document.querySelector(this.options.container)
      : this.options.container;

    this._items = [...this.options.items];
    this._handlers = {};
    this._timers = [];  // setTimeout 관리

    // 스와이프 상태
    this._touchState = {
      item: null,
      startX: 0,
      startY: 0,
      offsetX: 0,        // 현재 아이템의 기존 offset
      deltaX: 0,         // 터치 이동량
      direction: null,
      isSwiping: false,
      startTime: 0
    };

    // 현재 열린 아이템
    this._openedItem = null;

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
    this._container.className = 'catui-swipeable-list';
    this._container.innerHTML = this._items.map((item, index) =>
      this._renderItem(item, index)
    ).join('');
  }

  /**
   * 아이템 렌더링
   * @private
   */
  _renderItem(item, index) {
    const content = this.options.renderItem
      ? this.options.renderItem(item, index)
      : `<div class="catui-swipeable-text">${item.content || item.title || ''}</div>`;

    const leftActionsHtml = this.options.leftActions.length > 0
      ? `<div class="catui-swipeable-actions catui-swipeable-actions-left">
          ${this.options.leftActions.map((action, i) => `
            <button class="catui-swipeable-action" data-action-index="${i}" data-side="left"
              style="background-color: ${action.color || '#EF4444'}">
              <span class="material-icons">${action.icon}</span>
              ${action.label ? `<span class="catui-swipeable-action-label">${action.label}</span>` : ''}
            </button>
          `).join('')}
        </div>`
      : '';

    const rightActionsHtml = this.options.rightActions.length > 0
      ? `<div class="catui-swipeable-actions catui-swipeable-actions-right">
          ${this.options.rightActions.map((action, i) => `
            <button class="catui-swipeable-action" data-action-index="${i}" data-side="right"
              style="background-color: ${action.color || '#22C55E'}">
              <span class="material-icons">${action.icon}</span>
              ${action.label ? `<span class="catui-swipeable-action-label">${action.label}</span>` : ''}
            </button>
          `).join('')}
        </div>`
      : '';

    return `
      <div class="catui-swipeable-item" data-index="${index}" data-id="${item.id || index}" data-offset="0">
        ${rightActionsHtml}
        <div class="catui-swipeable-content">
          ${content}
        </div>
        ${leftActionsHtml}
      </div>
    `;
  }

  /**
   * 이벤트 바인딩
   * @private
   */
  _bindEvents() {
    // 터치 시작
    this._handlers.touchStart = (e) => {
      // 액션 버튼 클릭은 무시
      if (e.target.closest('.catui-swipeable-action')) return;

      const item = e.target.closest('.catui-swipeable-item');
      if (!item) return;

      const touch = e.touches[0];
      const currentOffset = parseFloat(item.dataset.offset) || 0;

      this._touchState = {
        item: item,
        startX: touch.clientX,
        startY: touch.clientY,
        offsetX: currentOffset,
        deltaX: 0,
        direction: null,
        isSwiping: false,
        startTime: Date.now()
      };

      // transition 제거 (드래그 중)
      const content = item.querySelector('.catui-swipeable-content');
      content.style.transition = 'none';
    };

    // 터치 이동
    this._handlers.touchMove = (e) => {
      const state = this._touchState;
      if (!state.item) return;

      const touch = e.touches[0];
      const deltaX = touch.clientX - state.startX;
      const deltaY = touch.clientY - state.startY;

      // 방향 결정
      if (!state.direction) {
        if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
          state.direction = Math.abs(deltaX) > Math.abs(deltaY) ? 'horizontal' : 'vertical';
        }
      }

      // 수직 스크롤이면 무시
      if (state.direction === 'vertical') {
        return;
      }

      // 수평 스와이프
      if (state.direction === 'horizontal') {
        e.preventDefault();
        state.isSwiping = true;
        state.deltaX = deltaX;

        // 새 위치 계산
        let newOffset = state.offsetX + deltaX;

        // 범위 제한
        const leftWidth = this._getActionsWidth('left');
        const rightWidth = this._getActionsWidth('right');

        // 왼쪽으로 스와이프 (오른쪽 액션 노출) - 음수
        // 오른쪽으로 스와이프 (왼쪽 액션 노출) - 양수
        if (newOffset < 0) {
          // 왼쪽으로 이동
          newOffset = Math.max(newOffset, -leftWidth - 20); // 약간의 탄성
        } else {
          // 오른쪽으로 이동
          newOffset = Math.min(newOffset, rightWidth + 20);
        }

        this._setItemOffset(state.item, newOffset);
      }
    };

    // 터치 종료
    this._handlers.touchEnd = () => {
      const state = this._touchState;
      if (!state.item) return;

      const item = state.item;
      const content = item.querySelector('.catui-swipeable-content');

      // transition 복구
      content.style.transition = 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)';

      if (!state.isSwiping) {
        this._touchState = { item: null };
        return;
      }

      // 최종 위치 결정
      const currentOffset = state.offsetX + state.deltaX;
      const leftWidth = this._getActionsWidth('left');
      const rightWidth = this._getActionsWidth('right');
      const threshold = this.options.threshold;

      // 스와이프 속도 계산
      const duration = Date.now() - state.startTime;
      const velocity = Math.abs(state.deltaX) / duration;
      const isQuickSwipe = velocity > 0.5;

      let targetOffset = 0;

      if (currentOffset < 0 && leftWidth > 0) {
        // 왼쪽으로 스와이프 (왼쪽 액션 열기)
        if (isQuickSwipe && state.deltaX < 0) {
          targetOffset = -leftWidth;
        } else if (Math.abs(currentOffset) > leftWidth * threshold) {
          targetOffset = -leftWidth;
        } else {
          targetOffset = 0;
        }
      } else if (currentOffset > 0 && rightWidth > 0) {
        // 오른쪽으로 스와이프 (오른쪽 액션 열기)
        if (isQuickSwipe && state.deltaX > 0) {
          targetOffset = rightWidth;
        } else if (currentOffset > rightWidth * threshold) {
          targetOffset = rightWidth;
        } else {
          targetOffset = 0;
        }
      }

      // 다른 열린 아이템 닫기
      if (targetOffset !== 0 && this._openedItem && this._openedItem !== item) {
        this._closeItem(this._openedItem);
      }

      // 위치 적용
      this._setItemOffset(item, targetOffset);
      item.dataset.offset = targetOffset;

      // 열림/닫힘 상태 업데이트
      if (targetOffset !== 0) {
        this._openedItem = item;
        if (this.options.onOpen) {
          const index = parseInt(item.dataset.index);
          this.options.onOpen(this._items[index], index, targetOffset < 0 ? 'left' : 'right');
        }
      } else {
        if (this._openedItem === item) {
          this._openedItem = null;
        }
        if (this.options.onClose) {
          const index = parseInt(item.dataset.index);
          this.options.onClose(this._items[index], index);
        }
      }

      this._touchState = { item: null };
    };

    // 액션 버튼 클릭
    this._handlers.actionClick = (e) => {
      const actionBtn = e.target.closest('.catui-swipeable-action');
      if (!actionBtn) return;

      e.stopPropagation();

      const item = actionBtn.closest('.catui-swipeable-item');
      const actionIndex = parseInt(actionBtn.dataset.actionIndex);
      const side = actionBtn.dataset.side;
      const itemIndex = parseInt(item.dataset.index);
      const itemData = this._items[itemIndex];

      const actions = side === 'left' ? this.options.leftActions : this.options.rightActions;
      const action = actions[actionIndex];

      if (action && action.onAction) {
        action.onAction(itemData, itemIndex, this);
      }

      // 액션 후 아이템 닫기
      this._closeItem(item);
    };

    // 아이템 클릭
    this._handlers.itemClick = (e) => {
      if (e.target.closest('.catui-swipeable-action')) return;

      const item = e.target.closest('.catui-swipeable-item');
      if (!item) return;

      const offset = parseFloat(item.dataset.offset) || 0;

      // 열린 아이템 클릭 시 닫기
      if (offset !== 0) {
        this._closeItem(item);
        return;
      }

      if (this.options.onItemClick) {
        const index = parseInt(item.dataset.index);
        this.options.onItemClick(this._items[index], index);
      }
    };

    // 외부 클릭 시 닫기
    this._handlers.documentTouch = (e) => {
      if (this._openedItem && !this._container.contains(e.target)) {
        this._closeItem(this._openedItem);
      }
    };

    // 이벤트 등록
    this._container.addEventListener('touchstart', this._handlers.touchStart, { passive: true });
    this._container.addEventListener('touchmove', this._handlers.touchMove, { passive: false });
    this._container.addEventListener('touchend', this._handlers.touchEnd, { passive: true });
    this._container.addEventListener('click', this._handlers.actionClick);
    this._container.addEventListener('click', this._handlers.itemClick);
    document.addEventListener('touchstart', this._handlers.documentTouch, { passive: true });
  }

  /**
   * 액션 영역 너비 계산
   * @private
   */
  _getActionsWidth(side) {
    const actions = side === 'left' ? this.options.leftActions : this.options.rightActions;
    return actions.length * 80; // 각 액션 버튼 80px
  }

  /**
   * 아이템 offset 설정
   * @private
   */
  _setItemOffset(item, offset) {
    const content = item.querySelector('.catui-swipeable-content');
    content.style.transform = `translateX(${offset}px)`;
  }

  /**
   * 아이템 닫기
   * @private
   */
  _closeItem(item) {
    if (!item) return;

    const content = item.querySelector('.catui-swipeable-content');
    content.style.transition = 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
    content.style.transform = 'translateX(0)';
    item.dataset.offset = '0';

    if (this._openedItem === item) {
      this._openedItem = null;
    }
  }

  /**
   * 모든 아이템 닫기
   */
  closeAll() {
    const items = this._container.querySelectorAll('.catui-swipeable-item');
    items.forEach(item => this._closeItem(item));
    this._openedItem = null;
  }

  /**
   * 특정 아이템 열기
   * @param {number} index - 인덱스
   * @param {string} side - 'left' 또는 'right'
   */
  open(index, side = 'left') {
    const item = this._container.querySelector(`[data-index="${index}"]`);
    if (!item) return;

    // 다른 열린 아이템 닫기
    if (this._openedItem && this._openedItem !== item) {
      this._closeItem(this._openedItem);
    }

    const width = this._getActionsWidth(side);
    const offset = side === 'left' ? -width : width;

    const content = item.querySelector('.catui-swipeable-content');
    content.style.transition = 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
    this._setItemOffset(item, offset);
    item.dataset.offset = offset;
    this._openedItem = item;
  }

  /**
   * 특정 아이템 닫기
   * @param {number} index - 인덱스
   */
  close(index) {
    const item = this._container.querySelector(`[data-index="${index}"]`);
    if (item) {
      this._closeItem(item);
    }
  }

  /**
   * 아이템 추가
   * @param {Object} item - 아이템 데이터
   * @param {number} [index] - 삽입 위치
   */
  addItem(item, index = this._items.length) {
    this._items.splice(index, 0, item);
    this._render();
  }

  /**
   * 아이템 제거
   * @param {number} index - 인덱스
   * @param {boolean} [animate=true] - 애니메이션 여부
   */
  removeItem(index, animate = true) {
    if (index < 0 || index >= this._items.length) return;

    const item = this._container.querySelector(`[data-index="${index}"]`);

    if (animate && item) {
      item.style.transition = 'height 0.3s ease, opacity 0.3s ease';
      item.style.height = `${item.offsetHeight}px`;
      item.offsetHeight;
      item.style.height = '0';
      item.style.opacity = '0';
      item.style.overflow = 'hidden';

      const timerId = setTimeout(() => {
        if (!this._container) return; // destroy 후 실행 방지
        this._items.splice(index, 1);
        this._render();
        if (this.options && this.options.onDelete) {
          this.options.onDelete(index, this._items);
        }
      }, 300);
      this._timers.push(timerId);
    } else {
      this._items.splice(index, 1);
      this._render();
    }
  }

  /**
   * 아이템 업데이트
   * @param {number} index - 인덱스
   * @param {Object} data - 새 데이터
   */
  updateItem(index, data) {
    if (index < 0 || index >= this._items.length) return;
    this._items[index] = { ...this._items[index], ...data };

    const itemEl = this._container.querySelector(`[data-index="${index}"]`);
    if (itemEl) {
      const content = itemEl.querySelector('.catui-swipeable-content');
      if (this.options.renderItem) {
        content.innerHTML = this.options.renderItem(this._items[index], index);
      } else {
        content.innerHTML = `<div class="catui-swipeable-text">${this._items[index].content || ''}</div>`;
      }
    }
  }

  /**
   * 아이템 목록 설정
   * @param {Array} items
   */
  setItems(items) {
    this._items = [...items];
    this._openedItem = null;
    this._render();
  }

  /**
   * 아이템 목록 가져오기
   * @returns {Array}
   */
  getItems() {
    return [...this._items];
  }

  /**
   * 아이템 개수
   * @returns {number}
   */
  get length() {
    return this._items.length;
  }

  /**
   * 정리
   */
  destroy() {
    // 타이머 정리
    this._timers.forEach(id => clearTimeout(id));
    this._timers = [];

    // 이벤트 리스너 제거
    if (this._container) {
      this._container.removeEventListener('touchstart', this._handlers.touchStart);
      this._container.removeEventListener('touchmove', this._handlers.touchMove);
      this._container.removeEventListener('touchend', this._handlers.touchEnd);
      this._container.removeEventListener('click', this._handlers.actionClick);
      this._container.removeEventListener('click', this._handlers.itemClick);

      // DOM 정리
      this._container.innerHTML = '';
      this._container.className = '';
    }

    document.removeEventListener('touchstart', this._handlers.documentTouch);

    // 참조 해제
    this._container = null;
    this._items = null;
    this._handlers = null;
    this._touchState = null;
    this._openedItem = null;
    this.options = null;
  }
}

/**
 * ReorderableList 클래스 - 드래그 정렬 리스트
 * @class ReorderableList
 */
class ReorderableList {
  /**
   * @constructor
   * @param {Object} options
   * @param {string|HTMLElement} options.container - 컨테이너
   * @param {Array} options.items - 아이템 배열
   * @param {string} [options.handle] - 드래그 핸들 선택자
   * @param {number} [options.animation=150] - 애니메이션 시간 (ms)
   * @param {string} [options.dragClass='is-dragging'] - 드래그 중 클래스
   * @param {string} [options.ghostClass='is-ghost'] - 고스트 클래스
   * @param {Function} [options.onStart] - 드래그 시작 콜백
   * @param {Function} [options.onEnd] - 드래그 종료 콜백
   * @param {Function} [options.onChange] - 순서 변경 콜백
   * @param {Function} [options.renderItem] - 커스텀 렌더러
   */
  constructor(options = {}) {
    this.options = {
      container: null,
      items: [],
      handle: null,
      animation: 150,
      dragClass: 'is-dragging',
      ghostClass: 'is-ghost',
      onStart: null,
      onEnd: null,
      onChange: null,
      renderItem: null,
      ...options
    };

    this._container = typeof this.options.container === 'string'
      ? document.querySelector(this.options.container)
      : this.options.container;

    this._items = [...this.options.items];
    this._dragItem = null;
    this._dragIndex = -1;
    this._placeholder = null;
    this._startY = 0;
    this._currentY = 0;
    this._handlers = {};
    this._rafId = null;

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
    this._container.className = 'catui-reorderable-list';
    this._container.innerHTML = this._items.map((item, index) =>
      this._renderItem(item, index)
    ).join('');
  }

  /**
   * 아이템 렌더링
   * @private
   */
  _renderItem(item, index) {
    const content = this.options.renderItem
      ? this.options.renderItem(item, index)
      : `<div class="catui-reorderable-text">${item.content || item.title || ''}</div>`;

    const handleHtml = this.options.handle
      ? ''
      : '<div class="catui-reorderable-handle"><span class="material-icons">drag_indicator</span></div>';

    return `
      <div class="catui-reorderable-item" data-index="${index}">
        ${handleHtml}
        <div class="catui-reorderable-content">${content}</div>
      </div>
    `;
  }

  /**
   * 이벤트 바인딩
   * @private
   */
  _bindEvents() {
    this._handlers.touchStart = (e) => {
      const handle = this.options.handle
        ? e.target.closest(this.options.handle)
        : e.target.closest('.catui-reorderable-handle');

      if (!handle) return;

      const item = e.target.closest('.catui-reorderable-item');
      if (!item) return;

      e.preventDefault();

      this._dragItem = item;
      this._dragIndex = parseInt(item.dataset.index);
      this._startY = e.touches[0].clientY;
      this._itemHeight = item.offsetHeight;

      // 드래그 클래스 추가
      item.classList.add(this.options.dragClass);

      // 플레이스홀더 생성
      this._placeholder = document.createElement('div');
      this._placeholder.className = `catui-reorderable-item ${this.options.ghostClass}`;
      this._placeholder.style.height = `${this._itemHeight}px`;
      item.parentNode.insertBefore(this._placeholder, item.nextSibling);

      // 드래그 아이템 스타일
      const rect = item.getBoundingClientRect();
      item.style.position = 'fixed';
      item.style.top = `${rect.top}px`;
      item.style.left = `${rect.left}px`;
      item.style.width = `${rect.width}px`;
      item.style.zIndex = '1000';

      if (this.options.onStart) {
        this.options.onStart(this._items[this._dragIndex], this._dragIndex);
      }
    };

    this._handlers.touchMove = (e) => {
      if (!this._dragItem) return;

      e.preventDefault();

      this._currentY = e.touches[0].clientY;
      const deltaY = this._currentY - this._startY;

      // 드래그 아이템 이동
      const rect = this._dragItem.getBoundingClientRect();
      this._dragItem.style.top = `${rect.top + deltaY}px`;
      this._startY = this._currentY;

      // 플레이스홀더 위치 업데이트
      this._updatePlaceholderPosition();
    };

    this._handlers.touchEnd = () => {
      if (!this._dragItem) return;

      // 새 위치 계산
      const newIndex = this._getNewIndex();

      // 드래그 아이템 원래대로
      this._dragItem.classList.remove(this.options.dragClass);
      this._dragItem.style.position = '';
      this._dragItem.style.top = '';
      this._dragItem.style.left = '';
      this._dragItem.style.width = '';
      this._dragItem.style.zIndex = '';

      // 플레이스홀더 제거
      if (this._placeholder && this._placeholder.parentNode) {
        this._placeholder.parentNode.removeChild(this._placeholder);
      }

      // 순서 변경
      if (newIndex !== this._dragIndex) {
        const [removed] = this._items.splice(this._dragIndex, 1);
        this._items.splice(newIndex, 0, removed);
        this._render();

        if (this.options.onChange) {
          this.options.onChange([...this._items], this._dragIndex, newIndex);
        }
      }

      if (this.options.onEnd) {
        this.options.onEnd(this._items[newIndex], this._dragIndex, newIndex);
      }

      this._dragItem = null;
      this._dragIndex = -1;
      this._placeholder = null;
    };

    // 이벤트 등록
    this._container.addEventListener('touchstart', this._handlers.touchStart, { passive: false });
    document.addEventListener('touchmove', this._handlers.touchMove, { passive: false });
    document.addEventListener('touchend', this._handlers.touchEnd, { passive: true });
  }

  /**
   * 플레이스홀더 위치 업데이트
   * @private
   */
  _updatePlaceholderPosition() {
    if (!this._placeholder || !this._dragItem) return;

    const items = Array.from(this._container.querySelectorAll('.catui-reorderable-item:not(.is-dragging):not(.is-ghost)'));
    const dragRect = this._dragItem.getBoundingClientRect();
    const dragCenterY = dragRect.top + dragRect.height / 2;

    for (let i = 0; i < items.length; i++) {
      const itemRect = items[i].getBoundingClientRect();
      const itemCenterY = itemRect.top + itemRect.height / 2;

      if (dragCenterY < itemCenterY) {
        if (items[i] !== this._placeholder.nextSibling) {
          this._container.insertBefore(this._placeholder, items[i]);
        }
        return;
      }
    }

    // 맨 마지막
    if (items.length > 0) {
      this._container.appendChild(this._placeholder);
    }
  }

  /**
   * 새 인덱스 계산
   * @private
   */
  _getNewIndex() {
    const items = Array.from(this._container.querySelectorAll('.catui-reorderable-item:not(.is-dragging)'));
    return items.indexOf(this._placeholder);
  }

  /**
   * 아이템 추가
   * @param {Object} item
   * @param {number} [index]
   */
  addItem(item, index = this._items.length) {
    this._items.splice(index, 0, item);
    this._render();
  }

  /**
   * 아이템 제거
   * @param {number} index
   */
  removeItem(index) {
    if (index < 0 || index >= this._items.length) return;
    this._items.splice(index, 1);
    this._render();
  }

  /**
   * 아이템 목록 설정
   * @param {Array} items
   */
  setItems(items) {
    this._items = [...items];
    this._render();
  }

  /**
   * 아이템 목록 가져오기
   * @returns {Array}
   */
  getItems() {
    return [...this._items];
  }

  /**
   * 정리
   */
  destroy() {
    // RAF 취소
    if (this._rafId) {
      cancelAnimationFrame(this._rafId);
    }

    // 이벤트 리스너 제거
    this._container.removeEventListener('touchstart', this._handlers.touchStart);
    document.removeEventListener('touchmove', this._handlers.touchMove);
    document.removeEventListener('touchend', this._handlers.touchEnd);

    // DOM 정리
    this._container.innerHTML = '';
    this._container.className = '';

    // 참조 해제
    this._container = null;
    this._items = null;
    this._dragItem = null;
    this._placeholder = null;
    this._handlers = null;
    this.options = null;
  }
}

/**
 * CheckList 클래스 - 체크박스 다중 선택 리스트
 * @class CheckList
 */
class CheckList {
  /**
   * @constructor
   * @param {Object} options
   * @param {string|HTMLElement} options.container - 컨테이너
   * @param {Array} options.items - 아이템 배열 [{id, content, checked?, disabled?}]
   * @param {boolean} [options.multiple=true] - 다중 선택 허용
   * @param {number} [options.maxSelect=Infinity] - 최대 선택 수
   * @param {boolean} [options.selectAll=false] - 전체 선택 버튼 표시
   * @param {string} [options.selectAllLabel='전체 선택'] - 전체 선택 라벨
   * @param {Function} [options.onChange] - 변경 콜백
   * @param {Function} [options.onSelect] - 선택 콜백
   * @param {Function} [options.onDeselect] - 선택 해제 콜백
   * @param {Function} [options.renderItem] - 커스텀 렌더러
   */
  constructor(options = {}) {
    this.options = {
      container: null,
      items: [],
      multiple: true,
      maxSelect: Infinity,
      selectAll: false,
      selectAllLabel: '전체 선택',
      onChange: null,
      onSelect: null,
      onDeselect: null,
      renderItem: null,
      ...options
    };

    this._container = typeof this.options.container === 'string'
      ? document.querySelector(this.options.container)
      : this.options.container;

    this._items = this.options.items.map(item => ({
      ...item,
      checked: item.checked || false,
      disabled: item.disabled || false
    }));
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
    this._container.className = 'catui-checklist';

    let html = '';

    // 전체 선택
    if (this.options.selectAll) {
      const checkedCount = this._items.filter(i => i.checked && !i.disabled).length;
      const selectableCount = this._items.filter(i => !i.disabled).length;
      const isAllChecked = checkedCount === selectableCount && selectableCount > 0;
      const isIndeterminate = checkedCount > 0 && checkedCount < selectableCount;

      html += `
        <div class="catui-checklist-header">
          <label class="catui-checklist-selectall">
            <input type="checkbox" 
              class="catui-checklist-selectall-input"
              ${isAllChecked ? 'checked' : ''}
              ${isIndeterminate ? 'data-indeterminate="true"' : ''}
            />
            <span class="catui-checklist-checkbox${isIndeterminate ? ' is-indeterminate' : ''}"></span>
            <span class="catui-checklist-selectall-label">${this.options.selectAllLabel}</span>
          </label>
          <span class="catui-checklist-count">${checkedCount}/${selectableCount}</span>
        </div>
      `;
    }

    // 아이템 목록
    html += '<div class="catui-checklist-items">';

    this._items.forEach((item, index) => {
      html += this._renderItem(item, index);
    });

    html += '</div>';

    this._container.innerHTML = html;

    // indeterminate 상태 설정
    const selectAllInput = this._container.querySelector('.catui-checklist-selectall-input');
    if (selectAllInput && selectAllInput.dataset.indeterminate === 'true') {
      selectAllInput.indeterminate = true;
    }
  }

  /**
   * 아이템 렌더링
   * @private
   */
  _renderItem(item, index) {
    if (this.options.renderItem) {
      return this.options.renderItem(item, index, item.checked);
    }

    return `
      <label class="catui-checklist-item${item.disabled ? ' is-disabled' : ''}${item.checked ? ' is-checked' : ''}" 
        data-index="${index}" data-id="${item.id || index}">
        <input type="checkbox" 
          class="catui-checklist-input"
          ${item.checked ? 'checked' : ''}
          ${item.disabled ? 'disabled' : ''}
        />
        <span class="catui-checklist-checkbox"></span>
        <span class="catui-checklist-content">${item.content}</span>
      </label>
    `;
  }

  /**
   * 이벤트 바인딩
   * @private
   */
  _bindEvents() {
    // 기존 이벤트 제거 (중복 방지)
    this._unbindEvents();

    // 아이템 클릭 (click 이벤트 사용 - change보다 먼저 처리)
    this._handlers.itemClick = (e) => {
      const label = e.target.closest('.catui-checklist-item');
      if (!label) return;
      if (label.classList.contains('is-disabled')) return;

      const index = parseInt(label.dataset.index);
      if (isNaN(index) || index < 0 || index >= this._items.length) return;

      const item = this._items[index];
      const input = label.querySelector('.catui-checklist-input');
      if (!input) return;

      const willBeChecked = !item.checked;

      // 최대 선택 수 체크
      if (willBeChecked && this.options.maxSelect !== Infinity) {
        const checkedCount = this._items.filter(i => i.checked).length;
        if (checkedCount >= this.options.maxSelect) {
          e.preventDefault();
          return;
        }
      }

      // 단일 선택 모드 - 다른 항목 해제
      if (willBeChecked && !this.options.multiple) {
        this._items.forEach((i, idx) => {
          if (i.checked && idx !== index) {
            i.checked = false;
            const otherLabel = this._container.querySelector(`.catui-checklist-item[data-index="${idx}"]`);
            if (otherLabel) {
              otherLabel.classList.remove('is-checked');
              const otherInput = otherLabel.querySelector('.catui-checklist-input');
              if (otherInput) otherInput.checked = false;
            }
          }
        });
      }

      // 상태 업데이트
      item.checked = willBeChecked;
      label.classList.toggle('is-checked', willBeChecked);
      input.checked = willBeChecked;

      // 전체 선택 상태 업데이트
      this._updateSelectAllState();

      // 콜백
      if (willBeChecked && this.options.onSelect) {
        this.options.onSelect(item, index);
      }
      if (!willBeChecked && this.options.onDeselect) {
        this.options.onDeselect(item, index);
      }
      if (this.options.onChange) {
        this.options.onChange(this.getSelected(), this._items);
      }

      // 기본 체크박스 동작 방지 (이미 수동으로 처리함)
      e.preventDefault();
    };

    // 전체 선택 클릭
    this._handlers.selectAllClick = (e) => {
      const selectAllLabel = e.target.closest('.catui-checklist-selectall');
      if (!selectAllLabel) return;

      const input = selectAllLabel.querySelector('.catui-checklist-selectall-input');
      if (!input) return;

      const willBeChecked = !input.checked;
      this._selectAll(willBeChecked);

      e.preventDefault();
    };

    this._container.addEventListener('click', this._handlers.itemClick);
    this._container.addEventListener('click', this._handlers.selectAllClick);
  }

  /**
   * 이벤트 해제
   * @private
   */
  _unbindEvents() {
    if (this._handlers.itemClick) {
      this._container.removeEventListener('click', this._handlers.itemClick);
    }
    if (this._handlers.selectAllClick) {
      this._container.removeEventListener('click', this._handlers.selectAllClick);
    }
  }

  /**
   * 전체 선택 상태 업데이트
   * @private
   */
  _updateSelectAllState() {
    if (!this.options.selectAll) return;

    const checkedCount = this._items.filter(i => i.checked && !i.disabled).length;
    const selectableCount = this._items.filter(i => !i.disabled).length;
    const isAllChecked = checkedCount === selectableCount && selectableCount > 0;
    const isIndeterminate = checkedCount > 0 && checkedCount < selectableCount;

    const selectAllInput = this._container.querySelector('.catui-checklist-selectall-input');
    const selectAllCheckbox = this._container.querySelector('.catui-checklist-selectall .catui-checklist-checkbox');
    const countEl = this._container.querySelector('.catui-checklist-count');

    if (selectAllInput) {
      selectAllInput.checked = isAllChecked;
      selectAllInput.indeterminate = isIndeterminate;
    }
    if (selectAllCheckbox) {
      selectAllCheckbox.classList.toggle('is-indeterminate', isIndeterminate);
    }
    if (countEl) {
      countEl.textContent = `${checkedCount}/${selectableCount}`;
    }
  }

  /**
   * 아이템 토글
   * @private
   */
  _toggleItem(index) {
    const item = this._items[index];
    if (!item || item.disabled) return;

    const newChecked = !item.checked;

    // 최대 선택 수 체크
    if (newChecked) {
      const checkedCount = this._items.filter(i => i.checked).length;
      if (checkedCount >= this.options.maxSelect) {
        return;
      }
    }

    // 단일 선택 모드
    if (!this.options.multiple && newChecked) {
      this._items.forEach(i => i.checked = false);
    }

    item.checked = newChecked;
    this._render();
    this._bindEvents();

    // 콜백
    if (newChecked && this.options.onSelect) {
      this.options.onSelect(item, index);
    }
    if (!newChecked && this.options.onDeselect) {
      this.options.onDeselect(item, index);
    }
    if (this.options.onChange) {
      this.options.onChange(this.getSelected(), this._items);
    }
  }

  /**
   * 전체 선택/해제
   * @private
   */
  _selectAll(checked) {
    // 상태 및 DOM 업데이트
    this._items.forEach((item, index) => {
      if (!item.disabled) {
        item.checked = checked;

        // DOM 업데이트
        const label = this._container.querySelector(`.catui-checklist-item[data-index="${index}"]`);
        if (label) {
          label.classList.toggle('is-checked', checked);
          const input = label.querySelector('.catui-checklist-input');
          if (input) input.checked = checked;
        }
      }
    });

    // 전체 선택 체크박스 업데이트
    const selectAllInput = this._container.querySelector('.catui-checklist-selectall-input');
    if (selectAllInput) {
      selectAllInput.checked = checked;
      selectAllInput.indeterminate = false;
    }

    // 카운트 업데이트
    this._updateSelectAllState();

    if (this.options.onChange) {
      this.options.onChange(this.getSelected(), this._items);
    }
  }

  /**
   * 선택된 아이템 가져오기
   * @returns {Array}
   */
  getSelected() {
    return this._items.filter(item => item.checked);
  }

  /**
   * 선택된 ID 가져오기
   * @returns {Array}
   */
  getSelectedIds() {
    return this._items
      .filter(item => item.checked)
      .map((item, index) => item.id !== undefined ? item.id : index);
  }

  /**
   * 아이템 선택
   * @param {number|string} id - 아이템 ID 또는 인덱스
   */
  select(id) {
    const index = this._findIndex(id);
    if (index !== -1 && !this._items[index].checked) {
      this._toggleItem(index);
    }
  }

  /**
   * 아이템 선택 해제
   * @param {number|string} id
   */
  deselect(id) {
    const index = this._findIndex(id);
    if (index !== -1 && this._items[index].checked) {
      this._toggleItem(index);
    }
  }

  /**
   * 모두 선택
   */
  selectAll() {
    this._selectAll(true);
  }

  /**
   * 모두 해제
   */
  deselectAll() {
    this._selectAll(false);
  }

  /**
   * 인덱스 찾기
   * @private
   */
  _findIndex(id) {
    if (typeof id === 'number' && id < this._items.length) {
      return id;
    }
    return this._items.findIndex(item => item.id === id);
  }

  /**
   * 아이템 추가
   * @param {Object} item
   */
  addItem(item) {
    this._items.push({
      ...item,
      checked: item.checked || false,
      disabled: item.disabled || false
    });
    this._render();
    this._bindEvents();
  }

  /**
   * 아이템 제거
   * @param {number|string} id
   */
  removeItem(id) {
    const index = this._findIndex(id);
    if (index !== -1) {
      this._items.splice(index, 1);
      this._render();
      this._bindEvents();
    }
  }

  /**
   * 아이템 비활성화
   * @param {number|string} id
   * @param {boolean} disabled
   */
  setDisabled(id, disabled) {
    const index = this._findIndex(id);
    if (index !== -1) {
      this._items[index].disabled = disabled;
      this._render();
      this._bindEvents();
    }
  }

  /**
   * 정리
   */
  destroy() {
    this._unbindEvents();

    this._container.innerHTML = '';
    this._container.className = '';

    this._container = null;
    this._items = null;
    this._handlers = null;
    this.options = null;
  }
}

/**
 * GroupedList 클래스 - 섹션별 그룹핑 리스트
 * @class GroupedList
 */
class GroupedList {
  /**
   * @constructor
   * @param {Object} options
   * @param {string|HTMLElement} options.container - 컨테이너
   * @param {Array} options.groups - 그룹 배열 [{title, items, collapsed?}]
   * @param {boolean} [options.collapsible=true] - 접기/펼치기 허용
   * @param {boolean} [options.accordion=false] - 아코디언 모드 (한 번에 하나만)
   * @param {boolean} [options.stickyHeaders=false] - 헤더 고정
   * @param {boolean} [options.showCount=true] - 아이템 수 표시
   * @param {Function} [options.onGroupToggle] - 그룹 토글 콜백
   * @param {Function} [options.onItemClick] - 아이템 클릭 콜백
   * @param {Function} [options.renderHeader] - 커스텀 헤더 렌더러
   * @param {Function} [options.renderItem] - 커스텀 아이템 렌더러
   */
  constructor(options = {}) {
    this.options = {
      container: null,
      groups: [],
      collapsible: true,
      accordion: false,
      stickyHeaders: false,
      showCount: true,
      onGroupToggle: null,
      onItemClick: null,
      renderHeader: null,
      renderItem: null,
      ...options
    };

    this._container = typeof this.options.container === 'string'
      ? document.querySelector(this.options.container)
      : this.options.container;

    this._groups = this.options.groups.map(group => ({
      ...group,
      collapsed: group.collapsed || false,
      items: group.items || []
    }));
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
    this._container.className = `catui-groupedlist${this.options.stickyHeaders ? ' has-sticky-headers' : ''}`;

    let html = '';

    this._groups.forEach((group, groupIndex) => {
      html += `
        <div class="catui-groupedlist-group${group.collapsed ? ' is-collapsed' : ''}" data-group="${groupIndex}">
          ${this._renderHeader(group, groupIndex)}
          <div class="catui-groupedlist-items">
            ${group.items.map((item, itemIndex) => this._renderItem(item, groupIndex, itemIndex)).join('')}
          </div>
        </div>
      `;
    });

    this._container.innerHTML = html;
  }

  /**
   * 헤더 렌더링
   * @private
   */
  _renderHeader(group, index) {
    if (this.options.renderHeader) {
      return this.options.renderHeader(group, index);
    }

    const count = this.options.showCount ? `<span class="catui-groupedlist-count">${group.items.length}</span>` : '';
    const arrow = this.options.collapsible ? '<span class="catui-groupedlist-arrow material-icons">expand_more</span>' : '';

    return `
      <div class="catui-groupedlist-header${this.options.collapsible ? ' is-collapsible' : ''}${this.options.stickyHeaders ? ' is-sticky' : ''}" data-group="${index}">
        <span class="catui-groupedlist-title">${group.title}</span>
        ${count}
        ${arrow}
      </div>
    `;
  }

  /**
   * 아이템 렌더링
   * @private
   */
  _renderItem(item, groupIndex, itemIndex) {
    if (this.options.renderItem) {
      return this.options.renderItem(item, groupIndex, itemIndex);
    }

    return `
      <div class="catui-groupedlist-item" data-group="${groupIndex}" data-index="${itemIndex}" data-id="${item.id || itemIndex}">
        ${item.icon ? `<span class="catui-groupedlist-item-icon material-icons">${item.icon}</span>` : ''}
        <span class="catui-groupedlist-item-content">${item.content || item.title || item.label || ''}</span>
        ${item.badge ? `<span class="catui-groupedlist-item-badge">${item.badge}</span>` : ''}
        ${item.arrow !== false ? '<span class="catui-groupedlist-item-arrow material-icons">chevron_right</span>' : ''}
      </div>
    `;
  }

  /**
   * 이벤트 바인딩
   * @private
   */
  _bindEvents() {
    // 기존 이벤트 제거 (중복 방지)
    this._unbindEvents();

    // 헤더 클릭 (토글)
    this._handlers.headerClick = (e) => {
      const header = e.target.closest('.catui-groupedlist-header');
      if (!header || !this.options.collapsible) return;

      const groupIndex = parseInt(header.dataset.group);
      this.toggleGroup(groupIndex);
    };

    // 아이템 클릭
    this._handlers.itemClick = (e) => {
      const item = e.target.closest('.catui-groupedlist-item');
      if (!item) return;

      const groupIndex = parseInt(item.dataset.group);
      const itemIndex = parseInt(item.dataset.index);
      const group = this._groups[groupIndex];
      const itemData = group?.items[itemIndex];

      if (itemData && this.options.onItemClick) {
        this.options.onItemClick(itemData, groupIndex, itemIndex);
      }
    };

    this._container.addEventListener('click', this._handlers.headerClick);
    this._container.addEventListener('click', this._handlers.itemClick);
  }

  /**
   * 이벤트 해제
   * @private
   */
  _unbindEvents() {
    if (this._handlers.headerClick) {
      this._container.removeEventListener('click', this._handlers.headerClick);
    }
    if (this._handlers.itemClick) {
      this._container.removeEventListener('click', this._handlers.itemClick);
    }
  }

  /**
   * 그룹 토글
   * @param {number} index
   */
  toggleGroup(index) {
    const group = this._groups[index];
    if (!group) return;

    const newCollapsed = !group.collapsed;

    // 아코디언 모드
    if (this.options.accordion && !newCollapsed) {
      this._groups.forEach((g, i) => {
        if (i !== index) g.collapsed = true;
      });
    }

    group.collapsed = newCollapsed;
    this._render();
    this._bindEvents();

    if (this.options.onGroupToggle) {
      this.options.onGroupToggle(group, index, newCollapsed);
    }
  }

  /**
   * 그룹 펼치기
   * @param {number} index
   */
  expandGroup(index) {
    if (this._groups[index]?.collapsed) {
      this.toggleGroup(index);
    }
  }

  /**
   * 그룹 접기
   * @param {number} index
   */
  collapseGroup(index) {
    if (!this._groups[index]?.collapsed) {
      this.toggleGroup(index);
    }
  }

  /**
   * 모든 그룹 펼치기
   */
  expandAll() {
    this._groups.forEach(group => group.collapsed = false);
    this._render();
    this._bindEvents();
  }

  /**
   * 모든 그룹 접기
   */
  collapseAll() {
    this._groups.forEach(group => group.collapsed = true);
    this._render();
    this._bindEvents();
  }

  /**
   * 그룹 추가
   * @param {Object} group
   */
  addGroup(group) {
    this._groups.push({
      ...group,
      collapsed: group.collapsed || false,
      items: group.items || []
    });
    this._render();
    this._bindEvents();
  }

  /**
   * 그룹에 아이템 추가
   * @param {number} groupIndex
   * @param {Object} item
   */
  addItem(groupIndex, item) {
    if (this._groups[groupIndex]) {
      this._groups[groupIndex].items.push(item);
      this._render();
      this._bindEvents();
    }
  }

  /**
   * 그룹에서 아이템 제거
   * @param {number} groupIndex
   * @param {number} itemIndex
   */
  removeItem(groupIndex, itemIndex) {
    if (this._groups[groupIndex]?.items[itemIndex]) {
      this._groups[groupIndex].items.splice(itemIndex, 1);
      this._render();
      this._bindEvents();
    }
  }

  /**
   * 그룹 가져오기
   * @returns {Array}
   */
  getGroups() {
    return this._groups;
  }

  /**
   * 정리
   */
  destroy() {
    this._unbindEvents();

    this._container.innerHTML = '';
    this._container.className = '';

    this._container = null;
    this._groups = null;
    this._handlers = null;
    this.options = null;
  }
}

export { SwipeableList, ReorderableList, CheckList, GroupedList };
export default { SwipeableList, ReorderableList, CheckList, GroupedList };
