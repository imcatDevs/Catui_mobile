/**
 * CATUI Mobile - Media Module
 * ImageCropper, VideoPlayer, AudioPlayer, MediaPreview 컴포넌트
 * @module media
 */

/**
 * ImageCropper 클래스 - 이미지 자르기/회전
 * @class ImageCropper
 */
class ImageCropper {
  /**
   * @constructor
   * @param {Object} options
   * @param {string|HTMLElement} options.container - 컨테이너
   * @param {string|File|Blob} [options.image] - 이미지 소스
   * @param {number} [options.aspectRatio=null] - 비율 (null=자유, 1=정사각형)
   * @param {string} [options.mask='none'] - 마스크 형태 (none, circle, square)
   * @param {number} [options.minWidth=50] - 최소 너비
   * @param {number} [options.minHeight=50] - 최소 높이
   * @param {boolean} [options.rotatable=true] - 회전 가능
   * @param {boolean} [options.zoomable=true] - 줌 가능
   * @param {boolean} [options.guides=true] - 가이드라인 표시
   * @param {Object} [options.output] - 출력 설정
   * @param {Function} [options.onReady] - 준비 완료 콜백
   * @param {Function} [options.onCrop] - 크롭 콜백
   * @param {Function} [options.onChange] - 변경 콜백
   */
  constructor(options = {}) {
    this.options = {
      container: null,
      image: null,
      aspectRatio: null,
      mask: 'none',
      minWidth: 50,
      minHeight: 50,
      rotatable: true,
      zoomable: true,
      guides: true,
      output: {
        width: null,
        height: null,
        format: 'image/jpeg',
        quality: 0.9
      },
      onReady: null,
      onCrop: null,
      onChange: null,
      ...options
    };

    this._container = typeof this.options.container === 'string'
      ? document.querySelector(this.options.container)
      : this.options.container;

    this._handlers = {};
    this._canvas = null;
    this._ctx = null;
    this._img = null;
    this._cropBox = { x: 0, y: 0, width: 200, height: 200 };
    this._rotation = 0;
    this._scale = 1;
    this._isDragging = false;
    this._isResizing = false;

    if (this._container) {
      this._render();
      this._bindEvents();

      if (this.options.image) {
        this.setImage(this.options.image);
      }
    }
  }

  /**
   * 렌더링
   * @private
   */
  _render() {
    const maskClass = this.options.mask !== 'none' ? `is-mask-${this.options.mask}` : '';

    this._container.className = `catui-image-cropper ${maskClass}`;
    this._container.innerHTML = `
      <div class="catui-cropper-wrapper">
        <canvas class="catui-cropper-canvas"></canvas>
        <div class="catui-cropper-overlay">
          <div class="catui-cropper-cropbox">
            ${this.options.guides ? `
              <div class="catui-cropper-guides">
                <div class="catui-cropper-guide-h"></div>
                <div class="catui-cropper-guide-h"></div>
                <div class="catui-cropper-guide-v"></div>
                <div class="catui-cropper-guide-v"></div>
              </div>
            ` : ''}
            <div class="catui-cropper-handle" data-handle="nw"></div>
            <div class="catui-cropper-handle" data-handle="ne"></div>
            <div class="catui-cropper-handle" data-handle="sw"></div>
            <div class="catui-cropper-handle" data-handle="se"></div>
          </div>
        </div>
      </div>
      <div class="catui-cropper-toolbar">
        ${this.options.rotatable ? `
          <button class="catui-cropper-btn" data-action="rotate-left" type="button">
            <span class="material-icons">rotate_left</span>
          </button>
          <button class="catui-cropper-btn" data-action="rotate-right" type="button">
            <span class="material-icons">rotate_right</span>
          </button>
        ` : ''}
        ${this.options.zoomable ? `
          <button class="catui-cropper-btn" data-action="zoom-out" type="button">
            <span class="material-icons">remove</span>
          </button>
          <button class="catui-cropper-btn" data-action="zoom-in" type="button">
            <span class="material-icons">add</span>
          </button>
        ` : ''}
        <button class="catui-cropper-btn" data-action="reset" type="button">
          <span class="material-icons">refresh</span>
        </button>
      </div>
    `;

    this._canvas = this._container.querySelector('.catui-cropper-canvas');
    this._ctx = this._canvas.getContext('2d');
    this._cropBoxEl = this._container.querySelector('.catui-cropper-cropbox');
  }

  /**
   * 이벤트 바인딩
   * @private
   */
  _bindEvents() {
    // 툴바 버튼
    this._handlers.toolbarClick = (e) => {
      const btn = e.target.closest('.catui-cropper-btn');
      if (!btn) return;

      const action = btn.dataset.action;
      switch (action) {
        case 'rotate-left': this.rotate(-90); break;
        case 'rotate-right': this.rotate(90); break;
        case 'zoom-in': this.zoom(0.1); break;
        case 'zoom-out': this.zoom(-0.1); break;
        case 'reset': this.reset(); break;
      }
    };

    // 크롭 박스 드래그
    this._handlers.mousedown = (e) => {
      const handle = e.target.dataset.handle;
      if (handle) {
        this._isResizing = handle;
      } else if (e.target.closest('.catui-cropper-cropbox')) {
        this._isDragging = true;
      }
      this._startX = e.clientX || e.touches?.[0]?.clientX;
      this._startY = e.clientY || e.touches?.[0]?.clientY;
      this._startCrop = { ...this._cropBox };
    };

    this._handlers.mousemove = (e) => {
      if (!this._isDragging && !this._isResizing) return;

      const clientX = e.clientX || e.touches?.[0]?.clientX;
      const clientY = e.clientY || e.touches?.[0]?.clientY;
      const dx = clientX - this._startX;
      const dy = clientY - this._startY;

      if (this._isDragging) {
        this._cropBox.x = this._startCrop.x + dx;
        this._cropBox.y = this._startCrop.y + dy;
      } else if (this._isResizing) {
        this._handleResize(this._isResizing, dx, dy);
      }

      this._updateCropBox();
      this._triggerChange();
    };

    this._handlers.mouseup = () => {
      this._isDragging = false;
      this._isResizing = false;
    };

    // 이벤트 등록
    this._container.querySelector('.catui-cropper-toolbar')?.addEventListener('click', this._handlers.toolbarClick);
    this._container.querySelector('.catui-cropper-overlay')?.addEventListener('mousedown', this._handlers.mousedown);
    this._container.querySelector('.catui-cropper-overlay')?.addEventListener('touchstart', this._handlers.mousedown, { passive: true });
    document.addEventListener('mousemove', this._handlers.mousemove);
    document.addEventListener('touchmove', this._handlers.mousemove, { passive: true });
    document.addEventListener('mouseup', this._handlers.mouseup);
    document.addEventListener('touchend', this._handlers.mouseup);
  }

  /**
   * 리사이즈 핸들
   * @private
   */
  _handleResize(handle, dx, dy) {
    const { aspectRatio } = this.options;
    let newWidth = this._startCrop.width;
    let newHeight = this._startCrop.height;
    let newX = this._startCrop.x;
    let newY = this._startCrop.y;

    if (handle.includes('e')) newWidth += dx;
    if (handle.includes('w')) { newWidth -= dx; newX += dx; }
    if (handle.includes('s')) newHeight += dy;
    if (handle.includes('n')) { newHeight -= dy; newY += dy; }

    // 최소 크기 제한
    newWidth = Math.max(this.options.minWidth, newWidth);
    newHeight = Math.max(this.options.minHeight, newHeight);

    // 비율 유지
    if (aspectRatio) {
      if (handle.includes('e') || handle.includes('w')) {
        newHeight = newWidth / aspectRatio;
      } else {
        newWidth = newHeight * aspectRatio;
      }
    }

    this._cropBox = { x: newX, y: newY, width: newWidth, height: newHeight };
  }

  /**
   * 크롭 박스 업데이트
   * @private
   */
  _updateCropBox() {
    if (!this._cropBoxEl) return;

    this._cropBoxEl.style.left = `${this._cropBox.x}px`;
    this._cropBoxEl.style.top = `${this._cropBox.y}px`;
    this._cropBoxEl.style.width = `${this._cropBox.width}px`;
    this._cropBoxEl.style.height = `${this._cropBox.height}px`;
  }

  /**
   * 변경 이벤트 트리거
   * @private
   */
  _triggerChange() {
    if (this.options.onChange) {
      this.options.onChange(this._cropBox, this._rotation, this._scale);
    }
  }

  /**
   * 이미지 설정
   * @param {string|File|Blob} source
   */
  setImage(source) {
    this._img = new Image();

    this._img.onload = () => {
      const wrapper = this._container.querySelector('.catui-cropper-wrapper');
      const wrapperRect = wrapper.getBoundingClientRect();

      this._canvas.width = wrapperRect.width;
      this._canvas.height = wrapperRect.height;

      this._drawImage();
      this._initCropBox();

      if (this.options.onReady) {
        this.options.onReady();
      }
    };

    if (source instanceof File || source instanceof Blob) {
      this._img.src = URL.createObjectURL(source);
    } else {
      // CORS 허용 (외부 이미지 지원)
      this._img.crossOrigin = 'anonymous';
      this._img.src = source;
    }
  }

  /**
   * 이미지 그리기
   * @private
   */
  _drawImage() {
    if (!this._img || !this._ctx) return;

    const { width, height } = this._canvas;
    this._ctx.clearRect(0, 0, width, height);

    this._ctx.save();
    this._ctx.translate(width / 2, height / 2);
    this._ctx.rotate((this._rotation * Math.PI) / 180);
    this._ctx.scale(this._scale, this._scale);

    const imgRatio = this._img.width / this._img.height;
    const canvasRatio = width / height;
    let drawWidth, drawHeight;

    if (imgRatio > canvasRatio) {
      drawWidth = width;
      drawHeight = width / imgRatio;
    } else {
      drawHeight = height;
      drawWidth = height * imgRatio;
    }

    this._ctx.drawImage(this._img, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
    this._ctx.restore();
  }

  /**
   * 크롭 박스 초기화
   * @private
   */
  _initCropBox() {
    const wrapper = this._container.querySelector('.catui-cropper-wrapper');
    const rect = wrapper.getBoundingClientRect();

    let size = Math.min(rect.width, rect.height) * 0.6;
    let width = size;
    let height = size;

    if (this.options.aspectRatio) {
      if (this.options.aspectRatio > 1) {
        height = width / this.options.aspectRatio;
      } else {
        width = height * this.options.aspectRatio;
      }
    }

    this._cropBox = {
      x: (rect.width - width) / 2,
      y: (rect.height - height) / 2,
      width,
      height
    };

    this._updateCropBox();
  }

  /**
   * 회전
   * @param {number} degrees
   */
  rotate(degrees) {
    this._rotation = (this._rotation + degrees) % 360;
    this._drawImage();
    this._triggerChange();
  }

  /**
   * 줌
   * @param {number} delta
   */
  zoom(delta) {
    this._scale = Math.max(0.1, Math.min(3, this._scale + delta));
    this._drawImage();
    this._triggerChange();
  }

  /**
   * 리셋
   */
  reset() {
    this._rotation = 0;
    this._scale = 1;
    this._drawImage();
    this._initCropBox();
    this._triggerChange();
  }

  /**
   * 크롭 실행
   * @returns {Object} { blob, dataURL, canvas }
   */
  async crop() {
    const outputCanvas = document.createElement('canvas');
    const ctx = outputCanvas.getContext('2d');

    const outputWidth = this.options.output.width || this._cropBox.width;
    const outputHeight = this.options.output.height || this._cropBox.height;

    outputCanvas.width = outputWidth;
    outputCanvas.height = outputHeight;

    // 크롭 영역 계산
    ctx.drawImage(
      this._canvas,
      this._cropBox.x,
      this._cropBox.y,
      this._cropBox.width,
      this._cropBox.height,
      0,
      0,
      outputWidth,
      outputHeight
    );

    const dataURL = outputCanvas.toDataURL(this.options.output.format, this.options.output.quality);

    const blob = await new Promise(resolve => {
      outputCanvas.toBlob(resolve, this.options.output.format, this.options.output.quality);
    });

    const result = { blob, dataURL, canvas: outputCanvas };

    if (this.options.onCrop) {
      this.options.onCrop(result);
    }

    return result;
  }

  /**
   * DataURL 가져오기
   * @returns {string}
   */
  getDataURL() {
    return this._canvas?.toDataURL(this.options.output.format, this.options.output.quality);
  }

  /**
   * 정리
   */
  destroy() {
    // 이벤트 제거
    this._container.querySelector('.catui-cropper-toolbar')?.removeEventListener('click', this._handlers.toolbarClick);
    this._container.querySelector('.catui-cropper-overlay')?.removeEventListener('mousedown', this._handlers.mousedown);
    this._container.querySelector('.catui-cropper-overlay')?.removeEventListener('touchstart', this._handlers.mousedown);
    document.removeEventListener('mousemove', this._handlers.mousemove);
    document.removeEventListener('touchmove', this._handlers.mousemove);
    document.removeEventListener('mouseup', this._handlers.mouseup);
    document.removeEventListener('touchend', this._handlers.mouseup);

    // DOM 정리
    this._container.innerHTML = '';
    this._container.className = '';

    // 참조 해제
    this._container = null;
    this._canvas = null;
    this._ctx = null;
    this._img = null;
    this._handlers = null;
    this.options = null;
  }
}

/**
 * VideoPlayer 클래스 - 비디오 플레이어
 * @class VideoPlayer
 */
class VideoPlayer {
  /**
   * @constructor
   * @param {Object} options
   * @param {string|HTMLElement} options.container - 컨테이너
   * @param {string} options.src - 비디오 소스
   * @param {string} [options.poster] - 포스터 이미지
   * @param {boolean} [options.controls=true] - 컨트롤 표시
   * @param {boolean} [options.autoplay=false] - 자동 재생
   * @param {boolean} [options.loop=false] - 반복 재생
   * @param {boolean} [options.muted=false] - 음소거
   * @param {boolean} [options.pip=true] - PIP 지원
   * @param {boolean} [options.fullscreen=true] - 전체화면 지원
   * @param {boolean} [options.playbackRate=true] - 배속 조절
   * @param {Function} [options.onPlay] - 재생 콜백
   * @param {Function} [options.onPause] - 일시정지 콜백
   * @param {Function} [options.onEnded] - 종료 콜백
   * @param {Function} [options.onTimeUpdate] - 시간 업데이트 콜백
   * @param {Function} [options.onError] - 에러 콜백
   */
  constructor(options = {}) {
    this.options = {
      container: null,
      src: '',
      poster: '',
      controls: true,
      autoplay: false,
      loop: false,
      muted: false,
      pip: true,
      fullscreen: true,
      playbackRate: true,
      playbackRates: [0.5, 0.75, 1, 1.25, 1.5, 2],
      onPlay: null,
      onPause: null,
      onEnded: null,
      onTimeUpdate: null,
      onError: null,
      ...options
    };

    this._container = typeof this.options.container === 'string'
      ? document.querySelector(this.options.container)
      : this.options.container;

    this._handlers = {};
    this._video = null;
    this._isPlaying = false;
    this._currentRate = 1;
    this._timers = [];

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
    this._container.className = 'catui-video-player';
    this._container.innerHTML = `
      <div class="catui-video-wrapper">
        <video 
          class="catui-video"
          ${this.options.poster ? `poster="${this.options.poster}"` : ''}
          ${this.options.autoplay ? 'autoplay' : ''}
          ${this.options.loop ? 'loop' : ''}
          ${this.options.muted ? 'muted' : ''}
          playsinline
        >
          <source src="${this.options.src}" type="video/mp4">
        </video>
        <div class="catui-video-overlay">
          <button class="catui-video-play-large" type="button">
            <span class="material-icons">play_arrow</span>
          </button>
        </div>
      </div>
      ${this.options.controls ? `
        <div class="catui-video-controls">
          <div class="catui-video-progress">
            <div class="catui-video-progress-bar">
              <div class="catui-video-progress-played"></div>
              <div class="catui-video-progress-buffered"></div>
            </div>
          </div>
          <div class="catui-video-actions">
            <div class="catui-video-left">
              <button class="catui-video-btn" data-action="play" type="button">
                <span class="material-icons">play_arrow</span>
              </button>
              <span class="catui-video-time">
                <span class="catui-video-current">0:00</span>
                <span>/</span>
                <span class="catui-video-duration">0:00</span>
              </span>
            </div>
            <div class="catui-video-right">
              ${this.options.playbackRate ? `
                <button class="catui-video-btn catui-video-rate" data-action="rate" type="button">1x</button>
              ` : ''}
              <button class="catui-video-btn" data-action="mute" type="button">
                <span class="material-icons">volume_up</span>
              </button>
              ${this.options.pip ? `
                <button class="catui-video-btn" data-action="pip" type="button">
                  <span class="material-icons">picture_in_picture_alt</span>
                </button>
              ` : ''}
              ${this.options.fullscreen ? `
                <button class="catui-video-btn" data-action="fullscreen" type="button">
                  <span class="material-icons">fullscreen</span>
                </button>
              ` : ''}
            </div>
          </div>
        </div>
      ` : ''}
    `;

    this._video = this._container.querySelector('.catui-video');
  }

  /**
   * 이벤트 바인딩
   * @private
   */
  _bindEvents() {
    // 비디오 이벤트
    this._handlers.play = () => {
      this._isPlaying = true;
      this._updatePlayButton();
      this._container.querySelector('.catui-video-overlay')?.classList.add('is-hidden');
      if (this.options.onPlay) this.options.onPlay();
    };

    this._handlers.pause = () => {
      this._isPlaying = false;
      this._updatePlayButton();
      if (this.options.onPause) this.options.onPause();
    };

    this._handlers.ended = () => {
      this._isPlaying = false;
      this._updatePlayButton();
      this._container.querySelector('.catui-video-overlay')?.classList.remove('is-hidden');
      if (this.options.onEnded) this.options.onEnded();
    };

    this._handlers.timeupdate = () => {
      this._updateProgress();
      if (this.options.onTimeUpdate) {
        this.options.onTimeUpdate(this._video.currentTime, this._video.duration);
      }
    };

    this._handlers.loadedmetadata = () => {
      this._updateDuration();
    };

    this._handlers.error = (e) => {
      if (this.options.onError) this.options.onError(e);
    };

    // 컨트롤 클릭
    this._handlers.controlClick = (e) => {
      const btn = e.target.closest('.catui-video-btn');
      if (!btn) return;

      const action = btn.dataset.action;
      switch (action) {
        case 'play': this.togglePlay(); break;
        case 'mute': this.toggleMute(); break;
        case 'pip': this.togglePip(); break;
        case 'fullscreen': this.toggleFullscreen(); break;
        case 'rate': this.cycleRate(); break;
      }
    };

    // 오버레이/비디오 클릭
    this._handlers.overlayClick = () => {
      this.togglePlay();
    };

    // 프로그레스 클릭
    this._handlers.progressClick = (e) => {
      const progressBar = this._container.querySelector('.catui-video-progress-bar');
      const rect = progressBar.getBoundingClientRect();
      const percent = (e.clientX - rect.left) / rect.width;
      this._video.currentTime = percent * this._video.duration;
    };

    // 이벤트 등록
    this._video.addEventListener('play', this._handlers.play);
    this._video.addEventListener('pause', this._handlers.pause);
    this._video.addEventListener('ended', this._handlers.ended);
    this._video.addEventListener('timeupdate', this._handlers.timeupdate);
    this._video.addEventListener('loadedmetadata', this._handlers.loadedmetadata);
    this._video.addEventListener('error', this._handlers.error);

    this._container.querySelector('.catui-video-controls')?.addEventListener('click', this._handlers.controlClick);
    this._container.querySelector('.catui-video-overlay')?.addEventListener('click', this._handlers.overlayClick);
    this._container.querySelector('.catui-video-progress')?.addEventListener('click', this._handlers.progressClick);
  }

  /**
   * 재생/일시정지 버튼 업데이트
   * @private
   */
  _updatePlayButton() {
    const btn = this._container.querySelector('[data-action="play"] .material-icons');
    const largeBtn = this._container.querySelector('.catui-video-play-large .material-icons');
    const icon = this._isPlaying ? 'pause' : 'play_arrow';
    if (btn) btn.textContent = icon;
    if (largeBtn) largeBtn.textContent = icon;
  }

  /**
   * 진행률 업데이트
   * @private
   */
  _updateProgress() {
    const played = (this._video.currentTime / this._video.duration) * 100;
    const playedEl = this._container.querySelector('.catui-video-progress-played');
    const currentEl = this._container.querySelector('.catui-video-current');

    if (playedEl) playedEl.style.width = `${played}%`;
    if (currentEl) currentEl.textContent = this._formatTime(this._video.currentTime);
  }

  /**
   * 재생 시간 업데이트
   * @private
   */
  _updateDuration() {
    const durationEl = this._container.querySelector('.catui-video-duration');
    if (durationEl) durationEl.textContent = this._formatTime(this._video.duration);
  }

  /**
   * 시간 포맷
   * @private
   */
  _formatTime(seconds) {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * 재생/일시정지 토글
   */
  togglePlay() {
    if (this._video.paused) {
      this._video.play();
    } else {
      this._video.pause();
    }
  }

  /**
   * 재생
   */
  play() {
    this._video.play();
  }

  /**
   * 일시정지
   */
  pause() {
    this._video.pause();
  }

  /**
   * 음소거 토글
   */
  toggleMute() {
    this._video.muted = !this._video.muted;
    const btn = this._container.querySelector('[data-action="mute"] .material-icons');
    if (btn) btn.textContent = this._video.muted ? 'volume_off' : 'volume_up';
  }

  /**
   * PIP 토글
   */
  async togglePip() {
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else {
        await this._video.requestPictureInPicture();
      }
    } catch (e) {
      console.warn('PIP not supported:', e);
    }
  }

  /**
   * 전체화면 토글
   */
  toggleFullscreen() {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      this._container.requestFullscreen();
    }
  }

  /**
   * 배속 순환
   */
  cycleRate() {
    const rates = this.options.playbackRates;
    const currentIndex = rates.indexOf(this._currentRate);
    const nextIndex = (currentIndex + 1) % rates.length;
    this._currentRate = rates[nextIndex];
    this._video.playbackRate = this._currentRate;

    const btn = this._container.querySelector('.catui-video-rate');
    if (btn) btn.textContent = `${this._currentRate}x`;
  }

  /**
   * 시간 이동
   * @param {number} time
   */
  seek(time) {
    this._video.currentTime = time;
  }

  /**
   * 소스 변경
   * @param {string} src
   */
  setSource(src) {
    this._video.src = src;
    this._video.load();
  }

  /**
   * 정리
   */
  destroy() {
    // 타이머 정리
    this._timers.forEach(id => clearTimeout(id));
    this._timers = [];

    // 이벤트 제거
    this._video?.removeEventListener('play', this._handlers.play);
    this._video?.removeEventListener('pause', this._handlers.pause);
    this._video?.removeEventListener('ended', this._handlers.ended);
    this._video?.removeEventListener('timeupdate', this._handlers.timeupdate);
    this._video?.removeEventListener('loadedmetadata', this._handlers.loadedmetadata);
    this._video?.removeEventListener('error', this._handlers.error);
    this._container.querySelector('.catui-video-controls')?.removeEventListener('click', this._handlers.controlClick);
    this._container.querySelector('.catui-video-overlay')?.removeEventListener('click', this._handlers.overlayClick);
    this._container.querySelector('.catui-video-progress')?.removeEventListener('click', this._handlers.progressClick);

    // DOM 정리
    this._container.innerHTML = '';
    this._container.className = '';

    // 참조 해제
    this._container = null;
    this._video = null;
    this._handlers = null;
    this.options = null;
  }
}

/**
 * AudioPlayer 클래스 - 오디오 플레이어
 * @class AudioPlayer
 */
class AudioPlayer {
  /**
   * @constructor
   * @param {Object} options
   * @param {string|HTMLElement} options.container - 컨테이너
   * @param {string} options.src - 오디오 소스
   * @param {string} [options.title] - 제목
   * @param {string} [options.artist] - 아티스트
   * @param {string} [options.cover] - 커버 이미지
   * @param {boolean} [options.autoplay=false] - 자동 재생
   * @param {boolean} [options.loop=false] - 반복 재생
   * @param {string} [options.theme='default'] - 테마 (default, mini, full)
   * @param {Function} [options.onPlay] - 재생 콜백
   * @param {Function} [options.onPause] - 일시정지 콜백
   * @param {Function} [options.onEnded] - 종료 콜백
   * @param {Function} [options.onTimeUpdate] - 시간 업데이트 콜백
   */
  constructor(options = {}) {
    this.options = {
      container: null,
      src: '',
      title: '',
      artist: '',
      cover: '',
      autoplay: false,
      loop: false,
      theme: 'default',
      onPlay: null,
      onPause: null,
      onEnded: null,
      onTimeUpdate: null,
      ...options
    };

    this._container = typeof this.options.container === 'string'
      ? document.querySelector(this.options.container)
      : this.options.container;

    this._handlers = {};
    this._audio = null;
    this._isPlaying = false;

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
    this._container.className = `catui-audio-player is-${this.options.theme}`;

    const coverHtml = this.options.cover
      ? `<img class="catui-audio-cover" src="${this.options.cover}" alt="">`
      : `<div class="catui-audio-cover catui-audio-cover-default"><span class="material-icons">music_note</span></div>`;

    this._container.innerHTML = `
      <audio 
        class="catui-audio"
        src="${this.options.src}"
        ${this.options.autoplay ? 'autoplay' : ''}
        ${this.options.loop ? 'loop' : ''}
      ></audio>
      ${this.options.theme === 'full' ? `
        <div class="catui-audio-header">
          ${coverHtml}
          <div class="catui-audio-info">
            <div class="catui-audio-title">${this.options.title || '제목 없음'}</div>
            <div class="catui-audio-artist">${this.options.artist || '아티스트 미상'}</div>
          </div>
        </div>
      ` : ''}
      <div class="catui-audio-controls">
        ${this.options.theme !== 'mini' ? `
          <button class="catui-audio-btn" data-action="prev" type="button">
            <span class="material-icons">skip_previous</span>
          </button>
        ` : ''}
        <button class="catui-audio-btn catui-audio-btn-play" data-action="play" type="button">
          <span class="material-icons">play_arrow</span>
        </button>
        ${this.options.theme !== 'mini' ? `
          <button class="catui-audio-btn" data-action="next" type="button">
            <span class="material-icons">skip_next</span>
          </button>
        ` : ''}
      </div>
      <div class="catui-audio-progress">
        <span class="catui-audio-time catui-audio-current">0:00</span>
        <div class="catui-audio-progress-bar">
          <div class="catui-audio-progress-played"></div>
        </div>
        <span class="catui-audio-time catui-audio-duration">0:00</span>
      </div>
      ${this.options.theme === 'full' ? `
        <div class="catui-audio-volume">
          <span class="material-icons">volume_up</span>
          <input type="range" class="catui-audio-volume-slider" min="0" max="1" step="0.1" value="1">
        </div>
      ` : ''}
    `;

    this._audio = this._container.querySelector('.catui-audio');
  }

  /**
   * 이벤트 바인딩
   * @private
   */
  _bindEvents() {
    // 오디오 이벤트
    this._handlers.play = () => {
      this._isPlaying = true;
      this._updatePlayButton();
      if (this.options.onPlay) this.options.onPlay();
    };

    this._handlers.pause = () => {
      this._isPlaying = false;
      this._updatePlayButton();
      if (this.options.onPause) this.options.onPause();
    };

    this._handlers.ended = () => {
      this._isPlaying = false;
      this._updatePlayButton();
      if (this.options.onEnded) this.options.onEnded();
    };

    this._handlers.timeupdate = () => {
      this._updateProgress();
      if (this.options.onTimeUpdate) {
        this.options.onTimeUpdate(this._audio.currentTime, this._audio.duration);
      }
    };

    this._handlers.loadedmetadata = () => {
      const durationEl = this._container.querySelector('.catui-audio-duration');
      if (durationEl) durationEl.textContent = this._formatTime(this._audio.duration);
    };

    // 컨트롤 클릭
    this._handlers.controlClick = (e) => {
      const btn = e.target.closest('.catui-audio-btn');
      if (!btn) return;

      const action = btn.dataset.action;
      switch (action) {
        case 'play': this.togglePlay(); break;
        case 'prev': this.seek(0); break;
        case 'next': this._audio.currentTime = this._audio.duration; break;
      }
    };

    // 프로그레스 클릭
    this._handlers.progressClick = (e) => {
      const bar = this._container.querySelector('.catui-audio-progress-bar');
      const rect = bar.getBoundingClientRect();
      const percent = (e.clientX - rect.left) / rect.width;
      this._audio.currentTime = percent * this._audio.duration;
    };

    // 볼륨 변경
    this._handlers.volumeChange = (e) => {
      this._audio.volume = e.target.value;
    };

    // 이벤트 등록
    this._audio.addEventListener('play', this._handlers.play);
    this._audio.addEventListener('pause', this._handlers.pause);
    this._audio.addEventListener('ended', this._handlers.ended);
    this._audio.addEventListener('timeupdate', this._handlers.timeupdate);
    this._audio.addEventListener('loadedmetadata', this._handlers.loadedmetadata);
    this._container.querySelector('.catui-audio-controls')?.addEventListener('click', this._handlers.controlClick);
    this._container.querySelector('.catui-audio-progress-bar')?.addEventListener('click', this._handlers.progressClick);
    this._container.querySelector('.catui-audio-volume-slider')?.addEventListener('input', this._handlers.volumeChange);
  }

  /**
   * 재생 버튼 업데이트
   * @private
   */
  _updatePlayButton() {
    const btn = this._container.querySelector('[data-action="play"] .material-icons');
    if (btn) btn.textContent = this._isPlaying ? 'pause' : 'play_arrow';
  }

  /**
   * 진행률 업데이트
   * @private
   */
  _updateProgress() {
    const played = (this._audio.currentTime / this._audio.duration) * 100;
    const playedEl = this._container.querySelector('.catui-audio-progress-played');
    const currentEl = this._container.querySelector('.catui-audio-current');

    if (playedEl) playedEl.style.width = `${played}%`;
    if (currentEl) currentEl.textContent = this._formatTime(this._audio.currentTime);
  }

  /**
   * 시간 포맷
   * @private
   */
  _formatTime(seconds) {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * 재생/일시정지 토글
   */
  togglePlay() {
    if (this._audio.paused) {
      this._audio.play();
    } else {
      this._audio.pause();
    }
  }

  /**
   * 재생
   */
  play() {
    this._audio.play();
  }

  /**
   * 일시정지
   */
  pause() {
    this._audio.pause();
  }

  /**
   * 시간 이동
   * @param {number} time
   */
  seek(time) {
    this._audio.currentTime = time;
  }

  /**
   * 볼륨 설정
   * @param {number} volume (0-1)
   */
  setVolume(volume) {
    this._audio.volume = Math.max(0, Math.min(1, volume));
  }

  /**
   * 소스 변경
   * @param {string} src
   * @param {Object} [info] - 추가 정보
   */
  setSource(src, info = {}) {
    this._audio.src = src;
    if (info.title) {
      const titleEl = this._container.querySelector('.catui-audio-title');
      if (titleEl) titleEl.textContent = info.title;
    }
    if (info.artist) {
      const artistEl = this._container.querySelector('.catui-audio-artist');
      if (artistEl) artistEl.textContent = info.artist;
    }
    if (info.cover) {
      const coverEl = this._container.querySelector('.catui-audio-cover');
      if (coverEl && coverEl.tagName === 'IMG') coverEl.src = info.cover;
    }
  }

  /**
   * 정리
   */
  destroy() {
    // 이벤트 제거
    this._audio?.removeEventListener('play', this._handlers.play);
    this._audio?.removeEventListener('pause', this._handlers.pause);
    this._audio?.removeEventListener('ended', this._handlers.ended);
    this._audio?.removeEventListener('timeupdate', this._handlers.timeupdate);
    this._audio?.removeEventListener('loadedmetadata', this._handlers.loadedmetadata);
    this._container.querySelector('.catui-audio-controls')?.removeEventListener('click', this._handlers.controlClick);
    this._container.querySelector('.catui-audio-progress-bar')?.removeEventListener('click', this._handlers.progressClick);
    this._container.querySelector('.catui-audio-volume-slider')?.removeEventListener('input', this._handlers.volumeChange);

    // DOM 정리
    this._container.innerHTML = '';
    this._container.className = '';

    // 참조 해제
    this._container = null;
    this._audio = null;
    this._handlers = null;
    this.options = null;
  }
}

/**
 * MediaPreview 클래스 - 미디어 미리보기
 * @class MediaPreview
 */
class MediaPreview {
  /**
   * @constructor
   * @param {Object} options
   * @param {string|HTMLElement} options.container - 컨테이너
   * @param {Array} options.items - 미디어 아이템 배열 [{type, src, thumbnail?, title?}]
   * @param {string} [options.size='medium'] - 크기 (small, medium, large)
   * @param {number} [options.columns=3] - 컬럼 수
   * @param {boolean} [options.playable=true] - 재생 가능 표시
   * @param {boolean} [options.removable=false] - 삭제 가능
   * @param {Function} [options.onClick] - 클릭 콜백
   * @param {Function} [options.onRemove] - 삭제 콜백
   */
  constructor(options = {}) {
    this.options = {
      container: null,
      items: [],
      size: 'medium',
      columns: 3,
      playable: true,
      removable: false,
      onClick: null,
      onRemove: null,
      ...options
    };

    this._container = typeof this.options.container === 'string'
      ? document.querySelector(this.options.container)
      : this.options.container;

    this._handlers = {};
    this._items = [...this.options.items];

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
    this._container.className = `catui-media-preview is-${this.options.size}`;
    this._container.style.setProperty('--columns', this.options.columns);

    this._container.innerHTML = this._items.map((item, index) => this._renderItem(item, index)).join('');
  }

  /**
   * 아이템 렌더링
   * @private
   */
  _renderItem(item, index) {
    const isVideo = item.type === 'video';
    const isAudio = item.type === 'audio';
    const thumbnail = item.thumbnail || (isAudio ? '' : item.src);

    return `
      <div class="catui-media-item" data-index="${index}" data-type="${item.type || 'image'}">
        ${thumbnail 
          ? `<img class="catui-media-thumb" src="${thumbnail}" alt="${item.title || ''}">`
          : `<div class="catui-media-thumb catui-media-thumb-default"><span class="material-icons">${isAudio ? 'music_note' : 'image'}</span></div>`
        }
        ${this.options.playable && (isVideo || isAudio) ? `
          <div class="catui-media-play">
            <span class="material-icons">${isVideo ? 'play_arrow' : 'music_note'}</span>
          </div>
        ` : ''}
        ${this.options.removable ? `
          <button class="catui-media-remove" data-index="${index}" type="button">
            <span class="material-icons">close</span>
          </button>
        ` : ''}
        ${item.title ? `<div class="catui-media-title">${item.title}</div>` : ''}
      </div>
    `;
  }

  /**
   * 이벤트 바인딩
   * @private
   */
  _bindEvents() {
    this._unbindEvents();

    this._handlers.click = (e) => {
      const removeBtn = e.target.closest('.catui-media-remove');
      if (removeBtn) {
        const index = parseInt(removeBtn.dataset.index);
        this.remove(index);
        return;
      }

      const item = e.target.closest('.catui-media-item');
      if (item && this.options.onClick) {
        const index = parseInt(item.dataset.index);
        this.options.onClick(this._items[index], index);
      }
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
   * 아이템 추가
   * @param {Object} item
   */
  add(item) {
    this._items.push(item);
    this._render();
    this._bindEvents();
  }

  /**
   * 아이템 삭제
   * @param {number} index
   */
  remove(index) {
    if (index < 0 || index >= this._items.length) return;

    const removed = this._items.splice(index, 1)[0];
    this._render();
    this._bindEvents();

    if (this.options.onRemove) {
      this.options.onRemove(removed, index);
    }
  }

  /**
   * 아이템 설정
   * @param {Array} items
   */
  setItems(items) {
    this._items = [...items];
    this._render();
    this._bindEvents();
  }

  /**
   * 아이템 가져오기
   * @returns {Array}
   */
  getItems() {
    return [...this._items];
  }

  /**
   * 전체 삭제
   */
  clear() {
    this._items = [];
    this._render();
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

export { ImageCropper, VideoPlayer, AudioPlayer, MediaPreview };
export default { ImageCropper, VideoPlayer, AudioPlayer, MediaPreview };
