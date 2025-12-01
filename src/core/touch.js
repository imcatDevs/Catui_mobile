/**
 * Touch & Gesture System for Mobile
 * @module core/touch
 * @description 모바일 터치 이벤트 및 제스처 인식 시스템
 */

/**
 * 터치 이벤트 관리자
 * @class TouchManager
 */
export class TouchManager {
  /**
   * 기본 옵션
   * @returns {Object} 기본 설정
   */
  static defaults() {
    return {
      swipeThreshold: 30,        // 스와이프 인식 최소 거리 (px)
      swipeVelocity: 0.1,        // 스와이프 인식 최소 속도
      tapTimeout: 250,           // 탭 인식 최대 시간 (ms)
      longPressTimeout: 500,     // 롱프레스 인식 시간 (ms)
      doubleTapTimeout: 300,     // 더블탭 인식 시간 (ms)
      pinchThreshold: 0.02,      // 핀치 인식 최소 스케일 변화
      preventScroll: false       // 스크롤 방지 여부
    };
  }

  /**
   * TouchManager 생성자
   * @param {HTMLElement|string} element - 대상 요소
   * @param {Object} options - 옵션
   */
  constructor(element, options = {}) {
    this.element = typeof element === 'string'
      ? document.querySelector(element)
      : element;

    if (!this.element) {
      throw new Error('TouchManager: Element not found');
    }

    this.options = { ...TouchManager.defaults(), ...options };
    this.handlers = new Map();

    // 터치 상태
    this._touchState = {
      startX: 0,
      startY: 0,
      lastX: 0,           // 이전 위치 (움직임 계산용)
      lastY: 0,
      startTime: 0,
      lastTapTime: 0,
      isLongPress: false,
      isSwiping: false,   // 스와이프 중인지
      longPressTimer: null,
      initialDistance: 0,
      initialScale: 1
    };

    // 바인딩된 핸들러 저장 (제거용)
    this._onTouchStart = this._handleTouchStart.bind(this);
    this._onTouchMove = this._handleTouchMove.bind(this);
    this._onTouchEnd = this._handleTouchEnd.bind(this);
    this._onTouchCancel = this._handleTouchCancel.bind(this);

    // 마우스 이벤트 핸들러 (데스크톱 fallback)
    this._onMouseDown = this._handleMouseDown.bind(this);
    this._onMouseMove = this._handleMouseMove.bind(this);
    this._onMouseUp = this._handleMouseUp.bind(this);

    this._isMouseDown = false;

    this._bindEvents();
  }

  /**
   * 이벤트 바인딩
   * @private
   */
  _bindEvents() {
    // 터치 이벤트
    this.element.addEventListener('touchstart', this._onTouchStart, { passive: !this.options.preventScroll });
    this.element.addEventListener('touchmove', this._onTouchMove, { passive: !this.options.preventScroll });
    this.element.addEventListener('touchend', this._onTouchEnd, { passive: true });
    this.element.addEventListener('touchcancel', this._onTouchCancel, { passive: true });

    // 마우스 이벤트 (데스크톱 fallback)
    this.element.addEventListener('mousedown', this._onMouseDown);
    document.addEventListener('mousemove', this._onMouseMove);
    document.addEventListener('mouseup', this._onMouseUp);
  }

  /**
   * 마우스 다운 핸들러 (데스크톱 fallback)
   * @private
   */
  _handleMouseDown(e) {
    this._isMouseDown = true;
    const state = this._touchState;

    state.startX = e.clientX;
    state.startY = e.clientY;
    state.lastX = e.clientX;
    state.lastY = e.clientY;
    state.startTime = Date.now();
    state.isLongPress = false;
    state.isSwiping = false;

    if (state.longPressTimer) clearTimeout(state.longPressTimer);

    state.longPressTimer = setTimeout(() => {
      state.isLongPress = true;
      this._emit('longpress', { x: state.startX, y: state.startY, target: e.target });
    }, this.options.longPressTimeout);
  }

  /**
   * 마우스 이동 핸들러 (데스크톱 fallback)
   * @private
   */
  _handleMouseMove(e) {
    if (!this._isMouseDown) return;

    const state = this._touchState;
    if (state.longPressTimer) {
      clearTimeout(state.longPressTimer);
      state.longPressTimer = null;
    }

    const deltaX = e.clientX - state.startX;
    const deltaY = e.clientY - state.startY;
    const movementX = e.clientX - state.lastX;
    const movementY = e.clientY - state.lastY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const duration = Date.now() - state.startTime;
    const velocity = distance / Math.max(duration, 1);

    // 실시간 스와이프 감지
    if (!state.isSwiping &&
        distance >= this.options.swipeThreshold &&
        velocity >= this.options.swipeVelocity) {
      state.isSwiping = true;
      const direction = this._getSwipeDirection(deltaX, deltaY);
      this._emit('swipe', { direction, deltaX, deltaY, velocity, distance });
      this._emit(`swipe${direction}`, { deltaX, deltaY, velocity, distance });
    }

    this._emit('pan', { deltaX, deltaY, movementX, movementY, x: e.clientX, y: e.clientY });

    state.lastX = e.clientX;
    state.lastY = e.clientY;
  }

  /**
   * 마우스 업 핸들러 (데스크톱 fallback)
   * @private
   */
  _handleMouseUp(e) {
    if (!this._isMouseDown) return;
    this._isMouseDown = false;

    const state = this._touchState;
    const now = Date.now();
    const duration = now - state.startTime;

    if (state.longPressTimer) {
      clearTimeout(state.longPressTimer);
      state.longPressTimer = null;
    }

    if (state.isLongPress || state.isSwiping) {
      state.isSwiping = false;
      return;
    }

    const deltaX = e.clientX - state.startX;
    const deltaY = e.clientY - state.startY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    // 탭 감지
    if (duration < this.options.tapTimeout && distance < 15) {
      if (now - state.lastTapTime < this.options.doubleTapTimeout) {
        this._emit('doubletap', { x: e.clientX, y: e.clientY, target: e.target });
        state.lastTapTime = 0;
      } else {
        this._emit('tap', { x: e.clientX, y: e.clientY, target: e.target });
        state.lastTapTime = now;
      }
    }
  }

  /**
   * 터치 시작 핸들러
   * @private
   */
  _handleTouchStart(e) {
    const touch = e.touches[0];
    const state = this._touchState;

    state.startX = touch.clientX;
    state.startY = touch.clientY;
    state.lastX = touch.clientX;
    state.lastY = touch.clientY;
    state.startTime = Date.now();
    state.isLongPress = false;
    state.isSwiping = false;

    // 롱프레스 타이머 시작
    if (state.longPressTimer) {
      clearTimeout(state.longPressTimer);
    }

    state.longPressTimer = setTimeout(() => {
      state.isLongPress = true;
      this._emit('longpress', {
        x: state.startX,
        y: state.startY,
        target: e.target
      });
    }, this.options.longPressTimeout);

    // 핀치 제스처 (2개 터치)
    if (e.touches.length === 2) {
      state.initialDistance = this._getDistance(e.touches[0], e.touches[1]);
      state.initialScale = 1;
    }

    if (this.options.preventScroll) {
      e.preventDefault();
    }
  }

  /**
   * 터치 이동 핸들러
   * @private
   */
  _handleTouchMove(e) {
    const state = this._touchState;

    // 롱프레스 취소
    if (state.longPressTimer) {
      clearTimeout(state.longPressTimer);
      state.longPressTimer = null;
    }

    // 핀치 제스처
    if (e.touches.length === 2) {
      const currentDistance = this._getDistance(e.touches[0], e.touches[1]);
      const scale = currentDistance / state.initialDistance;

      if (Math.abs(scale - state.initialScale) > this.options.pinchThreshold) {
        this._emit('pinch', {
          scale: scale,
          center: this._getCenter(e.touches[0], e.touches[1])
        });
        state.initialScale = scale;
      }
    }

    // 단일 터치 이동
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      const deltaX = touch.clientX - state.startX;  // 시작점 대비
      const deltaY = touch.clientY - state.startY;
      const movementX = touch.clientX - state.lastX;  // 이전 위치 대비
      const movementY = touch.clientY - state.lastY;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      const duration = Date.now() - state.startTime;
      const velocity = distance / Math.max(duration, 1);

      // 실시간 스와이프 감지 (touchMove 중에)
      if (!state.isSwiping &&
          distance >= this.options.swipeThreshold &&
          velocity >= this.options.swipeVelocity) {
        state.isSwiping = true;
        const direction = this._getSwipeDirection(deltaX, deltaY);
        this._emit('swipe', { direction, deltaX, deltaY, velocity, distance });
        this._emit(`swipe${direction}`, { deltaX, deltaY, velocity, distance });
      }

      // pan 이벤트
      this._emit('pan', {
        deltaX,       // 시작점 대비 총 이동량
        deltaY,
        movementX,    // 이전 프레임 대비 이동량
        movementY,
        x: touch.clientX,
        y: touch.clientY
      });

      // 현재 위치를 이전 위치로 저장
      state.lastX = touch.clientX;
      state.lastY = touch.clientY;
    }

    if (this.options.preventScroll) {
      e.preventDefault();
    }
  }

  /**
   * 터치 종료 핸들러
   * @private
   */
  _handleTouchEnd(e) {
    const state = this._touchState;
    const now = Date.now();
    const duration = now - state.startTime;

    // 롱프레스 타이머 취소
    if (state.longPressTimer) {
      clearTimeout(state.longPressTimer);
      state.longPressTimer = null;
    }

    // 롱프레스 또는 이미 스와이프 감지됨
    if (state.isLongPress || state.isSwiping) {
      state.isSwiping = false;
      return;
    }

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - state.startX;
    const deltaY = touch.clientY - state.startY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    // 탭 감지 (짧은 터치, 적은 이동)
    if (duration < this.options.tapTimeout && distance < 15) {
      // 더블탭 체크
      if (now - state.lastTapTime < this.options.doubleTapTimeout) {
        this._emit('doubletap', {
          x: touch.clientX,
          y: touch.clientY,
          target: e.target
        });
        state.lastTapTime = 0;
      } else {
        this._emit('tap', {
          x: touch.clientX,
          y: touch.clientY,
          target: e.target
        });
        state.lastTapTime = now;
      }
    }
  }

  /**
   * 터치 취소 핸들러
   * @private
   */
  _handleTouchCancel() {
    const state = this._touchState;

    if (state.longPressTimer) {
      clearTimeout(state.longPressTimer);
      state.longPressTimer = null;
    }

    state.isLongPress = false;
  }

  /**
   * 스와이프 방향 계산
   * @private
   */
  _getSwipeDirection(deltaX, deltaY) {
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      return deltaX > 0 ? 'right' : 'left';
    }
    return deltaY > 0 ? 'down' : 'up';
  }

  /**
   * 두 터치 포인트 사이 거리 계산
   * @private
   */
  _getDistance(touch1, touch2) {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * 두 터치 포인트의 중심점 계산
   * @private
   */
  _getCenter(touch1, touch2) {
    return {
      x: (touch1.clientX + touch2.clientX) / 2,
      y: (touch1.clientY + touch2.clientY) / 2
    };
  }

  /**
   * 이벤트 핸들러 등록
   * @param {string} event - 이벤트 이름 (tap, doubletap, longpress, swipe, swipeleft, swiperight, swipeup, swipedown, pinch, pan)
   * @param {Function} handler - 핸들러 함수
   * @returns {Function} 구독 취소 함수
   */
  on(event, handler) {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, []);
    }
    this.handlers.get(event).push(handler);

    return () => this.off(event, handler);
  }

  /**
   * 이벤트 핸들러 제거
   * @param {string} event - 이벤트 이름
   * @param {Function} handler - 핸들러 함수
   */
  off(event, handler) {
    if (!this.handlers.has(event)) return;

    if (handler) {
      const handlers = this.handlers.get(event);
      const index = handlers.indexOf(handler);
      if (index !== -1) {
        handlers.splice(index, 1);
      }
    } else {
      this.handlers.delete(event);
    }
  }

  /**
   * 이벤트 발생
   * @private
   */
  _emit(event, data) {
    if (!this.handlers.has(event)) return;

    this.handlers.get(event).forEach(handler => {
      try {
        handler(data);
      } catch (error) {
        console.error(`TouchManager: Error in ${event} handler:`, error);
      }
    });
  }

  /**
   * 리소스 정리
   */
  destroy() {
    // 터치 이벤트 리스너 제거
    this.element.removeEventListener('touchstart', this._onTouchStart);
    this.element.removeEventListener('touchmove', this._onTouchMove);
    this.element.removeEventListener('touchend', this._onTouchEnd);
    this.element.removeEventListener('touchcancel', this._onTouchCancel);

    // 마우스 이벤트 리스너 제거
    this.element.removeEventListener('mousedown', this._onMouseDown);
    document.removeEventListener('mousemove', this._onMouseMove);
    document.removeEventListener('mouseup', this._onMouseUp);

    // 타이머 정리
    if (this._touchState?.longPressTimer) {
      clearTimeout(this._touchState.longPressTimer);
    }

    // 핸들러 정리
    this.handlers.clear();

    // 참조 해제
    this.element = null;
    this.options = null;
    this._touchState = null;
    this._isMouseDown = false;
  }
}

/**
 * 제스처 인식기
 * @class GestureRecognizer
 * @description 복합 제스처 인식 (회전, 드래그 등)
 */
export class GestureRecognizer {
  /**
   * 기본 옵션
   */
  static defaults() {
    return {
      rotationThreshold: 15,     // 회전 인식 최소 각도 (도)
      dragThreshold: 10          // 드래그 인식 최소 거리 (px)
    };
  }

  /**
   * GestureRecognizer 생성자
   * @param {HTMLElement|string} element - 대상 요소
   * @param {Object} options - 옵션
   */
  constructor(element, options = {}) {
    this.element = typeof element === 'string'
      ? document.querySelector(element)
      : element;

    if (!this.element) {
      throw new Error('GestureRecognizer: Element not found');
    }

    this.options = { ...GestureRecognizer.defaults(), ...options };
    this.handlers = new Map();

    this._state = {
      initialAngle: 0,
      isDragging: false,
      dragStartX: 0,
      dragStartY: 0
    };

    this._onTouchStart = this._handleTouchStart.bind(this);
    this._onTouchMove = this._handleTouchMove.bind(this);
    this._onTouchEnd = this._handleTouchEnd.bind(this);

    // 마우스 이벤트 핸들러 (데스크톱 fallback)
    this._onMouseDown = this._handleMouseDown.bind(this);
    this._onMouseMove = this._handleMouseMove.bind(this);
    this._onMouseUp = this._handleMouseUp.bind(this);
    this._isMouseDown = false;

    this._bindEvents();
  }

  _bindEvents() {
    // 터치 이벤트
    this.element.addEventListener('touchstart', this._onTouchStart, { passive: false });
    this.element.addEventListener('touchmove', this._onTouchMove, { passive: false });
    this.element.addEventListener('touchend', this._onTouchEnd, { passive: true });

    // 마우스 이벤트 (데스크톱 fallback)
    this.element.addEventListener('mousedown', this._onMouseDown);
    document.addEventListener('mousemove', this._onMouseMove);
    document.addEventListener('mouseup', this._onMouseUp);
  }

  /**
   * 마우스 다운 핸들러 (데스크톱 fallback)
   * @private
   */
  _handleMouseDown(e) {
    this._isMouseDown = true;
    this._state.dragStartX = e.clientX;
    this._state.dragStartY = e.clientY;
    this._state.isDragging = false;
  }

  /**
   * 마우스 이동 핸들러 (데스크톱 fallback)
   * @private
   */
  _handleMouseMove(e) {
    if (!this._isMouseDown) return;

    const deltaX = e.clientX - this._state.dragStartX;
    const deltaY = e.clientY - this._state.dragStartY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    if (!this._state.isDragging && distance > this.options.dragThreshold) {
      this._state.isDragging = true;
      this._emit('dragstart', {
        x: this._state.dragStartX,
        y: this._state.dragStartY
      });
    }

    if (this._state.isDragging) {
      this._emit('drag', {
        x: e.clientX,
        y: e.clientY,
        deltaX,
        deltaY
      });
    }
  }

  /**
   * 마우스 업 핸들러 (데스크톱 fallback)
   * @private
   */
  _handleMouseUp(e) {
    if (!this._isMouseDown) return;
    this._isMouseDown = false;

    if (this._state.isDragging) {
      this._emit('dragend', {
        x: e.clientX,
        y: e.clientY
      });
      this._state.isDragging = false;
    }
  }

  _handleTouchStart(e) {
    if (e.touches.length === 2) {
      this._state.initialAngle = this._getAngle(e.touches[0], e.touches[1]);
    }

    if (e.touches.length === 1) {
      this._state.dragStartX = e.touches[0].clientX;
      this._state.dragStartY = e.touches[0].clientY;
    }
  }

  _handleTouchMove(e) {
    // 회전 감지
    if (e.touches.length === 2) {
      const currentAngle = this._getAngle(e.touches[0], e.touches[1]);
      const rotation = currentAngle - this._state.initialAngle;

      if (Math.abs(rotation) > this.options.rotationThreshold) {
        this._emit('rotate', {
          angle: rotation,
          direction: rotation > 0 ? 'clockwise' : 'counterclockwise'
        });
      }
    }

    // 드래그 감지
    if (e.touches.length === 1) {
      const deltaX = e.touches[0].clientX - this._state.dragStartX;
      const deltaY = e.touches[0].clientY - this._state.dragStartY;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      if (!this._state.isDragging && distance > this.options.dragThreshold) {
        this._state.isDragging = true;
        this._emit('dragstart', {
          x: this._state.dragStartX,
          y: this._state.dragStartY
        });
      }

      if (this._state.isDragging) {
        this._emit('drag', {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
          deltaX,
          deltaY
        });
        e.preventDefault();
      }
    }
  }

  _handleTouchEnd(e) {
    if (this._state.isDragging) {
      const touch = e.changedTouches[0];
      this._emit('dragend', {
        x: touch.clientX,
        y: touch.clientY
      });
      this._state.isDragging = false;
    }
  }

  _getAngle(touch1, touch2) {
    const dx = touch2.clientX - touch1.clientX;
    const dy = touch2.clientY - touch1.clientY;
    return Math.atan2(dy, dx) * 180 / Math.PI;
  }

  on(event, handler) {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, []);
    }
    this.handlers.get(event).push(handler);
    return () => this.off(event, handler);
  }

  off(event, handler) {
    if (!this.handlers.has(event)) return;

    if (handler) {
      const handlers = this.handlers.get(event);
      const index = handlers.indexOf(handler);
      if (index !== -1) handlers.splice(index, 1);
    } else {
      this.handlers.delete(event);
    }
  }

  _emit(event, data) {
    if (!this.handlers.has(event)) return;
    this.handlers.get(event).forEach(handler => {
      try {
        handler(data);
      } catch (error) {
        console.error(`GestureRecognizer: Error in ${event} handler:`, error);
      }
    });
  }

  destroy() {
    // 터치 이벤트 리스너 제거
    this.element.removeEventListener('touchstart', this._onTouchStart);
    this.element.removeEventListener('touchmove', this._onTouchMove);
    this.element.removeEventListener('touchend', this._onTouchEnd);

    // 마우스 이벤트 리스너 제거
    this.element.removeEventListener('mousedown', this._onMouseDown);
    document.removeEventListener('mousemove', this._onMouseMove);
    document.removeEventListener('mouseup', this._onMouseUp);

    this.handlers.clear();
    this.element = null;
    this._isMouseDown = false;
  }
}

/**
 * Pull-to-Refresh 컴포넌트
 * @class PullToRefresh
 */
export class PullToRefresh {
  static defaults() {
    return {
      threshold: 80,             // 새로고침 트리거 거리 (px)
      resistance: 2.5,           // 당김 저항값
      refreshTimeout: 2000,      // 새로고침 최대 시간 (ms)
      indicatorElement: null,    // 커스텀 인디케이터 요소
      onRefresh: null            // 새로고침 콜백
    };
  }

  constructor(element, options = {}) {
    this.element = typeof element === 'string'
      ? document.querySelector(element)
      : element;

    if (!this.element) {
      throw new Error('PullToRefresh: Element not found');
    }

    this.options = { ...PullToRefresh.defaults(), ...options };
    this._state = {
      isPulling: false,
      isRefreshing: false,
      startY: 0,
      pullDistance: 0
    };

    this._indicator = null;
    this._createIndicator();
    this._bindEvents();
  }

  _createIndicator() {
    if (this.options.indicatorElement) {
      this._indicator = this.options.indicatorElement;
    } else {
      this._indicator = document.createElement('div');
      this._indicator.className = 'ptr-indicator';
      this._indicator.innerHTML = `
        <div class="ptr-spinner"></div>
        <span class="ptr-text">당겨서 새로고침</span>
      `;
      this.element.parentNode.insertBefore(this._indicator, this.element);
    }
  }

  _bindEvents() {
    this._onTouchStart = this._handleTouchStart.bind(this);
    this._onTouchMove = this._handleTouchMove.bind(this);
    this._onTouchEnd = this._handleTouchEnd.bind(this);

    this.element.addEventListener('touchstart', this._onTouchStart, { passive: true });
    this.element.addEventListener('touchmove', this._onTouchMove, { passive: false });
    this.element.addEventListener('touchend', this._onTouchEnd, { passive: true });
  }

  _handleTouchStart(e) {
    if (this._state.isRefreshing) return;
    if (this.element.scrollTop > 0) return;

    this._state.startY = e.touches[0].clientY;
    this._state.isPulling = true;
  }

  _handleTouchMove(e) {
    if (!this._state.isPulling || this._state.isRefreshing) return;

    const deltaY = e.touches[0].clientY - this._state.startY;

    if (deltaY > 0 && this.element.scrollTop === 0) {
      e.preventDefault();
      this._state.pullDistance = deltaY / this.options.resistance;
      this._updateIndicator();
    }
  }

  _handleTouchEnd() {
    if (!this._state.isPulling) return;

    if (this._state.pullDistance >= this.options.threshold) {
      this._startRefresh();
    } else {
      this._reset();
    }

    this._state.isPulling = false;
  }

  _updateIndicator() {
    const progress = Math.min(this._state.pullDistance / this.options.threshold, 1);
    this._indicator.style.transform = `translateY(${this._state.pullDistance}px)`;
    this._indicator.style.opacity = progress;

    if (progress >= 1) {
      this._indicator.classList.add('ptr-ready');
    } else {
      this._indicator.classList.remove('ptr-ready');
    }
  }

  _startRefresh() {
    this._state.isRefreshing = true;
    this._indicator.classList.add('ptr-refreshing');
    this._indicator.style.transform = `translateY(${this.options.threshold}px)`;

    const refreshPromise = this.options.onRefresh?.();

    if (refreshPromise instanceof Promise) {
      Promise.race([
        refreshPromise,
        new Promise(resolve => setTimeout(resolve, this.options.refreshTimeout))
      ]).finally(() => this._reset());
    } else {
      setTimeout(() => this._reset(), this.options.refreshTimeout);
    }
  }

  _reset() {
    this._state.pullDistance = 0;
    this._state.isRefreshing = false;
    this._indicator.style.transform = 'translateY(0)';
    this._indicator.style.opacity = 0;
    this._indicator.classList.remove('ptr-ready', 'ptr-refreshing');
  }

  destroy() {
    this.element.removeEventListener('touchstart', this._onTouchStart);
    this.element.removeEventListener('touchmove', this._onTouchMove);
    this.element.removeEventListener('touchend', this._onTouchEnd);

    if (this._indicator && !this.options.indicatorElement) {
      this._indicator.remove();
    }

    this.element = null;
    this._indicator = null;
  }
}

export default {
  TouchManager,
  GestureRecognizer,
  PullToRefresh
};
