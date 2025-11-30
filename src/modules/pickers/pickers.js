/**
 * CATUI Mobile - Pickers Module
 * @module pickers
 * @description 날짜, 시간, 색상 선택기 및 카운트다운 컴포넌트
 */

/**
 * DatePicker 클래스 - 날짜 선택기
 * @class DatePicker
 */
class DatePicker {
  /**
   * @constructor
   * @param {Object} options
   * @param {string|HTMLElement} options.trigger - 트리거 요소
   * @param {Date} [options.value] - 초기 날짜
   * @param {Date} [options.min] - 최소 날짜
   * @param {Date} [options.max] - 최대 날짜
   * @param {string} [options.format='YYYY-MM-DD'] - 날짜 형식
   * @param {string} [options.locale='ko'] - 로케일
   * @param {Function} [options.onChange] - 변경 콜백
   */
  constructor(options = {}) {
    this.options = {
      trigger: null,
      value: new Date(),
      min: null,
      max: null,
      format: 'YYYY-MM-DD',
      locale: 'ko',
      onChange: null,
      ...options
    };

    this._trigger = typeof this.options.trigger === 'string'
      ? document.querySelector(this.options.trigger)
      : this.options.trigger;

    this._value = new Date(this.options.value);
    this._viewDate = new Date(this._value);
    this._element = null;
    this._backdrop = null;
    this._isOpen = false;

    this._weekdays = this.options.locale === 'ko' 
      ? ['일', '월', '화', '수', '목', '금', '토']
      : ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

    this._months = this.options.locale === 'ko'
      ? ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월']
      : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    if (this._trigger) {
      this._bindTrigger();
    }
  }

  /**
   * 트리거 바인딩
   * @private
   */
  _bindTrigger() {
    this._triggerHandler = () => this.open();
    this._trigger.addEventListener('click', this._triggerHandler);
  }

  /**
   * 요소 생성
   * @private
   */
  _createElement() {
    const el = document.createElement('div');
    el.className = 'catui-datepicker';
    el.style.cssText = `
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      background: var(--bg-primary, #fff);
      border-radius: var(--radius-lg, 16px) var(--radius-lg, 16px) 0 0;
      box-shadow: var(--shadow-lg, 0 -4px 20px rgba(0,0,0,0.15));
      z-index: 1300;
      transform: translateY(100%);
      transition: transform 0.3s ease;
      max-height: 80vh;
      overflow: hidden;
    `;

    el.innerHTML = this._renderContent();
    return el;
  }

  /**
   * 콘텐츠 렌더링
   * @private
   */
  _renderContent() {
    const year = this._viewDate.getFullYear();
    const month = this._viewDate.getMonth();
    const currentYear = new Date().getFullYear();

    // 년도 옵션 생성 (현재 년도 ±50년)
    const yearOptions = [];
    for (let y = currentYear - 50; y <= currentYear + 50; y++) {
      yearOptions.push(`<option value="${y}" ${y === year ? 'selected' : ''}>${y}년</option>`);
    }

    // 월 옵션 생성
    const monthOptions = this._months.map((m, i) => 
      `<option value="${i}" ${i === month ? 'selected' : ''}>${m}</option>`
    ).join('');

    return `
      <div class="catui-picker-header" style="display: flex; align-items: center; justify-content: space-between; padding: 16px; border-bottom: 1px solid var(--border-color, #e5e7eb);">
        <button class="catui-picker-btn" data-action="prev-month" style="width: 40px; height: 40px; border: none; background: transparent; cursor: pointer; border-radius: 50%;">
          <span class="material-icons" style="color: var(--text-secondary);">chevron_left</span>
        </button>
        <div style="display: flex; align-items: center; gap: 8px;">
          <select class="catui-picker-year-select" style="
            appearance: none; -webkit-appearance: none;
            padding: 8px 24px 8px 12px; border: 1px solid var(--border-color, #e5e7eb);
            border-radius: 8px; font-size: 16px; font-weight: 600;
            background: var(--bg-secondary, #F9FAFB) url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"12\" height=\"12\" viewBox=\"0 0 24 24\"><path fill=\"%236B7280\" d=\"M7 10l5 5 5-5z\"/></svg>') no-repeat right 8px center;
            color: var(--text-primary, #111827); cursor: pointer;
          ">${yearOptions.join('')}</select>
          <select class="catui-picker-month-select" style="
            appearance: none; -webkit-appearance: none;
            padding: 8px 24px 8px 12px; border: 1px solid var(--border-color, #e5e7eb);
            border-radius: 8px; font-size: 16px; font-weight: 600;
            background: var(--bg-secondary, #F9FAFB) url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"12\" height=\"12\" viewBox=\"0 0 24 24\"><path fill=\"%236B7280\" d=\"M7 10l5 5 5-5z\"/></svg>') no-repeat right 8px center;
            color: var(--text-primary, #111827); cursor: pointer;
          ">${monthOptions}</select>
        </div>
        <button class="catui-picker-btn" data-action="next-month" style="width: 40px; height: 40px; border: none; background: transparent; cursor: pointer; border-radius: 50%;">
          <span class="material-icons" style="color: var(--text-secondary);">chevron_right</span>
        </button>
      </div>
      <div class="catui-picker-body" style="padding: 16px;">
        <div class="catui-picker-weekdays" style="display: grid; grid-template-columns: repeat(7, 1fr); text-align: center; margin-bottom: 8px;">
          ${this._weekdays.map(d => `<span style="font-size: 12px; color: var(--text-tertiary); padding: 8px 0;">${d}</span>`).join('')}
        </div>
        <div class="catui-picker-days" style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px;">
          ${this._renderDays(year, month)}
        </div>
      </div>
      <div class="catui-picker-footer" style="display: flex; gap: 8px; padding: 16px; border-top: 1px solid var(--border-color, #e5e7eb);">
        <button class="catui-picker-cancel" style="flex: 1; padding: 12px; border: 1px solid var(--border-color); background: transparent; border-radius: 8px; font-size: 14px; cursor: pointer;">취소</button>
        <button class="catui-picker-confirm" style="flex: 1; padding: 12px; border: none; background: var(--primary, #3B82F6); color: white; border-radius: 8px; font-size: 14px; cursor: pointer;">확인</button>
      </div>
    `;
  }

  /**
   * 날짜 렌더링
   * @private
   */
  _renderDays(year, month) {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();
    const selected = this._value;

    let html = '';

    // 빈 칸
    for (let i = 0; i < firstDay; i++) {
      html += '<span></span>';
    }

    // 날짜
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const isToday = this._isSameDay(date, today);
      const isSelected = this._isSameDay(date, selected);
      const isDisabled = this._isDisabled(date);

      const styles = `
        display: flex; align-items: center; justify-content: center;
        width: 40px; height: 40px; margin: 0 auto;
        border-radius: 50%; cursor: ${isDisabled ? 'not-allowed' : 'pointer'};
        font-size: 14px; border: none;
        background: ${isSelected ? 'var(--primary, #3B82F6)' : 'transparent'};
        color: ${isSelected ? 'white' : isDisabled ? 'var(--text-tertiary)' : 'var(--text-primary)'};
        ${isToday && !isSelected ? 'border: 2px solid var(--primary, #3B82F6);' : ''}
        opacity: ${isDisabled ? '0.5' : '1'};
      `;

      html += `<button class="catui-picker-day" data-date="${date.toISOString()}" ${isDisabled ? 'disabled' : ''} style="${styles}">${day}</button>`;
    }

    return html;
  }

  /**
   * 같은 날 비교
   * @private
   */
  _isSameDay(d1, d2) {
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
  }

  /**
   * 비활성 날짜 확인
   * @private
   */
  _isDisabled(date) {
    if (this.options.min && date < this.options.min) return true;
    if (this.options.max && date > this.options.max) return true;
    return false;
  }

  /**
   * 열기
   */
  open() {
    if (this._isOpen) return;

    // 백드롭
    this._backdrop = document.createElement('div');
    this._backdrop.style.cssText = `
      position: fixed; top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0,0,0,0.5); z-index: 1299;
      opacity: 0; transition: opacity 0.3s ease;
    `;
    this._backdrop.addEventListener('click', () => this.close());
    document.body.appendChild(this._backdrop);

    // 피커
    this._element = this._createElement();
    document.body.appendChild(this._element);
    this._bindEvents();

    // 애니메이션
    requestAnimationFrame(() => {
      this._backdrop.style.opacity = '1';
      this._element.style.transform = 'translateY(0)';
    });

    this._isOpen = true;
  }

  /**
   * 닫기
   */
  close() {
    if (!this._isOpen) return;

    this._backdrop.style.opacity = '0';
    this._element.style.transform = 'translateY(100%)';

    setTimeout(() => {
      this._backdrop?.remove();
      this._element?.remove();
      this._backdrop = null;
      this._element = null;
    }, 300);

    this._isOpen = false;
  }

  /**
   * 이벤트 바인딩
   * @private
   */
  _bindEvents() {
    // 클릭 이벤트
    this._element.addEventListener('click', (e) => {
      const action = e.target.closest('[data-action]')?.dataset.action;
      const day = e.target.closest('.catui-picker-day');

      if (action === 'prev-month') {
        this._viewDate.setMonth(this._viewDate.getMonth() - 1);
        this._update();
      } else if (action === 'next-month') {
        this._viewDate.setMonth(this._viewDate.getMonth() + 1);
        this._update();
      } else if (day && !day.disabled) {
        this._value = new Date(day.dataset.date);
        this._update();
      } else if (e.target.closest('.catui-picker-cancel')) {
        this.close();
      } else if (e.target.closest('.catui-picker-confirm')) {
        this._confirm();
      }
    });

    // 년도 선택 이벤트
    const yearSelect = this._element.querySelector('.catui-picker-year-select');
    if (yearSelect) {
      yearSelect.addEventListener('change', (e) => {
        this._viewDate.setFullYear(parseInt(e.target.value, 10));
        this._updateDays();
      });
    }

    // 월 선택 이벤트
    const monthSelect = this._element.querySelector('.catui-picker-month-select');
    if (monthSelect) {
      monthSelect.addEventListener('change', (e) => {
        this._viewDate.setMonth(parseInt(e.target.value, 10));
        this._updateDays();
      });
    }
  }

  /**
   * 업데이트 (전체)
   * @private
   */
  _update() {
    const yearSelect = this._element.querySelector('.catui-picker-year-select');
    const monthSelect = this._element.querySelector('.catui-picker-month-select');
    
    const year = this._viewDate.getFullYear();
    const month = this._viewDate.getMonth();
    
    // Select 값 업데이트
    if (yearSelect) yearSelect.value = year;
    if (monthSelect) monthSelect.value = month;
    
    // 날짜 업데이트
    this._updateDays();
  }

  /**
   * 날짜만 업데이트
   * @private
   */
  _updateDays() {
    const body = this._element.querySelector('.catui-picker-body');
    const year = this._viewDate.getFullYear();
    const month = this._viewDate.getMonth();
    
    body.querySelector('.catui-picker-days').innerHTML = this._renderDays(year, month);
  }

  /**
   * 확인
   * @private
   */
  _confirm() {
    if (this._trigger) {
      this._trigger.value = this.format(this._value);
    }
    if (this.options.onChange) {
      this.options.onChange(this._value, this.format(this._value));
    }
    this.close();
  }

  /**
   * 날짜 형식화
   * @param {Date} date
   * @returns {string}
   */
  format(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    
    return this.options.format
      .replace('YYYY', y)
      .replace('MM', m)
      .replace('DD', d);
  }

  /**
   * 값 설정
   * @param {Date|string} date
   */
  setValue(date) {
    this._value = new Date(date);
    this._viewDate = new Date(this._value);
  }

  /**
   * 값 가져오기
   * @returns {Date}
   */
  getValue() {
    return new Date(this._value);
  }

  /**
   * 정리
   */
  destroy() {
    this.close();
    if (this._trigger && this._triggerHandler) {
      this._trigger.removeEventListener('click', this._triggerHandler);
    }
    this._trigger = null;
    this.options = null;
  }
}

/**
 * TimePicker 클래스 - 시간 선택기
 * @class TimePicker
 */
class TimePicker {
  /**
   * @constructor
   * @param {Object} options
   * @param {string|HTMLElement} options.trigger - 트리거 요소
   * @param {string} [options.value='12:00'] - 초기 시간
   * @param {boolean} [options.is24Hour=true] - 24시간 형식
   * @param {number} [options.minuteStep=1] - 분 단위
   * @param {Function} [options.onChange] - 변경 콜백
   */
  constructor(options = {}) {
    this.options = {
      trigger: null,
      value: '12:00',
      is24Hour: true,
      minuteStep: 1,
      onChange: null,
      ...options
    };

    this._trigger = typeof this.options.trigger === 'string'
      ? document.querySelector(this.options.trigger)
      : this.options.trigger;

    const [h, m] = this.options.value.split(':').map(Number);
    this._hours = h;
    this._minutes = m;
    this._element = null;
    this._backdrop = null;
    this._isOpen = false;

    if (this._trigger) {
      this._bindTrigger();
    }
  }

  /**
   * 트리거 바인딩
   * @private
   */
  _bindTrigger() {
    this._triggerHandler = () => this.open();
    this._trigger.addEventListener('click', this._triggerHandler);
  }

  /**
   * 열기
   */
  open() {
    if (this._isOpen) return;

    // 백드롭
    this._backdrop = document.createElement('div');
    this._backdrop.style.cssText = `
      position: fixed; top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0,0,0,0.5); z-index: 1299;
      opacity: 0; transition: opacity 0.3s ease;
    `;
    this._backdrop.addEventListener('click', () => this.close());
    document.body.appendChild(this._backdrop);

    // 피커
    this._element = this._createElement();
    document.body.appendChild(this._element);
    this._bindEvents();

    requestAnimationFrame(() => {
      this._backdrop.style.opacity = '1';
      this._element.style.transform = 'translateY(0)';
    });

    this._isOpen = true;
  }

  /**
   * 닫기
   */
  close() {
    if (!this._isOpen) return;

    this._backdrop.style.opacity = '0';
    this._element.style.transform = 'translateY(100%)';

    setTimeout(() => {
      this._backdrop?.remove();
      this._element?.remove();
      this._backdrop = null;
      this._element = null;
    }, 300);

    this._isOpen = false;
  }

  /**
   * 요소 생성
   * @private
   */
  _createElement() {
    const el = document.createElement('div');
    el.className = 'catui-timepicker';
    el.style.cssText = `
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      background: var(--bg-primary, #fff);
      border-radius: var(--radius-lg, 16px) var(--radius-lg, 16px) 0 0;
      box-shadow: var(--shadow-lg, 0 -4px 20px rgba(0,0,0,0.15));
      z-index: 1300;
      transform: translateY(100%);
      transition: transform 0.3s ease;
    `;

    const maxHour = this.options.is24Hour ? 23 : 12;

    el.innerHTML = `
      <div class="catui-picker-header" style="text-align: center; padding: 16px; border-bottom: 1px solid var(--border-color);">
        <span style="font-size: 18px; font-weight: 600; color: var(--text-primary);">시간 선택</span>
      </div>
      <div class="catui-picker-body" style="display: flex; justify-content: center; align-items: center; padding: 24px; gap: 16px;">
        <div class="catui-time-column" style="display: flex; flex-direction: column; align-items: center; gap: 8px;">
          <button data-action="hour-up" style="width: 48px; height: 48px; border: none; background: var(--bg-secondary); border-radius: 50%; cursor: pointer;">
            <span class="material-icons">keyboard_arrow_up</span>
          </button>
          <input type="text" class="catui-time-hour" value="${String(this._hours).padStart(2, '0')}" readonly
            style="width: 64px; height: 64px; text-align: center; font-size: 32px; font-weight: 600; border: 2px solid var(--border-color); border-radius: 8px; background: transparent; color: var(--text-primary);">
          <button data-action="hour-down" style="width: 48px; height: 48px; border: none; background: var(--bg-secondary); border-radius: 50%; cursor: pointer;">
            <span class="material-icons">keyboard_arrow_down</span>
          </button>
        </div>
        <span style="font-size: 32px; font-weight: 600; color: var(--text-primary);">:</span>
        <div class="catui-time-column" style="display: flex; flex-direction: column; align-items: center; gap: 8px;">
          <button data-action="minute-up" style="width: 48px; height: 48px; border: none; background: var(--bg-secondary); border-radius: 50%; cursor: pointer;">
            <span class="material-icons">keyboard_arrow_up</span>
          </button>
          <input type="text" class="catui-time-minute" value="${String(this._minutes).padStart(2, '0')}" readonly
            style="width: 64px; height: 64px; text-align: center; font-size: 32px; font-weight: 600; border: 2px solid var(--border-color); border-radius: 8px; background: transparent; color: var(--text-primary);">
          <button data-action="minute-down" style="width: 48px; height: 48px; border: none; background: var(--bg-secondary); border-radius: 50%; cursor: pointer;">
            <span class="material-icons">keyboard_arrow_down</span>
          </button>
        </div>
      </div>
      <div class="catui-picker-footer" style="display: flex; gap: 8px; padding: 16px; border-top: 1px solid var(--border-color);">
        <button class="catui-picker-cancel" style="flex: 1; padding: 12px; border: 1px solid var(--border-color); background: transparent; border-radius: 8px; font-size: 14px; cursor: pointer;">취소</button>
        <button class="catui-picker-confirm" style="flex: 1; padding: 12px; border: none; background: var(--primary, #3B82F6); color: white; border-radius: 8px; font-size: 14px; cursor: pointer;">확인</button>
      </div>
    `;

    return el;
  }

  /**
   * 이벤트 바인딩
   * @private
   */
  _bindEvents() {
    const maxHour = this.options.is24Hour ? 23 : 12;
    const hourInput = this._element.querySelector('.catui-time-hour');
    const minuteInput = this._element.querySelector('.catui-time-minute');

    this._element.addEventListener('click', (e) => {
      const action = e.target.closest('[data-action]')?.dataset.action;

      if (action === 'hour-up') {
        this._hours = (this._hours + 1) % (maxHour + 1);
        hourInput.value = String(this._hours).padStart(2, '0');
      } else if (action === 'hour-down') {
        this._hours = this._hours === 0 ? maxHour : this._hours - 1;
        hourInput.value = String(this._hours).padStart(2, '0');
      } else if (action === 'minute-up') {
        this._minutes = (this._minutes + this.options.minuteStep) % 60;
        minuteInput.value = String(this._minutes).padStart(2, '0');
      } else if (action === 'minute-down') {
        this._minutes = this._minutes < this.options.minuteStep ? 60 - this.options.minuteStep : this._minutes - this.options.minuteStep;
        minuteInput.value = String(this._minutes).padStart(2, '0');
      } else if (e.target.closest('.catui-picker-cancel')) {
        this.close();
      } else if (e.target.closest('.catui-picker-confirm')) {
        this._confirm();
      }
    });
  }

  /**
   * 확인
   * @private
   */
  _confirm() {
    const value = this.getValue();
    if (this._trigger) {
      this._trigger.value = value;
    }
    if (this.options.onChange) {
      this.options.onChange(value, this._hours, this._minutes);
    }
    this.close();
  }

  /**
   * 값 가져오기
   * @returns {string}
   */
  getValue() {
    return `${String(this._hours).padStart(2, '0')}:${String(this._minutes).padStart(2, '0')}`;
  }

  /**
   * 값 설정
   * @param {string} value
   */
  setValue(value) {
    const [h, m] = value.split(':').map(Number);
    this._hours = h;
    this._minutes = m;
  }

  /**
   * 정리
   */
  destroy() {
    this.close();
    if (this._trigger && this._triggerHandler) {
      this._trigger.removeEventListener('click', this._triggerHandler);
    }
    this._trigger = null;
    this.options = null;
  }
}

/**
 * ColorPicker 클래스 - 색상 선택기
 * @class ColorPicker
 */
class ColorPicker {
  /**
   * @constructor
   * @param {Object} options
   * @param {string|HTMLElement} options.trigger - 트리거 요소
   * @param {string} [options.value='#3B82F6'] - 초기 색상
   * @param {Array} [options.presets] - 프리셋 색상들
   * @param {boolean} [options.showInput=true] - 입력 필드 표시
   * @param {Function} [options.onChange] - 변경 콜백
   */
  constructor(options = {}) {
    this.options = {
      trigger: null,
      value: '#3B82F6',
      presets: [
        '#EF4444', '#F97316', '#EAB308', '#22C55E', '#14B8A6',
        '#3B82F6', '#6366F1', '#8B5CF6', '#EC4899', '#6B7280',
        '#1F2937', '#FFFFFF'
      ],
      showInput: true,
      onChange: null,
      ...options
    };

    this._trigger = typeof this.options.trigger === 'string'
      ? document.querySelector(this.options.trigger)
      : this.options.trigger;

    this._value = this.options.value;
    this._element = null;
    this._backdrop = null;
    this._isOpen = false;

    if (this._trigger) {
      this._bindTrigger();
      this._updateTrigger();
    }
  }

  /**
   * 트리거 바인딩
   * @private
   */
  _bindTrigger() {
    this._triggerHandler = () => this.open();
    this._trigger.addEventListener('click', this._triggerHandler);
  }

  /**
   * 트리거 업데이트
   * @private
   */
  _updateTrigger() {
    if (this._trigger.tagName === 'INPUT') {
      this._trigger.value = this._value;
    }
    this._trigger.style.backgroundColor = this._value;
  }

  /**
   * 열기
   */
  open() {
    if (this._isOpen) return;

    this._backdrop = document.createElement('div');
    this._backdrop.style.cssText = `
      position: fixed; top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0,0,0,0.5); z-index: 1299;
      opacity: 0; transition: opacity 0.3s ease;
    `;
    this._backdrop.addEventListener('click', () => this.close());
    document.body.appendChild(this._backdrop);

    this._element = this._createElement();
    document.body.appendChild(this._element);
    this._bindEvents();

    requestAnimationFrame(() => {
      this._backdrop.style.opacity = '1';
      this._element.style.transform = 'translateY(0)';
    });

    this._isOpen = true;
  }

  /**
   * 닫기
   */
  close() {
    if (!this._isOpen) return;

    this._backdrop.style.opacity = '0';
    this._element.style.transform = 'translateY(100%)';

    setTimeout(() => {
      this._backdrop?.remove();
      this._element?.remove();
      this._backdrop = null;
      this._element = null;
    }, 300);

    this._isOpen = false;
  }

  /**
   * 요소 생성
   * @private
   */
  _createElement() {
    const el = document.createElement('div');
    el.className = 'catui-colorpicker';
    el.style.cssText = `
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      background: var(--bg-primary, #fff);
      border-radius: var(--radius-lg, 16px) var(--radius-lg, 16px) 0 0;
      box-shadow: var(--shadow-lg, 0 -4px 20px rgba(0,0,0,0.15));
      z-index: 1300;
      transform: translateY(100%);
      transition: transform 0.3s ease;
    `;

    el.innerHTML = `
      <div class="catui-picker-header" style="text-align: center; padding: 16px; border-bottom: 1px solid var(--border-color);">
        <span style="font-size: 18px; font-weight: 600; color: var(--text-primary);">색상 선택</span>
      </div>
      <div class="catui-picker-body" style="padding: 16px;">
        <div class="catui-color-preview" style="width: 100%; height: 60px; border-radius: 8px; margin-bottom: 16px; background: ${this._value};"></div>
        ${this.options.showInput ? `
          <div style="margin-bottom: 16px;">
            <input type="text" class="catui-color-input" value="${this._value}" 
              style="width: 100%; padding: 12px; border: 1px solid var(--border-color); border-radius: 8px; font-size: 16px; text-align: center; font-family: monospace;">
          </div>
        ` : ''}
        <div class="catui-color-presets" style="display: grid; grid-template-columns: repeat(6, 1fr); gap: 8px;">
          ${this.options.presets.map(color => `
            <button class="catui-color-preset" data-color="${color}" 
              style="width: 100%; aspect-ratio: 1; border: 2px solid ${color === this._value ? 'var(--primary)' : 'transparent'}; 
              border-radius: 8px; background: ${color}; cursor: pointer;"></button>
          `).join('')}
        </div>
      </div>
      <div class="catui-picker-footer" style="display: flex; gap: 8px; padding: 16px; border-top: 1px solid var(--border-color);">
        <button class="catui-picker-cancel" style="flex: 1; padding: 12px; border: 1px solid var(--border-color); background: transparent; border-radius: 8px; font-size: 14px; cursor: pointer;">취소</button>
        <button class="catui-picker-confirm" style="flex: 1; padding: 12px; border: none; background: var(--primary, #3B82F6); color: white; border-radius: 8px; font-size: 14px; cursor: pointer;">확인</button>
      </div>
    `;

    return el;
  }

  /**
   * 이벤트 바인딩
   * @private
   */
  _bindEvents() {
    const preview = this._element.querySelector('.catui-color-preview');
    const input = this._element.querySelector('.catui-color-input');
    const presets = this._element.querySelectorAll('.catui-color-preset');

    presets.forEach(preset => {
      preset.addEventListener('click', () => {
        this._value = preset.dataset.color;
        preview.style.background = this._value;
        if (input) input.value = this._value;
        
        presets.forEach(p => p.style.borderColor = 'transparent');
        preset.style.borderColor = 'var(--primary)';
      });
    });

    if (input) {
      input.addEventListener('input', () => {
        if (/^#[0-9A-Fa-f]{6}$/.test(input.value)) {
          this._value = input.value;
          preview.style.background = this._value;
          presets.forEach(p => {
            p.style.borderColor = p.dataset.color === this._value ? 'var(--primary)' : 'transparent';
          });
        }
      });
    }

    this._element.querySelector('.catui-picker-cancel').addEventListener('click', () => this.close());
    this._element.querySelector('.catui-picker-confirm').addEventListener('click', () => this._confirm());
  }

  /**
   * 확인
   * @private
   */
  _confirm() {
    this._updateTrigger();
    if (this.options.onChange) {
      this.options.onChange(this._value);
    }
    this.close();
  }

  /**
   * 값 가져오기
   * @returns {string}
   */
  getValue() {
    return this._value;
  }

  /**
   * 값 설정
   * @param {string} color
   */
  setValue(color) {
    this._value = color;
    this._updateTrigger();
  }

  /**
   * 정리
   */
  destroy() {
    this.close();
    if (this._trigger && this._triggerHandler) {
      this._trigger.removeEventListener('click', this._triggerHandler);
    }
    this._trigger = null;
    this.options = null;
  }
}

/**
 * Countdown 클래스 - 카운트다운 타이머
 * @class Countdown
 */
class Countdown {
  /**
   * @constructor
   * @param {Object} options
   * @param {string|HTMLElement} options.container - 컨테이너
   * @param {Date|string} options.target - 목표 시간
   * @param {string} [options.format='DD:HH:MM:SS'] - 형식
   * @param {boolean} [options.autoStart=true] - 자동 시작
   * @param {Function} [options.onTick] - 틱 콜백
   * @param {Function} [options.onComplete] - 완료 콜백
   */
  constructor(options = {}) {
    this.options = {
      container: null,
      target: null,
      format: 'DD:HH:MM:SS',
      autoStart: true,
      showLabels: true,
      labels: { days: '일', hours: '시간', minutes: '분', seconds: '초' },
      onTick: null,
      onComplete: null,
      ...options
    };

    this._container = typeof this.options.container === 'string'
      ? document.querySelector(this.options.container)
      : this.options.container;

    this._target = new Date(this.options.target);
    this._interval = null;
    this._remaining = { days: 0, hours: 0, minutes: 0, seconds: 0 };

    if (this._container) {
      this._render();
      if (this.options.autoStart) {
        this.start();
      }
    }
  }

  /**
   * 렌더링
   * @private
   */
  _render() {
    this._container.className = 'catui-countdown';
    this._container.style.cssText = 'display: flex; gap: 8px; justify-content: center;';
    
    const items = [];
    if (this.options.format.includes('DD')) items.push('days');
    if (this.options.format.includes('HH')) items.push('hours');
    if (this.options.format.includes('MM')) items.push('minutes');
    if (this.options.format.includes('SS')) items.push('seconds');

    this._container.innerHTML = items.map((key, i) => `
      <div class="catui-countdown-item" style="text-align: center;">
        <div class="catui-countdown-value" data-key="${key}" 
          style="min-width: 50px; padding: 12px; background: var(--bg-secondary); border-radius: 8px; font-size: 24px; font-weight: 700; color: var(--text-primary);">
          00
        </div>
        ${this.options.showLabels ? `<div style="font-size: 12px; color: var(--text-tertiary); margin-top: 4px;">${this.options.labels[key]}</div>` : ''}
      </div>
      ${i < items.length - 1 ? '<span style="font-size: 24px; font-weight: 700; color: var(--text-tertiary); align-self: flex-start; padding-top: 12px;">:</span>' : ''}
    `).join('');
  }

  /**
   * 시작
   */
  start() {
    if (this._interval) return;
    
    this._tick();
    this._interval = setInterval(() => this._tick(), 1000);
  }

  /**
   * 정지
   */
  stop() {
    if (this._interval) {
      clearInterval(this._interval);
      this._interval = null;
    }
  }

  /**
   * 틱
   * @private
   */
  _tick() {
    const now = new Date();
    const diff = Math.max(0, this._target - now);

    if (diff === 0) {
      this.stop();
      this._update({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      if (this.options.onComplete) {
        this.options.onComplete();
      }
      return;
    }

    const seconds = Math.floor(diff / 1000) % 60;
    const minutes = Math.floor(diff / (1000 * 60)) % 60;
    const hours = Math.floor(diff / (1000 * 60 * 60)) % 24;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    this._remaining = { days, hours, minutes, seconds };
    this._update(this._remaining);

    if (this.options.onTick) {
      this.options.onTick(this._remaining, diff);
    }
  }

  /**
   * 업데이트
   * @private
   */
  _update(values) {
    Object.entries(values).forEach(([key, value]) => {
      const el = this._container.querySelector(`[data-key="${key}"]`);
      if (el) el.textContent = String(value).padStart(2, '0');
    });
  }

  /**
   * 목표 시간 설정
   * @param {Date|string} target
   */
  setTarget(target) {
    this._target = new Date(target);
    this._tick();
  }

  /**
   * 남은 시간 가져오기
   * @returns {Object}
   */
  getRemaining() {
    return { ...this._remaining };
  }

  /**
   * 정리
   */
  destroy() {
    this.stop();
    if (this._container) {
      this._container.innerHTML = '';
    }
    this._container = null;
    this.options = null;
  }
}

/**
 * DDay 클래스 - 디데이 카운터
 * @class DDay
 */
class DDay {
  /**
   * @constructor
   * @param {Object} options
   * @param {string|HTMLElement} options.container - 컨테이너
   * @param {Date|string} options.target - 목표 날짜
   * @param {string} [options.title] - 제목
   * @param {string} [options.prefix='D'] - 접두사
   * @param {boolean} [options.showTime=false] - 시간 표시
   */
  constructor(options = {}) {
    this.options = {
      container: null,
      target: null,
      title: '',
      prefix: 'D',
      showTime: false,
      ...options
    };

    this._container = typeof this.options.container === 'string'
      ? document.querySelector(this.options.container)
      : this.options.container;

    this._target = new Date(this.options.target);
    this._target.setHours(0, 0, 0, 0);
    this._interval = null;

    if (this._container) {
      this._render();
      this._update();
      
      if (this.options.showTime) {
        this._interval = setInterval(() => this._update(), 1000);
      }
    }
  }

  /**
   * 렌더링
   * @private
   */
  _render() {
    this._container.className = 'catui-dday';
    this._container.style.cssText = 'text-align: center; padding: 16px;';
    
    this._container.innerHTML = `
      ${this.options.title ? `<div class="catui-dday-title" style="font-size: 14px; color: var(--text-secondary); margin-bottom: 8px;">${this.options.title}</div>` : ''}
      <div class="catui-dday-value" style="font-size: 48px; font-weight: 700; color: var(--primary);"></div>
      ${this.options.showTime ? `<div class="catui-dday-time" style="font-size: 14px; color: var(--text-tertiary); margin-top: 4px;"></div>` : ''}
      <div class="catui-dday-date" style="font-size: 12px; color: var(--text-tertiary); margin-top: 8px;"></div>
    `;
  }

  /**
   * 업데이트
   * @private
   */
  _update() {
    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);

    const diff = this._target - today;
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

    const valueEl = this._container.querySelector('.catui-dday-value');
    const dateEl = this._container.querySelector('.catui-dday-date');
    const timeEl = this._container.querySelector('.catui-dday-time');

    if (days === 0) {
      valueEl.textContent = `${this.options.prefix}-Day`;
    } else if (days > 0) {
      valueEl.textContent = `${this.options.prefix}-${days}`;
    } else {
      valueEl.textContent = `${this.options.prefix}+${Math.abs(days)}`;
    }

    dateEl.textContent = this._formatDate(this._target);

    if (timeEl && this.options.showTime) {
      const remaining = this._target - now;
      if (remaining > 0) {
        const hours = Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
        timeEl.textContent = `${hours}시간 ${minutes}분 ${seconds}초 남음`;
      } else {
        timeEl.textContent = '';
      }
    }
  }

  /**
   * 날짜 형식화
   * @private
   */
  _formatDate(date) {
    const y = date.getFullYear();
    const m = date.getMonth() + 1;
    const d = date.getDate();
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    const day = days[date.getDay()];
    return `${y}년 ${m}월 ${d}일 (${day})`;
  }

  /**
   * 목표 설정
   * @param {Date|string} target
   */
  setTarget(target) {
    this._target = new Date(target);
    this._target.setHours(0, 0, 0, 0);
    this._update();
  }

  /**
   * 디데이 값 가져오기
   * @returns {number}
   */
  getDays() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return Math.ceil((this._target - today) / (1000 * 60 * 60 * 24));
  }

  /**
   * 정리
   */
  destroy() {
    if (this._interval) {
      clearInterval(this._interval);
    }
    if (this._container) {
      this._container.innerHTML = '';
    }
    this._container = null;
    this.options = null;
  }
}

export { DatePicker, TimePicker, ColorPicker, Countdown, DDay };
export default { DatePicker, TimePicker, ColorPicker, Countdown, DDay };
