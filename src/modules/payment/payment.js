/**
 * CATUI Mobile - Payment Module
 * CardInput, PaymentMethods, PriceBreakdown, ReceiptView 컴포넌트
 * @module payment
 */

/**
 * CardInput 클래스 - 카드번호 입력
 * @class CardInput
 */
class CardInput {
  /**
   * @constructor
   * @param {Object} options
   * @param {string|HTMLElement} options.container - 컨테이너
   * @param {Array} [options.fields=['number', 'expiry', 'cvc']] - 필드
   * @param {boolean} [options.detectCardType=true] - 카드사 감지
   * @param {Array} [options.supportedCards=['visa', 'mastercard', 'amex', 'jcb']] - 지원 카드사
   * @param {boolean} [options.validateOnBlur=true] - blur 시 유효성 검사
   * @param {string} [options.placeholder] - 플레이스홀더
   * @param {Function} [options.onCardTypeChange] - 카드사 변경 콜백
   * @param {Function} [options.onChange] - 변경 콜백
   * @param {Function} [options.onComplete] - 완료 콜백
   * @param {Function} [options.onError] - 에러 콜백
   */
  constructor(options = {}) {
    this.options = {
      container: null,
      fields: ['number', 'expiry', 'cvc'],
      detectCardType: true,
      supportedCards: ['visa', 'mastercard', 'amex', 'jcb'],
      validateOnBlur: true,
      placeholder: {
        number: '카드 번호',
        expiry: 'MM/YY',
        cvc: 'CVC',
        name: '카드 소유자명'
      },
      onCardTypeChange: null,
      onChange: null,
      onComplete: null,
      onError: null,
      ...options
    };

    this._container = typeof this.options.container === 'string'
      ? document.querySelector(this.options.container)
      : this.options.container;

    this._handlers = {};
    this._cardType = null;
    this._values = {
      number: '',
      expiry: '',
      cvc: '',
      name: ''
    };
    this._valid = {
      number: false,
      expiry: false,
      cvc: false,
      name: true
    };

    if (this._container) {
      this._render();
      this._bindEvents();
    }
  }

  /**
   * 카드사 패턴
   * @private
   */
  static CARD_PATTERNS = {
    visa: /^4/,
    mastercard: /^5[1-5]|^2[2-7]/,
    amex: /^3[47]/,
    jcb: /^35/,
    discover: /^6(?:011|5)/,
    diners: /^3(?:0[0-5]|[68])/,
    unionpay: /^62/
  };

  /**
   * 카드사 정보
   * @private
   */
  static CARD_INFO = {
    visa: { name: 'Visa', icon: 'credit_card', lengths: [16], cvcLength: 3 },
    mastercard: { name: 'Mastercard', icon: 'credit_card', lengths: [16], cvcLength: 3 },
    amex: { name: 'American Express', icon: 'credit_card', lengths: [15], cvcLength: 4 },
    jcb: { name: 'JCB', icon: 'credit_card', lengths: [16], cvcLength: 3 },
    discover: { name: 'Discover', icon: 'credit_card', lengths: [16], cvcLength: 3 },
    diners: { name: 'Diners Club', icon: 'credit_card', lengths: [14], cvcLength: 3 },
    unionpay: { name: 'UnionPay', icon: 'credit_card', lengths: [16, 17, 18, 19], cvcLength: 3 }
  };

  /**
   * 렌더링
   * @private
   */
  _render() {
    const { fields, placeholder } = this.options;

    this._container.className = 'catui-card-input';
    this._container.innerHTML = `
      <div class="catui-card-input-header">
        <span class="material-icons catui-card-input-icon">credit_card</span>
        <span class="catui-card-input-type"></span>
      </div>
      <div class="catui-card-input-fields">
        ${fields.includes('number') ? `
          <div class="catui-card-input-field is-full">
            <input type="text" inputmode="numeric" pattern="[0-9]*"
                   class="catui-card-input-number" 
                   placeholder="${placeholder.number}"
                   maxlength="19" autocomplete="cc-number">
            <span class="catui-card-input-error"></span>
          </div>
        ` : ''}
        <div class="catui-card-input-row">
          ${fields.includes('expiry') ? `
            <div class="catui-card-input-field">
              <input type="text" inputmode="numeric" pattern="[0-9]*"
                     class="catui-card-input-expiry" 
                     placeholder="${placeholder.expiry}"
                     maxlength="5" autocomplete="cc-exp">
              <span class="catui-card-input-error"></span>
            </div>
          ` : ''}
          ${fields.includes('cvc') ? `
            <div class="catui-card-input-field">
              <input type="text" inputmode="numeric" pattern="[0-9]*"
                     class="catui-card-input-cvc" 
                     placeholder="${placeholder.cvc}"
                     maxlength="4" autocomplete="cc-csc">
              <span class="catui-card-input-error"></span>
            </div>
          ` : ''}
        </div>
        ${fields.includes('name') ? `
          <div class="catui-card-input-field is-full">
            <input type="text" 
                   class="catui-card-input-name" 
                   placeholder="${placeholder.name}"
                   autocomplete="cc-name">
            <span class="catui-card-input-error"></span>
          </div>
        ` : ''}
      </div>
    `;
  }

  /**
   * 이벤트 바인딩
   * @private
   */
  _bindEvents() {
    // 카드번호 입력
    const numberInput = this._container.querySelector('.catui-card-input-number');
    if (numberInput) {
      this._handlers.numberInput = (e) => this._handleNumberInput(e);
      this._handlers.numberBlur = () => this._validateField('number');
      numberInput.addEventListener('input', this._handlers.numberInput);
      if (this.options.validateOnBlur) {
        numberInput.addEventListener('blur', this._handlers.numberBlur);
      }
    }

    // 만료일 입력
    const expiryInput = this._container.querySelector('.catui-card-input-expiry');
    if (expiryInput) {
      this._handlers.expiryInput = (e) => this._handleExpiryInput(e);
      this._handlers.expiryBlur = () => this._validateField('expiry');
      expiryInput.addEventListener('input', this._handlers.expiryInput);
      if (this.options.validateOnBlur) {
        expiryInput.addEventListener('blur', this._handlers.expiryBlur);
      }
    }

    // CVC 입력
    const cvcInput = this._container.querySelector('.catui-card-input-cvc');
    if (cvcInput) {
      this._handlers.cvcInput = (e) => this._handleCvcInput(e);
      this._handlers.cvcBlur = () => this._validateField('cvc');
      cvcInput.addEventListener('input', this._handlers.cvcInput);
      if (this.options.validateOnBlur) {
        cvcInput.addEventListener('blur', this._handlers.cvcBlur);
      }
    }

    // 이름 입력
    const nameInput = this._container.querySelector('.catui-card-input-name');
    if (nameInput) {
      this._handlers.nameInput = (e) => this._handleNameInput(e);
      nameInput.addEventListener('input', this._handlers.nameInput);
    }
  }

  /**
   * 카드번호 입력 처리
   * @private
   */
  _handleNumberInput(e) {
    const value = e.target.value.replace(/\D/g, '');

    // 포맷팅 (4자리마다 공백)
    const formatted = value.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
    e.target.value = formatted;

    this._values.number = value;

    // 카드사 감지
    if (this.options.detectCardType) {
      this._detectCardType(value);
    }

    this._emitChange('number', value, this._validateNumber(value));
    this._checkComplete();
  }

  /**
   * 만료일 입력 처리
   * @private
   */
  _handleExpiryInput(e) {
    let value = e.target.value.replace(/\D/g, '');

    // MM/YY 포맷
    if (value.length >= 2) {
      value = value.slice(0, 2) + '/' + value.slice(2, 4);
    }
    e.target.value = value;

    this._values.expiry = value;
    this._emitChange('expiry', value, this._validateExpiry(value));
    this._checkComplete();
  }

  /**
   * CVC 입력 처리
   * @private
   */
  _handleCvcInput(e) {
    const value = e.target.value.replace(/\D/g, '');
    e.target.value = value;

    this._values.cvc = value;
    this._emitChange('cvc', value, this._validateCvc(value));
    this._checkComplete();
  }

  /**
   * 이름 입력 처리
   * @private
   */
  _handleNameInput(e) {
    const value = e.target.value;
    this._values.name = value;
    this._valid.name = value.length > 0;
    this._emitChange('name', value, this._valid.name);
    this._checkComplete();
  }

  /**
   * 카드사 감지
   * @private
   */
  _detectCardType(number) {
    let detected = null;

    for (const [type, pattern] of Object.entries(CardInput.CARD_PATTERNS)) {
      if (pattern.test(number) && this.options.supportedCards.includes(type)) {
        detected = type;
        break;
      }
    }

    if (detected !== this._cardType) {
      this._cardType = detected;
      this._updateCardTypeUI();

      if (this.options.onCardTypeChange) {
        this.options.onCardTypeChange(detected);
      }
    }
  }

  /**
   * 카드사 UI 업데이트
   * @private
   */
  _updateCardTypeUI() {
    const typeEl = this._container.querySelector('.catui-card-input-type');

    if (this._cardType && CardInput.CARD_INFO[this._cardType]) {
      const info = CardInput.CARD_INFO[this._cardType];
      typeEl.textContent = info.name;
      this._container.dataset.cardType = this._cardType;
    } else {
      typeEl.textContent = '';
      delete this._container.dataset.cardType;
    }
  }

  /**
   * 필드 유효성 검사
   * @private
   */
  _validateField(field) {
    let isValid = false;
    let error = '';

    switch (field) {
      case 'number':
        isValid = this._validateNumber(this._values.number);
        error = isValid ? '' : '유효하지 않은 카드 번호입니다';
        break;
      case 'expiry':
        isValid = this._validateExpiry(this._values.expiry);
        error = isValid ? '' : '유효하지 않은 만료일입니다';
        break;
      case 'cvc':
        isValid = this._validateCvc(this._values.cvc);
        error = isValid ? '' : '유효하지 않은 CVC입니다';
        break;
    }

    this._valid[field] = isValid;

    // 에러 UI 업데이트
    const fieldEl = this._container.querySelector(`.catui-card-input-${field}`);
    const errorEl = fieldEl?.parentElement.querySelector('.catui-card-input-error');

    if (fieldEl) {
      fieldEl.classList.toggle('is-invalid', !isValid && this._values[field].length > 0);
      fieldEl.classList.toggle('is-valid', isValid);
    }
    if (errorEl) {
      errorEl.textContent = error;
    }

    if (!isValid && error && this.options.onError) {
      this.options.onError(field, error);
    }

    return isValid;
  }

  /**
   * 카드번호 유효성 검사 (Luhn 알고리즘)
   * @private
   */
  _validateNumber(number) {
    if (!number || number.length < 13) return false;

    // Luhn 알고리즘
    let sum = 0;
    let isEven = false;

    for (let i = number.length - 1; i >= 0; i--) {
      let digit = parseInt(number[i], 10);

      if (isEven) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }

      sum += digit;
      isEven = !isEven;
    }

    return sum % 10 === 0;
  }

  /**
   * 만료일 유효성 검사
   * @private
   */
  _validateExpiry(expiry) {
    if (!expiry || expiry.length < 5) return false;

    const [month, year] = expiry.split('/');
    const m = parseInt(month, 10);
    const y = parseInt('20' + year, 10);

    if (m < 1 || m > 12) return false;

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    if (y < currentYear) return false;
    if (y === currentYear && m < currentMonth) return false;

    return true;
  }

  /**
   * CVC 유효성 검사
   * @private
   */
  _validateCvc(cvc) {
    const expectedLength = this._cardType && CardInput.CARD_INFO[this._cardType]
      ? CardInput.CARD_INFO[this._cardType].cvcLength
      : 3;

    return cvc && cvc.length === expectedLength;
  }

  /**
   * 변경 이벤트 발생
   * @private
   */
  _emitChange(field, value, isValid) {
    if (this.options.onChange) {
      this.options.onChange(field, value, isValid);
    }
  }

  /**
   * 완료 체크
   * @private
   */
  _checkComplete() {
    const requiredFields = this.options.fields;
    const allValid = requiredFields.every(field => {
      if (field === 'name') return true; // 이름은 선택적
      return this._valid[field];
    });

    if (allValid && this.options.onComplete) {
      this.options.onComplete(this.getCardData());
    }
  }

  /**
   * 카드 데이터 가져오기
   * @returns {Object}
   */
  getCardData() {
    return {
      number: this._values.number,
      expiry: this._values.expiry,
      cvc: this._values.cvc,
      name: this._values.name,
      cardType: this._cardType,
      isValid: this.isValid()
    };
  }

  /**
   * 유효성 검사
   * @returns {boolean}
   */
  isValid() {
    return this.options.fields.every(field => {
      if (field === 'name' && !this._values.name) return true;
      return this._valid[field];
    });
  }

  /**
   * 초기화
   */
  clear() {
    this._values = { number: '', expiry: '', cvc: '', name: '' };
    this._valid = { number: false, expiry: false, cvc: false, name: true };
    this._cardType = null;

    const inputs = this._container.querySelectorAll('input');
    inputs.forEach(input => {
      input.value = '';
      input.classList.remove('is-valid', 'is-invalid');
    });

    const errors = this._container.querySelectorAll('.catui-card-input-error');
    errors.forEach(el => el.textContent = '');

    this._updateCardTypeUI();
  }

  /**
   * 정리
   */
  destroy() {
    const numberInput = this._container?.querySelector('.catui-card-input-number');
    const expiryInput = this._container?.querySelector('.catui-card-input-expiry');
    const cvcInput = this._container?.querySelector('.catui-card-input-cvc');
    const nameInput = this._container?.querySelector('.catui-card-input-name');

    if (numberInput) {
      numberInput.removeEventListener('input', this._handlers.numberInput);
      numberInput.removeEventListener('blur', this._handlers.numberBlur);
    }
    if (expiryInput) {
      expiryInput.removeEventListener('input', this._handlers.expiryInput);
      expiryInput.removeEventListener('blur', this._handlers.expiryBlur);
    }
    if (cvcInput) {
      cvcInput.removeEventListener('input', this._handlers.cvcInput);
      cvcInput.removeEventListener('blur', this._handlers.cvcBlur);
    }
    if (nameInput) {
      nameInput.removeEventListener('input', this._handlers.nameInput);
    }

    if (this._container) {
      this._container.innerHTML = '';
      this._container.className = '';
    }

    this._container = null;
    this._handlers = null;
    this._values = null;
    this._valid = null;
    this.options = null;
  }
}


/**
 * PaymentMethods 클래스 - 결제수단 선택
 * @class PaymentMethods
 */
class PaymentMethods {
  /**
   * @constructor
   * @param {Object} options
   * @param {string|HTMLElement} options.container - 컨테이너
   * @param {Array} options.methods - 결제수단 배열 [{id, name, icon, description, disabled}]
   * @param {string} [options.selected] - 선택된 결제수단 ID
   * @param {boolean} [options.showDescription=true] - 설명 표시
   * @param {string} [options.layout='list'] - 레이아웃 (list, grid)
   * @param {Function} [options.onChange] - 변경 콜백
   */
  constructor(options = {}) {
    this.options = {
      container: null,
      methods: [],
      selected: null,
      showDescription: true,
      layout: 'list',
      onChange: null,
      ...options
    };

    this._container = typeof this.options.container === 'string'
      ? document.querySelector(this.options.container)
      : this.options.container;

    this._handlers = {};
    this._selected = this.options.selected;

    if (this._container) {
      this._render();
      this._bindEvents();
    }
  }

  /**
   * 기본 결제수단 아이콘
   * @private
   */
  static METHOD_ICONS = {
    card: 'credit_card',
    bank: 'account_balance',
    phone: 'phone_android',
    kakao: 'chat',
    naver: 'public',
    paypal: 'payment',
    apple: 'apple',
    google: 'g_mobiledata',
    cash: 'payments',
    point: 'stars'
  };

  /**
   * 렌더링
   * @private
   */
  _render() {
    const { methods, showDescription, layout } = this.options;

    this._container.className = `catui-payment-methods is-${layout}`;
    this._container.innerHTML = methods.map(method => `
      <div class="catui-payment-method ${method.id === this._selected ? 'is-selected' : ''} ${method.disabled ? 'is-disabled' : ''}"
           data-method="${method.id}">
        <div class="catui-payment-method-radio">
          <span class="catui-payment-method-check"></span>
        </div>
        <div class="catui-payment-method-icon">
          <span class="material-icons">${method.icon || PaymentMethods.METHOD_ICONS[method.id] || 'payment'}</span>
        </div>
        <div class="catui-payment-method-info">
          <div class="catui-payment-method-name">${method.name}</div>
          ${showDescription && method.description ? `
            <div class="catui-payment-method-desc">${method.description}</div>
          ` : ''}
        </div>
        ${method.badge ? `<span class="catui-payment-method-badge">${method.badge}</span>` : ''}
      </div>
    `).join('');
  }

  /**
   * 이벤트 바인딩
   * @private
   */
  _bindEvents() {
    this._handlers.click = (e) => {
      const methodEl = e.target.closest('.catui-payment-method');
      if (methodEl && !methodEl.classList.contains('is-disabled')) {
        this.select(methodEl.dataset.method);
      }
    };

    this._container.addEventListener('click', this._handlers.click);
  }

  /**
   * 결제수단 선택
   * @param {string} methodId
   */
  select(methodId) {
    if (this._selected === methodId) return;

    // 이전 선택 해제
    const prevEl = this._container.querySelector('.catui-payment-method.is-selected');
    if (prevEl) prevEl.classList.remove('is-selected');

    // 새 선택
    const newEl = this._container.querySelector(`[data-method="${methodId}"]`);
    if (newEl) {
      newEl.classList.add('is-selected');
      this._selected = methodId;

      if (this.options.onChange) {
        const method = this.options.methods.find(m => m.id === methodId);
        this.options.onChange(methodId, method);
      }
    }
  }

  /**
   * 선택된 결제수단 가져오기
   * @returns {Object|null}
   */
  getSelected() {
    if (!this._selected) return null;
    return this.options.methods.find(m => m.id === this._selected) || null;
  }

  /**
   * 결제수단 업데이트
   * @param {Array} methods
   */
  setMethods(methods) {
    this.options.methods = methods;
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
 * PriceBreakdown 클래스 - 가격 상세
 * @class PriceBreakdown
 */
class PriceBreakdown {
  /**
   * @constructor
   * @param {Object} options
   * @param {string|HTMLElement} options.container - 컨테이너
   * @param {Array} options.items - 항목 배열 [{label, amount, type, highlight}]
   * @param {string} [options.currency='₩'] - 통화 기호
   * @param {string} [options.locale='ko-KR'] - 로케일
   * @param {boolean} [options.showTotal=true] - 합계 표시
   * @param {string} [options.totalLabel='총 결제 금액'] - 합계 레이블
   */
  constructor(options = {}) {
    this.options = {
      container: null,
      items: [],
      currency: '₩',
      locale: 'ko-KR',
      showTotal: true,
      totalLabel: '총 결제 금액',
      ...options
    };

    this._container = typeof this.options.container === 'string'
      ? document.querySelector(this.options.container)
      : this.options.container;

    if (this._container) {
      this._render();
    }
  }

  /**
   * 렌더링
   * @private
   */
  _render() {
    const { items, currency, locale, showTotal, totalLabel } = this.options;

    // 합계 계산
    let total = 0;
    items.forEach(item => {
      if (item.type === 'discount') {
        total -= Math.abs(item.amount);
      } else {
        total += item.amount;
      }
    });

    this._container.className = 'catui-price-breakdown';
    this._container.innerHTML = `
      <div class="catui-price-breakdown-items">
        ${items.map(item => `
          <div class="catui-price-breakdown-item ${item.type === 'discount' ? 'is-discount' : ''} ${item.highlight ? 'is-highlight' : ''}">
            <span class="catui-price-breakdown-label">${item.label}</span>
            <span class="catui-price-breakdown-amount">
              ${item.type === 'discount' ? '-' : ''}${currency}${this._formatNumber(Math.abs(item.amount), locale)}
            </span>
          </div>
        `).join('')}
      </div>
      ${showTotal ? `
        <div class="catui-price-breakdown-total">
          <span class="catui-price-breakdown-total-label">${totalLabel}</span>
          <span class="catui-price-breakdown-total-amount">${currency}${this._formatNumber(total, locale)}</span>
        </div>
      ` : ''}
    `;

    this._total = total;
  }

  /**
   * 숫자 포맷
   * @private
   */
  _formatNumber(num, locale) {
    return new Intl.NumberFormat(locale).format(num);
  }

  /**
   * 항목 업데이트
   * @param {Array} items
   */
  setItems(items) {
    this.options.items = items;
    this._render();
  }

  /**
   * 항목 추가
   * @param {Object} item
   */
  addItem(item) {
    this.options.items.push(item);
    this._render();
  }

  /**
   * 합계 가져오기
   * @returns {number}
   */
  getTotal() {
    return this._total;
  }

  /**
   * 정리
   */
  destroy() {
    if (this._container) {
      this._container.innerHTML = '';
      this._container.className = '';
    }

    this._container = null;
    this.options = null;
  }
}


/**
 * ReceiptView 클래스 - 영수증 뷰
 * @class ReceiptView
 */
class ReceiptView {
  /**
   * @constructor
   * @param {Object} options
   * @param {string|HTMLElement} options.container - 컨테이너
   * @param {Object} options.receipt - 영수증 데이터
   * @param {string} options.receipt.orderNumber - 주문번호
   * @param {Date|string} options.receipt.date - 결제일시
   * @param {Array} options.receipt.items - 상품 목록
   * @param {Object} options.receipt.payment - 결제 정보
   * @param {Object} [options.receipt.store] - 가맹점 정보
   * @param {boolean} [options.showLogo=true] - 로고 표시
   * @param {string} [options.logo] - 로고 URL
   * @param {boolean} [options.printable=true] - 인쇄 가능
   * @param {Function} [options.onPrint] - 인쇄 콜백
   * @param {Function} [options.onShare] - 공유 콜백
   */
  constructor(options = {}) {
    this.options = {
      container: null,
      receipt: {},
      showLogo: true,
      logo: null,
      printable: true,
      currency: '₩',
      locale: 'ko-KR',
      onPrint: null,
      onShare: null,
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
    const { receipt, showLogo, logo, printable, currency, locale } = this.options;
    const { orderNumber, date, items = [], payment = {}, store } = receipt;

    const dateStr = date instanceof Date
      ? date.toLocaleString(locale)
      : new Date(date).toLocaleString(locale);

    // 상품 합계
    const subtotal = items.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
    const discount = payment.discount || 0;
    const total = subtotal - discount + (payment.deliveryFee || 0);

    this._container.className = 'catui-receipt';
    this._container.innerHTML = `
      ${showLogo ? `
        <div class="catui-receipt-header">
          ${logo ? `<img src="${logo}" class="catui-receipt-logo" alt="Logo">` : ''}
          <span class="material-icons catui-receipt-icon">receipt_long</span>
        </div>
      ` : ''}
      
      <div class="catui-receipt-title">결제 완료</div>
      
      <div class="catui-receipt-info">
        <div class="catui-receipt-info-row">
          <span>주문번호</span>
          <span>${orderNumber || '-'}</span>
        </div>
        <div class="catui-receipt-info-row">
          <span>결제일시</span>
          <span>${dateStr}</span>
        </div>
        ${payment.method ? `
          <div class="catui-receipt-info-row">
            <span>결제수단</span>
            <span>${payment.method}</span>
          </div>
        ` : ''}
      </div>
      
      <div class="catui-receipt-divider"></div>
      
      <div class="catui-receipt-items">
        ${items.map(item => `
          <div class="catui-receipt-item">
            <div class="catui-receipt-item-name">
              ${item.name}
              ${item.quantity > 1 ? `<span class="catui-receipt-item-qty">x${item.quantity}</span>` : ''}
            </div>
            <div class="catui-receipt-item-price">${currency}${this._formatNumber(item.price * (item.quantity || 1), locale)}</div>
          </div>
        `).join('')}
      </div>
      
      <div class="catui-receipt-divider"></div>
      
      <div class="catui-receipt-summary">
        <div class="catui-receipt-summary-row">
          <span>상품금액</span>
          <span>${currency}${this._formatNumber(subtotal, locale)}</span>
        </div>
        ${discount > 0 ? `
          <div class="catui-receipt-summary-row is-discount">
            <span>할인</span>
            <span>-${currency}${this._formatNumber(discount, locale)}</span>
          </div>
        ` : ''}
        ${payment.deliveryFee ? `
          <div class="catui-receipt-summary-row">
            <span>배송비</span>
            <span>${currency}${this._formatNumber(payment.deliveryFee, locale)}</span>
          </div>
        ` : ''}
        <div class="catui-receipt-summary-total">
          <span>총 결제금액</span>
          <span>${currency}${this._formatNumber(total, locale)}</span>
        </div>
      </div>
      
      ${store ? `
        <div class="catui-receipt-store">
          <div class="catui-receipt-store-name">${store.name || ''}</div>
          ${store.address ? `<div class="catui-receipt-store-info">${store.address}</div>` : ''}
          ${store.tel ? `<div class="catui-receipt-store-info">${store.tel}</div>` : ''}
        </div>
      ` : ''}
      
      ${printable ? `
        <div class="catui-receipt-actions">
          <button class="catui-receipt-btn" data-action="print" type="button">
            <span class="material-icons">print</span>
            인쇄
          </button>
          <button class="catui-receipt-btn" data-action="share" type="button">
            <span class="material-icons">share</span>
            공유
          </button>
        </div>
      ` : ''}
    `;
  }

  /**
   * 숫자 포맷
   * @private
   */
  _formatNumber(num, locale) {
    return new Intl.NumberFormat(locale).format(num);
  }

  /**
   * 이벤트 바인딩
   * @private
   */
  _bindEvents() {
    this._handlers.click = (e) => {
      const btn = e.target.closest('.catui-receipt-btn');
      if (!btn) return;

      const action = btn.dataset.action;
      if (action === 'print') {
        if (this.options.onPrint) {
          this.options.onPrint();
        } else {
          this.print();
        }
      } else if (action === 'share') {
        if (this.options.onShare) {
          this.options.onShare(this.options.receipt);
        }
      }
    };

    this._container.addEventListener('click', this._handlers.click);
  }

  /**
   * 인쇄
   */
  print() {
    const printContent = this._container.innerHTML;
    const printWindow = window.open('', '_blank');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>영수증</title>
        <style>
          body { font-family: sans-serif; padding: 20px; max-width: 400px; margin: 0 auto; }
          .catui-receipt-actions { display: none; }
          .catui-receipt-header { text-align: center; margin-bottom: 20px; }
          .catui-receipt-icon { font-size: 48px; color: #4CAF50; }
          .catui-receipt-title { text-align: center; font-size: 24px; font-weight: bold; margin: 20px 0; }
          .catui-receipt-divider { border-top: 1px dashed #ccc; margin: 15px 0; }
          .catui-receipt-info-row, .catui-receipt-summary-row { display: flex; justify-content: space-between; padding: 5px 0; }
          .catui-receipt-item { display: flex; justify-content: space-between; padding: 8px 0; }
          .catui-receipt-summary-total { display: flex; justify-content: space-between; font-weight: bold; font-size: 18px; margin-top: 10px; padding-top: 10px; border-top: 2px solid #000; }
          .is-discount { color: #f44336; }
        </style>
      </head>
      <body>${printContent}</body>
      </html>
    `);

    printWindow.document.close();
    printWindow.print();
  }

  /**
   * 영수증 데이터 업데이트
   * @param {Object} receipt
   */
  setReceipt(receipt) {
    this.options.receipt = receipt;
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

export { CardInput, PaymentMethods, PriceBreakdown, ReceiptView };
export default { CardInput, PaymentMethods, PriceBreakdown, ReceiptView };
