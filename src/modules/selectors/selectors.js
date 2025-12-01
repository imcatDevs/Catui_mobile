/**
 * CATUI Mobile - Advanced Selectors Module
 * @module selectors
 * @description 고급 선택 컴포넌트 (Autocomplete, MultiSelect, RangeSlider, TagInput)
 */

/**
 * Autocomplete 클래스 - 자동완성 검색
 * @class Autocomplete
 */
class Autocomplete {
  constructor(options = {}) {
    this.options = {
      input: null,
      data: [],
      source: null,
      minLength: 1,
      debounce: 300,
      maxResults: 10,
      highlight: true,
      placeholder: '',
      emptyMessage: '결과 없음',
      renderItem: null,
      onSelect: null,
      onChange: null,
      ...options
    };

    this._input = typeof this.options.input === 'string'
      ? document.querySelector(this.options.input)
      : this.options.input;

    this._dropdown = null;
    this._results = [];
    this._activeIndex = -1;
    this._isOpen = false;
    this._debounceTimer = null;
    this._selectedValue = null;
    this._handlers = {};

    if (this._input) {
      this._init();
      this._bindEvents();
    }
  }

  _init() {
    this._input.classList.add('catui-autocomplete-input');
    this._input.setAttribute('autocomplete', 'off');
    this._input.setAttribute('role', 'combobox');
    this._input.setAttribute('aria-expanded', 'false');

    if (this.options.placeholder) {
      this._input.placeholder = this.options.placeholder;
    }

    this._wrapper = document.createElement('div');
    this._wrapper.className = 'catui-autocomplete';
    this._input.parentNode.insertBefore(this._wrapper, this._input);
    this._wrapper.appendChild(this._input);

    this._dropdown = document.createElement('div');
    this._dropdown.className = 'catui-autocomplete-dropdown';
    this._dropdown.setAttribute('role', 'listbox');
    this._wrapper.appendChild(this._dropdown);
  }

  _bindEvents() {
    this._handlers.input = (e) => {
      const query = e.target.value;
      if (this._debounceTimer) clearTimeout(this._debounceTimer);
      if (query.length < this.options.minLength) { this._close(); return; }
      this._debounceTimer = setTimeout(() => this._search(query), this.options.debounce);
    };

    this._handlers.keydown = (e) => {
      if (!this._isOpen) {
        if (e.key === 'ArrowDown' && this._input.value.length >= this.options.minLength) {
          this._search(this._input.value);
        }
        return;
      }
      switch (e.key) {
        case 'ArrowDown': e.preventDefault(); this._navigate(1); break;
        case 'ArrowUp': e.preventDefault(); this._navigate(-1); break;
        case 'Enter': e.preventDefault(); if (this._activeIndex >= 0) this._select(this._results[this._activeIndex]); break;
        case 'Escape': this._close(); break;
      }
    };

    this._handlers.blur = () => setTimeout(() => { if (!this._wrapper.contains(document.activeElement)) this._close(); }, 150);
    this._handlers.clickOutside = (e) => { if (!this._wrapper.contains(e.target)) this._close(); };

    this._input.addEventListener('input', this._handlers.input);
    this._input.addEventListener('keydown', this._handlers.keydown);
    this._input.addEventListener('blur', this._handlers.blur);
    document.addEventListener('click', this._handlers.clickOutside);

    this._dropdown.addEventListener('click', (e) => {
      const item = e.target.closest('.catui-autocomplete-item');
      if (item) this._select(this._results[parseInt(item.dataset.index, 10)]);
    });
  }

  async _search(query) {
    let results;
    if (this.options.source) {
      this._dropdown.innerHTML = '<div class="catui-autocomplete-loading"><span class="catui-spinner-sm"></span></div>';
      this._open();
      try { results = await this.options.source(query); } catch (e) { results = []; }
    } else {
      const lq = query.toLowerCase();
      results = this.options.data.filter(item => {
        const text = typeof item === 'string' ? item : (item.label || item.text || item.value || '');
        return text.toLowerCase().includes(lq);
      });
    }
    this._results = results.slice(0, this.options.maxResults);
    this._activeIndex = -1;
    this._render(query);
  }

  _render(query) {
    if (this._results.length === 0) {
      this._dropdown.innerHTML = `<div class="catui-autocomplete-empty">${this.options.emptyMessage}</div>`;
    } else {
      this._dropdown.innerHTML = this._results.map((item, i) => {
        const text = typeof item === 'string' ? item : (item.label || item.text || item.value || '');
        const content = this.options.renderItem ? this.options.renderItem(item, query) : this._highlight(text, query);
        return `<div class="catui-autocomplete-item" data-index="${i}" role="option">${content}</div>`;
      }).join('');
    }
    this._open();
  }

  _highlight(text, query) {
    if (!this.options.highlight || !query) return text;
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  }

  _navigate(dir) {
    const items = this._dropdown.querySelectorAll('.catui-autocomplete-item');
    if (items.length === 0) return;
    items[this._activeIndex]?.classList.remove('is-active');
    this._activeIndex += dir;
    if (this._activeIndex < 0) this._activeIndex = items.length - 1;
    if (this._activeIndex >= items.length) this._activeIndex = 0;
    items[this._activeIndex].classList.add('is-active');
    items[this._activeIndex].scrollIntoView({ block: 'nearest' });
  }

  _select(item) {
    const value = typeof item === 'string' ? item : (item.value || item.label || item.text || '');
    const text = typeof item === 'string' ? item : (item.label || item.text || item.value || '');
    this._input.value = text;
    this._selectedValue = value;
    this._close();
    if (this.options.onSelect) this.options.onSelect(item, value);
    if (this.options.onChange) this.options.onChange(value, item);
  }

  _open() { if (this._isOpen) return; this._isOpen = true; this._dropdown.classList.add('is-open'); this._input.setAttribute('aria-expanded', 'true'); }
  _close() { if (!this._isOpen) return; this._isOpen = false; this._dropdown.classList.remove('is-open'); this._input.setAttribute('aria-expanded', 'false'); this._activeIndex = -1; }

  getValue() { return this._selectedValue; }
  setValue(value, text = null) { this._selectedValue = value; this._input.value = text || value; }
  clear() { this._input.value = ''; this._selectedValue = null; this._results = []; this._close(); }
  setData(data) { this.options.data = data; }

  destroy() {
    if (this._debounceTimer) clearTimeout(this._debounceTimer);
    this._input.removeEventListener('input', this._handlers.input);
    this._input.removeEventListener('keydown', this._handlers.keydown);
    this._input.removeEventListener('blur', this._handlers.blur);
    document.removeEventListener('click', this._handlers.clickOutside);
    if (this._wrapper?.parentNode) { this._wrapper.parentNode.insertBefore(this._input, this._wrapper); this._wrapper.remove(); }
    this._input.classList.remove('catui-autocomplete-input');
    this._input = null; this._wrapper = null; this._dropdown = null; this.options = null;
  }
}

/**
 * MultiSelect 클래스 - 다중 선택
 * @class MultiSelect
 */
class MultiSelect {
  constructor(options = {}) {
    this.options = {
      container: null, options: [], value: [], placeholder: '선택하세요',
      maxSelect: Infinity, searchable: true, clearable: true,
      chips: true, chipVariant: 'default', onChange: null, ...options
    };

    this._container = typeof this.options.container === 'string' ? document.querySelector(this.options.container) : this.options.container;
    this._selected = [...this.options.value];
    this._isOpen = false;
    this._searchQuery = '';
    this._handlers = {};

    if (this._container) { this._render(); this._bindEvents(); }
  }

  _render() {
    this._container.className = 'catui-multiselect';
    this._container.innerHTML = `
      <div class="catui-multiselect-trigger">
        <div class="catui-multiselect-selection">${this._renderSelection()}</div>
        <div class="catui-multiselect-actions">
          ${this.options.clearable && this._selected.length > 0 ? '<button type="button" class="catui-multiselect-clear"><span class="material-icons">close</span></button>' : ''}
          <span class="catui-multiselect-arrow"><span class="material-icons">expand_more</span></span>
        </div>
      </div>
      <div class="catui-multiselect-dropdown">
        ${this.options.searchable ? '<div class="catui-multiselect-search"><span class="material-icons">search</span><input type="text" placeholder="검색..." class="catui-multiselect-search-input"></div>' : ''}
        <div class="catui-multiselect-options">${this._renderOptions()}</div>
      </div>`;
    this._trigger = this._container.querySelector('.catui-multiselect-trigger');
    this._dropdown = this._container.querySelector('.catui-multiselect-dropdown');
    this._optionsEl = this._container.querySelector('.catui-multiselect-options');
    this._searchInput = this._container.querySelector('.catui-multiselect-search-input');
    this._selection = this._container.querySelector('.catui-multiselect-selection');
  }

  _renderSelection() {
    if (this._selected.length === 0) return `<span class="catui-multiselect-placeholder">${this.options.placeholder}</span>`;
    if (this.options.chips) {
      return this._selected.map(v => {
        const o = this.options.options.find(x => x.value === v);
        return o ? `<span class="catui-multiselect-chip${this.options.chipVariant === 'outline' ? ' chip-outline' : ''}" data-value="${v}">${o.label}<button type="button" class="catui-multiselect-chip-remove" data-value="${v}"><span class="material-icons">close</span></button></span>` : '';
      }).join('');
    }
    return `<span class="catui-multiselect-text">${this._selected.map(v => this.options.options.find(x => x.value === v)?.label || v).join(', ')}</span>`;
  }

  _renderOptions() {
    const q = this._searchQuery.toLowerCase();
    const filtered = this.options.options.filter(o => !q || o.label.toLowerCase().includes(q));
    if (filtered.length === 0) return '<div class="catui-multiselect-empty">검색 결과 없음</div>';
    return filtered.map(o => {
      const sel = this._selected.includes(o.value);
      const dis = o.disabled || (!sel && this._selected.length >= this.options.maxSelect);
      return `<div class="catui-multiselect-option${sel ? ' is-selected' : ''}${dis ? ' is-disabled' : ''}" data-value="${o.value}"><span class="catui-multiselect-checkbox"><span class="material-icons">${sel ? 'check_box' : 'check_box_outline_blank'}</span></span><span class="catui-multiselect-label">${o.label}</span></div>`;
    }).join('');
  }

  _bindEvents() {
    this._handlers.click = (e) => {
      if (e.target.closest('.catui-multiselect-chip-remove')) { e.stopPropagation(); this._deselect(e.target.closest('.catui-multiselect-chip-remove').dataset.value); return; }
      if (e.target.closest('.catui-multiselect-clear')) { e.stopPropagation(); this.clear(); return; }
      if (e.target.closest('.catui-multiselect-trigger')) { this._toggle(); return; }
      const opt = e.target.closest('.catui-multiselect-option');
      if (opt && !opt.classList.contains('is-disabled')) {
        const v = opt.dataset.value;
        this._selected.includes(v) ? this._deselect(v) : this._select(v);
      }
    };
    this._handlers.clickOutside = (e) => { if (!this._container.contains(e.target)) this._close(); };
    this._container.addEventListener('click', this._handlers.click);
    document.addEventListener('click', this._handlers.clickOutside);
    if (this._searchInput) {
      this._searchInput.addEventListener('input', (e) => { this._searchQuery = e.target.value; this._optionsEl.innerHTML = this._renderOptions(); });
      this._searchInput.addEventListener('click', (e) => e.stopPropagation());
    }
  }

  _select(v) { if (this._selected.includes(v) || this._selected.length >= this.options.maxSelect) return; this._selected.push(v); this._updateUI(); this._fireChange(); }
  _deselect(v) { const i = this._selected.indexOf(v); if (i === -1) return; this._selected.splice(i, 1); this._updateUI(); this._fireChange(); }
  _updateUI() { this._selection.innerHTML = this._renderSelection(); this._optionsEl.innerHTML = this._renderOptions(); }
  _fireChange() { if (this.options.onChange) this.options.onChange(this._selected, this._selected.map(v => this.options.options.find(o => o.value === v)).filter(Boolean)); }
  _open() { if (this._isOpen) return; this._isOpen = true; this._container.classList.add('is-open'); this._dropdown.classList.add('is-open'); if (this._searchInput) setTimeout(() => this._searchInput.focus(), 50); }
  _close() { if (!this._isOpen) return; this._isOpen = false; this._container.classList.remove('is-open'); this._dropdown.classList.remove('is-open'); this._searchQuery = ''; if (this._searchInput) { this._searchInput.value = ''; this._optionsEl.innerHTML = this._renderOptions(); } }
  _toggle() { this._isOpen ? this._close() : this._open(); }

  getValue() { return [...this._selected]; }
  setValue(v) { this._selected = Array.isArray(v) ? [...v] : [v]; this._updateUI(); }
  clear() { this._selected = []; this._updateUI(); this._fireChange(); }
  selectAll() { this._selected = this.options.options.filter(o => !o.disabled).slice(0, this.options.maxSelect).map(o => o.value); this._updateUI(); this._fireChange(); }
  setOptions(o) { this.options.options = o; this._selected = this._selected.filter(v => o.some(x => x.value === v)); this._updateUI(); }

  destroy() {
    this._container.removeEventListener('click', this._handlers.click);
    document.removeEventListener('click', this._handlers.clickOutside);
    this._container.innerHTML = ''; this._container.className = '';
    this._container = null; this.options = null;
  }
}

/**
 * RangeSlider 클래스 - 범위 슬라이더
 * @class RangeSlider
 */
class RangeSlider {
  constructor(options = {}) {
    this.options = {
      container: null, min: 0, max: 100, value: null, step: 1,
      range: false, showValue: true, showTicks: false, showLabels: false,
      labels: null, unit: '', formatValue: null, onChange: null, onChangeEnd: null, ...options
    };

    this._container = typeof this.options.container === 'string' ? document.querySelector(this.options.container) : this.options.container;
    this._value = this.options.range ? (this.options.value || [this.options.min, this.options.max]) : (this.options.value ?? this.options.min);
    this._activeThumb = null;
    this._isDragging = false;
    this._handlers = {};

    if (this._container) { this._render(); this._bindEvents(); }
  }

  _render() {
    this._container.className = 'catui-range-slider' + (this.options.range ? ' is-range' : '');
    this._container.innerHTML = `
      ${this.options.showValue ? `<div class="catui-range-slider-values">${this.options.range
    ? `<span class="catui-range-slider-value" data-thumb="min">${this._formatValue(this._value[0])}</span><span class="catui-range-slider-separator">~</span><span class="catui-range-slider-value" data-thumb="max">${this._formatValue(this._value[1])}</span>`
    : `<span class="catui-range-slider-value">${this._formatValue(this._value)}</span>`}</div>` : ''}
      <div class="catui-range-slider-track">
        <div class="catui-range-slider-fill"></div>
        ${this.options.range
    ? '<div class="catui-range-slider-thumb" data-thumb="min" tabindex="0"></div><div class="catui-range-slider-thumb" data-thumb="max" tabindex="0"></div>'
    : '<div class="catui-range-slider-thumb" tabindex="0"></div>'}
      </div>
      ${this.options.showLabels ? `<div class="catui-range-slider-labels"><span style="left:0%">${this._formatValue(this.options.min)}</span><span style="left:100%">${this._formatValue(this.options.max)}</span></div>` : ''}`;
    this._track = this._container.querySelector('.catui-range-slider-track');
    this._fill = this._container.querySelector('.catui-range-slider-fill');
    this._thumbs = this._container.querySelectorAll('.catui-range-slider-thumb');
    this._valueDisplays = this._container.querySelectorAll('.catui-range-slider-value');
    this._updateUI();
  }

  _bindEvents() {
    this._handlers.pointerDown = (e) => {
      if (e.target.closest('.catui-range-slider-thumb')) {
        this._activeThumb = e.target.closest('.catui-range-slider-thumb');
        this._isDragging = true;
        this._activeThumb.classList.add('is-active');
        this._container.classList.add('is-dragging');
        e.preventDefault();
      } else if (e.target.closest('.catui-range-slider-track')) {
        this._handleTrackClick(e);
      }
    };
    this._handlers.pointerMove = (e) => { if (this._isDragging) this._handleDrag(e); };
    this._handlers.pointerUp = () => {
      if (this._isDragging) {
        this._isDragging = false;
        this._activeThumb?.classList.remove('is-active');
        this._container.classList.remove('is-dragging');
        this._activeThumb = null;
        if (this.options.onChangeEnd) this.options.onChangeEnd(this._value);
      }
    };

    this._track.addEventListener('pointerdown', this._handlers.pointerDown);
    document.addEventListener('pointermove', this._handlers.pointerMove);
    document.addEventListener('pointerup', this._handlers.pointerUp);
    this._track.style.touchAction = 'none';

    this._thumbs.forEach(thumb => {
      thumb.addEventListener('keydown', (e) => {
        let delta = 0;
        switch (e.key) {
          case 'ArrowRight': case 'ArrowUp': delta = this.options.step; break;
          case 'ArrowLeft': case 'ArrowDown': delta = -this.options.step; break;
          case 'PageUp': delta = this.options.step * 10; break;
          case 'PageDown': delta = -this.options.step * 10; break;
          default: return;
        }
        e.preventDefault();
        const cur = this.options.range ? this._value[thumb.dataset.thumb === 'min' ? 0 : 1] : this._value;
        this._setThumbValue(thumb, cur + delta);
      });
    });
  }

  _handleDrag(e) {
    const rect = this._track.getBoundingClientRect();
    const clientX = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
    const percent = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    this._setThumbValue(this._activeThumb, this._percentToValue(percent));
  }

  _handleTrackClick(e) {
    const rect = this._track.getBoundingClientRect();
    const percent = ((e.clientX - rect.left) / rect.width) * 100;
    const value = this._percentToValue(percent);
    if (this.options.range) {
      const thumb = Math.abs(value - this._value[0]) <= Math.abs(value - this._value[1]) ? this._thumbs[0] : this._thumbs[1];
      this._setThumbValue(thumb, value);
    } else {
      this._setThumbValue(this._thumbs[0], value);
    }
    if (this.options.onChangeEnd) this.options.onChangeEnd(this._value);
  }

  _setThumbValue(thumb, value) {
    value = Math.max(this.options.min, Math.min(this.options.max, value));
    value = Math.round(value / this.options.step) * this.options.step;
    value = parseFloat(value.toFixed(10));

    if (this.options.range) {
      const isMin = thumb.dataset.thumb === 'min';
      const old = [...this._value];
      if (isMin) this._value[0] = Math.min(value, this._value[1]);
      else this._value[1] = Math.max(value, this._value[0]);
      if (old[0] !== this._value[0] || old[1] !== this._value[1]) { this._updateUI(); this._fireChange(); }
    } else {
      if (value !== this._value) { this._value = value; this._updateUI(); this._fireChange(); }
    }
  }

  _updateUI() {
    if (this.options.range) {
      const minP = this._valueToPercent(this._value[0]), maxP = this._valueToPercent(this._value[1]);
      this._thumbs[0].style.left = `${minP}%`; this._thumbs[1].style.left = `${maxP}%`;
      this._fill.style.left = `${minP}%`; this._fill.style.width = `${maxP - minP}%`;
      if (this._valueDisplays.length >= 2) { this._valueDisplays[0].textContent = this._formatValue(this._value[0]); this._valueDisplays[1].textContent = this._formatValue(this._value[1]); }
    } else {
      const p = this._valueToPercent(this._value);
      this._thumbs[0].style.left = `${p}%`;
      this._fill.style.left = '0%'; this._fill.style.width = `${p}%`;
      if (this._valueDisplays.length > 0) this._valueDisplays[0].textContent = this._formatValue(this._value);
    }
  }

  _valueToPercent(v) { return ((v - this.options.min) / (this.options.max - this.options.min)) * 100; }
  _percentToValue(p) { return this.options.min + (p / 100) * (this.options.max - this.options.min); }
  _formatValue(v) { return this.options.formatValue ? this.options.formatValue(v) : `${v}${this.options.unit}`; }
  _fireChange() { if (this.options.onChange) this.options.onChange(this._value); }

  getValue() { return this.options.range ? [...this._value] : this._value; }
  setValue(v) {
    if (this.options.range && Array.isArray(v)) this._value = [Math.max(this.options.min, Math.min(v[0], this.options.max)), Math.max(this.options.min, Math.min(v[1], this.options.max))];
    else this._value = Math.max(this.options.min, Math.min(v, this.options.max));
    this._updateUI();
  }
  reset() { this._value = this.options.range ? [this.options.min, this.options.max] : this.options.min; this._updateUI(); this._fireChange(); }
  disable() { this._container.classList.add('is-disabled'); this._thumbs.forEach(t => t.setAttribute('tabindex', '-1')); }
  enable() { this._container.classList.remove('is-disabled'); this._thumbs.forEach(t => t.setAttribute('tabindex', '0')); }

  destroy() {
    this._track.removeEventListener('pointerdown', this._handlers.pointerDown);
    document.removeEventListener('pointermove', this._handlers.pointerMove);
    document.removeEventListener('pointerup', this._handlers.pointerUp);
    this._container.innerHTML = ''; this._container.className = '';
    this._container = null; this.options = null;
  }
}

/**
 * TagInput 클래스 - 태그 입력
 * @class TagInput
 */
class TagInput {
  constructor(options = {}) {
    this.options = {
      container: null, value: [], placeholder: '태그 입력',
      maxTags: Infinity, maxLength: 50, allowDuplicates: false,
      suggestions: [], delimiter: ',', validate: null, transform: null, onChange: null, ...options
    };

    this._container = typeof this.options.container === 'string' ? document.querySelector(this.options.container) : this.options.container;
    this._tags = [...this.options.value];
    this._suggestionIndex = -1;

    if (this._container) { this._render(); this._bindEvents(); }
  }

  _render() {
    this._container.className = 'catui-tag-input';
    this._container.innerHTML = `
      <div class="catui-tag-input-wrapper">
        <div class="catui-tag-input-tags">${this._tags.map((t, i) => this._renderTag(t, i)).join('')}</div>
        <input type="text" class="catui-tag-input-field" placeholder="${this._tags.length === 0 ? this.options.placeholder : ''}" ${this._tags.length >= this.options.maxTags ? 'disabled' : ''}>
      </div>
      ${this.options.suggestions.length > 0 ? '<div class="catui-tag-input-suggestions"></div>' : ''}`;
    this._tagsEl = this._container.querySelector('.catui-tag-input-tags');
    this._input = this._container.querySelector('.catui-tag-input-field');
    this._suggestionsEl = this._container.querySelector('.catui-tag-input-suggestions');
  }

  _renderTag(tag, i) {
    return `<span class="catui-tag-input-tag" data-index="${i}"><span class="catui-tag-input-tag-text">${this._escapeHtml(tag)}</span><button type="button" class="catui-tag-input-tag-remove" data-index="${i}"><span class="material-icons">close</span></button></span>`;
  }

  _escapeHtml(t) { const d = document.createElement('div'); d.textContent = t; return d.innerHTML; }

  _bindEvents() {
    this._handlers = {};

    this._handlers.keydown = (e) => {
      const v = this._input.value.trim();
      switch (e.key) {
        case 'Enter': case this.options.delimiter:
          e.preventDefault();
          if (v) this._addTag(v);
          else if (this._suggestionIndex >= 0) { const s = this._getFilteredSuggestions(); if (s[this._suggestionIndex]) this._addTag(s[this._suggestionIndex]); }
          break;
        case 'Backspace': if (!v && this._tags.length > 0) this._removeTag(this._tags.length - 1); break;
        case 'ArrowDown': if (this._suggestionsEl) { e.preventDefault(); this._navSuggestions(1); } break;
        case 'ArrowUp': if (this._suggestionsEl) { e.preventDefault(); this._navSuggestions(-1); } break;
        case 'Escape': this._closeSuggestions(); break;
      }
    };

    this._handlers.input = () => this._updateSuggestions();
    this._handlers.focus = () => { this._container.classList.add('is-focused'); this._updateSuggestions(); };
    this._handlers.blur = () => { this._container.classList.remove('is-focused'); setTimeout(() => this._closeSuggestions(), 150); };

    this._handlers.click = (e) => {
      const rem = e.target.closest('.catui-tag-input-tag-remove');
      if (rem) { this._removeTag(parseInt(rem.dataset.index, 10)); return; }
      const sug = e.target.closest('.catui-tag-input-suggestion');
      if (sug) { this._addTag(sug.dataset.value); return; }
      if (e.target === this._container || e.target.closest('.catui-tag-input-wrapper')) this._input.focus();
    };

    this._input.addEventListener('keydown', this._handlers.keydown);
    this._input.addEventListener('input', this._handlers.input);
    this._input.addEventListener('focus', this._handlers.focus);
    this._input.addEventListener('blur', this._handlers.blur);
    this._container.addEventListener('click', this._handlers.click);
  }

  _addTag(tag) {
    if (this.options.transform) tag = this.options.transform(tag);
    tag = tag.trim();
    if (!tag || this._tags.length >= this.options.maxTags) return false;
    if (tag.length > this.options.maxLength) tag = tag.substring(0, this.options.maxLength);
    if (!this.options.allowDuplicates && this._tags.includes(tag)) { this._input.value = ''; return false; }
    if (this.options.validate && !this.options.validate(tag)) return false;
    this._tags.push(tag);
    this._input.value = '';
    this._updateUI();
    this._closeSuggestions();
    this._fireChange();
    return true;
  }

  _removeTag(i) { if (i < 0 || i >= this._tags.length) return; this._tags.splice(i, 1); this._updateUI(); this._fireChange(); this._input.focus(); }
  _updateUI() { this._tagsEl.innerHTML = this._tags.map((t, i) => this._renderTag(t, i)).join(''); this._input.placeholder = this._tags.length === 0 ? this.options.placeholder : ''; this._input.disabled = this._tags.length >= this.options.maxTags; }

  _getFilteredSuggestions() {
    const q = this._input.value.toLowerCase().trim();
    if (!q) return [];
    return this.options.suggestions.filter(s => s.toLowerCase().includes(q) && !this._tags.includes(s)).slice(0, 8);
  }

  _updateSuggestions() {
    if (!this._suggestionsEl) return;
    const sug = this._getFilteredSuggestions();
    this._suggestionIndex = -1;
    if (sug.length === 0) { this._closeSuggestions(); return; }
    this._suggestionsEl.innerHTML = sug.map((s, i) => `<div class="catui-tag-input-suggestion" data-value="${this._escapeHtml(s)}" data-index="${i}">${this._highlight(s, this._input.value)}</div>`).join('');
    this._suggestionsEl.classList.add('is-open');
  }

  _highlight(t, q) { if (!q) return t; return t.replace(new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'), '<mark>$1</mark>'); }
  _navSuggestions(dir) {
    const items = this._suggestionsEl?.querySelectorAll('.catui-tag-input-suggestion');
    if (!items || items.length === 0) return;
    items[this._suggestionIndex]?.classList.remove('is-active');
    this._suggestionIndex += dir;
    if (this._suggestionIndex < 0) this._suggestionIndex = items.length - 1;
    if (this._suggestionIndex >= items.length) this._suggestionIndex = 0;
    items[this._suggestionIndex].classList.add('is-active');
  }
  _closeSuggestions() { if (this._suggestionsEl) { this._suggestionsEl.classList.remove('is-open'); this._suggestionIndex = -1; } }
  _fireChange() { if (this.options.onChange) this.options.onChange([...this._tags]); }

  getValue() { return [...this._tags]; }
  setValue(t) { this._tags = Array.isArray(t) ? [...t] : []; this._updateUI(); }
  addTag(t) { return this._addTag(t); }
  clear() { this._tags = []; this._input.value = ''; this._updateUI(); this._fireChange(); }
  setSuggestions(s) { this.options.suggestions = s; }

  destroy() {
    if (this._input && this._handlers) {
      this._input.removeEventListener('keydown', this._handlers.keydown);
      this._input.removeEventListener('input', this._handlers.input);
      this._input.removeEventListener('focus', this._handlers.focus);
      this._input.removeEventListener('blur', this._handlers.blur);
    }
    if (this._container && this._handlers) {
      this._container.removeEventListener('click', this._handlers.click);
    }
    if (this._container) {
      this._container.innerHTML = '';
      this._container.className = '';
    }
    this._container = null;
    this._input = null;
    this._handlers = null;
    this.options = null;
  }
}

export { Autocomplete, MultiSelect, RangeSlider, TagInput };
export default { Autocomplete, MultiSelect, RangeSlider, TagInput };
