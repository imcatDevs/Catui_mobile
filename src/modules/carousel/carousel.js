/**
 * CATUI Mobile - Carousel Module
 * Slider, Lightbox 컴포넌트
 * @module carousel
 */

/**
 * Slider 클래스 - 이미지/콘텐츠 슬라이더
 * @class Slider
 */
class Slider {
  constructor(options = {}) {
    this.options = {
      container: null,
      slides: [],           // [{ image, title, description, link }] 또는 HTML 문자열 배열
      autoplay: false,
      autoplayDelay: 5000,
      loop: true,
      effect: 'slide',      // slide, fade, flip, cube, cards
      direction: 'horizontal', // horizontal, vertical
      slidesPerView: 1,
      spaceBetween: 0,
      speed: 300,
      showPagination: true,
      showNavigation: true,
      showScrollbar: false,
      lazy: true,           // 이미지 지연 로딩
      keyboard: true,
      touchEnabled: true,
      onChange: null,
      onInit: null,
      ...options
    };

    this._container = null;
    this._wrapper = null;
    this._slides = [];
    this._currentIndex = 0;
    this._autoplayInterval = null;
    this._isAnimating = false;
    this._touchStartX = 0;
    this._touchStartY = 0;
    this._handlers = {};

    this._init();
  }

  _init() {
    this._container = typeof this.options.container === 'string'
      ? document.querySelector(this.options.container)
      : this.options.container;

    if (!this._container) {
      console.error('[Slider] Container not found');
      return;
    }

    this._render();
    this._bindEvents();
    
    if (this.options.autoplay) {
      this._startAutoplay();
    }

    this.options.onInit?.();
  }

  _render() {
    this._container.className = 'catui-slider';
    this._container.setAttribute('data-effect', this.options.effect);
    this._container.setAttribute('data-direction', this.options.direction);

    let html = `<div class="catui-slider-wrapper">`;

    this.options.slides.forEach((slide, index) => {
      const isActive = index === 0 ? 'is-active' : '';
      if (typeof slide === 'string') {
        html += `<div class="catui-slider-slide ${isActive}">${slide}</div>`;
      } else {
        const imgSrc = this.options.lazy && index > 0 ? '' : slide.image;
        const dataSrc = this.options.lazy && index > 0 ? `data-src="${slide.image}"` : '';
        html += `
          <div class="catui-slider-slide ${isActive}" ${slide.link ? `data-link="${slide.link}"` : ''}>
            ${slide.image ? `<img class="catui-slider-image ${this.options.lazy && index > 0 ? 'is-lazy' : ''}" src="${imgSrc}" ${dataSrc} alt="${slide.title || ''}">` : ''}
            ${slide.title || slide.description ? `
              <div class="catui-slider-content">
                ${slide.title ? `<h3 class="catui-slider-title">${slide.title}</h3>` : ''}
                ${slide.description ? `<p class="catui-slider-description">${slide.description}</p>` : ''}
              </div>
            ` : ''}
          </div>
        `;
      }
    });

    html += `</div>`;

    // 페이지네이션
    if (this.options.showPagination) {
      html += `<div class="catui-slider-pagination">`;
      this.options.slides.forEach((_, index) => {
        html += `<span class="catui-slider-bullet ${index === 0 ? 'is-active' : ''}" data-index="${index}"></span>`;
      });
      html += `</div>`;
    }

    // 네비게이션
    if (this.options.showNavigation && this.options.slides.length > 1) {
      html += `
        <button class="catui-slider-nav catui-slider-prev" aria-label="Previous">
          <span class="material-icons">chevron_left</span>
        </button>
        <button class="catui-slider-nav catui-slider-next" aria-label="Next">
          <span class="material-icons">chevron_right</span>
        </button>
      `;
    }

    this._container.innerHTML = html;
    this._wrapper = this._container.querySelector('.catui-slider-wrapper');
    this._slides = this._container.querySelectorAll('.catui-slider-slide');
  }

  _bindEvents() {
    // 네비게이션
    const prevBtn = this._container.querySelector('.catui-slider-prev');
    const nextBtn = this._container.querySelector('.catui-slider-next');
    
    if (prevBtn) {
      this._handlers.prev = () => this.prev();
      prevBtn.addEventListener('click', this._handlers.prev);
    }
    if (nextBtn) {
      this._handlers.next = () => this.next();
      nextBtn.addEventListener('click', this._handlers.next);
    }

    // 페이지네이션
    const bullets = this._container.querySelectorAll('.catui-slider-bullet');
    bullets.forEach(bullet => {
      bullet.addEventListener('click', () => {
        this.goTo(parseInt(bullet.dataset.index, 10));
      });
    });

    // 터치 이벤트
    if (this.options.touchEnabled) {
      this._handlers.touchStart = (e) => this._onTouchStart(e);
      this._handlers.touchMove = (e) => this._onTouchMove(e);
      this._handlers.touchEnd = (e) => this._onTouchEnd(e);
      
      this._wrapper.addEventListener('touchstart', this._handlers.touchStart, { passive: true });
      this._wrapper.addEventListener('touchmove', this._handlers.touchMove, { passive: false });
      this._wrapper.addEventListener('touchend', this._handlers.touchEnd, { passive: true });
    }

    // 키보드
    if (this.options.keyboard) {
      this._handlers.keydown = (e) => {
        if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') this.prev();
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') this.next();
      };
      document.addEventListener('keydown', this._handlers.keydown);
    }

    // 자동재생 일시중지 (호버/포커스)
    if (this.options.autoplay) {
      this._handlers.mouseEnter = () => this._stopAutoplay();
      this._handlers.mouseLeave = () => this._startAutoplay();
      this._container.addEventListener('mouseenter', this._handlers.mouseEnter);
      this._container.addEventListener('mouseleave', this._handlers.mouseLeave);
    }

    // 슬라이드 클릭 (링크)
    this._slides.forEach(slide => {
      if (slide.dataset.link) {
        slide.style.cursor = 'pointer';
        slide.addEventListener('click', () => {
          window.location.href = slide.dataset.link;
        });
      }
    });
  }

  _onTouchStart(e) {
    this._touchStartX = e.touches[0].clientX;
    this._touchStartY = e.touches[0].clientY;
    this._stopAutoplay();
  }

  _onTouchMove(e) {
    if (!this._touchStartX) return;
    
    const diffX = this._touchStartX - e.touches[0].clientX;
    const diffY = this._touchStartY - e.touches[0].clientY;
    
    // 수평 스와이프가 더 큰 경우 스크롤 방지
    if (Math.abs(diffX) > Math.abs(diffY)) {
      e.preventDefault();
    }
  }

  _onTouchEnd(e) {
    const diffX = this._touchStartX - e.changedTouches[0].clientX;
    const threshold = 50;

    if (Math.abs(diffX) > threshold) {
      if (diffX > 0) {
        this.next();
      } else {
        this.prev();
      }
    }

    this._touchStartX = 0;
    this._touchStartY = 0;
    
    if (this.options.autoplay) {
      this._startAutoplay();
    }
  }

  _updateSlide() {
    const effect = this.options.effect;
    const speed = this.options.speed;

    this._slides.forEach((slide, index) => {
      slide.classList.remove('is-active', 'is-prev', 'is-next');
      
      if (index === this._currentIndex) {
        slide.classList.add('is-active');
        // 지연 로딩
        if (this.options.lazy) {
          const img = slide.querySelector('.catui-slider-image.is-lazy');
          if (img && img.dataset.src) {
            img.src = img.dataset.src;
            img.classList.remove('is-lazy');
          }
        }
      } else if (index === this._currentIndex - 1 || (this._currentIndex === 0 && index === this._slides.length - 1)) {
        slide.classList.add('is-prev');
      } else if (index === this._currentIndex + 1 || (this._currentIndex === this._slides.length - 1 && index === 0)) {
        slide.classList.add('is-next');
      }
    });

    // slide 효과
    if (effect === 'slide') {
      const offset = this.options.direction === 'horizontal' 
        ? `-${this._currentIndex * 100}%`
        : `-${this._currentIndex * 100}%`;
      
      this._wrapper.style.transition = `transform ${speed}ms ease`;
      this._wrapper.style.transform = this.options.direction === 'horizontal'
        ? `translateX(${offset})`
        : `translateY(${offset})`;
    }

    // 페이지네이션 업데이트
    const bullets = this._container.querySelectorAll('.catui-slider-bullet');
    bullets.forEach((bullet, index) => {
      bullet.classList.toggle('is-active', index === this._currentIndex);
    });

    // 인접 슬라이드 지연 로딩
    if (this.options.lazy) {
      const preloadIndices = [
        this._currentIndex - 1,
        this._currentIndex + 1
      ].filter(i => i >= 0 && i < this._slides.length);

      preloadIndices.forEach(i => {
        const img = this._slides[i].querySelector('.catui-slider-image.is-lazy');
        if (img && img.dataset.src) {
          img.src = img.dataset.src;
          img.classList.remove('is-lazy');
        }
      });
    }

    this.options.onChange?.(this._currentIndex);
  }

  _startAutoplay() {
    if (this._autoplayInterval) return;
    this._autoplayInterval = setInterval(() => {
      this.next();
    }, this.options.autoplayDelay);
  }

  _stopAutoplay() {
    if (this._autoplayInterval) {
      clearInterval(this._autoplayInterval);
      this._autoplayInterval = null;
    }
  }

  next() {
    if (this._isAnimating) return;
    
    if (this._currentIndex < this._slides.length - 1) {
      this._currentIndex++;
    } else if (this.options.loop) {
      this._currentIndex = 0;
    } else {
      return;
    }

    this._isAnimating = true;
    this._updateSlide();
    setTimeout(() => { this._isAnimating = false; }, this.options.speed);
  }

  prev() {
    if (this._isAnimating) return;
    
    if (this._currentIndex > 0) {
      this._currentIndex--;
    } else if (this.options.loop) {
      this._currentIndex = this._slides.length - 1;
    } else {
      return;
    }

    this._isAnimating = true;
    this._updateSlide();
    setTimeout(() => { this._isAnimating = false; }, this.options.speed);
  }

  goTo(index) {
    if (this._isAnimating || index === this._currentIndex) return;
    if (index < 0 || index >= this._slides.length) return;

    this._currentIndex = index;
    this._isAnimating = true;
    this._updateSlide();
    setTimeout(() => { this._isAnimating = false; }, this.options.speed);
  }

  getCurrentIndex() {
    return this._currentIndex;
  }

  destroy() {
    this._stopAutoplay();

    // 이벤트 리스너 제거
    if (this._handlers.keydown) {
      document.removeEventListener('keydown', this._handlers.keydown);
    }
    if (this._wrapper && this._handlers.touchStart) {
      this._wrapper.removeEventListener('touchstart', this._handlers.touchStart);
      this._wrapper.removeEventListener('touchmove', this._handlers.touchMove);
      this._wrapper.removeEventListener('touchend', this._handlers.touchEnd);
    }
    if (this._handlers.mouseEnter) {
      this._container.removeEventListener('mouseenter', this._handlers.mouseEnter);
      this._container.removeEventListener('mouseleave', this._handlers.mouseLeave);
    }

    this._container.innerHTML = '';
    this._container.className = '';
    this._container = null;
    this._wrapper = null;
    this._slides = null;
    this._handlers = null;
    this.options = null;
  }
}

/**
 * Lightbox 클래스 - 이미지 라이트박스/갤러리
 * @class Lightbox
 */
class Lightbox {
  static _instance = null;
  static _boundElements = new WeakMap();

  constructor(options = {}) {
    this.options = {
      images: [],           // [{ src, thumb, title, description }]
      startIndex: 0,
      loop: true,
      animation: 'fade',    // fade, zoom, slide, flip
      showThumbs: true,
      showCounter: true,
      showTitle: true,
      enableZoom: true,
      enableSwipe: true,
      closeOnOverlay: true,
      keyboardNav: true,
      onOpen: null,
      onClose: null,
      onChange: null,
      ...options
    };

    this._overlay = null;
    this._container = null;
    this._currentIndex = this.options.startIndex;
    this._isOpen = false;
    this._isZoomed = false;
    this._handlers = {};
  }

  _createElement() {
    // 오버레이
    this._overlay = document.createElement('div');
    this._overlay.className = 'catui-lightbox-overlay';
    this._overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.95);
      z-index: 3000;
      opacity: 0;
      transition: opacity 0.3s ease;
      display: flex;
      flex-direction: column;
    `;

    // 헤더
    const header = document.createElement('div');
    header.className = 'catui-lightbox-header';
    header.style.cssText = `
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px;
      color: #fff;
      flex-shrink: 0;
    `;

    let headerHTML = '';
    if (this.options.showCounter) {
      headerHTML += `<span class="catui-lightbox-counter">${this._currentIndex + 1} / ${this.options.images.length}</span>`;
    } else {
      headerHTML += '<span></span>';
    }
    headerHTML += `
      <div class="catui-lightbox-actions" style="display:flex;gap:8px;">
        ${this.options.enableZoom ? `<button class="catui-lightbox-btn catui-lightbox-zoom" style="display:flex;padding:8px;background:none;border:none;color:#fff;cursor:pointer;border-radius:50%;"><span class="material-icons">zoom_in</span></button>` : ''}
        <button class="catui-lightbox-btn catui-lightbox-close" style="display:flex;padding:8px;background:none;border:none;color:#fff;cursor:pointer;border-radius:50%;"><span class="material-icons">close</span></button>
      </div>
    `;
    header.innerHTML = headerHTML;
    this._overlay.appendChild(header);

    // 메인 컨테이너
    this._container = document.createElement('div');
    this._container.className = 'catui-lightbox-container';
    this._container.style.cssText = `
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      overflow: hidden;
    `;
    this._container.setAttribute('data-animation', this.options.animation);

    // 이미지 래퍼
    const wrapper = document.createElement('div');
    wrapper.className = 'catui-lightbox-wrapper';
    wrapper.style.cssText = `
      max-width: 90%;
      max-height: 80vh;
      position: relative;
    `;

    const img = document.createElement('img');
    img.className = 'catui-lightbox-image';
    img.style.cssText = `
      max-width: 100%;
      max-height: 80vh;
      object-fit: contain;
      opacity: 0;
      transform: scale(0.9);
      transition: opacity 0.3s ease, transform 0.3s ease;
    `;
    wrapper.appendChild(img);
    this._container.appendChild(wrapper);

    // 네비게이션
    if (this.options.images.length > 1) {
      const prevBtn = document.createElement('button');
      prevBtn.className = 'catui-lightbox-nav catui-lightbox-prev';
      prevBtn.innerHTML = '<span class="material-icons">chevron_left</span>';
      prevBtn.style.cssText = `
        position: absolute;
        left: 16px;
        top: 50%;
        transform: translateY(-50%);
        display: flex;
        padding: 12px;
        background: rgba(255,255,255,0.1);
        border: none;
        color: #fff;
        cursor: pointer;
        border-radius: 50%;
        transition: background 0.2s;
      `;

      const nextBtn = document.createElement('button');
      nextBtn.className = 'catui-lightbox-nav catui-lightbox-next';
      nextBtn.innerHTML = '<span class="material-icons">chevron_right</span>';
      nextBtn.style.cssText = prevBtn.style.cssText;
      nextBtn.style.left = 'auto';
      nextBtn.style.right = '16px';

      this._container.appendChild(prevBtn);
      this._container.appendChild(nextBtn);
    }

    this._overlay.appendChild(this._container);

    // 제목/설명
    if (this.options.showTitle) {
      const caption = document.createElement('div');
      caption.className = 'catui-lightbox-caption';
      caption.style.cssText = `
        padding: 16px;
        text-align: center;
        color: #fff;
        flex-shrink: 0;
      `;
      this._overlay.appendChild(caption);
    }

    // 썸네일
    if (this.options.showThumbs && this.options.images.length > 1) {
      const thumbs = document.createElement('div');
      thumbs.className = 'catui-lightbox-thumbs';
      thumbs.style.cssText = `
        display: flex;
        justify-content: center;
        gap: 8px;
        padding: 16px;
        overflow-x: auto;
        flex-shrink: 0;
      `;

      this.options.images.forEach((image, index) => {
        const thumb = document.createElement('div');
        thumb.className = `catui-lightbox-thumb ${index === this._currentIndex ? 'is-active' : ''}`;
        thumb.dataset.index = index;
        thumb.style.cssText = `
          width: 60px;
          height: 60px;
          border-radius: 8px;
          overflow: hidden;
          cursor: pointer;
          opacity: ${index === this._currentIndex ? '1' : '0.5'};
          transition: opacity 0.2s;
          flex-shrink: 0;
          border: 2px solid ${index === this._currentIndex ? '#fff' : 'transparent'};
        `;
        thumb.innerHTML = `<img src="${image.thumb || image.src}" style="width:100%;height:100%;object-fit:cover;">`;
        thumbs.appendChild(thumb);
      });

      this._overlay.appendChild(thumbs);
    }

    return this._overlay;
  }

  _bindEvents() {
    // 닫기 버튼
    this._handlers.close = () => this.close();
    this._overlay.querySelector('.catui-lightbox-close').addEventListener('click', this._handlers.close);

    // 오버레이 클릭
    if (this.options.closeOnOverlay) {
      this._handlers.overlayClick = (e) => {
        if (e.target === this._container || e.target.classList.contains('catui-lightbox-wrapper')) {
          this.close();
        }
      };
      this._container.addEventListener('click', this._handlers.overlayClick);
    }

    // 네비게이션
    const prevBtn = this._overlay.querySelector('.catui-lightbox-prev');
    const nextBtn = this._overlay.querySelector('.catui-lightbox-next');
    if (prevBtn) {
      this._handlers.prev = () => this.prev();
      prevBtn.addEventListener('click', this._handlers.prev);
    }
    if (nextBtn) {
      this._handlers.next = () => this.next();
      nextBtn.addEventListener('click', this._handlers.next);
    }

    // 썸네일 클릭
    const thumbs = this._overlay.querySelectorAll('.catui-lightbox-thumb');
    thumbs.forEach(thumb => {
      thumb.addEventListener('click', () => {
        this.goTo(parseInt(thumb.dataset.index, 10));
      });
    });

    // 줌
    const zoomBtn = this._overlay.querySelector('.catui-lightbox-zoom');
    if (zoomBtn) {
      this._handlers.zoom = () => this._toggleZoom();
      zoomBtn.addEventListener('click', this._handlers.zoom);
    }

    // 키보드
    if (this.options.keyboardNav) {
      this._handlers.keydown = (e) => {
        if (!this._isOpen) return;
        if (e.key === 'Escape') this.close();
        if (e.key === 'ArrowLeft') this.prev();
        if (e.key === 'ArrowRight') this.next();
      };
      document.addEventListener('keydown', this._handlers.keydown);
    }

    // 스와이프
    if (this.options.enableSwipe) {
      let startX = 0;
      this._handlers.touchStart = (e) => { startX = e.touches[0].clientX; };
      this._handlers.touchEnd = (e) => {
        const diff = startX - e.changedTouches[0].clientX;
        if (Math.abs(diff) > 50) {
          diff > 0 ? this.next() : this.prev();
        }
      };
      this._container.addEventListener('touchstart', this._handlers.touchStart, { passive: true });
      this._container.addEventListener('touchend', this._handlers.touchEnd, { passive: true });
    }
  }

  _updateImage() {
    const image = this.options.images[this._currentIndex];
    const img = this._overlay.querySelector('.catui-lightbox-image');
    const wrapper = this._overlay.querySelector('.catui-lightbox-wrapper');
    const animation = this.options.animation;

    // 애니메이션 시작
    if (animation === 'fade') {
      img.style.opacity = '0';
    } else if (animation === 'zoom') {
      img.style.opacity = '0';
      img.style.transform = 'scale(0.5)';
    } else if (animation === 'slide') {
      wrapper.style.opacity = '0';
      wrapper.style.transform = 'translateX(30px)';
    } else if (animation === 'flip') {
      wrapper.style.transform = 'rotateY(90deg)';
    }

    setTimeout(() => {
      img.src = image.src;
      img.onload = () => {
        // 애니메이션 완료
        if (animation === 'fade') {
          img.style.opacity = '1';
          img.style.transform = 'scale(1)';
        } else if (animation === 'zoom') {
          img.style.opacity = '1';
          img.style.transform = 'scale(1)';
        } else if (animation === 'slide') {
          wrapper.style.opacity = '1';
          wrapper.style.transform = 'translateX(0)';
        } else if (animation === 'flip') {
          wrapper.style.transform = 'rotateY(0)';
        }
      };
    }, 150);

    // 카운터 업데이트
    const counter = this._overlay.querySelector('.catui-lightbox-counter');
    if (counter) {
      counter.textContent = `${this._currentIndex + 1} / ${this.options.images.length}`;
    }

    // 캡션 업데이트
    const caption = this._overlay.querySelector('.catui-lightbox-caption');
    if (caption) {
      caption.innerHTML = `
        ${image.title ? `<div style="font-weight:600;margin-bottom:4px;">${image.title}</div>` : ''}
        ${image.description ? `<div style="font-size:14px;opacity:0.7;">${image.description}</div>` : ''}
      `;
    }

    // 썸네일 업데이트
    const thumbs = this._overlay.querySelectorAll('.catui-lightbox-thumb');
    thumbs.forEach((thumb, index) => {
      const isActive = index === this._currentIndex;
      thumb.classList.toggle('is-active', isActive);
      thumb.style.opacity = isActive ? '1' : '0.5';
      thumb.style.borderColor = isActive ? '#fff' : 'transparent';
    });

    this.options.onChange?.(this._currentIndex, image);
  }

  _toggleZoom() {
    const img = this._overlay.querySelector('.catui-lightbox-image');
    const zoomBtn = this._overlay.querySelector('.catui-lightbox-zoom .material-icons');
    
    this._isZoomed = !this._isZoomed;
    
    if (this._isZoomed) {
      img.style.maxWidth = 'none';
      img.style.maxHeight = 'none';
      img.style.cursor = 'zoom-out';
      if (zoomBtn) zoomBtn.textContent = 'zoom_out';
    } else {
      img.style.maxWidth = '100%';
      img.style.maxHeight = '80vh';
      img.style.cursor = 'zoom-in';
      if (zoomBtn) zoomBtn.textContent = 'zoom_in';
    }
  }

  open(startIndex = 0) {
    if (this._isOpen) return;

    this._currentIndex = startIndex;
    this._createElement();
    document.body.appendChild(this._overlay);
    document.body.style.overflow = 'hidden';

    this._bindEvents();

    requestAnimationFrame(() => {
      this._overlay.style.opacity = '1';
      this._updateImage();
    });

    this._isOpen = true;
    this.options.onOpen?.();
  }

  close() {
    if (!this._isOpen) return;

    this._overlay.style.opacity = '0';
    document.body.style.overflow = '';

    setTimeout(() => {
      // 이벤트 리스너 제거
      if (this._handlers.keydown) {
        document.removeEventListener('keydown', this._handlers.keydown);
      }
      if (this._handlers.touchStart) {
        this._container.removeEventListener('touchstart', this._handlers.touchStart);
        this._container.removeEventListener('touchend', this._handlers.touchEnd);
      }

      this._overlay?.remove();
      this._overlay = null;
      this._container = null;
      this._isOpen = false;
      this._isZoomed = false;
      this.options.onClose?.();
    }, 300);
  }

  next() {
    if (this._currentIndex < this.options.images.length - 1) {
      this._currentIndex++;
    } else if (this.options.loop) {
      this._currentIndex = 0;
    } else {
      return;
    }
    this._updateImage();
  }

  prev() {
    if (this._currentIndex > 0) {
      this._currentIndex--;
    } else if (this.options.loop) {
      this._currentIndex = this.options.images.length - 1;
    } else {
      return;
    }
    this._updateImage();
  }

  goTo(index) {
    if (index === this._currentIndex) return;
    if (index < 0 || index >= this.options.images.length) return;
    this._currentIndex = index;
    this._updateImage();
  }

  /**
   * 이미지 요소에 라이트박스 자동 바인딩
   * @param {string} selector - 선택자
   * @param {Object} options - 옵션
   */
  static init(selector = '[data-lightbox]', options = {}) {
    const elements = document.querySelectorAll(selector);
    const groups = {};

    // 그룹별로 이미지 수집
    elements.forEach(el => {
      const group = el.dataset.lightboxGroup || 'default';
      if (!groups[group]) groups[group] = [];
      
      groups[group].push({
        element: el,
        src: el.dataset.lightbox || el.src || el.href,
        thumb: el.dataset.lightboxThumb || el.src,
        title: el.dataset.lightboxTitle || el.title || el.alt,
        description: el.dataset.lightboxDesc
      });
    });

    // 각 요소에 클릭 이벤트 바인딩
    Object.keys(groups).forEach(group => {
      const images = groups[group];
      
      images.forEach((item, index) => {
        if (Lightbox._boundElements.has(item.element)) return;

        const handler = (e) => {
          e.preventDefault();
          const lightbox = new Lightbox({
            images: images.map(i => ({ src: i.src, thumb: i.thumb, title: i.title, description: i.description })),
            startIndex: index,
            ...options
          });
          lightbox.open(index);
        };

        item.element.addEventListener('click', handler);
        item.element.style.cursor = 'pointer';
        Lightbox._boundElements.set(item.element, handler);
      });
    });
  }

  /**
   * 바인딩 해제
   */
  static unbind(element) {
    const handler = Lightbox._boundElements.get(element);
    if (handler) {
      element.removeEventListener('click', handler);
      Lightbox._boundElements.delete(element);
    }
  }

  destroy() {
    this.close();
    this._handlers = null;
    this.options = null;
  }
}

export { Slider, Lightbox };
export default { Slider, Lightbox };
