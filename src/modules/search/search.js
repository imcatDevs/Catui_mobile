/**
 * CATUI Mobile - Search Module
 * SearchBar, SearchHistory, SearchFilter, SearchSuggestion 컴포넌트
 * @module search
 */

/**
 * SearchBar 클래스 - 확장형 검색바
 * @class SearchBar
 */
class SearchBar {
  /**
   * @constructor
   * @param {Object} options
   * @param {string|HTMLElement} options.container - 컨테이너
   * @param {string} [options.placeholder='검색'] - 플레이스홀더
   * @param {boolean} [options.expandable=false] - 확장형 (아이콘 → 입력창)
   * @param {boolean} [options.showCancel=true] - 취소 버튼 표시
   * @param {string} [options.cancelText='취소'] - 취소 버튼 텍스트
   * @param {boolean} [options.showClear=true] - 지우기 버튼 표시
   * @param {boolean} [options.autofocus=false] - 자동 포커스
   * @param {number} [options.debounce=300] - 디바운스 시간 (ms)
   * @param {string} [options.leftIcon='search'] - 왼쪽 아이콘
   * @param {Function} [options.onSearch] - 검색 콜백
   * @param {Function} [options.onInput] - 입력 콜백
   * @param {Function} [options.onFocus] - 포커스 콜백
   * @param {Function} [options.onBlur] - 블러 콜백
   * @param {Function} [options.onCancel] - 취소 콜백
   * @param {Function} [options.onClear] - 지우기 콜백
   */
  constructor(options = {}) {
    this.options = {
      container: null,
      placeholder: '검색',
      expandable: false,
      showCancel: true,
      cancelText: '취소',
      showClear: true,
      autofocus: false,
      debounce: 300,
      leftIcon: 'search',
      onSearch: null,
      onInput: null,
      onFocus: null,
      onBlur: null,
      onCancel: null,
      onClear: null,
      ...options
    };

    this._container = typeof this.options.container === 'string'
      ? document.querySelector(this.options.container)
      : this.options.container;

    this._handlers = {};
    this._input = null;
    this._isExpanded = !this.options.expandable;
    this._debounceTimer = null;

    if (this._container) {
      this._render();
      this._bindEvents();

      if (this.options.autofocus && !this.options.expandable) {
        this._input?.focus();
      }
    }
  }

  /**
   * 렌더링
   * @private
   */
  _render() {
    const expandableClass = this.options.expandable ? 'is-expandable' : '';
    const expandedClass = this._isExpanded ? 'is-expanded' : '';

    this._container.className = `catui-searchbar ${expandableClass} ${expandedClass}`.trim();

    this._container.innerHTML = `
      ${this.options.expandable ? `
        <button class="catui-searchbar-trigger" type="button">
          <span class="material-icons">${this.options.leftIcon}</span>
        </button>
      ` : ''}
      <div class="catui-searchbar-field">
        <span class="catui-searchbar-icon material-icons">${this.options.leftIcon}</span>
        <input 
          type="search" 
          class="catui-searchbar-input" 
          placeholder="${this.options.placeholder}"
          autocomplete="off"
        />
        ${this.options.showClear ? `
          <button class="catui-searchbar-clear" type="button" style="display: none;">
            <span class="material-icons">close</span>
          </button>
        ` : ''}
      </div>
      ${this.options.showCancel ? `
        <button class="catui-searchbar-cancel" type="button">${this.options.cancelText}</button>
      ` : ''}
    `;

    this._input = this._container.querySelector('.catui-searchbar-input');
    this._clearBtn = this._container.querySelector('.catui-searchbar-clear');
    this._cancelBtn = this._container.querySelector('.catui-searchbar-cancel');
    this._trigger = this._container.querySelector('.catui-searchbar-trigger');
  }

  /**
   * 이벤트 바인딩
   * @private
   */
  _bindEvents() {
    // 입력
    this._handlers.input = (e) => {
      const value = e.target.value;
      
      // 지우기 버튼 표시/숨김
      if (this._clearBtn) {
        this._clearBtn.style.display = value ? 'flex' : 'none';
      }

      // 디바운스 적용
      if (this._debounceTimer) {
        clearTimeout(this._debounceTimer);
      }

      this._debounceTimer = setTimeout(() => {
        if (this.options.onInput) {
          this.options.onInput(value);
        }
      }, this.options.debounce);
    };

    // 검색 (Enter)
    this._handlers.keydown = (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (this._debounceTimer) {
          clearTimeout(this._debounceTimer);
        }
        if (this.options.onSearch) {
          this.options.onSearch(this._input.value);
        }
      }
    };

    // 포커스
    this._handlers.focus = () => {
      this._container.classList.add('is-focused');
      if (this.options.onFocus) {
        this.options.onFocus();
      }
    };

    // 블러
    this._handlers.blur = () => {
      this._container.classList.remove('is-focused');
      if (this.options.onBlur) {
        this.options.onBlur();
      }
    };

    // 지우기
    this._handlers.clear = () => {
      this._input.value = '';
      this._input.focus();
      if (this._clearBtn) {
        this._clearBtn.style.display = 'none';
      }
      if (this.options.onClear) {
        this.options.onClear();
      }
    };

    // 취소
    this._handlers.cancel = () => {
      this._input.value = '';
      this._input.blur();
      if (this._clearBtn) {
        this._clearBtn.style.display = 'none';
      }
      
      if (this.options.expandable) {
        this._isExpanded = false;
        this._container.classList.remove('is-expanded');
      }

      if (this.options.onCancel) {
        this.options.onCancel();
      }
    };

    // 확장 트리거
    this._handlers.trigger = () => {
      this._isExpanded = true;
      this._container.classList.add('is-expanded');
      setTimeout(() => {
        this._input?.focus();
      }, 100);
    };

    // 이벤트 등록
    this._input.addEventListener('input', this._handlers.input);
    this._input.addEventListener('keydown', this._handlers.keydown);
    this._input.addEventListener('focus', this._handlers.focus);
    this._input.addEventListener('blur', this._handlers.blur);

    if (this._clearBtn) {
      this._clearBtn.addEventListener('click', this._handlers.clear);
    }
    if (this._cancelBtn) {
      this._cancelBtn.addEventListener('click', this._handlers.cancel);
    }
    if (this._trigger) {
      this._trigger.addEventListener('click', this._handlers.trigger);
    }
  }

  /**
   * 값 가져오기
   * @returns {string}
   */
  getValue() {
    return this._input?.value || '';
  }

  /**
   * 값 설정
   * @param {string} value
   */
  setValue(value) {
    if (this._input) {
      this._input.value = value;
      if (this._clearBtn) {
        this._clearBtn.style.display = value ? 'flex' : 'none';
      }
    }
  }

  /**
   * 포커스
   */
  focus() {
    if (this.options.expandable && !this._isExpanded) {
      this._handlers.trigger();
    } else {
      this._input?.focus();
    }
  }

  /**
   * 블러
   */
  blur() {
    this._input?.blur();
  }

  /**
   * 지우기
   */
  clear() {
    this._handlers.clear();
  }

  /**
   * 확장
   */
  expand() {
    if (this.options.expandable) {
      this._handlers.trigger();
    }
  }

  /**
   * 축소
   */
  collapse() {
    if (this.options.expandable) {
      this._handlers.cancel();
    }
  }

  /**
   * 정리
   */
  destroy() {
    // 디바운스 타이머 정리
    if (this._debounceTimer) {
      clearTimeout(this._debounceTimer);
    }

    // 이벤트 제거
    this._input?.removeEventListener('input', this._handlers.input);
    this._input?.removeEventListener('keydown', this._handlers.keydown);
    this._input?.removeEventListener('focus', this._handlers.focus);
    this._input?.removeEventListener('blur', this._handlers.blur);
    this._clearBtn?.removeEventListener('click', this._handlers.clear);
    this._cancelBtn?.removeEventListener('click', this._handlers.cancel);
    this._trigger?.removeEventListener('click', this._handlers.trigger);

    // DOM 정리
    this._container.innerHTML = '';
    this._container.className = '';

    // 참조 해제
    this._container = null;
    this._input = null;
    this._clearBtn = null;
    this._cancelBtn = null;
    this._trigger = null;
    this._handlers = null;
    this._debounceTimer = null;
    this.options = null;
  }
}

/**
 * SearchHistory 클래스 - 최근 검색어
 * @class SearchHistory
 */
class SearchHistory {
  /**
   * @constructor
   * @param {Object} options
   * @param {string|HTMLElement} options.container - 컨테이너
   * @param {string} [options.storageKey='catui_search_history'] - 로컬스토리지 키
   * @param {number} [options.maxItems=10] - 최대 저장 수
   * @param {string} [options.title='최근 검색'] - 제목
   * @param {boolean} [options.showClearAll=true] - 전체 삭제 버튼
   * @param {string} [options.clearAllText='전체 삭제'] - 전체 삭제 텍스트
   * @param {string} [options.emptyText='최근 검색어가 없습니다'] - 빈 상태 텍스트
   * @param {Function} [options.onSelect] - 선택 콜백
   * @param {Function} [options.onRemove] - 삭제 콜백
   * @param {Function} [options.onClear] - 전체 삭제 콜백
   */
  constructor(options = {}) {
    this.options = {
      container: null,
      storageKey: 'catui_search_history',
      maxItems: 10,
      title: '최근 검색',
      showClearAll: true,
      clearAllText: '전체 삭제',
      emptyText: '최근 검색어가 없습니다',
      onSelect: null,
      onRemove: null,
      onClear: null,
      ...options
    };

    this._container = typeof this.options.container === 'string'
      ? document.querySelector(this.options.container)
      : this.options.container;

    this._handlers = {};
    this._items = this._loadFromStorage();

    if (this._container) {
      this._render();
      this._bindEvents();
    }
  }

  /**
   * 로컬스토리지에서 로드
   * @private
   */
  _loadFromStorage() {
    try {
      const data = localStorage.getItem(this.options.storageKey);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  /**
   * 로컬스토리지에 저장
   * @private
   */
  _saveToStorage() {
    try {
      localStorage.setItem(this.options.storageKey, JSON.stringify(this._items));
    } catch {
      // 스토리지 오류 무시
    }
  }

  /**
   * 렌더링
   * @private
   */
  _render() {
    this._container.className = 'catui-search-history';

    if (this._items.length === 0) {
      this._container.innerHTML = `
        <div class="catui-search-history-empty">${this.options.emptyText}</div>
      `;
      return;
    }

    this._container.innerHTML = `
      <div class="catui-search-history-header">
        <span class="catui-search-history-title">${this.options.title}</span>
        ${this.options.showClearAll ? `
          <button class="catui-search-history-clearall" type="button">${this.options.clearAllText}</button>
        ` : ''}
      </div>
      <div class="catui-search-history-list">
        ${this._items.map((item, index) => `
          <div class="catui-search-history-item" data-index="${index}">
            <span class="catui-search-history-icon material-icons">history</span>
            <span class="catui-search-history-text">${item}</span>
            <button class="catui-search-history-remove" type="button" data-index="${index}">
              <span class="material-icons">close</span>
            </button>
          </div>
        `).join('')}
      </div>
    `;
  }

  /**
   * 이벤트 바인딩
   * @private
   */
  _bindEvents() {
    // 기존 이벤트 제거
    this._unbindEvents();

    // 아이템 클릭
    this._handlers.itemClick = (e) => {
      const item = e.target.closest('.catui-search-history-item');
      const removeBtn = e.target.closest('.catui-search-history-remove');

      if (removeBtn) {
        const index = parseInt(removeBtn.dataset.index);
        this.remove(index);
        return;
      }

      if (item) {
        const index = parseInt(item.dataset.index);
        const text = this._items[index];
        if (text && this.options.onSelect) {
          this.options.onSelect(text);
        }
      }
    };

    // 전체 삭제
    this._handlers.clearAll = () => {
      this.clear();
    };

    this._container.addEventListener('click', this._handlers.itemClick);

    const clearAllBtn = this._container.querySelector('.catui-search-history-clearall');
    if (clearAllBtn) {
      clearAllBtn.addEventListener('click', this._handlers.clearAll);
    }
  }

  /**
   * 이벤트 해제
   * @private
   */
  _unbindEvents() {
    if (this._handlers.itemClick) {
      this._container.removeEventListener('click', this._handlers.itemClick);
    }
  }

  /**
   * 검색어 추가
   * @param {string} text
   */
  add(text) {
    if (!text || typeof text !== 'string') return;
    
    text = text.trim();
    if (!text) return;

    // 중복 제거
    this._items = this._items.filter(item => item !== text);
    
    // 맨 앞에 추가
    this._items.unshift(text);
    
    // 최대 개수 제한
    if (this._items.length > this.options.maxItems) {
      this._items = this._items.slice(0, this.options.maxItems);
    }

    this._saveToStorage();
    this._render();
    this._bindEvents();
  }

  /**
   * 검색어 제거
   * @param {number} index
   */
  remove(index) {
    if (index < 0 || index >= this._items.length) return;

    const removed = this._items.splice(index, 1)[0];
    this._saveToStorage();
    this._render();
    this._bindEvents();

    if (this.options.onRemove) {
      this.options.onRemove(removed, index);
    }
  }

  /**
   * 전체 삭제
   */
  clear() {
    this._items = [];
    this._saveToStorage();
    this._render();
    this._bindEvents();

    if (this.options.onClear) {
      this.options.onClear();
    }
  }

  /**
   * 검색어 목록 가져오기
   * @returns {Array}
   */
  getItems() {
    return [...this._items];
  }

  /**
   * 표시
   */
  show() {
    this._container.style.display = '';
  }

  /**
   * 숨김
   */
  hide() {
    this._container.style.display = 'none';
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
 * SearchFilter 클래스 - 필터 UI (바텀시트)
 * @class SearchFilter
 */
class SearchFilter {
  /**
   * @constructor
   * @param {Object} options
   * @param {Array} options.filters - 필터 배열 [{id, label, type, options?, value?}]
   * @param {string} [options.title='필터'] - 제목
   * @param {string} [options.applyText='적용'] - 적용 버튼 텍스트
   * @param {string} [options.resetText='초기화'] - 초기화 버튼 텍스트
   * @param {Function} [options.onApply] - 적용 콜백
   * @param {Function} [options.onReset] - 초기화 콜백
   * @param {Function} [options.onChange] - 변경 콜백
   */
  constructor(options = {}) {
    this.options = {
      filters: [],
      title: '필터',
      applyText: '적용',
      resetText: '초기화',
      onApply: null,
      onReset: null,
      onChange: null,
      ...options
    };

    this._overlay = null;
    this._handlers = {};
    this._isOpen = false;
    this._values = {};
    this._timers = [];

    // 초기값 설정
    this.options.filters.forEach(filter => {
      this._values[filter.id] = filter.value !== undefined ? filter.value : null;
    });
  }

  /**
   * 열기
   */
  open() {
    if (this._isOpen) return;
    this._isOpen = true;

    this._overlay = document.createElement('div');
    this._overlay.className = 'catui-search-filter-overlay';
    this._overlay.innerHTML = this._renderContent();
    document.body.appendChild(this._overlay);

    // 애니메이션
    requestAnimationFrame(() => {
      this._overlay.classList.add('is-visible');
    });

    this._bindEvents();
  }

  /**
   * 내용 렌더링
   * @private
   */
  _renderContent() {
    return `
      <div class="catui-search-filter-sheet">
        <div class="catui-search-filter-header">
          <button class="catui-search-filter-reset" type="button">${this.options.resetText}</button>
          <span class="catui-search-filter-title">${this.options.title}</span>
          <button class="catui-search-filter-close" type="button">
            <span class="material-icons">close</span>
          </button>
        </div>
        <div class="catui-search-filter-body">
          ${this.options.filters.map(filter => this._renderFilter(filter)).join('')}
        </div>
        <div class="catui-search-filter-footer">
          <button class="catui-search-filter-apply" type="button">${this.options.applyText}</button>
        </div>
      </div>
    `;
  }

  /**
   * 필터 렌더링
   * @private
   */
  _renderFilter(filter) {
    let content = '';

    switch (filter.type) {
      case 'select':
        content = `
          <select class="catui-search-filter-select" data-id="${filter.id}">
            <option value="">선택</option>
            ${(filter.options || []).map(opt => `
              <option value="${opt.value}" ${this._values[filter.id] === opt.value ? 'selected' : ''}>
                ${opt.label}
              </option>
            `).join('')}
          </select>
        `;
        break;

      case 'checkbox':
        content = `
          <div class="catui-search-filter-checkboxes" data-id="${filter.id}">
            ${(filter.options || []).map(opt => `
              <label class="catui-search-filter-checkbox">
                <input type="checkbox" value="${opt.value}" 
                  ${(this._values[filter.id] || []).includes(opt.value) ? 'checked' : ''}
                />
                <span>${opt.label}</span>
              </label>
            `).join('')}
          </div>
        `;
        break;

      case 'radio':
        content = `
          <div class="catui-search-filter-radios" data-id="${filter.id}">
            ${(filter.options || []).map(opt => `
              <label class="catui-search-filter-radio">
                <input type="radio" name="${filter.id}" value="${opt.value}"
                  ${this._values[filter.id] === opt.value ? 'checked' : ''}
                />
                <span>${opt.label}</span>
              </label>
            `).join('')}
          </div>
        `;
        break;

      case 'range':
        const value = this._values[filter.id] || filter.min || 0;
        content = `
          <div class="catui-search-filter-range" data-id="${filter.id}">
            <input type="range" 
              min="${filter.min || 0}" 
              max="${filter.max || 100}" 
              value="${value}"
            />
            <span class="catui-search-filter-range-value">${value}</span>
          </div>
        `;
        break;

      case 'chips':
        content = `
          <div class="catui-search-filter-chips" data-id="${filter.id}">
            ${(filter.options || []).map(opt => `
              <button class="catui-search-filter-chip ${this._values[filter.id] === opt.value ? 'is-active' : ''}"
                type="button" data-value="${opt.value}">
                ${opt.label}
              </button>
            `).join('')}
          </div>
        `;
        break;
    }

    return `
      <div class="catui-search-filter-item">
        <div class="catui-search-filter-label">${filter.label}</div>
        <div class="catui-search-filter-control">${content}</div>
      </div>
    `;
  }

  /**
   * 이벤트 바인딩
   * @private
   */
  _bindEvents() {
    // 닫기
    this._handlers.close = () => {
      this.close();
    };

    // 오버레이 클릭
    this._handlers.overlayClick = (e) => {
      if (e.target === this._overlay) {
        this.close();
      }
    };

    // 초기화
    this._handlers.reset = () => {
      this._values = {};
      this.options.filters.forEach(filter => {
        this._values[filter.id] = filter.value !== undefined ? filter.value : null;
      });
      
      // UI 업데이트
      this._overlay.querySelector('.catui-search-filter-body').innerHTML = 
        this.options.filters.map(filter => this._renderFilter(filter)).join('');
      
      this._bindFilterEvents();

      if (this.options.onReset) {
        this.options.onReset();
      }
    };

    // 적용
    this._handlers.apply = () => {
      if (this.options.onApply) {
        this.options.onApply(this.getValues());
      }
      this.close();
    };

    // 이벤트 등록
    this._overlay.querySelector('.catui-search-filter-close')?.addEventListener('click', this._handlers.close);
    this._overlay.querySelector('.catui-search-filter-reset')?.addEventListener('click', this._handlers.reset);
    this._overlay.querySelector('.catui-search-filter-apply')?.addEventListener('click', this._handlers.apply);
    this._overlay.addEventListener('click', this._handlers.overlayClick);

    this._bindFilterEvents();
  }

  /**
   * 필터 이벤트 바인딩
   * @private
   */
  _bindFilterEvents() {
    // Select
    this._overlay.querySelectorAll('.catui-search-filter-select').forEach(select => {
      select.addEventListener('change', (e) => {
        this._values[e.target.dataset.id] = e.target.value || null;
        this._triggerChange();
      });
    });

    // Checkbox
    this._overlay.querySelectorAll('.catui-search-filter-checkboxes').forEach(container => {
      const id = container.dataset.id;
      container.querySelectorAll('input').forEach(input => {
        input.addEventListener('change', () => {
          const checked = Array.from(container.querySelectorAll('input:checked')).map(i => i.value);
          this._values[id] = checked.length ? checked : null;
          this._triggerChange();
        });
      });
    });

    // Radio
    this._overlay.querySelectorAll('.catui-search-filter-radios').forEach(container => {
      const id = container.dataset.id;
      container.querySelectorAll('input').forEach(input => {
        input.addEventListener('change', () => {
          this._values[id] = input.value;
          this._triggerChange();
        });
      });
    });

    // Range
    this._overlay.querySelectorAll('.catui-search-filter-range').forEach(container => {
      const id = container.dataset.id;
      const input = container.querySelector('input');
      const valueEl = container.querySelector('.catui-search-filter-range-value');
      
      input.addEventListener('input', () => {
        this._values[id] = parseInt(input.value);
        valueEl.textContent = input.value;
        this._triggerChange();
      });
    });

    // Chips
    this._overlay.querySelectorAll('.catui-search-filter-chips').forEach(container => {
      const id = container.dataset.id;
      container.querySelectorAll('.catui-search-filter-chip').forEach(chip => {
        chip.addEventListener('click', () => {
          container.querySelectorAll('.catui-search-filter-chip').forEach(c => c.classList.remove('is-active'));
          chip.classList.add('is-active');
          this._values[id] = chip.dataset.value;
          this._triggerChange();
        });
      });
    });
  }

  /**
   * 변경 이벤트 트리거
   * @private
   */
  _triggerChange() {
    if (this.options.onChange) {
      this.options.onChange(this.getValues());
    }
  }

  /**
   * 값 가져오기
   * @returns {Object}
   */
  getValues() {
    const result = {};
    for (const key in this._values) {
      if (this._values[key] !== null && this._values[key] !== undefined) {
        result[key] = this._values[key];
      }
    }
    return result;
  }

  /**
   * 값 설정
   * @param {Object} values
   */
  setValues(values) {
    this._values = { ...this._values, ...values };
  }

  /**
   * 활성 필터 수
   * @returns {number}
   */
  getActiveCount() {
    return Object.values(this._values).filter(v => 
      v !== null && v !== undefined && (Array.isArray(v) ? v.length > 0 : true)
    ).length;
  }

  /**
   * 닫기
   */
  close() {
    if (!this._isOpen) return;
    this._isOpen = false;

    this._overlay?.classList.remove('is-visible');

    const timerId = setTimeout(() => {
      if (this._overlay) {
        this._overlay.querySelector('.catui-search-filter-close')?.removeEventListener('click', this._handlers.close);
        this._overlay.querySelector('.catui-search-filter-reset')?.removeEventListener('click', this._handlers.reset);
        this._overlay.querySelector('.catui-search-filter-apply')?.removeEventListener('click', this._handlers.apply);
        this._overlay.removeEventListener('click', this._handlers.overlayClick);

        this._overlay.remove();
        this._overlay = null;
      }
    }, 300);
    this._timers.push(timerId);
  }

  /**
   * 정리
   */
  destroy() {
    // 타이머 정리
    this._timers.forEach(id => clearTimeout(id));
    this._timers = [];

    this.close();
    this._handlers = null;
    this._values = null;
    this.options = null;
  }
}

/**
 * SearchSuggestion 클래스 - 검색어 자동완성
 * @class SearchSuggestion
 */
class SearchSuggestion {
  /**
   * @constructor
   * @param {Object} options
   * @param {string|HTMLElement} options.container - 컨테이너
   * @param {Array} [options.items=[]] - 추천 항목 배열
   * @param {Function} [options.fetchSuggestions] - 비동기 추천 함수
   * @param {number} [options.minLength=1] - 최소 입력 길이
   * @param {number} [options.maxItems=10] - 최대 표시 수
   * @param {boolean} [options.highlight=true] - 검색어 하이라이트
   * @param {string} [options.emptyText='검색 결과가 없습니다'] - 빈 상태 텍스트
   * @param {boolean} [options.showEmpty=false] - 결과 없을 때 표시
   * @param {Function} [options.onSelect] - 선택 콜백
   * @param {Function} [options.renderItem] - 커스텀 렌더러
   */
  constructor(options = {}) {
    this.options = {
      container: null,
      items: [],
      fetchSuggestions: null,
      minLength: 1,
      maxItems: 10,
      highlight: true,
      emptyText: '검색 결과가 없습니다',
      showEmpty: false,
      onSelect: null,
      renderItem: null,
      ...options
    };

    this._container = typeof this.options.container === 'string'
      ? document.querySelector(this.options.container)
      : this.options.container;

    this._handlers = {};
    this._query = '';
    this._suggestions = [];
    this._selectedIndex = -1;
    this._isLoading = false;

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
    this._container.className = 'catui-search-suggestion';
    this._container.innerHTML = '';

    if (this._isLoading) {
      this._container.innerHTML = `
        <div class="catui-search-suggestion-loading">
          <span class="material-icons spin">hourglass_empty</span>
          검색 중...
        </div>
      `;
      return;
    }

    if (this._suggestions.length === 0) {
      if (this.options.showEmpty && this._query.length >= this.options.minLength) {
        this._container.innerHTML = `
          <div class="catui-search-suggestion-empty">${this.options.emptyText}</div>
        `;
      }
      return;
    }

    this._container.innerHTML = `
      <div class="catui-search-suggestion-list">
        ${this._suggestions.slice(0, this.options.maxItems).map((item, index) => {
          if (this.options.renderItem) {
            return this.options.renderItem(item, index, this._query);
          }
          
          const text = typeof item === 'string' ? item : item.text || item.label || item.title;
          const highlighted = this.options.highlight ? this._highlight(text, this._query) : text;
          const icon = item.icon || 'search';

          return `
            <div class="catui-search-suggestion-item ${index === this._selectedIndex ? 'is-selected' : ''}" 
              data-index="${index}">
              <span class="catui-search-suggestion-icon material-icons">${icon}</span>
              <span class="catui-search-suggestion-text">${highlighted}</span>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  /**
   * 하이라이트
   * @private
   */
  _highlight(text, query) {
    if (!query) return text;
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  }

  /**
   * 이벤트 바인딩
   * @private
   */
  _bindEvents() {
    this._unbindEvents();

    this._handlers.click = (e) => {
      const item = e.target.closest('.catui-search-suggestion-item');
      if (!item) return;

      const index = parseInt(item.dataset.index);
      this._selectItem(index);
    };

    this._container.addEventListener('click', this._handlers.click);
  }

  /**
   * 이벤트 해제
   * @private
   */
  _unbindEvents() {
    if (this._handlers.click) {
      this._container.removeEventListener('click', this._handlers.click);
    }
  }

  /**
   * 아이템 선택
   * @private
   */
  _selectItem(index) {
    if (index < 0 || index >= this._suggestions.length) return;

    const item = this._suggestions[index];
    if (this.options.onSelect) {
      this.options.onSelect(item, index);
    }
  }

  /**
   * 검색어 업데이트
   * @param {string} query
   */
  async update(query) {
    this._query = query;
    this._selectedIndex = -1;

    if (query.length < this.options.minLength) {
      this._suggestions = [];
      this._render();
      return;
    }

    // 비동기 fetch
    if (this.options.fetchSuggestions) {
      this._isLoading = true;
      this._render();

      try {
        this._suggestions = await this.options.fetchSuggestions(query);
      } catch {
        this._suggestions = [];
      }

      this._isLoading = false;
      this._render();
      this._bindEvents();
      return;
    }

    // 정적 필터링
    const lowerQuery = query.toLowerCase();
    this._suggestions = this.options.items.filter(item => {
      const text = typeof item === 'string' ? item : item.text || item.label || item.title || '';
      return text.toLowerCase().includes(lowerQuery);
    });

    this._render();
    this._bindEvents();
  }

  /**
   * 다음 항목 선택
   */
  selectNext() {
    if (this._suggestions.length === 0) return;
    this._selectedIndex = (this._selectedIndex + 1) % this._suggestions.length;
    this._render();
    this._bindEvents();
  }

  /**
   * 이전 항목 선택
   */
  selectPrev() {
    if (this._suggestions.length === 0) return;
    this._selectedIndex = this._selectedIndex <= 0 
      ? this._suggestions.length - 1 
      : this._selectedIndex - 1;
    this._render();
    this._bindEvents();
  }

  /**
   * 현재 선택 항목 가져오기
   * @returns {*}
   */
  getSelected() {
    if (this._selectedIndex >= 0 && this._selectedIndex < this._suggestions.length) {
      return this._suggestions[this._selectedIndex];
    }
    return null;
  }

  /**
   * 선택 확정
   */
  confirmSelection() {
    if (this._selectedIndex >= 0) {
      this._selectItem(this._selectedIndex);
    }
  }

  /**
   * 추천 목록 설정
   * @param {Array} items
   */
  setItems(items) {
    this.options.items = items;
  }

  /**
   * 지우기
   */
  clear() {
    this._query = '';
    this._suggestions = [];
    this._selectedIndex = -1;
    this._render();
  }

  /**
   * 표시
   */
  show() {
    this._container.style.display = '';
  }

  /**
   * 숨김
   */
  hide() {
    this._container.style.display = 'none';
  }

  /**
   * 정리
   */
  destroy() {
    this._unbindEvents();

    this._container.innerHTML = '';
    this._container.className = '';

    this._container = null;
    this._suggestions = null;
    this._handlers = null;
    this.options = null;
  }
}

export { SearchBar, SearchHistory, SearchFilter, SearchSuggestion };
export default { SearchBar, SearchHistory, SearchFilter, SearchSuggestion };
