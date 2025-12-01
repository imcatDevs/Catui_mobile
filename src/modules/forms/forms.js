/**
 * CATUI Mobile - Form Components Module
 * @module forms
 * @description 고급 폼 컴포넌트 (FileUpload, Rating, SignaturePad, FormWizard)
 */

/**
 * FileUpload 클래스 - 파일 업로드
 * @class FileUpload
 */
class FileUpload {
  constructor(options = {}) {
    this.options = {
      container: null,
      accept: '*/*',
      multiple: false,
      maxSize: 10 * 1024 * 1024, // 10MB
      maxFiles: 10,
      preview: true,
      dragDrop: true,
      placeholder: '파일을 선택하거나 드래그하세요',
      onChange: null,
      onError: null,
      ...options
    };

    this._container = typeof this.options.container === 'string'
      ? document.querySelector(this.options.container)
      : this.options.container;

    this._files = [];
    this._handlers = {};

    if (this._container) {
      this._render();
      this._bindEvents();
    }
  }

  _render() {
    this._container.className = 'catui-file-upload';
    this._container.innerHTML = `
      <div class="catui-file-upload-dropzone${this.options.dragDrop ? ' has-dragdrop' : ''}">
        <input type="file" class="catui-file-upload-input" 
          accept="${this.options.accept}" 
          ${this.options.multiple ? 'multiple' : ''}>
        <div class="catui-file-upload-placeholder">
          <span class="material-icons">cloud_upload</span>
          <span class="catui-file-upload-text">${this.options.placeholder}</span>
          <span class="catui-file-upload-hint">${this._getHintText()}</span>
        </div>
      </div>
      ${this.options.preview ? '<div class="catui-file-upload-preview"></div>' : ''}
    `;

    this._input = this._container.querySelector('.catui-file-upload-input');
    this._dropzone = this._container.querySelector('.catui-file-upload-dropzone');
    this._previewEl = this._container.querySelector('.catui-file-upload-preview');
  }

  _getHintText() {
    const maxSizeMB = (this.options.maxSize / (1024 * 1024)).toFixed(0);
    return `최대 ${maxSizeMB}MB${this.options.multiple ? `, ${this.options.maxFiles}개까지` : ''}`;
  }

  _bindEvents() {
    this._handlers.change = (e) => this._handleFiles(e.target.files);
    this._handlers.click = () => this._input.click();

    this._input.addEventListener('change', this._handlers.change);
    this._dropzone.addEventListener('click', this._handlers.click);

    if (this.options.dragDrop) {
      this._handlers.dragover = (e) => {
        e.preventDefault();
        this._dropzone.classList.add('is-dragover');
      };
      this._handlers.dragleave = () => {
        this._dropzone.classList.remove('is-dragover');
      };
      this._handlers.drop = (e) => {
        e.preventDefault();
        this._dropzone.classList.remove('is-dragover');
        this._handleFiles(e.dataTransfer.files);
      };

      this._dropzone.addEventListener('dragover', this._handlers.dragover);
      this._dropzone.addEventListener('dragleave', this._handlers.dragleave);
      this._dropzone.addEventListener('drop', this._handlers.drop);
    }

    // Preview 삭제 버튼
    if (this._previewEl) {
      this._handlers.previewClick = (e) => {
        const removeBtn = e.target.closest('.catui-file-upload-remove');
        if (removeBtn) {
          const index = parseInt(removeBtn.dataset.index, 10);
          this.removeFile(index);
        }
      };
      this._previewEl.addEventListener('click', this._handlers.previewClick);
    }
  }

  _handleFiles(fileList) {
    const files = Array.from(fileList);
    const errors = [];

    files.forEach(file => {
      if (file.size > this.options.maxSize) {
        errors.push({ file, error: 'size', message: `${file.name}: 파일 크기 초과` });
        return;
      }
      if (this._files.length >= this.options.maxFiles) {
        errors.push({ file, error: 'count', message: `최대 ${this.options.maxFiles}개까지 업로드 가능` });
        return;
      }
      if (!this.options.multiple) {
        this._files = [];
      }
      this._files.push(file);
    });

    if (errors.length > 0 && this.options.onError) {
      this.options.onError(errors);
    }

    this._updatePreview();
    this._input.value = '';

    if (this.options.onChange) {
      this.options.onChange(this._files);
    }
  }

  _updatePreview() {
    if (!this._previewEl) return;

    this._previewEl.innerHTML = this._files.map((file, i) => {
      const isImage = file.type.startsWith('image/');
      const size = this._formatSize(file.size);

      return `
        <div class="catui-file-upload-item" data-index="${i}">
          <div class="catui-file-upload-item-icon">
            ${isImage ? `<img src="${URL.createObjectURL(file)}" alt="${file.name}">` :
    `<span class="material-icons">${this._getFileIcon(file.type)}</span>`}
          </div>
          <div class="catui-file-upload-item-info">
            <span class="catui-file-upload-item-name">${file.name}</span>
            <span class="catui-file-upload-item-size">${size}</span>
          </div>
          <button type="button" class="catui-file-upload-remove" data-index="${i}">
            <span class="material-icons">close</span>
          </button>
        </div>
      `;
    }).join('');
  }

  _formatSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  _getFileIcon(type) {
    if (type.startsWith('image/')) return 'image';
    if (type.startsWith('video/')) return 'videocam';
    if (type.startsWith('audio/')) return 'audiotrack';
    if (type.includes('pdf')) return 'picture_as_pdf';
    if (type.includes('zip') || type.includes('rar')) return 'folder_zip';
    return 'description';
  }

  getFiles() { return [...this._files]; }
  removeFile(index) {
    if (index >= 0 && index < this._files.length) {
      this._files.splice(index, 1);
      this._updatePreview();
      if (this.options.onChange) this.options.onChange(this._files);
    }
  }
  clear() {
    this._files = [];
    this._updatePreview();
    if (this.options.onChange) this.options.onChange(this._files);
  }

  destroy() {
    this._input.removeEventListener('change', this._handlers.change);
    this._dropzone.removeEventListener('click', this._handlers.click);
    if (this.options.dragDrop) {
      this._dropzone.removeEventListener('dragover', this._handlers.dragover);
      this._dropzone.removeEventListener('dragleave', this._handlers.dragleave);
      this._dropzone.removeEventListener('drop', this._handlers.drop);
    }
    if (this._previewEl) {
      this._previewEl.removeEventListener('click', this._handlers.previewClick);
    }
    this._container.innerHTML = '';
    this._container.className = '';
    this._container = null;
    this._handlers = null;
    this.options = null;
  }
}

/**
 * Rating 클래스 - 별점/평점
 * @class Rating
 */
class Rating {
  constructor(options = {}) {
    this.options = {
      container: null,
      value: 0,
      max: 5,
      step: 1, // 0.5 for half stars
      size: 'md', // sm, md, lg
      readonly: false,
      icon: 'star',
      activeColor: 'var(--warning, #EAB308)',
      inactiveColor: 'var(--border-color, #E5E7EB)',
      showValue: false,
      onChange: null,
      ...options
    };

    this._container = typeof this.options.container === 'string'
      ? document.querySelector(this.options.container)
      : this.options.container;

    this._value = this.options.value;
    this._hoverValue = null;
    this._handlers = {};

    if (this._container) {
      this._render();
      this._bindEvents();
    }
  }

  _render() {
    const sizeMap = { sm: 20, md: 28, lg: 36 };
    const iconSize = sizeMap[this.options.size] || sizeMap.md;

    this._container.className = `catui-rating catui-rating-${this.options.size}${this.options.readonly ? ' is-readonly' : ''}`;

    let html = '<div class="catui-rating-stars">';
    for (let i = 1; i <= this.options.max; i++) {
      html += `
        <span class="catui-rating-star" data-value="${i}" style="font-size: ${iconSize}px;">
          <span class="material-icons catui-rating-icon-empty" style="color: ${this.options.inactiveColor}">${this.options.icon}_border</span>
          <span class="material-icons catui-rating-icon-full" style="color: ${this.options.activeColor}">${this.options.icon}</span>
          ${this.options.step === 0.5 ? `<span class="material-icons catui-rating-icon-half" style="color: ${this.options.activeColor}">${this.options.icon}_half</span>` : ''}
        </span>
      `;
    }
    html += '</div>';

    if (this.options.showValue) {
      html += `<span class="catui-rating-value">${this._value}</span>`;
    }

    this._container.innerHTML = html;
    this._starsEl = this._container.querySelector('.catui-rating-stars');
    this._valueEl = this._container.querySelector('.catui-rating-value');
    this._updateUI();
  }

  _bindEvents() {
    if (this.options.readonly) return;

    this._handlers.click = (e) => {
      const star = e.target.closest('.catui-rating-star');
      if (star) {
        const rect = star.getBoundingClientRect();
        const x = e.clientX - rect.left;
        let value = parseInt(star.dataset.value, 10);

        if (this.options.step === 0.5 && x < rect.width / 2) {
          value -= 0.5;
        }
        this.setValue(value);
      }
    };

    this._handlers.mousemove = (e) => {
      const star = e.target.closest('.catui-rating-star');
      if (star) {
        const rect = star.getBoundingClientRect();
        const x = e.clientX - rect.left;
        let value = parseInt(star.dataset.value, 10);

        if (this.options.step === 0.5 && x < rect.width / 2) {
          value -= 0.5;
        }
        this._hoverValue = value;
        this._updateUI();
      }
    };

    this._handlers.mouseleave = () => {
      this._hoverValue = null;
      this._updateUI();
    };

    this._starsEl.addEventListener('click', this._handlers.click);
    this._starsEl.addEventListener('mousemove', this._handlers.mousemove);
    this._starsEl.addEventListener('mouseleave', this._handlers.mouseleave);
  }

  _updateUI() {
    const displayValue = this._hoverValue !== null ? this._hoverValue : this._value;
    const stars = this._starsEl.querySelectorAll('.catui-rating-star');

    stars.forEach((star, i) => {
      const starValue = i + 1;
      star.classList.remove('is-full', 'is-half', 'is-empty');

      if (displayValue >= starValue) {
        star.classList.add('is-full');
      } else if (displayValue >= starValue - 0.5 && this.options.step === 0.5) {
        star.classList.add('is-half');
      } else {
        star.classList.add('is-empty');
      }
    });

    if (this._valueEl) {
      this._valueEl.textContent = this._value;
    }
  }

  getValue() { return this._value; }
  setValue(value) {
    value = Math.max(0, Math.min(this.options.max, value));
    if (value !== this._value) {
      this._value = value;
      this._updateUI();
      if (this.options.onChange) this.options.onChange(value);
    }
  }
  reset() { this.setValue(0); }

  destroy() {
    if (!this.options.readonly && this._starsEl) {
      this._starsEl.removeEventListener('click', this._handlers.click);
      this._starsEl.removeEventListener('mousemove', this._handlers.mousemove);
      this._starsEl.removeEventListener('mouseleave', this._handlers.mouseleave);
    }
    this._container.innerHTML = '';
    this._container.className = '';
    this._container = null;
    this._handlers = null;
    this.options = null;
  }
}

/**
 * SignaturePad 클래스 - 서명 패드
 * @class SignaturePad
 */
class SignaturePad {
  constructor(options = {}) {
    this.options = {
      container: null,
      width: 400,
      height: 200,
      lineWidth: 2,
      lineColor: '#111827',
      backgroundColor: '#FFFFFF',
      showClearBtn: true,
      showUndoBtn: true,
      placeholder: '서명해 주세요',
      onChange: null,
      ...options
    };

    this._container = typeof this.options.container === 'string'
      ? document.querySelector(this.options.container)
      : this.options.container;

    this._canvas = null;
    this._ctx = null;
    this._isDrawing = false;
    this._lastX = 0;
    this._lastY = 0;
    this._paths = [];
    this._currentPath = [];
    this._handlers = {};

    if (this._container) {
      this._render();
      this._bindEvents();
    }
  }

  _render() {
    this._container.className = 'catui-signature-pad';
    this._container.innerHTML = `
      <div class="catui-signature-pad-canvas-wrapper">
        <canvas class="catui-signature-pad-canvas" width="${this.options.width}" height="${this.options.height}"></canvas>
        <div class="catui-signature-pad-placeholder">${this.options.placeholder}</div>
      </div>
      <div class="catui-signature-pad-actions">
        ${this.options.showUndoBtn ? '<button type="button" class="catui-signature-pad-btn" data-action="undo"><span class="material-icons">undo</span></button>' : ''}
        ${this.options.showClearBtn ? '<button type="button" class="catui-signature-pad-btn" data-action="clear"><span class="material-icons">delete_outline</span></button>' : ''}
      </div>
    `;

    this._canvas = this._container.querySelector('.catui-signature-pad-canvas');
    this._placeholderEl = this._container.querySelector('.catui-signature-pad-placeholder');
    this._ctx = this._canvas.getContext('2d');

    this._initCanvas();
  }

  _initCanvas() {
    // High DPI 지원
    const dpr = window.devicePixelRatio || 1;
    const rect = this._canvas.getBoundingClientRect();

    this._canvas.width = rect.width * dpr;
    this._canvas.height = rect.height * dpr;
    this._canvas.style.width = rect.width + 'px';
    this._canvas.style.height = rect.height + 'px';

    this._ctx.scale(dpr, dpr);
    this._ctx.lineCap = 'round';
    this._ctx.lineJoin = 'round';
    this._ctx.lineWidth = this.options.lineWidth;

    // CSS 변수를 실제 색상으로 변환
    this._resolveColors();
    this._clear(false);
  }

  _resolveColors() {
    const style = getComputedStyle(document.documentElement);

    // lineColor가 CSS 변수면 실제 값으로 변환
    if (this.options.lineColor.startsWith('var(')) {
      const varName = this.options.lineColor.match(/var\(--([^,)]+)/)?.[1];
      if (varName) {
        this.options.lineColor = style.getPropertyValue('--' + varName).trim() || '#111827';
      }
    }

    // backgroundColor가 CSS 변수면 실제 값으로 변환
    if (this.options.backgroundColor.startsWith('var(')) {
      const varName = this.options.backgroundColor.match(/var\(--([^,)]+)/)?.[1];
      if (varName) {
        this.options.backgroundColor = style.getPropertyValue('--' + varName).trim() || '#FFFFFF';
      }
    }
  }

  _bindEvents() {
    // 포인터 이벤트 (터치 + 마우스 통합)
    this._handlers.pointerdown = (e) => {
      e.preventDefault();
      this._isDrawing = true;
      const pos = this._getPointerPos(e);
      this._lastX = pos.x;
      this._lastY = pos.y;
      this._currentPath = [{ x: pos.x, y: pos.y }];
      this._hidePlaceholder();
    };

    this._handlers.pointermove = (e) => {
      if (!this._isDrawing) return;
      e.preventDefault();
      const pos = this._getPointerPos(e);
      this._draw(this._lastX, this._lastY, pos.x, pos.y);
      this._lastX = pos.x;
      this._lastY = pos.y;
      this._currentPath.push({ x: pos.x, y: pos.y });
    };

    this._handlers.pointerup = () => {
      if (this._isDrawing && this._currentPath.length > 0) {
        this._paths.push([...this._currentPath]);
        this._currentPath = [];
        if (this.options.onChange) this.options.onChange(this.toDataURL());
      }
      this._isDrawing = false;
    };

    this._handlers.pointerleave = () => {
      if (this._isDrawing && this._currentPath.length > 0) {
        this._paths.push([...this._currentPath]);
        this._currentPath = [];
      }
      this._isDrawing = false;
    };

    this._canvas.addEventListener('pointerdown', this._handlers.pointerdown);
    this._canvas.addEventListener('pointermove', this._handlers.pointermove);
    this._canvas.addEventListener('pointerup', this._handlers.pointerup);
    this._canvas.addEventListener('pointerleave', this._handlers.pointerleave);
    this._canvas.style.touchAction = 'none';

    // 버튼 이벤트
    this._handlers.btnClick = (e) => {
      const action = e.target.closest('[data-action]')?.dataset.action;
      if (action === 'clear') this.clear();
      if (action === 'undo') this.undo();
    };
    this._container.addEventListener('click', this._handlers.btnClick);
  }

  _getPointerPos(e) {
    const rect = this._canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  }

  _draw(x1, y1, x2, y2) {
    this._ctx.strokeStyle = this.options.lineColor;
    this._ctx.beginPath();
    this._ctx.moveTo(x1, y1);
    this._ctx.lineTo(x2, y2);
    this._ctx.stroke();
  }

  _redraw() {
    this._clear(false);
    this._ctx.strokeStyle = this.options.lineColor;

    this._paths.forEach(path => {
      if (path.length < 2) return;
      this._ctx.beginPath();
      this._ctx.moveTo(path[0].x, path[0].y);
      for (let i = 1; i < path.length; i++) {
        this._ctx.lineTo(path[i].x, path[i].y);
      }
      this._ctx.stroke();
    });

    if (this._paths.length === 0) {
      this._showPlaceholder();
    }
  }

  _clear(notify = true) {
    this._ctx.fillStyle = this.options.backgroundColor;
    this._ctx.fillRect(0, 0, this._canvas.width, this._canvas.height);
    if (notify && this.options.onChange) this.options.onChange(null);
  }

  _hidePlaceholder() {
    if (this._placeholderEl) this._placeholderEl.style.display = 'none';
  }

  _showPlaceholder() {
    if (this._placeholderEl) this._placeholderEl.style.display = '';
  }

  clear() {
    this._paths = [];
    this._currentPath = [];
    this._clear();
    this._showPlaceholder();
  }

  undo() {
    if (this._paths.length > 0) {
      this._paths.pop();
      this._redraw();
      if (this.options.onChange) {
        this.options.onChange(this._paths.length > 0 ? this.toDataURL() : null);
      }
    }
  }

  isEmpty() { return this._paths.length === 0; }
  toDataURL(type = 'image/png') { return this._canvas.toDataURL(type); }
  toBlob(callback, type = 'image/png') { this._canvas.toBlob(callback, type); }

  destroy() {
    this._canvas.removeEventListener('pointerdown', this._handlers.pointerdown);
    this._canvas.removeEventListener('pointermove', this._handlers.pointermove);
    this._canvas.removeEventListener('pointerup', this._handlers.pointerup);
    this._canvas.removeEventListener('pointerleave', this._handlers.pointerleave);
    this._container.removeEventListener('click', this._handlers.btnClick);
    this._container.innerHTML = '';
    this._container.className = '';
    this._container = null;
    this._canvas = null;
    this._ctx = null;
    this._handlers = null;
    this.options = null;
  }
}

/**
 * FormWizard 클래스 - 단계별 폼
 * @class FormWizard
 */
class FormWizard {
  constructor(options = {}) {
    this.options = {
      container: null,
      steps: [], // [{title, content, validate?}]
      currentStep: 0,
      showStepNumbers: true,
      showNavButtons: true,
      prevText: '이전',
      nextText: '다음',
      submitText: '완료',
      allowStepClick: false,
      animation: true,
      onStepChange: null,
      onSubmit: null,
      onValidationError: null,
      ...options
    };

    this._container = typeof this.options.container === 'string'
      ? document.querySelector(this.options.container)
      : this.options.container;

    this._currentStep = this.options.currentStep;
    this._handlers = {};

    if (this._container && this.options.steps.length > 0) {
      this._render();
      this._bindEvents();
    }
  }

  _render() {
    this._container.className = 'catui-form-wizard';
    this._container.innerHTML = `
      <div class="catui-form-wizard-header">
        <div class="catui-form-wizard-steps">
          ${this.options.steps.map((step, i) => `
            <div class="catui-form-wizard-step${i === this._currentStep ? ' is-active' : ''}${i < this._currentStep ? ' is-completed' : ''}" 
                 data-step="${i}" ${this.options.allowStepClick && i < this._currentStep ? 'role="button" tabindex="0"' : ''}>
              <div class="catui-form-wizard-step-indicator">
                ${this.options.showStepNumbers ? `<span class="catui-form-wizard-step-number">${i + 1}</span>` : ''}
                <span class="catui-form-wizard-step-check material-icons">check</span>
              </div>
              <span class="catui-form-wizard-step-title">${step.title}</span>
            </div>
          `).join('')}
          <div class="catui-form-wizard-progress">
            <div class="catui-form-wizard-progress-bar" style="width: ${this._getProgress()}%"></div>
          </div>
        </div>
      </div>
      <div class="catui-form-wizard-content">
        ${this.options.steps.map((step, i) => `
          <div class="catui-form-wizard-panel${i === this._currentStep ? ' is-active' : ''}" data-step="${i}">
            ${step.content}
          </div>
        `).join('')}
      </div>
      ${this.options.showNavButtons ? `
        <div class="catui-form-wizard-footer">
          <button type="button" class="catui-form-wizard-btn catui-form-wizard-prev" ${this._currentStep === 0 ? 'disabled' : ''}>
            <span class="material-icons">chevron_left</span>
            ${this.options.prevText}
          </button>
          <button type="button" class="catui-form-wizard-btn catui-form-wizard-next is-primary">
            ${this._currentStep === this.options.steps.length - 1 ? this.options.submitText : this.options.nextText}
            ${this._currentStep === this.options.steps.length - 1 ? '' : '<span class="material-icons">chevron_right</span>'}
          </button>
        </div>
      ` : ''}
    `;

    this._stepsEl = this._container.querySelector('.catui-form-wizard-steps');
    this._contentEl = this._container.querySelector('.catui-form-wizard-content');
    this._progressBar = this._container.querySelector('.catui-form-wizard-progress-bar');
    this._prevBtn = this._container.querySelector('.catui-form-wizard-prev');
    this._nextBtn = this._container.querySelector('.catui-form-wizard-next');
  }

  _getProgress() {
    return (this._currentStep / (this.options.steps.length - 1)) * 100;
  }

  _bindEvents() {
    this._handlers.click = (e) => {
      if (e.target.closest('.catui-form-wizard-prev')) {
        this.prev();
      } else if (e.target.closest('.catui-form-wizard-next')) {
        if (this._currentStep === this.options.steps.length - 1) {
          this._submit();
        } else {
          this.next();
        }
      } else if (this.options.allowStepClick) {
        const stepEl = e.target.closest('.catui-form-wizard-step[role="button"]');
        if (stepEl) {
          const step = parseInt(stepEl.dataset.step, 10);
          if (step < this._currentStep) {
            this.goTo(step);
          }
        }
      }
    };

    this._container.addEventListener('click', this._handlers.click);
  }

  async _validateCurrentStep() {
    const step = this.options.steps[this._currentStep];
    if (step.validate) {
      try {
        const result = await step.validate(this._currentStep, this._getPanelEl(this._currentStep));
        return result !== false;
      } catch (e) {
        if (this.options.onValidationError) {
          this.options.onValidationError(e, this._currentStep);
        }
        return false;
      }
    }
    return true;
  }

  _getPanelEl(step) {
    return this._contentEl.querySelector(`.catui-form-wizard-panel[data-step="${step}"]`);
  }

  _updateUI() {
    // Steps
    const stepEls = this._stepsEl.querySelectorAll('.catui-form-wizard-step');
    stepEls.forEach((el, i) => {
      el.classList.toggle('is-active', i === this._currentStep);
      el.classList.toggle('is-completed', i < this._currentStep);
    });

    // Panels
    const panelEls = this._contentEl.querySelectorAll('.catui-form-wizard-panel');
    panelEls.forEach((el, i) => {
      el.classList.toggle('is-active', i === this._currentStep);
    });

    // Progress
    if (this._progressBar) {
      this._progressBar.style.width = `${this._getProgress()}%`;
    }

    // Buttons
    if (this._prevBtn) {
      this._prevBtn.disabled = this._currentStep === 0;
    }
    if (this._nextBtn) {
      const isLast = this._currentStep === this.options.steps.length - 1;
      this._nextBtn.innerHTML = isLast
        ? this.options.submitText
        : `${this.options.nextText}<span class="material-icons">chevron_right</span>`;
    }
  }

  async next() {
    if (this._currentStep >= this.options.steps.length - 1) return false;

    const valid = await this._validateCurrentStep();
    if (!valid) return false;

    this._currentStep++;
    this._updateUI();

    if (this.options.onStepChange) {
      this.options.onStepChange(this._currentStep, 'next');
    }
    return true;
  }

  prev() {
    if (this._currentStep <= 0) return false;

    this._currentStep--;
    this._updateUI();

    if (this.options.onStepChange) {
      this.options.onStepChange(this._currentStep, 'prev');
    }
    return true;
  }

  async goTo(step) {
    if (step < 0 || step >= this.options.steps.length || step === this._currentStep) return false;

    // 앞으로 갈 때는 현재 스텝 검증
    if (step > this._currentStep) {
      const valid = await this._validateCurrentStep();
      if (!valid) return false;
    }

    this._currentStep = step;
    this._updateUI();

    if (this.options.onStepChange) {
      this.options.onStepChange(this._currentStep, 'goto');
    }
    return true;
  }

  async _submit() {
    const valid = await this._validateCurrentStep();
    if (!valid) return;

    if (this.options.onSubmit) {
      this.options.onSubmit(this._collectData());
    }
  }

  _collectData() {
    const data = {};
    const panels = this._contentEl.querySelectorAll('.catui-form-wizard-panel');
    panels.forEach((panel, _i) => {
      const inputs = panel.querySelectorAll('input, select, textarea');
      inputs.forEach(input => {
        if (input.name) {
          if (input.type === 'checkbox') {
            data[input.name] = input.checked;
          } else if (input.type === 'radio') {
            if (input.checked) data[input.name] = input.value;
          } else {
            data[input.name] = input.value;
          }
        }
      });
    });
    return data;
  }

  getCurrentStep() { return this._currentStep; }
  getTotalSteps() { return this.options.steps.length; }
  getData() { return this._collectData(); }

  destroy() {
    this._container.removeEventListener('click', this._handlers.click);
    this._container.innerHTML = '';
    this._container.className = '';
    this._container = null;
    this._handlers = null;
    this.options = null;
  }
}

export { FileUpload, Rating, SignaturePad, FormWizard };
export default { FileUpload, Rating, SignaturePad, FormWizard };
