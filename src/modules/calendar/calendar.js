/**
 * CATUI Mobile - Calendar Module
 * MonthCalendar, WeekView, DateRangePicker, EventCard 컴포넌트
 * @module calendar
 */

/**
 * MonthCalendar 클래스 - 월간 캘린더
 * @class MonthCalendar
 */
class MonthCalendar {
  /**
   * @constructor
   * @param {Object} options
   * @param {string|HTMLElement} options.container - 컨테이너
   * @param {Date} [options.date=new Date()] - 초기 날짜
   * @param {Array} [options.events=[]] - 이벤트 배열 [{date, title, color, allDay}]
   * @param {string} [options.selectionMode='single'] - 선택 모드 (single, multiple, range)
   * @param {Date} [options.minDate] - 최소 날짜
   * @param {Date} [options.maxDate] - 최대 날짜
   * @param {Array} [options.disabledDates=[]] - 비활성 날짜
   * @param {Array} [options.disabledDays=[]] - 비활성 요일 (0=일, 6=토)
   * @param {boolean} [options.showWeekNumbers=false] - 주차 표시
   * @param {boolean} [options.showAdjacentMonths=true] - 인접 월 날짜 표시
   * @param {number} [options.firstDayOfWeek=0] - 시작 요일 (0=일요일)
   * @param {string} [options.locale='ko-KR'] - 로케일
   * @param {Function} [options.onDateSelect] - 날짜 선택 콜백
   * @param {Function} [options.onMonthChange] - 월 변경 콜백
   * @param {Function} [options.onEventClick] - 이벤트 클릭 콜백
   */
  constructor(options = {}) {
    this.options = {
      container: null,
      date: new Date(),
      events: [],
      selectionMode: 'single',
      minDate: null,
      maxDate: null,
      disabledDates: [],
      disabledDays: [],
      showWeekNumbers: false,
      showAdjacentMonths: true,
      firstDayOfWeek: 0,
      locale: 'ko-KR',
      onDateSelect: null,
      onMonthChange: null,
      onEventClick: null,
      ...options
    };

    this._container = typeof this.options.container === 'string'
      ? document.querySelector(this.options.container)
      : this.options.container;

    this._handlers = {};
    this._currentDate = new Date(this.options.date);
    this._selectedDates = [];
    this._rangeStart = null;

    if (this._container) {
      this._render();
      this._bindEvents();
    }
  }

  /**
   * 요일 이름
   * @private
   */
  _getDayNames() {
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    const firstDay = this.options.firstDayOfWeek;
    return [...days.slice(firstDay), ...days.slice(0, firstDay)];
  }

  /**
   * 월 이름
   * @private
   */
  _getMonthName(date) {
    return date.toLocaleDateString(this.options.locale, { year: 'numeric', month: 'long' });
  }

  /**
   * 렌더링
   * @private
   */
  _render() {
    const year = this._currentDate.getFullYear();
    const month = this._currentDate.getMonth();

    this._container.className = 'catui-calendar';
    this._container.innerHTML = `
      <div class="catui-calendar-header">
        <button class="catui-calendar-nav" data-action="prev" type="button">
          <span class="material-icons">chevron_left</span>
        </button>
        <span class="catui-calendar-title">${this._getMonthName(this._currentDate)}</span>
        <button class="catui-calendar-nav" data-action="next" type="button">
          <span class="material-icons">chevron_right</span>
        </button>
      </div>
      <div class="catui-calendar-weekdays">
        ${this._getDayNames().map((day, i) => `
          <div class="catui-calendar-weekday ${i === 0 || i === 6 ? 'is-weekend' : ''}">${day}</div>
        `).join('')}
      </div>
      <div class="catui-calendar-days">
        ${this._renderDays(year, month)}
      </div>
    `;
  }

  /**
   * 날짜 렌더링
   * @private
   */
  _renderDays(year, month) {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDay = (firstDay.getDay() - this.options.firstDayOfWeek + 7) % 7;
    const totalDays = lastDay.getDate();

    const prevMonthLastDay = new Date(year, month, 0).getDate();
    const days = [];

    // 이전 달
    for (let i = startDay - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, prevMonthLastDay - i);
      days.push(this._createDayHtml(date, true));
    }

    // 현재 달
    for (let i = 1; i <= totalDays; i++) {
      const date = new Date(year, month, i);
      days.push(this._createDayHtml(date, false));
    }

    // 다음 달
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      const date = new Date(year, month + 1, i);
      days.push(this._createDayHtml(date, true));
    }

    return days.join('');
  }

  /**
   * 날짜 HTML 생성
   * @private
   */
  _createDayHtml(date, isAdjacent) {
    const dateStr = this._formatDate(date);
    const today = this._formatDate(new Date());
    const isToday = dateStr === today;
    const isSelected = this._isSelected(date);
    const isDisabled = this._isDisabled(date);
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    const events = this._getEventsForDate(date);
    const isInRange = this._isInRange(date);

    if (isAdjacent && !this.options.showAdjacentMonths) {
      return '<div class="catui-calendar-day is-empty"></div>';
    }

    const classes = ['catui-calendar-day'];
    if (isAdjacent) classes.push('is-adjacent');
    if (isToday) classes.push('is-today');
    if (isSelected) classes.push('is-selected');
    if (isDisabled) classes.push('is-disabled');
    if (isWeekend) classes.push('is-weekend');
    if (isInRange) classes.push('is-in-range');
    if (this._rangeStart && dateStr === this._formatDate(this._rangeStart)) classes.push('is-range-start');

    return `
      <div class="${classes.join(' ')}" data-date="${dateStr}">
        <span class="catui-calendar-day-num">${date.getDate()}</span>
        ${events.length > 0 ? `
          <div class="catui-calendar-events">
            ${events.slice(0, 3).map(e => `
              <div class="catui-calendar-event" style="background: ${e.color || 'var(--primary)'}" 
                   data-event-id="${e.id || ''}" title="${e.title}"></div>
            `).join('')}
            ${events.length > 3 ? `<span class="catui-calendar-more">+${events.length - 3}</span>` : ''}
          </div>
        ` : ''}
      </div>
    `;
  }

  /**
   * 날짜 포맷
   * @private
   */
  _formatDate(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  /**
   * 날짜 파싱
   * @private
   */
  _parseDate(dateStr) {
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d);
  }

  /**
   * 선택 여부 확인
   * @private
   */
  _isSelected(date) {
    const dateStr = this._formatDate(date);
    return this._selectedDates.includes(dateStr);
  }

  /**
   * 범위 내 여부 확인
   * @private
   */
  _isInRange(date) {
    if (this.options.selectionMode !== 'range' || this._selectedDates.length !== 2) return false;

    const start = this._parseDate(this._selectedDates[0]);
    const end = this._parseDate(this._selectedDates[1]);

    return date > start && date < end;
  }

  /**
   * 비활성 여부 확인
   * @private
   */
  _isDisabled(date) {
    const dateStr = this._formatDate(date);

    // 비활성 날짜
    if (this.options.disabledDates.includes(dateStr)) return true;

    // 비활성 요일
    if (this.options.disabledDays.includes(date.getDay())) return true;

    // 범위 제한
    if (this.options.minDate && date < new Date(this.options.minDate)) return true;
    if (this.options.maxDate && date > new Date(this.options.maxDate)) return true;

    return false;
  }

  /**
   * 해당 날짜의 이벤트 가져오기
   * @private
   */
  _getEventsForDate(date) {
    const dateStr = this._formatDate(date);
    return this.options.events.filter(e => e.date === dateStr);
  }

  /**
   * 이벤트 바인딩
   * @private
   */
  _bindEvents() {
    this._handlers.click = (e) => {
      // 네비게이션
      const navBtn = e.target.closest('.catui-calendar-nav');
      if (navBtn) {
        const action = navBtn.dataset.action;
        if (action === 'prev') this.prevMonth();
        else if (action === 'next') this.nextMonth();
        return;
      }

      // 날짜 선택
      const dayEl = e.target.closest('.catui-calendar-day');
      if (dayEl && !dayEl.classList.contains('is-disabled') && !dayEl.classList.contains('is-empty')) {
        this._handleDateSelect(dayEl.dataset.date);
        return;
      }

      // 이벤트 클릭
      const eventEl = e.target.closest('.catui-calendar-event');
      if (eventEl && this.options.onEventClick) {
        const eventId = eventEl.dataset.eventId;
        const event = this.options.events.find(e => e.id === eventId);
        if (event) this.options.onEventClick(event);
      }
    };

    this._container.addEventListener('click', this._handlers.click);
  }

  /**
   * 날짜 선택 처리
   * @private
   */
  _handleDateSelect(dateStr) {
    const { selectionMode } = this.options;

    if (selectionMode === 'single') {
      this._selectedDates = [dateStr];
    } else if (selectionMode === 'multiple') {
      const index = this._selectedDates.indexOf(dateStr);
      if (index === -1) {
        this._selectedDates.push(dateStr);
      } else {
        this._selectedDates.splice(index, 1);
      }
    } else if (selectionMode === 'range') {
      if (!this._rangeStart || this._selectedDates.length === 2) {
        this._rangeStart = this._parseDate(dateStr);
        this._selectedDates = [dateStr];
      } else {
        const start = this._rangeStart;
        const end = this._parseDate(dateStr);
        if (end < start) {
          this._selectedDates = [dateStr, this._formatDate(start)];
        } else {
          this._selectedDates = [this._formatDate(start), dateStr];
        }
        this._rangeStart = null;
      }
    }

    this._updateDays();

    if (this.options.onDateSelect) {
      if (selectionMode === 'single') {
        this.options.onDateSelect(this._parseDate(dateStr));
      } else {
        this.options.onDateSelect(this._selectedDates.map(d => this._parseDate(d)));
      }
    }
  }

  /**
   * 날짜 업데이트
   * @private
   */
  _updateDays() {
    const daysContainer = this._container.querySelector('.catui-calendar-days');
    if (daysContainer) {
      daysContainer.innerHTML = this._renderDays(
        this._currentDate.getFullYear(),
        this._currentDate.getMonth()
      );
    }
  }

  /**
   * 이전 달
   */
  prevMonth() {
    this._currentDate.setMonth(this._currentDate.getMonth() - 1);
    this._render();
    this._bindEvents();

    if (this.options.onMonthChange) {
      this.options.onMonthChange(this._currentDate.getFullYear(), this._currentDate.getMonth());
    }
  }

  /**
   * 다음 달
   */
  nextMonth() {
    this._currentDate.setMonth(this._currentDate.getMonth() + 1);
    this._render();
    this._bindEvents();

    if (this.options.onMonthChange) {
      this.options.onMonthChange(this._currentDate.getFullYear(), this._currentDate.getMonth());
    }
  }

  /**
   * 특정 월로 이동
   * @param {number} year
   * @param {number} month - 0-based
   */
  goToMonth(year, month) {
    this._currentDate = new Date(year, month, 1);
    this._render();
    this._bindEvents();

    if (this.options.onMonthChange) {
      this.options.onMonthChange(year, month);
    }
  }

  /**
   * 오늘로 이동
   */
  goToToday() {
    this._currentDate = new Date();
    this._render();
    this._bindEvents();
  }

  /**
   * 날짜 선택
   * @param {Date|string} date
   */
  selectDate(date) {
    const dateStr = date instanceof Date ? this._formatDate(date) : date;
    this._handleDateSelect(dateStr);
  }

  /**
   * 선택 초기화
   */
  clearSelection() {
    this._selectedDates = [];
    this._rangeStart = null;
    this._updateDays();
  }

  /**
   * 이벤트 설정
   * @param {Array} events
   */
  setEvents(events) {
    this.options.events = events;
    this._updateDays();
  }

  /**
   * 이벤트 추가
   * @param {Object} event
   */
  addEvent(event) {
    this.options.events.push(event);
    this._updateDays();
  }

  /**
   * 선택된 날짜 가져오기
   * @returns {Array<Date>}
   */
  getSelectedDates() {
    return this._selectedDates.map(d => this._parseDate(d));
  }

  /**
   * 정리
   */
  destroy() {
    if (this._container) {
      this._container.removeEventListener('click', this._handlers.click);
      this._container.innerHTML = '';
      this._container.className = '';
    }

    this._container = null;
    this._handlers = null;
    this._selectedDates = null;
    this.options = null;
  }
}


/**
 * WeekView 클래스 - 주간 타임라인 뷰
 * @class WeekView
 */
class WeekView {
  /**
   * @constructor
   * @param {Object} options
   * @param {string|HTMLElement} options.container - 컨테이너
   * @param {Date} [options.date=new Date()] - 기준 날짜
   * @param {Array} [options.events=[]] - 이벤트 배열
   * @param {number} [options.startHour=0] - 시작 시간
   * @param {number} [options.endHour=24] - 종료 시간
   * @param {number} [options.hourHeight=60] - 시간당 높이 (px)
   * @param {string} [options.locale='ko-KR'] - 로케일
   * @param {Function} [options.onEventClick] - 이벤트 클릭 콜백
   * @param {Function} [options.onTimeSlotClick] - 시간 슬롯 클릭 콜백
   */
  constructor(options = {}) {
    this.options = {
      container: null,
      date: new Date(),
      events: [],
      startHour: 0,
      endHour: 24,
      hourHeight: 60,
      locale: 'ko-KR',
      onEventClick: null,
      onTimeSlotClick: null,
      ...options
    };

    this._container = typeof this.options.container === 'string'
      ? document.querySelector(this.options.container)
      : this.options.container;

    this._handlers = {};
    this._weekStart = this._getWeekStart(new Date(this.options.date));

    if (this._container) {
      this._render();
      this._bindEvents();
    }
  }

  /**
   * 주 시작일 가져오기
   * @private
   */
  _getWeekStart(date) {
    const d = new Date(date);
    const day = d.getDay();
    d.setDate(d.getDate() - day);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  /**
   * 렌더링
   * @private
   */
  _render() {
    const { startHour, endHour, hourHeight } = this.options;
    const days = this._getWeekDays();
    const today = new Date().toDateString();

    this._container.className = 'catui-weekview';
    this._container.innerHTML = `
      <div class="catui-weekview-header">
        <div class="catui-weekview-corner"></div>
        ${days.map(day => `
          <div class="catui-weekview-day-header ${day.date.toDateString() === today ? 'is-today' : ''}">
            <span class="catui-weekview-day-name">${day.name}</span>
            <span class="catui-weekview-day-num">${day.date.getDate()}</span>
          </div>
        `).join('')}
      </div>
      <div class="catui-weekview-body" style="height: ${(endHour - startHour) * hourHeight}px;">
        <div class="catui-weekview-times">
          ${this._renderTimeSlots()}
        </div>
        <div class="catui-weekview-grid">
          ${days.map(day => `
            <div class="catui-weekview-column" data-date="${this._formatDate(day.date)}">
              ${this._renderEventsForDay(day.date)}
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  /**
   * 주간 날짜 가져오기
   * @private
   */
  _getWeekDays() {
    const days = [];
    const dayNames = ['일', '월', '화', '수', '목', '금', '토'];

    for (let i = 0; i < 7; i++) {
      const date = new Date(this._weekStart);
      date.setDate(date.getDate() + i);
      days.push({
        date,
        name: dayNames[date.getDay()]
      });
    }

    return days;
  }

  /**
   * 시간 슬롯 렌더링
   * @private
   */
  _renderTimeSlots() {
    const { startHour, endHour, hourHeight } = this.options;
    let html = '';

    for (let h = startHour; h < endHour; h++) {
      const timeStr = `${String(h).padStart(2, '0')}:00`;
      html += `
        <div class="catui-weekview-time" style="height: ${hourHeight}px;">
          <span>${timeStr}</span>
        </div>
      `;
    }

    return html;
  }

  /**
   * 날짜별 이벤트 렌더링
   * @private
   */
  _renderEventsForDay(date) {
    const dateStr = this._formatDate(date);
    const events = this.options.events.filter(e => {
      const eventDate = new Date(e.start || e.date);
      return this._formatDate(eventDate) === dateStr;
    });

    const { startHour, hourHeight } = this.options;

    return events.map(event => {
      const start = new Date(event.start || event.date);
      const end = event.end ? new Date(event.end) : new Date(start.getTime() + 60 * 60 * 1000);

      const startMinutes = (start.getHours() - startHour) * 60 + start.getMinutes();
      const duration = (end - start) / (1000 * 60);

      const top = (startMinutes / 60) * hourHeight;
      const height = (duration / 60) * hourHeight;

      return `
        <div class="catui-weekview-event" 
             style="top: ${top}px; height: ${height}px; background: ${event.color || 'var(--primary)'};"
             data-event-id="${event.id || ''}">
          <div class="catui-weekview-event-title">${event.title}</div>
          ${duration >= 60 ? `<div class="catui-weekview-event-time">${this._formatTime(start)} - ${this._formatTime(end)}</div>` : ''}
        </div>
      `;
    }).join('');
  }

  /**
   * 날짜 포맷
   * @private
   */
  _formatDate(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  /**
   * 시간 포맷
   * @private
   */
  _formatTime(date) {
    return date.toLocaleTimeString(this.options.locale, { hour: '2-digit', minute: '2-digit' });
  }

  /**
   * 이벤트 바인딩
   * @private
   */
  _bindEvents() {
    this._handlers.click = (e) => {
      const eventEl = e.target.closest('.catui-weekview-event');
      if (eventEl && this.options.onEventClick) {
        const eventId = eventEl.dataset.eventId;
        const event = this.options.events.find(ev => ev.id === eventId);
        if (event) this.options.onEventClick(event);
        return;
      }

      const column = e.target.closest('.catui-weekview-column');
      if (column && this.options.onTimeSlotClick) {
        const rect = column.getBoundingClientRect();
        const y = e.clientY - rect.top;
        const hour = Math.floor(y / this.options.hourHeight) + this.options.startHour;
        const date = column.dataset.date;
        this.options.onTimeSlotClick(date, hour);
      }
    };

    this._container.addEventListener('click', this._handlers.click);
  }

  /**
   * 이전 주
   */
  prevWeek() {
    this._weekStart.setDate(this._weekStart.getDate() - 7);
    this._render();
    this._bindEvents();
  }

  /**
   * 다음 주
   */
  nextWeek() {
    this._weekStart.setDate(this._weekStart.getDate() + 7);
    this._render();
    this._bindEvents();
  }

  /**
   * 이벤트 설정
   * @param {Array} events
   */
  setEvents(events) {
    this.options.events = events;
    this._render();
    this._bindEvents();
  }

  /**
   * 정리
   */
  destroy() {
    if (this._container) {
      this._container.removeEventListener('click', this._handlers.click);
      this._container.innerHTML = '';
      this._container.className = '';
    }

    this._container = null;
    this._handlers = null;
    this.options = null;
  }
}


/**
 * DateRangePicker 클래스 - 기간 선택
 * @class DateRangePicker
 */
class DateRangePicker {
  /**
   * @constructor
   * @param {Object} options
   * @param {string|HTMLElement} options.container - 컨테이너
   * @param {Date} [options.startDate] - 시작일
   * @param {Date} [options.endDate] - 종료일
   * @param {Date} [options.minDate] - 최소 날짜
   * @param {Date} [options.maxDate] - 최대 날짜
   * @param {Array} [options.presets] - 프리셋 [{label, start, end}]
   * @param {string} [options.locale='ko-KR'] - 로케일
   * @param {Function} [options.onChange] - 변경 콜백
   */
  constructor(options = {}) {
    this.options = {
      container: null,
      startDate: null,
      endDate: null,
      minDate: null,
      maxDate: null,
      presets: [
        { label: '오늘', days: 0 },
        { label: '최근 7일', days: 7 },
        { label: '최근 30일', days: 30 },
        { label: '이번 달', type: 'month' },
        { label: '지난 달', type: 'lastMonth' }
      ],
      locale: 'ko-KR',
      onChange: null,
      ...options
    };

    this._container = typeof this.options.container === 'string'
      ? document.querySelector(this.options.container)
      : this.options.container;

    this._handlers = {};
    this._startDate = this.options.startDate ? new Date(this.options.startDate) : null;
    this._endDate = this.options.endDate ? new Date(this.options.endDate) : null;
    this._currentMonth = new Date();
    this._selecting = 'start';

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
    const { presets } = this.options;

    this._container.className = 'catui-daterange';
    this._container.innerHTML = `
      <div class="catui-daterange-presets">
        ${presets.map((preset, i) => `
          <button class="catui-daterange-preset" data-preset="${i}" type="button">${preset.label}</button>
        `).join('')}
      </div>
      <div class="catui-daterange-inputs">
        <div class="catui-daterange-input ${this._selecting === 'start' ? 'is-active' : ''}" data-type="start">
          <span class="material-icons">event</span>
          <span class="catui-daterange-value">${this._startDate ? this._formatDisplay(this._startDate) : '시작일'}</span>
        </div>
        <span class="catui-daterange-separator">~</span>
        <div class="catui-daterange-input ${this._selecting === 'end' ? 'is-active' : ''}" data-type="end">
          <span class="material-icons">event</span>
          <span class="catui-daterange-value">${this._endDate ? this._formatDisplay(this._endDate) : '종료일'}</span>
        </div>
      </div>
      <div class="catui-daterange-calendar">
        ${this._renderCalendar()}
      </div>
    `;
  }

  /**
   * 캘린더 렌더링
   * @private
   */
  _renderCalendar() {
    const year = this._currentMonth.getFullYear();
    const month = this._currentMonth.getMonth();
    const monthName = this._currentMonth.toLocaleDateString(this.options.locale, { year: 'numeric', month: 'long' });

    return `
      <div class="catui-daterange-header">
        <button class="catui-daterange-nav" data-action="prev" type="button">
          <span class="material-icons">chevron_left</span>
        </button>
        <span class="catui-daterange-month">${monthName}</span>
        <button class="catui-daterange-nav" data-action="next" type="button">
          <span class="material-icons">chevron_right</span>
        </button>
      </div>
      <div class="catui-daterange-weekdays">
        ${['일', '월', '화', '수', '목', '금', '토'].map(d => `
          <div class="catui-daterange-weekday">${d}</div>
        `).join('')}
      </div>
      <div class="catui-daterange-days">
        ${this._renderDays(year, month)}
      </div>
    `;
  }

  /**
   * 날짜 렌더링
   * @private
   */
  _renderDays(year, month) {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDay = firstDay.getDay();
    const totalDays = lastDay.getDate();

    const days = [];

    // 빈 칸
    for (let i = 0; i < startDay; i++) {
      days.push('<div class="catui-daterange-day is-empty"></div>');
    }

    // 날짜
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 1; i <= totalDays; i++) {
      const date = new Date(year, month, i);
      const dateStr = this._formatDate(date);

      const classes = ['catui-daterange-day'];

      if (date.getTime() === today.getTime()) classes.push('is-today');
      if (this._isDisabled(date)) classes.push('is-disabled');
      if (this._startDate && dateStr === this._formatDate(this._startDate)) classes.push('is-start');
      if (this._endDate && dateStr === this._formatDate(this._endDate)) classes.push('is-end');
      if (this._isInRange(date)) classes.push('is-in-range');

      days.push(`<div class="${classes.join(' ')}" data-date="${dateStr}">${i}</div>`);
    }

    return days.join('');
  }

  /**
   * 범위 내 여부
   * @private
   */
  _isInRange(date) {
    if (!this._startDate || !this._endDate) return false;
    return date > this._startDate && date < this._endDate;
  }

  /**
   * 비활성 여부
   * @private
   */
  _isDisabled(date) {
    if (this.options.minDate && date < new Date(this.options.minDate)) return true;
    if (this.options.maxDate && date > new Date(this.options.maxDate)) return true;
    return false;
  }

  /**
   * 날짜 포맷 (저장용)
   * @private
   */
  _formatDate(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  /**
   * 날짜 포맷 (표시용)
   * @private
   */
  _formatDisplay(date) {
    return date.toLocaleDateString(this.options.locale, { year: 'numeric', month: 'short', day: 'numeric' });
  }

  /**
   * 이벤트 바인딩
   * @private
   */
  _bindEvents() {
    this._handlers.click = (e) => {
      // 프리셋
      const presetBtn = e.target.closest('.catui-daterange-preset');
      if (presetBtn) {
        this._applyPreset(parseInt(presetBtn.dataset.preset));
        return;
      }

      // 입력 필드
      const inputEl = e.target.closest('.catui-daterange-input');
      if (inputEl) {
        this._selecting = inputEl.dataset.type;
        this._updateInputs();
        return;
      }

      // 네비게이션
      const navBtn = e.target.closest('.catui-daterange-nav');
      if (navBtn) {
        if (navBtn.dataset.action === 'prev') {
          this._currentMonth.setMonth(this._currentMonth.getMonth() - 1);
        } else {
          this._currentMonth.setMonth(this._currentMonth.getMonth() + 1);
        }
        this._updateCalendar();
        return;
      }

      // 날짜 선택
      const dayEl = e.target.closest('.catui-daterange-day');
      if (dayEl && !dayEl.classList.contains('is-disabled') && !dayEl.classList.contains('is-empty')) {
        this._selectDate(dayEl.dataset.date);
      }
    };

    this._container.addEventListener('click', this._handlers.click);
  }

  /**
   * 프리셋 적용
   * @private
   */
  _applyPreset(index) {
    const preset = this.options.presets[index];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (preset.type === 'month') {
      this._startDate = new Date(today.getFullYear(), today.getMonth(), 1);
      this._endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    } else if (preset.type === 'lastMonth') {
      this._startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      this._endDate = new Date(today.getFullYear(), today.getMonth(), 0);
    } else {
      this._endDate = new Date(today);
      this._startDate = new Date(today);
      this._startDate.setDate(this._startDate.getDate() - (preset.days || 0));
    }

    this._render();
    this._bindEvents();
    this._emitChange();
  }

  /**
   * 날짜 선택
   * @private
   */
  _selectDate(dateStr) {
    const date = new Date(dateStr);

    if (this._selecting === 'start') {
      this._startDate = date;
      if (this._endDate && date > this._endDate) {
        this._endDate = null;
      }
      this._selecting = 'end';
    } else {
      if (date < this._startDate) {
        this._endDate = this._startDate;
        this._startDate = date;
      } else {
        this._endDate = date;
      }
      this._selecting = 'start';
    }

    this._render();
    this._bindEvents();
    this._emitChange();
  }

  /**
   * 입력 필드 업데이트
   * @private
   */
  _updateInputs() {
    this._container.querySelectorAll('.catui-daterange-input').forEach(el => {
      el.classList.toggle('is-active', el.dataset.type === this._selecting);
    });
  }

  /**
   * 캘린더 업데이트
   * @private
   */
  _updateCalendar() {
    const calendarEl = this._container.querySelector('.catui-daterange-calendar');
    if (calendarEl) {
      calendarEl.innerHTML = this._renderCalendar();
    }
  }

  /**
   * 변경 이벤트 발생
   * @private
   */
  _emitChange() {
    if (this.options.onChange && this._startDate && this._endDate) {
      this.options.onChange({
        start: this._startDate,
        end: this._endDate
      });
    }
  }

  /**
   * 범위 가져오기
   * @returns {Object}
   */
  getRange() {
    return {
      start: this._startDate,
      end: this._endDate
    };
  }

  /**
   * 범위 설정
   * @param {Date} start
   * @param {Date} end
   */
  setRange(start, end) {
    this._startDate = start ? new Date(start) : null;
    this._endDate = end ? new Date(end) : null;
    this._render();
    this._bindEvents();
  }

  /**
   * 정리
   */
  destroy() {
    if (this._container) {
      this._container.removeEventListener('click', this._handlers.click);
      this._container.innerHTML = '';
      this._container.className = '';
    }

    this._container = null;
    this._handlers = null;
    this.options = null;
  }
}


/**
 * EventCard 클래스 - 일정 카드
 * @class EventCard
 */
class EventCard {
  /**
   * @constructor
   * @param {Object} options
   * @param {string|HTMLElement} options.container - 컨테이너
   * @param {Object} options.event - 이벤트 데이터
   * @param {string} options.event.title - 제목
   * @param {Date|string} options.event.start - 시작일시
   * @param {Date|string} [options.event.end] - 종료일시
   * @param {string} [options.event.location] - 장소
   * @param {string} [options.event.description] - 설명
   * @param {string} [options.event.color] - 색상
   * @param {boolean} [options.event.allDay] - 종일 여부
   * @param {boolean} [options.compact=false] - 컴팩트 모드
   * @param {Function} [options.onClick] - 클릭 콜백
   * @param {Function} [options.onEdit] - 수정 콜백
   * @param {Function} [options.onDelete] - 삭제 콜백
   */
  constructor(options = {}) {
    this.options = {
      container: null,
      event: {},
      compact: false,
      locale: 'ko-KR',
      onClick: null,
      onEdit: null,
      onDelete: null,
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

  /**
   * 렌더링
   * @private
   */
  _render() {
    const { event, compact, locale } = this.options;
    const start = new Date(event.start);
    const end = event.end ? new Date(event.end) : null;

    const dateStr = start.toLocaleDateString(locale, { month: 'short', day: 'numeric', weekday: 'short' });
    const timeStr = event.allDay ? '종일' : start.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
    const endTimeStr = end ? end.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' }) : '';

    this._container.className = `catui-eventcard ${compact ? 'is-compact' : ''}`;
    this._container.style.setProperty('--event-color', event.color || 'var(--primary)');

    this._container.innerHTML = `
      <div class="catui-eventcard-indicator"></div>
      <div class="catui-eventcard-content">
        <div class="catui-eventcard-header">
          <h4 class="catui-eventcard-title">${event.title}</h4>
          ${!compact ? `
            <div class="catui-eventcard-actions">
              <button class="catui-eventcard-btn" data-action="edit" type="button">
                <span class="material-icons">edit</span>
              </button>
              <button class="catui-eventcard-btn" data-action="delete" type="button">
                <span class="material-icons">delete</span>
              </button>
            </div>
          ` : ''}
        </div>
        <div class="catui-eventcard-meta">
          <span class="catui-eventcard-date">
            <span class="material-icons">event</span>
            ${dateStr}
          </span>
          <span class="catui-eventcard-time">
            <span class="material-icons">schedule</span>
            ${timeStr}${endTimeStr ? ` - ${endTimeStr}` : ''}
          </span>
        </div>
        ${!compact && event.location ? `
          <div class="catui-eventcard-location">
            <span class="material-icons">location_on</span>
            ${event.location}
          </div>
        ` : ''}
        ${!compact && event.description ? `
          <p class="catui-eventcard-desc">${event.description}</p>
        ` : ''}
      </div>
    `;
  }

  /**
   * 이벤트 바인딩
   * @private
   */
  _bindEvents() {
    this._handlers.click = (e) => {
      const btn = e.target.closest('.catui-eventcard-btn');
      if (btn) {
        const action = btn.dataset.action;
        if (action === 'edit' && this.options.onEdit) {
          this.options.onEdit(this.options.event);
        } else if (action === 'delete' && this.options.onDelete) {
          this.options.onDelete(this.options.event);
        }
        return;
      }

      if (this.options.onClick) {
        this.options.onClick(this.options.event);
      }
    };

    this._container.addEventListener('click', this._handlers.click);
  }

  /**
   * 이벤트 업데이트
   * @param {Object} event
   */
  setEvent(event) {
    this.options.event = event;
    this._render();
    this._bindEvents();
  }

  /**
   * 정리
   */
  destroy() {
    if (this._container) {
      this._container.removeEventListener('click', this._handlers.click);
      this._container.innerHTML = '';
      this._container.className = '';
    }

    this._container = null;
    this._handlers = null;
    this.options = null;
  }
}

export { MonthCalendar, WeekView, DateRangePicker, EventCard };
export default { MonthCalendar, WeekView, DateRangePicker, EventCard };
