/**
 * CATUI Mobile - Auth Module
 * OTPInput, PinInput, PasswordInput 컴포넌트
 * @module auth
 */

/**
 * OTPInput 클래스 - 인증번호 입력
 * @class OTPInput
 */
class OTPInput {
  /**
   * @constructor
   * @param {Object} options
   * @param {string|HTMLElement} options.container - 컨테이너
   * @param {number} [options.length=6] - 자릿수
   * @param {string} [options.type='number'] - 입력 타입 (number, text, password)
   * @param {boolean} [options.autoFocus=true] - 자동 포커스
   * @param {boolean} [options.masked=false] - 마스킹 표시
   * @param {string} [options.separator=''] - 구분자
   * @param {Array} [options.separatorPosition=[]] - 구분자 위치
   * @param {boolean} [options.autoSubmit=true] - 완료 시 자동 제출
   * @param {string} [options.placeholder=''] - 플레이스홀더
   * @param {Function} [options.onInput] - 입력 콜백
   * @param {Function} [options.onComplete] - 완료 콜백
   * @param {Function} [options.onPaste] - 붙여넣기 콜백
   */
  constructor(options = {}) {
    this.options = {
      container: null,
      length: 6,
      type: 'number',
      autoFocus: true,
      masked: false,
      separator: '',
      separatorPosition: [],
      autoSubmit: true,
      placeholder: '',
      onInput: null,
      onComplete: null,
      onPaste: null,
      ...options
    };

    this._container = typeof this.options.container === 'string'
      ? document.querySelector(this.options.container)
      : this.options.container;

    this._inputs = [];
    this._value = '';
    this._handlers = {};
    this._isError = false;
    this._timers = [];  // setTimeout 관리

    if (this._container) {
      this._render();
      this._bindEvents();

      if (this.options.autoFocus) {
        this._inputs[0]?.focus();
      }
    }
  }

  /**
   * 렌더링
   * @private
   */
  _render() {
    this._container.className = 'catui-otp-input';

    let html = '<div class="catui-otp-fields">';

    for (let i = 0; i < this.options.length; i++) {
      // 구분자 추가
      if (this.options.separator && this.options.separatorPosition.includes(i)) {
        html += `<span class="catui-otp-separator">${this.options.separator}</span>`;
      }

      // password 타입은 form 밖에서 경고 발생하므로 text + CSS로 마스킹
      const inputType = this.options.type === 'number' ? 'tel' : 'text';

      html += `
        <input 
          type="${inputType}"
          class="catui-otp-field${this.options.masked ? ' is-masked' : ''}"
          data-index="${i}"
          maxlength="1"
          inputmode="${this.options.type === 'number' ? 'numeric' : 'text'}"
          pattern="${this.options.type === 'number' ? '[0-9]*' : '.*'}"
          autocomplete="one-time-code"
          placeholder="${this.options.placeholder}"
        />
      `;
    }

    html += '</div>';
    this._container.innerHTML = html;

    this._inputs = Array.from(this._container.querySelectorAll('.catui-otp-field'));
  }

  /**
   * 이벤트 바인딩
   * @private
   */
  _bindEvents() {
    // 입력 이벤트
    this._handlers.input = (e) => {
      const input = e.target;
      const index = parseInt(input.dataset.index);
      let value = input.value;

      // 숫자만 허용 (type이 number인 경우)
      if (this.options.type === 'number') {
        value = value.replace(/[^0-9]/g, '');
        input.value = value;
      }

      // 한 글자만
      if (value.length > 1) {
        input.value = value[0];
      }

      this._updateValue();

      if (this.options.onInput) {
        this.options.onInput(this._value, index);
      }

      // 에러 상태 해제
      if (this._isError) {
        this.setError(false);
      }

      // 다음 입력칸으로 이동
      if (value && index < this.options.length - 1) {
        this._inputs[index + 1].focus();
      }

      // 완료 체크
      if (this._value.length === this.options.length) {
        if (this.options.onComplete) {
          this.options.onComplete(this._value);
        }
      }
    };

    // 키다운 이벤트
    this._handlers.keydown = (e) => {
      const input = e.target;
      const index = parseInt(input.dataset.index);

      // Backspace
      if (e.key === 'Backspace') {
        if (!input.value && index > 0) {
          e.preventDefault();
          this._inputs[index - 1].focus();
          this._inputs[index - 1].value = '';
          this._updateValue();
        }
      }

      // 좌우 화살표
      if (e.key === 'ArrowLeft' && index > 0) {
        e.preventDefault();
        this._inputs[index - 1].focus();
      }
      if (e.key === 'ArrowRight' && index < this.options.length - 1) {
        e.preventDefault();
        this._inputs[index + 1].focus();
      }
    };

    // 붙여넣기 이벤트
    this._handlers.paste = (e) => {
      e.preventDefault();
      const pastedData = (e.clipboardData || window.clipboardData).getData('text');

      if (this.options.onPaste) {
        this.options.onPaste(pastedData);
      }

      // 숫자만 추출 (type이 number인 경우)
      let cleanData = this.options.type === 'number'
        ? pastedData.replace(/[^0-9]/g, '')
        : pastedData;

      // 길이 제한
      cleanData = cleanData.slice(0, this.options.length);

      // 각 입력칸에 분배
      for (let i = 0; i < cleanData.length; i++) {
        if (this._inputs[i]) {
          this._inputs[i].value = cleanData[i];
        }
      }

      this._updateValue();

      // 마지막 입력된 칸으로 포커스
      const lastIndex = Math.min(cleanData.length, this.options.length) - 1;
      if (lastIndex >= 0 && this._inputs[lastIndex]) {
        this._inputs[lastIndex].focus();
      }

      // 완료 체크
      if (this._value.length === this.options.length && this.options.onComplete) {
        this.options.onComplete(this._value);
      }
    };

    // 포커스 이벤트
    this._handlers.focus = (e) => {
      e.target.select();
      this._container.classList.add('is-focused');
    };

    this._handlers.blur = () => {
      this._container.classList.remove('is-focused');
    };

    // 이벤트 등록
    this._inputs.forEach(input => {
      input.addEventListener('input', this._handlers.input);
      input.addEventListener('keydown', this._handlers.keydown);
      input.addEventListener('paste', this._handlers.paste);
      input.addEventListener('focus', this._handlers.focus);
      input.addEventListener('blur', this._handlers.blur);
    });
  }

  /**
   * 값 업데이트
   * @private
   */
  _updateValue() {
    this._value = this._inputs.map(input => input.value).join('');
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
   * @param {string} value
   */
  setValue(value) {
    const chars = value.split('').slice(0, this.options.length);

    this._inputs.forEach((input, i) => {
      input.value = chars[i] || '';
    });

    this._updateValue();
  }

  /**
   * 초기화
   */
  clear() {
    this._inputs.forEach(input => {
      input.value = '';
    });
    this._value = '';
    this._inputs[0]?.focus();
    this.setError(false);
  }

  /**
   * 특정 인덱스에 포커스
   * @param {number} index
   */
  focus(index = 0) {
    if (this._inputs[index]) {
      this._inputs[index].focus();
    }
  }

  /**
   * 에러 상태 설정
   * @param {boolean} isError
   */
  setError(isError) {
    this._isError = isError;

    if (isError) {
      this._container.classList.add('is-error');
      // 흔들림 효과
      this._container.classList.add('shake');
      const timerId = setTimeout(() => {
        if (this._container) {
          this._container.classList.remove('shake');
        }
      }, 500);
      this._timers.push(timerId);
    } else {
      this._container.classList.remove('is-error');
    }
  }

  /**
   * 비활성화
   * @param {boolean} disabled
   */
  setDisabled(disabled) {
    this._inputs.forEach(input => {
      input.disabled = disabled;
    });
    this._container.classList.toggle('is-disabled', disabled);
  }

  /**
   * 정리
   */
  destroy() {
    // 타이머 정리
    this._timers.forEach(id => clearTimeout(id));
    this._timers = [];

    // 이벤트 제거
    this._inputs.forEach(input => {
      input.removeEventListener('input', this._handlers.input);
      input.removeEventListener('keydown', this._handlers.keydown);
      input.removeEventListener('paste', this._handlers.paste);
      input.removeEventListener('focus', this._handlers.focus);
      input.removeEventListener('blur', this._handlers.blur);
    });

    // DOM 정리
    this._container.innerHTML = '';
    this._container.className = '';

    // 참조 해제
    this._container = null;
    this._inputs = null;
    this._handlers = null;
    this._timers = null;
    this.options = null;
  }
}

/**
 * PinInput 클래스 - PIN 번호 입력 (키패드)
 * @class PinInput
 */
class PinInput {
  /**
   * @constructor
   * @param {Object} options
   * @param {string|HTMLElement} options.container - 컨테이너
   * @param {number} [options.length=4] - 자릿수
   * @param {string} [options.title=''] - 제목
   * @param {string} [options.subtitle=''] - 부제목
   * @param {boolean} [options.shuffle=false] - 키패드 셔플
   * @param {boolean} [options.biometric=false] - 생체인증 버튼
   * @param {string} [options.display='dots'] - 표시 방식 (dots, numbers, masked)
   * @param {boolean} [options.haptic=true] - 진동 피드백
   * @param {Function} [options.onInput] - 입력 콜백
   * @param {Function} [options.onComplete] - 완료 콜백
   * @param {Function} [options.onBiometric] - 생체인증 콜백
   * @param {Function} [options.onError] - 에러 콜백
   */
  constructor(options = {}) {
    this.options = {
      container: null,
      length: 4,
      title: '',
      subtitle: '',
      shuffle: false,
      biometric: false,
      display: 'dots',
      haptic: true,
      onInput: null,
      onComplete: null,
      onBiometric: null,
      onError: null,
      ...options
    };

    this._container = typeof this.options.container === 'string'
      ? document.querySelector(this.options.container)
      : this.options.container;

    this._value = '';
    this._handlers = {};
    this._isError = false;
    this._isLocked = false;
    this._timers = [];  // setTimeout 관리

    if (this._container) {
      this._render();
      this._bindEvents();
    }
  }

  /**
   * 키패드 숫자 생성
   * @private
   */
  _getKeypadNumbers() {
    const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0];

    if (this.options.shuffle) {
      // Fisher-Yates 셔플
      for (let i = numbers.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
      }
    }

    return numbers;
  }

  /**
   * 렌더링
   * @private
   */
  _render() {
    this._container.className = 'catui-pin-input';

    const numbers = this._getKeypadNumbers();

    let html = '';

    // 제목
    if (this.options.title) {
      html += `<div class="catui-pin-title">${this.options.title}</div>`;
    }

    if (this.options.subtitle) {
      html += `<div class="catui-pin-subtitle">${this.options.subtitle}</div>`;
    }

    // 입력 표시
    html += '<div class="catui-pin-display">';
    for (let i = 0; i < this.options.length; i++) {
      html += `<div class="catui-pin-dot" data-index="${i}"></div>`;
    }
    html += '</div>';

    // 키패드
    html += '<div class="catui-pin-keypad">';

    // 1-9
    for (let i = 0; i < 9; i++) {
      html += `
        <button class="catui-pin-key" data-value="${numbers[i]}">
          <span class="catui-pin-key-number">${numbers[i]}</span>
        </button>
      `;
    }

    // 생체인증 또는 빈칸
    if (this.options.biometric) {
      html += `
        <button class="catui-pin-key catui-pin-key-biometric" data-action="biometric">
          <span class="material-icons">fingerprint</span>
        </button>
      `;
    } else {
      html += '<div class="catui-pin-key catui-pin-key-empty"></div>';
    }

    // 0
    html += `
      <button class="catui-pin-key" data-value="${numbers[9]}">
        <span class="catui-pin-key-number">${numbers[9]}</span>
      </button>
    `;

    // 삭제
    html += `
      <button class="catui-pin-key catui-pin-key-delete" data-action="delete">
        <span class="material-icons">backspace</span>
      </button>
    `;

    html += '</div>';

    this._container.innerHTML = html;

    this._dots = Array.from(this._container.querySelectorAll('.catui-pin-dot'));
    this._keys = Array.from(this._container.querySelectorAll('.catui-pin-key'));
  }

  /**
   * 이벤트 바인딩
   * @private
   */
  _bindEvents() {
    // 기존 이벤트 제거 (중복 방지)
    if (this._handlers.keyClick) {
      this._container.removeEventListener('click', this._handlers.keyClick);
    }

    this._handlers.keyClick = (e) => {
      if (this._isLocked) return;

      const key = e.target.closest('.catui-pin-key');
      if (!key) return;

      // 중복 클릭 방지 (debounce)
      if (this._lastClickTime && Date.now() - this._lastClickTime < 100) {
        return;
      }
      this._lastClickTime = Date.now();

      const value = key.dataset.value;
      const action = key.dataset.action;

      // 진동 피드백
      if (this.options.haptic && navigator.vibrate) {
        navigator.vibrate(10);
      }

      // 숫자 입력
      if (value !== undefined) {
        this._addDigit(value);
      }

      // 삭제
      if (action === 'delete') {
        this._removeDigit();
      }

      // 생체인증
      if (action === 'biometric' && this.options.onBiometric) {
        this.options.onBiometric();
      }
    };

    this._container.addEventListener('click', this._handlers.keyClick);
  }

  /**
   * 숫자 추가
   * @private
   */
  _addDigit(digit) {
    if (this._value.length >= this.options.length) return;

    this._value += digit;
    this._updateDisplay();

    // 에러 상태 해제
    if (this._isError) {
      this.setError(false);
    }

    if (this.options.onInput) {
      this.options.onInput(this._value.length);
    }

    // 완료 체크
    if (this._value.length === this.options.length) {
      if (this.options.onComplete) {
        this.options.onComplete(this._value);
      }
    }
  }

  /**
   * 숫자 제거
   * @private
   */
  _removeDigit() {
    if (this._value.length === 0) return;

    this._value = this._value.slice(0, -1);
    this._updateDisplay();

    if (this.options.onInput) {
      this.options.onInput(this._value.length);
    }
  }

  /**
   * 표시 업데이트
   * @private
   */
  _updateDisplay() {
    this._dots.forEach((dot, i) => {
      const isFilled = i < this._value.length;
      dot.classList.toggle('is-filled', isFilled);

      // 숫자 표시 모드
      if (this.options.display === 'numbers') {
        dot.textContent = this._value[i] || '';
      } else if (this.options.display === 'masked') {
        dot.textContent = isFilled ? '●' : '';
      }
    });
  }

  /**
   * 값 가져오기
   * @returns {string}
   */
  getValue() {
    return this._value;
  }

  /**
   * 초기화
   */
  clear() {
    this._value = '';
    this._updateDisplay();
    this.setError(false);
  }

  /**
   * 에러 상태 설정 (흔들림 효과)
   * @param {boolean} isError
   */
  setError(isError) {
    this._isError = isError;
    const display = this._container.querySelector('.catui-pin-display');

    if (isError) {
      display.classList.add('is-error', 'shake');

      // 진동
      if (this.options.haptic && navigator.vibrate) {
        navigator.vibrate([100, 50, 100]);
      }

      const timerId = setTimeout(() => {
        if (this._container) {
          display.classList.remove('shake');
        }
      }, 500);
      this._timers.push(timerId);

      if (this.options.onError) {
        this.options.onError();
      }
    } else {
      display.classList.remove('is-error');
    }
  }

  /**
   * 잠금
   * @param {boolean} locked
   */
  setLocked(locked) {
    this._isLocked = locked;
    this._container.classList.toggle('is-locked', locked);
  }

  /**
   * 키패드 셔플
   */
  shuffle() {
    // 기존 이벤트 제거
    if (this._handlers.keyClick) {
      this._container.removeEventListener('click', this._handlers.keyClick);
    }
    this._render();
    this._bindEvents();
  }

  /**
   * 제목 변경
   * @param {string} title
   * @param {string} subtitle
   */
  setTitle(title, subtitle = '') {
    const titleEl = this._container.querySelector('.catui-pin-title');
    const subtitleEl = this._container.querySelector('.catui-pin-subtitle');

    if (titleEl) titleEl.textContent = title;
    if (subtitleEl) subtitleEl.textContent = subtitle;
  }

  /**
   * 정리
   */
  destroy() {
    // 타이머 정리
    this._timers.forEach(id => clearTimeout(id));
    this._timers = [];

    this._container.removeEventListener('click', this._handlers.keyClick);

    // DOM 정리
    this._container.innerHTML = '';
    this._container.className = '';

    // 참조 해제
    this._container = null;
    this._dots = null;
    this._keys = null;
    this._handlers = null;
    this._timers = null;
    this.options = null;
  }
}

/**
 * PasswordInput 클래스 - 비밀번호 입력 (강도 표시)
 * @class PasswordInput
 */
class PasswordInput {
  /**
   * @constructor
   * @param {Object} options
   * @param {string|HTMLElement} options.container - 컨테이너
   * @param {string} [options.placeholder='비밀번호'] - 플레이스홀더
   * @param {boolean} [options.showToggle=true] - 표시/숨김 토글
   * @param {boolean} [options.showStrength=true] - 강도 표시
   * @param {number} [options.minLength=8] - 최소 길이
   * @param {boolean} [options.requireUppercase=true] - 대문자 필수
   * @param {boolean} [options.requireLowercase=true] - 소문자 필수
   * @param {boolean} [options.requireNumber=true] - 숫자 필수
   * @param {boolean} [options.requireSpecial=false] - 특수문자 필수
   * @param {Function} [options.onInput] - 입력 콜백
   * @param {Function} [options.onStrengthChange] - 강도 변경 콜백
   */
  constructor(options = {}) {
    this.options = {
      container: null,
      placeholder: '비밀번호',
      showToggle: true,
      showStrength: true,
      minLength: 8,
      requireUppercase: true,
      requireLowercase: true,
      requireNumber: true,
      requireSpecial: false,
      onInput: null,
      onStrengthChange: null,
      ...options
    };

    this._container = typeof this.options.container === 'string'
      ? document.querySelector(this.options.container)
      : this.options.container;

    this._handlers = {};
    this._isVisible = false;
    this._strength = 0;

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
    this._container.className = 'catui-password-input';

    // form으로 감싸서 Chrome 경고 방지
    let html = `
      <form class="catui-password-form" autocomplete="off" onsubmit="return false;">
        <div class="catui-password-field">
          <input 
            type="password" 
            class="catui-password-value"
            placeholder="${this.options.placeholder}"
            autocomplete="new-password"
          />
          ${this.options.showToggle ? `
            <button type="button" class="catui-password-toggle">
              <span class="material-icons">visibility</span>
            </button>
          ` : ''}
        </div>
      </form>
    `;

    if (this.options.showStrength) {
      html += `
        <div class="catui-password-strength">
          <div class="catui-password-strength-bar">
            <div class="catui-password-strength-fill"></div>
          </div>
          <span class="catui-password-strength-text"></span>
        </div>
        <ul class="catui-password-rules">
          <li data-rule="length">최소 ${this.options.minLength}자 이상</li>
          ${this.options.requireUppercase ? '<li data-rule="uppercase">대문자 포함</li>' : ''}
          ${this.options.requireLowercase ? '<li data-rule="lowercase">소문자 포함</li>' : ''}
          ${this.options.requireNumber ? '<li data-rule="number">숫자 포함</li>' : ''}
          ${this.options.requireSpecial ? '<li data-rule="special">특수문자 포함</li>' : ''}
        </ul>
      `;
    }

    this._container.innerHTML = html;

    this._input = this._container.querySelector('.catui-password-value');
    this._toggle = this._container.querySelector('.catui-password-toggle');
    this._strengthFill = this._container.querySelector('.catui-password-strength-fill');
    this._strengthText = this._container.querySelector('.catui-password-strength-text');
    this._rules = this._container.querySelectorAll('.catui-password-rules li');
  }

  /**
   * 이벤트 바인딩
   * @private
   */
  _bindEvents() {
    // 입력 이벤트
    this._handlers.input = () => {
      const value = this._input.value;

      if (this.options.showStrength) {
        this._checkStrength(value);
      }

      if (this.options.onInput) {
        this.options.onInput(value, this._strength);
      }
    };

    // 토글 이벤트
    this._handlers.toggle = () => {
      this._isVisible = !this._isVisible;
      this._input.type = this._isVisible ? 'text' : 'password';

      const icon = this._toggle.querySelector('.material-icons');
      icon.textContent = this._isVisible ? 'visibility_off' : 'visibility';
    };

    this._input.addEventListener('input', this._handlers.input);

    if (this._toggle) {
      this._toggle.addEventListener('click', this._handlers.toggle);
    }
  }

  /**
   * 강도 체크
   * @private
   */
  _checkStrength(password) {
    const checks = {
      length: password.length >= this.options.minLength,
      uppercase: !this.options.requireUppercase || /[A-Z]/.test(password),
      lowercase: !this.options.requireLowercase || /[a-z]/.test(password),
      number: !this.options.requireNumber || /[0-9]/.test(password),
      special: !this.options.requireSpecial || /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };

    // 규칙 업데이트
    this._rules.forEach(rule => {
      const ruleName = rule.dataset.rule;
      const isPassed = checks[ruleName];
      rule.classList.toggle('is-valid', isPassed);
    });

    // 강도 계산
    const passedCount = Object.values(checks).filter(v => v).length;
    const totalCount = Object.keys(checks).filter(k => {
      if (k === 'uppercase') return this.options.requireUppercase;
      if (k === 'lowercase') return this.options.requireLowercase;
      if (k === 'number') return this.options.requireNumber;
      if (k === 'special') return this.options.requireSpecial;
      return true;
    }).length;

    this._strength = Math.round((passedCount / totalCount) * 100);

    // 강도 바 업데이트
    let strengthLevel = 'weak';
    let strengthText = '약함';

    if (this._strength >= 100) {
      strengthLevel = 'strong';
      strengthText = '강함';
    } else if (this._strength >= 60) {
      strengthLevel = 'medium';
      strengthText = '보통';
    }

    if (this._strengthFill) {
      this._strengthFill.style.width = `${this._strength}%`;
      this._strengthFill.className = `catui-password-strength-fill is-${strengthLevel}`;
    }

    if (this._strengthText) {
      this._strengthText.textContent = password ? strengthText : '';
    }

    if (this.options.onStrengthChange) {
      this.options.onStrengthChange(this._strength, strengthLevel, checks);
    }
  }

  /**
   * 값 가져오기
   * @returns {string}
   */
  getValue() {
    return this._input.value;
  }

  /**
   * 값 설정
   * @param {string} value
   */
  setValue(value) {
    this._input.value = value;
    this._checkStrength(value);
  }

  /**
   * 강도 가져오기
   * @returns {number}
   */
  getStrength() {
    return this._strength;
  }

  /**
   * 유효성 검사
   * @returns {boolean}
   */
  isValid() {
    return this._strength >= 100;
  }

  /**
   * 초기화
   */
  clear() {
    this._input.value = '';
    this._strength = 0;
    this._checkStrength('');
  }

  /**
   * 포커스
   */
  focus() {
    this._input.focus();
  }

  /**
   * 비활성화
   * @param {boolean} disabled
   */
  setDisabled(disabled) {
    this._input.disabled = disabled;
    this._container.classList.toggle('is-disabled', disabled);
  }

  /**
   * 에러 상태
   * @param {boolean} isError
   * @param {string} message
   */
  setError(isError, message = '') {
    this._container.classList.toggle('is-error', isError);

    let errorEl = this._container.querySelector('.catui-password-error');

    if (isError && message) {
      if (!errorEl) {
        errorEl = document.createElement('div');
        errorEl.className = 'catui-password-error';
        this._container.appendChild(errorEl);
      }
      errorEl.textContent = message;
    } else if (errorEl) {
      errorEl.remove();
    }
  }

  /**
   * 정리
   */
  destroy() {
    this._input.removeEventListener('input', this._handlers.input);

    if (this._toggle) {
      this._toggle.removeEventListener('click', this._handlers.toggle);
    }

    // DOM 정리
    this._container.innerHTML = '';
    this._container.className = '';

    // 참조 해제
    this._container = null;
    this._input = null;
    this._toggle = null;
    this._handlers = null;
    this.options = null;
  }
}

/**
 * SocialLoginButtons 클래스 - 소셜 로그인 버튼 그룹
 * @class SocialLoginButtons
 */
class SocialLoginButtons {
  /**
   * @constructor
   * @param {Object} options
   * @param {string|HTMLElement} options.container - 컨테이너
   * @param {Array} options.providers - 제공자 배열 [{id, name, icon?, color?, textColor?}]
   * @param {string} [options.layout='vertical'] - 레이아웃 (vertical, horizontal, grid)
   * @param {string} [options.size='medium'] - 크기 (small, medium, large)
   * @param {boolean} [options.showLabel=true] - 라벨 표시
   * @param {string} [options.labelFormat='{provider}로 계속하기'] - 라벨 포맷
   * @param {boolean} [options.iconOnly=false] - 아이콘만 표시
   * @param {boolean} [options.rounded=false] - 둥근 버튼
   * @param {Function} [options.onClick] - 클릭 콜백
   */
  constructor(options = {}) {
    this.options = {
      container: null,
      providers: [],
      layout: 'vertical',
      size: 'medium',
      showLabel: true,
      labelFormat: '{provider}로 계속하기',
      iconOnly: false,
      rounded: false,
      onClick: null,
      ...options
    };

    this._container = typeof this.options.container === 'string'
      ? document.querySelector(this.options.container)
      : this.options.container;

    this._handlers = {};

    // 기본 제공자 설정 (Material Icons 사용)
    this._defaultProviders = {
      google: { name: 'Google', icon: 'mail', color: '#FFFFFF', textColor: '#1F2937', border: true },
      apple: { name: 'Apple', icon: 'laptop_mac', color: '#000000', textColor: '#FFFFFF' },
      kakao: { name: '카카오', icon: 'chat_bubble', color: '#FEE500', textColor: '#191919' },
      naver: { name: '네이버', icon: 'language', color: '#03C75A', textColor: '#FFFFFF' },
      facebook: { name: 'Facebook', icon: 'thumb_up', color: '#1877F2', textColor: '#FFFFFF' },
      twitter: { name: 'Twitter', icon: 'tag', color: '#1DA1F2', textColor: '#FFFFFF' },
      github: { name: 'GitHub', icon: 'code', color: '#24292E', textColor: '#FFFFFF' },
      microsoft: { name: 'Microsoft', icon: 'grid_view', color: '#2F2F2F', textColor: '#FFFFFF' },
      line: { name: 'LINE', icon: 'chat', color: '#00B900', textColor: '#FFFFFF' }
    };

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
    const layoutClass = `is-${this.options.layout}`;
    const sizeClass = `is-${this.options.size}`;

    this._container.className = `catui-social-login ${layoutClass} ${sizeClass}`;
    if (this.options.iconOnly) {
      this._container.classList.add('is-icon-only');
    }
    if (this.options.rounded) {
      this._container.classList.add('is-rounded');
    }

    const html = this.options.providers.map(provider => {
      const config = this._getProviderConfig(provider);
      return this._renderButton(provider.id || provider, config);
    }).join('');

    this._container.innerHTML = html;
  }

  /**
   * 제공자 설정 가져오기
   * @private
   */
  _getProviderConfig(provider) {
    if (typeof provider === 'string') {
      return this._defaultProviders[provider] || { name: provider, icon: 'login', color: '#6B7280', textColor: '#FFFFFF' };
    }

    const defaultConfig = this._defaultProviders[provider.id] || {};
    return {
      name: provider.name || defaultConfig.name || provider.id,
      icon: provider.icon || defaultConfig.icon || 'login',
      color: provider.color || defaultConfig.color || '#6B7280',
      textColor: provider.textColor || defaultConfig.textColor || '#FFFFFF',
      border: provider.border || defaultConfig.border || false
    };
  }

  /**
   * 버튼 렌더링
   * @private
   */
  _renderButton(id, config) {
    const label = this.options.showLabel && !this.options.iconOnly
      ? `<span class="catui-social-login-label">${this.options.labelFormat.replace('{provider}', config.name)}</span>`
      : '';

    const borderStyle = config.border ? 'border: 1px solid var(--border-color, #E5E7EB);' : '';

    return `
      <button 
        class="catui-social-login-btn" 
        data-provider="${id}"
        style="background: ${config.color}; color: ${config.textColor}; ${borderStyle}"
      >
        <span class="catui-social-login-icon material-icons">${config.icon}</span>
        ${label}
      </button>
    `;
  }

  /**
   * 이벤트 바인딩
   * @private
   */
  _bindEvents() {
    this._handlers.click = (e) => {
      const btn = e.target.closest('.catui-social-login-btn');
      if (!btn) return;

      const provider = btn.dataset.provider;

      if (this.options.onClick) {
        this.options.onClick(provider);
      }
    };

    this._container.addEventListener('click', this._handlers.click);
  }

  /**
   * 제공자 추가
   * @param {string|Object} provider
   */
  addProvider(provider) {
    this.options.providers.push(provider);
    this._render();
  }

  /**
   * 제공자 제거
   * @param {string} id
   */
  removeProvider(id) {
    this.options.providers = this.options.providers.filter(p =>
      (typeof p === 'string' ? p : p.id) !== id
    );
    this._render();
  }

  /**
   * 버튼 비활성화
   * @param {string} id
   * @param {boolean} disabled
   */
  setDisabled(id, disabled) {
    const btn = this._container.querySelector(`[data-provider="${id}"]`);
    if (btn) {
      btn.disabled = disabled;
      btn.classList.toggle('is-disabled', disabled);
    }
  }

  /**
   * 로딩 상태
   * @param {string} id
   * @param {boolean} loading
   */
  setLoading(id, loading) {
    const btn = this._container.querySelector(`[data-provider="${id}"]`);
    if (btn) {
      btn.classList.toggle('is-loading', loading);
      btn.disabled = loading;

      const icon = btn.querySelector('.catui-social-login-icon');
      if (icon) {
        if (loading) {
          icon.dataset.originalIcon = icon.textContent;
          icon.textContent = 'hourglass_empty';
          icon.classList.add('spin');
        } else {
          icon.textContent = icon.dataset.originalIcon || 'login';
          icon.classList.remove('spin');
        }
      }
    }
  }

  /**
   * 정리
   */
  destroy() {
    this._container.removeEventListener('click', this._handlers.click);

    this._container.innerHTML = '';
    this._container.className = '';

    this._container = null;
    this._handlers = null;
    this.options = null;
  }
}

/**
 * BiometricPrompt 클래스 - 생체인증 안내 UI
 * @class BiometricPrompt
 */
class BiometricPrompt {
  /**
   * @constructor
   * @param {Object} options
   * @param {string} [options.type='fingerprint'] - 인증 타입 (fingerprint, face, iris)
   * @param {string} [options.title='생체인증'] - 제목
   * @param {string} [options.subtitle=''] - 부제목
   * @param {string} [options.description='기기에 등록된 생체정보로 인증합니다'] - 설명
   * @param {string} [options.cancelText='취소'] - 취소 버튼 텍스트
   * @param {boolean} [options.showCancel=true] - 취소 버튼 표시
   * @param {Function} [options.onAuthenticate] - 인증 시도 콜백
   * @param {Function} [options.onCancel] - 취소 콜백
   * @param {Function} [options.onError] - 에러 콜백
   */
  constructor(options = {}) {
    this.options = {
      type: 'fingerprint',
      title: '생체인증',
      subtitle: '',
      description: '기기에 등록된 생체정보로 인증합니다',
      cancelText: '취소',
      showCancel: true,
      onAuthenticate: null,
      onCancel: null,
      onError: null,
      ...options
    };

    this._overlay = null;
    this._handlers = {};
    this._isOpen = false;
    this._state = 'idle'; // idle, authenticating, success, error
    this._timers = [];
  }

  /**
   * 아이콘 가져오기
   * @private
   */
  _getIcon() {
    const icons = {
      fingerprint: 'fingerprint',
      face: 'face',
      iris: 'visibility'
    };
    return icons[this.options.type] || 'fingerprint';
  }

  /**
   * 열기
   */
  open() {
    if (this._isOpen) return;
    this._isOpen = true;
    this._state = 'idle';

    this._overlay = document.createElement('div');
    this._overlay.className = 'catui-biometric-overlay';
    this._overlay.innerHTML = this._renderContent();
    document.body.appendChild(this._overlay);

    // 애니메이션
    requestAnimationFrame(() => {
      this._overlay.classList.add('is-visible');
    });

    this._bindEvents();

    // 자동 인증 시작
    const timerId = setTimeout(() => {
      this._startAuthentication();
    }, 300);
    this._timers.push(timerId);
  }

  /**
   * 내용 렌더링
   * @private
   */
  _renderContent() {
    return `
      <div class="catui-biometric-prompt">
        <div class="catui-biometric-icon-wrapper">
          <span class="catui-biometric-icon material-icons">${this._getIcon()}</span>
          <div class="catui-biometric-ripple"></div>
        </div>
        <div class="catui-biometric-title">${this.options.title}</div>
        ${this.options.subtitle ? `<div class="catui-biometric-subtitle">${this.options.subtitle}</div>` : ''}
        <div class="catui-biometric-description">${this.options.description}</div>
        <div class="catui-biometric-status"></div>
        ${this.options.showCancel ? `
          <button class="catui-biometric-cancel">${this.options.cancelText}</button>
        ` : ''}
      </div>
    `;
  }

  /**
   * 이벤트 바인딩
   * @private
   */
  _bindEvents() {
    // 취소 버튼
    this._handlers.cancel = () => {
      if (this.options.onCancel) {
        this.options.onCancel();
      }
      this.close();
    };

    // 오버레이 클릭
    this._handlers.overlayClick = (e) => {
      if (e.target === this._overlay) {
        this._handlers.cancel();
      }
    };

    const cancelBtn = this._overlay.querySelector('.catui-biometric-cancel');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', this._handlers.cancel);
    }
    this._overlay.addEventListener('click', this._handlers.overlayClick);
  }

  /**
   * 인증 시작
   * @private
   */
  _startAuthentication() {
    if (this._state !== 'idle') return;
    this._state = 'authenticating';

    const iconWrapper = this._overlay.querySelector('.catui-biometric-icon-wrapper');
    iconWrapper?.classList.add('is-authenticating');

    this._setStatus('인증 중...', 'info');

    if (this.options.onAuthenticate) {
      this.options.onAuthenticate();
    }
  }

  /**
   * 상태 메시지 설정
   * @private
   */
  _setStatus(message, type = 'info') {
    const statusEl = this._overlay?.querySelector('.catui-biometric-status');
    if (statusEl) {
      statusEl.textContent = message;
      statusEl.className = `catui-biometric-status is-${type}`;
    }
  }

  /**
   * 성공 처리
   */
  success() {
    if (!this._isOpen) return;
    this._state = 'success';

    const iconWrapper = this._overlay.querySelector('.catui-biometric-icon-wrapper');
    const icon = this._overlay.querySelector('.catui-biometric-icon');

    iconWrapper?.classList.remove('is-authenticating');
    iconWrapper?.classList.add('is-success');
    if (icon) icon.textContent = 'check_circle';

    this._setStatus('인증 성공', 'success');

    const timerId = setTimeout(() => {
      this.close();
    }, 1000);
    this._timers.push(timerId);
  }

  /**
   * 실패 처리
   * @param {string} message
   */
  error(message = '인증 실패') {
    if (!this._isOpen) return;
    this._state = 'error';

    const iconWrapper = this._overlay.querySelector('.catui-biometric-icon-wrapper');
    const icon = this._overlay.querySelector('.catui-biometric-icon');

    iconWrapper?.classList.remove('is-authenticating');
    iconWrapper?.classList.add('is-error');
    if (icon) icon.textContent = 'error';

    this._setStatus(message, 'error');

    if (this.options.onError) {
      this.options.onError(message);
    }

    // 3초 후 재시도 가능
    const timerId = setTimeout(() => {
      if (this._isOpen) {
        this._state = 'idle';
        iconWrapper?.classList.remove('is-error');
        if (icon) icon.textContent = this._getIcon();
        this._setStatus('다시 시도하려면 탭하세요', 'info');

        // 재시도 클릭 핸들러
        this._handlers.retry = () => {
          this._startAuthentication();
        };
        iconWrapper?.addEventListener('click', this._handlers.retry, { once: true });
      }
    }, 2000);
    this._timers.push(timerId);
  }

  /**
   * 닫기
   */
  close() {
    if (!this._isOpen) return;
    this._isOpen = false;

    // 타이머 정리
    this._timers.forEach(id => clearTimeout(id));
    this._timers = [];

    this._overlay?.classList.remove('is-visible');

    const timerId = setTimeout(() => {
      if (this._overlay) {
        // 이벤트 제거
        const cancelBtn = this._overlay.querySelector('.catui-biometric-cancel');
        if (cancelBtn) {
          cancelBtn.removeEventListener('click', this._handlers.cancel);
        }
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
    this.close();
    this._handlers = null;
    this.options = null;
  }
}

export { OTPInput, PinInput, PasswordInput, SocialLoginButtons, BiometricPrompt };
export default { OTPInput, PinInput, PasswordInput, SocialLoginButtons, BiometricPrompt };
