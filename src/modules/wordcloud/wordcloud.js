/**
 * CATUI Mobile - Word Cloud Module
 * 워드 클라우드 시각화 컴포넌트 (Canvas 기반, 픽셀 충돌 검사)
 * @module wordcloud
 */

/**
 * WordCloud 클래스 - Canvas 기반 워드 클라우드
 * @class WordCloud
 */
class WordCloud {
  constructor(options = {}) {
    this.options = {
      container: null,
      words: [],                 // [{ text: '단어', weight: 10, color? }, ...]
      width: null,               // null = 컨테이너 너비
      height: 300,
      minFontSize: 12,
      maxFontSize: 60,
      fontFamily: '"Noto Sans KR", Arial, sans-serif',
      fontWeight: 'bold',
      colors: null,              // 색상 배열 (null이면 테마 사용)
      colorTheme: 'default',     // default, blue, rainbow, monochrome, warm, cool
      rotate: false,             // 회전 활성화
      rotateAngles: [0, 90],     // 회전 각도
      gridSize: 4,               // 충돌 검사 그리드 크기
      shrinkToFit: true,         // 배치 실패 시 크기 줄여서 재시도
      backgroundColor: null,     // 배경색 (null = 투명)
      mask: null,                // 마스크: 'heart', 'circle', 'star', 'cloud' 또는 SVG URL
      maskSize: 0.9,             // 마스크 크기 비율 (0.1 ~ 1.0)
      tooltip: true,
      onClick: null,
      onHover: null,
      ...options
    };

    this._container = null;
    this._canvas = null;
    this._ctx = null;
    this._placedWords = [];
    this._grid = null;
    this._maskData = null;
    this._tooltip = null;
    this._handlers = {};
    this._resizeTimer = null;

    this._init();
  }

  _init() {
    this._container = typeof this.options.container === 'string'
      ? document.querySelector(this.options.container)
      : this.options.container;

    if (!this._container) {
      console.error('[WordCloud] Container not found');
      return;
    }

    const { mask } = this.options;
    if (mask) {
      this._loadMask(mask, () => {
        this._render();
        this._bindEvents();
      });
    } else {
      this._render();
      this._bindEvents();
    }
  }

  // ==================== 마스크 로드 ====================
  
  _loadMask(mask, callback) {
    const containerWidth = this.options.width || this._container.clientWidth || 400;
    const containerHeight = this.options.height;
    const size = Math.min(containerWidth, containerHeight) * this.options.maskSize;

    // 내장 마스크
    if (mask === 'heart') {
      this._createHeartMask(size, callback);
    } else if (mask === 'circle') {
      this._createCircleMask(size, callback);
    } else if (mask === 'star') {
      this._createStarMask(size, callback);
    } else if (mask === 'cloud') {
      this._createCloudMask(size, callback);
    } else if (mask.endsWith('.svg') || mask.startsWith('data:image')) {
      this._loadSvgMask(mask, size, callback);
    } else {
      callback();
    }
  }

  _createHeartMask(size, callback) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = size;
    canvas.height = size;

    ctx.fillStyle = '#000';
    ctx.beginPath();

    const cx = size / 2;
    const cy = size / 2.2;
    const s = size / 100;

    ctx.moveTo(cx, cy + 30 * s);
    ctx.bezierCurveTo(cx, cy + 20 * s, cx - 25 * s, cy - 10 * s, cx - 25 * s, cy - 20 * s);
    ctx.bezierCurveTo(cx - 25 * s, cy - 35 * s, cx - 10 * s, cy - 40 * s, cx, cy - 30 * s);
    ctx.bezierCurveTo(cx + 10 * s, cy - 40 * s, cx + 25 * s, cy - 35 * s, cx + 25 * s, cy - 20 * s);
    ctx.bezierCurveTo(cx + 25 * s, cy - 10 * s, cx, cy + 20 * s, cx, cy + 30 * s);
    ctx.closePath();
    ctx.fill();

    this._extractMaskPixels(ctx, size, size, callback);
  }

  _createCircleMask(size, callback) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = size;
    canvas.height = size;

    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2 - 10, 0, Math.PI * 2);
    ctx.fill();

    this._extractMaskPixels(ctx, size, size, callback);
  }

  _createStarMask(size, callback) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = size;
    canvas.height = size;

    ctx.fillStyle = '#000';
    ctx.beginPath();

    const cx = size / 2;
    const cy = size / 2;
    const outerR = size / 2 - 20;
    const innerR = outerR * 0.4;
    const points = 5;

    for (let i = 0; i < points * 2; i++) {
      const r = i % 2 === 0 ? outerR : innerR;
      const angle = (i * Math.PI / points) - Math.PI / 2;
      const x = cx + r * Math.cos(angle);
      const y = cy + r * Math.sin(angle);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();

    this._extractMaskPixels(ctx, size, size, callback);
  }

  _createCloudMask(size, callback) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = size;
    canvas.height = size;

    ctx.fillStyle = '#000';
    ctx.beginPath();

    const cx = size / 2;
    const cy = size / 2;
    const s = size / 200;

    ctx.arc(cx - 40 * s, cy + 10 * s, 35 * s, 0, Math.PI * 2);
    ctx.arc(cx, cy - 20 * s, 50 * s, 0, Math.PI * 2);
    ctx.arc(cx + 50 * s, cy, 40 * s, 0, Math.PI * 2);
    ctx.arc(cx + 20 * s, cy + 20 * s, 35 * s, 0, Math.PI * 2);
    ctx.arc(cx - 20 * s, cy + 25 * s, 30 * s, 0, Math.PI * 2);
    ctx.fill();

    this._extractMaskPixels(ctx, size, size, callback);
  }

  _loadSvgMask(url, size, callback) {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = size;
      canvas.height = size;

      // SVG를 Canvas에 그리기
      const scale = Math.min(size / img.width, size / img.height) * 0.9;
      const x = (size - img.width * scale) / 2;
      const y = (size - img.height * scale) / 2;
      
      ctx.drawImage(img, x, y, img.width * scale, img.height * scale);

      // 알파 채널 기반으로 마스크 생성
      this._extractMaskPixels(ctx, size, size, callback);
    };

    img.onerror = () => {
      console.error('[WordCloud] Failed to load mask SVG');
      callback();
    };

    img.src = url;
  }

  _extractMaskPixels(ctx, width, height, callback) {
    const imageData = ctx.getImageData(0, 0, width, height);
    const pixels = [];

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4;
        if (imageData.data[i + 3] > 50) { // 알파 > 50
          pixels.push({ x, y });
        }
      }
    }

    this._maskData = { width, height, pixels };
    callback();
  }

  _getColorTheme(theme) {
    const themes = {
      default: ['#3B82F6', '#22C55E', '#EAB308', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316'],
      blue: ['#1E40AF', '#1D4ED8', '#2563EB', '#3B82F6', '#60A5FA', '#93C5FD'],
      rainbow: ['#EF4444', '#F97316', '#EAB308', '#22C55E', '#06B6D4', '#3B82F6', '#8B5CF6'],
      monochrome: ['#111827', '#374151', '#4B5563', '#6B7280', '#9CA3AF'],
      warm: ['#EF4444', '#F97316', '#EAB308', '#F59E0B', '#D97706'],
      cool: ['#06B6D4', '#0EA5E9', '#3B82F6', '#6366F1', '#8B5CF6']
    };
    return themes[theme] || themes.default;
  }

  _render() {
    const { words, width, height, backgroundColor } = this.options;

    this._container.className = 'catui-wordcloud';
    this._container.innerHTML = '';

    const containerWidth = width || this._container.clientWidth || 400;
    const containerHeight = height;

    this._container.style.cssText = `
      position: relative;
      width: ${containerWidth}px;
      height: ${containerHeight}px;
      overflow: hidden;
    `;

    if (!words || words.length === 0) {
      this._container.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--text-tertiary);">단어 데이터가 없습니다</div>';
      return;
    }

    // Canvas 생성
    this._canvas = document.createElement('canvas');
    this._canvas.width = containerWidth;
    this._canvas.height = containerHeight;
    this._canvas.style.cssText = 'display:block;width:100%;height:100%;';
    this._container.appendChild(this._canvas);
    this._ctx = this._canvas.getContext('2d');

    // 배경
    if (backgroundColor) {
      this._ctx.fillStyle = backgroundColor;
      this._ctx.fillRect(0, 0, containerWidth, containerHeight);
    }

    // 단어 배치
    this._placeWords(containerWidth, containerHeight);

    // 툴팁 생성
    if (this.options.tooltip) {
      this._createTooltip();
    }
  }

  _placeWords(width, height) {
    const { words, gridSize, minFontSize, maxFontSize } = this.options;

    // 그리드 초기화
    const ngx = Math.ceil(width / gridSize);
    const ngy = Math.ceil(height / gridSize);

    // 마스크가 있으면 마스크 영역만 true, 없으면 전체 true
    if (this._maskData) {
      this._grid = this._createGrid(ngx, ngy, false);
      this._applyMaskToGrid(width, height, ngx, ngy, gridSize);
    } else {
      this._grid = this._createGrid(ngx, ngy, true);
    }

    // 가중치 범위
    const weights = words.map(w => w.weight || 1);
    const minW = Math.min(...weights);
    const maxW = Math.max(...weights);

    // 정렬 (큰 것부터)
    const sorted = [...words].sort((a, b) => (b.weight || 1) - (a.weight || 1));

    // 중심
    const center = [ngx / 2, ngy / 2];
    const maxRadius = Math.max(ngx, ngy);

    // 반지름별 포인트 캐시
    const pointsCache = [];
    const getPoints = (r) => {
      if (pointsCache[r]) return pointsCache[r];
      
      const pts = [];
      if (r === 0) {
        pts.push([center[0], center[1]]);
      } else {
        const T = r * 8;
        for (let t = 0; t < T; t++) {
          const angle = (t / T) * 2 * Math.PI;
          pts.push([
            center[0] + r * Math.cos(angle),
            center[1] + r * Math.sin(angle)
          ]);
        }
      }
      pointsCache[r] = pts;
      return pts;
    };

    this._placedWords = [];
    const colors = this.options.colors || this._getColorTheme(this.options.colorTheme);

    sorted.forEach((word, index) => {
      const fontSize = this._calcFontSize(word.weight || 1, minW, maxW, minFontSize, maxFontSize);
      const color = word.color || colors[index % colors.length];
      this._tryPlaceWord(word, fontSize, color, gridSize, ngx, ngy, maxRadius, getPoints, width, height);
    });
  }

  _applyMaskToGrid(canvasW, canvasH, ngx, ngy, gridSize) {
    const { width: maskW, height: maskH, pixels } = this._maskData;

    // 마스크를 캔버스에 맞게 스케일 및 중앙 배치
    const scaleX = canvasW / maskW;
    const scaleY = canvasH / maskH;
    const scale = Math.min(scaleX, scaleY);

    const offsetX = (canvasW - maskW * scale) / 2;
    const offsetY = (canvasH - maskH * scale) / 2;

    // 마스크 픽셀 영역을 그리드에 적용
    for (const p of pixels) {
      const sx = Math.floor(p.x * scale + offsetX);
      const sy = Math.floor(p.y * scale + offsetY);
      const gx = Math.floor(sx / gridSize);
      const gy = Math.floor(sy / gridSize);

      if (gx >= 0 && gx < ngx && gy >= 0 && gy < ngy) {
        this._grid[gx][gy] = true;
      }
    }
  }

  _createGrid(ngx, ngy, defaultValue) {
    const grid = [];
    for (let i = 0; i < ngx; i++) {
      grid[i] = [];
      for (let j = 0; j < ngy; j++) {
        grid[i][j] = defaultValue;
      }
    }
    return grid;
  }

  _calcFontSize(weight, minW, maxW, minFontSize, maxFontSize) {
    const factor = maxFontSize / maxW;
    let size = weight * factor;
    if (size < minFontSize) size = minFontSize;
    return Math.floor(size);
  }

  _tryPlaceWord(word, fontSize, color, g, ngx, ngy, maxRadius, getPoints, canvasW, canvasH) {
    const { rotate, rotateAngles, shrinkToFit, minFontSize, fontFamily, fontWeight } = this.options;

    // 회전 각도
    let rotation = 0;
    if (rotate && rotateAngles.length > 0) {
      rotation = rotateAngles[Math.floor(Math.random() * rotateAngles.length)];
    }

    // 텍스트 정보 추출
    const info = this._getTextInfo(word.text, fontSize, rotation, fontFamily, fontWeight, g);
    if (!info) return false;

    // 중심에서 바깥으로 확장하며 배치
    for (let r = 0; r <= maxRadius; r++) {
      const points = getPoints(r);

      for (const pt of points) {
        const gx = Math.floor(pt[0] - info.gw / 2);
        const gy = Math.floor(pt[1] - info.gh / 2);

        if (this._canFit(gx, gy, info.occupied, ngx, ngy)) {
          // 그리드에 표시
          this._markGrid(gx, gy, info.occupied);

          // Canvas에 그리기
          const drawX = (gx + info.gw / 2) * g;
          const drawY = (gy + info.gh / 2) * g;

          this._drawWord(word.text, drawX, drawY, fontSize, color, rotation);

          // 배치 정보 저장
          this._placedWords.push({
            text: word.text,
            weight: word.weight,
            x: drawX - info.width / 2,
            y: drawY - info.height / 2,
            width: info.width,
            height: info.height,
            centerX: drawX,
            centerY: drawY,
            fontSize,
            color,
            rotation
          });

          return true;
        }
      }
    }

    // shrinkToFit: 크기 줄여서 재시도
    if (shrinkToFit && fontSize > minFontSize) {
      const nextSize = Math.max(Math.floor(fontSize * 0.8), minFontSize);
      return this._tryPlaceWord(word, nextSize, color, g, ngx, ngy, maxRadius, getPoints, canvasW, canvasH);
    }

    return false;
  }

  _getTextInfo(text, fontSize, rotation, fontFamily, fontWeight, g) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
    const metrics = ctx.measureText(text);
    const textW = metrics.width;
    const textH = fontSize * 1.2;

    // 회전 고려한 크기
    const rad = rotation * Math.PI / 180;
    const cos = Math.abs(Math.cos(rad));
    const sin = Math.abs(Math.sin(rad));
    const width = Math.ceil(textW * cos + textH * sin) + 10;
    const height = Math.ceil(textW * sin + textH * cos) + 10;

    canvas.width = width;
    canvas.height = height;

    ctx.translate(width / 2, height / 2);
    ctx.rotate(rad);
    ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
    ctx.fillStyle = '#000';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    ctx.fillText(text, 0, 0);

    // 픽셀 데이터 추출
    const imageData = ctx.getImageData(0, 0, width, height).data;
    const gw = Math.ceil(width / g);
    const gh = Math.ceil(height / g);
    const occupied = [];

    for (let gx = 0; gx < gw; gx++) {
      for (let gy = 0; gy < gh; gy++) {
        let hasPixel = false;

        for (let x = 0; x < g && !hasPixel; x++) {
          for (let y = 0; y < g && !hasPixel; y++) {
            const px = gx * g + x;
            const py = gy * g + y;
            if (px < width && py < height) {
              const idx = (py * width + px) * 4 + 3;
              if (imageData[idx] > 0) hasPixel = true;
            }
          }
        }

        if (hasPixel) {
          occupied.push([gx, gy]);
        }
      }
    }

    return { occupied, gw, gh, width, height };
  }

  _canFit(gx, gy, occupied, ngx, ngy) {
    for (const [ox, oy] of occupied) {
      const px = gx + ox;
      const py = gy + oy;

      if (px < 0 || py < 0 || px >= ngx || py >= ngy) return false;
      if (!this._grid[px][py]) return false;
    }
    return true;
  }

  _markGrid(gx, gy, occupied) {
    for (const [ox, oy] of occupied) {
      this._grid[gx + ox][gy + oy] = false;
    }
  }

  _drawWord(text, x, y, fontSize, color, rotation) {
    const { fontFamily, fontWeight } = this.options;
    const ctx = this._ctx;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation * Math.PI / 180);
    ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
    ctx.fillStyle = color;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    ctx.fillText(text, 0, 0);
    ctx.restore();
  }

  _createTooltip() {
    this._tooltip = document.createElement('div');
    this._tooltip.className = 'catui-wordcloud-tooltip';
    this._tooltip.style.cssText = `
      position: fixed;
      padding: 8px 12px;
      background: var(--bg-primary, #fff);
      border: 1px solid var(--border-color, #e5e7eb);
      border-radius: 6px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      font-size: 13px;
      color: var(--text-primary, #1f2937);
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.2s;
      z-index: 1000;
    `;
    document.body.appendChild(this._tooltip);
  }

  _bindEvents() {
    if (!this._canvas) return;

    this._handlers.click = (e) => {
      const word = this._getWordAt(e);
      if (word && this.options.onClick) {
        this.options.onClick(word, e);
      }
    };

    this._handlers.mousemove = (e) => {
      const word = this._getWordAt(e);

      if (word) {
        this._canvas.style.cursor = 'pointer';

        if (this._tooltip) {
          this._tooltip.innerHTML = `<strong>${word.text}</strong><span style="color:var(--text-secondary);margin-left:8px;">가중치: ${word.weight}</span>`;
          this._tooltip.style.opacity = '1';
          this._tooltip.style.left = `${e.clientX + 10}px`;
          this._tooltip.style.top = `${e.clientY + 10}px`;
        }

        if (this.options.onHover) {
          this.options.onHover(word, e);
        }
      } else {
        this._canvas.style.cursor = 'default';
        if (this._tooltip) this._tooltip.style.opacity = '0';
      }
    };

    this._handlers.mouseleave = () => {
      if (this._tooltip) this._tooltip.style.opacity = '0';
    };

    this._canvas.addEventListener('click', this._handlers.click);
    this._canvas.addEventListener('mousemove', this._handlers.mousemove);
    this._canvas.addEventListener('mouseleave', this._handlers.mouseleave);

    // 리사이즈
    this._handlers.resize = () => {
      if (this._resizeTimer) clearTimeout(this._resizeTimer);
      this._resizeTimer = setTimeout(() => this.refresh(), 200);
    };
    window.addEventListener('resize', this._handlers.resize);
  }

  _getWordAt(e) {
    const rect = this._canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    for (const word of this._placedWords) {
      if (x >= word.x && x <= word.x + word.width &&
          y >= word.y && y <= word.y + word.height) {
        return word;
      }
    }
    return null;
  }

  // Public API
  setWords(words) {
    this.options.words = words;
    this._render();
  }

  refresh() {
    this._render();
  }

  setColorTheme(theme) {
    this.options.colorTheme = theme;
    this._render();
  }

  getWords() {
    return this._placedWords;
  }

  toDataURL(type = 'image/png') {
    return this._canvas ? this._canvas.toDataURL(type) : '';
  }

  download(filename = 'wordcloud.png') {
    const dataUrl = this.toDataURL();
    if (!dataUrl) return;

    const link = document.createElement('a');
    link.download = filename;
    link.href = dataUrl;
    link.click();
  }

  destroy() {
    if (this._resizeTimer) clearTimeout(this._resizeTimer);

    if (this._canvas) {
      this._canvas.removeEventListener('click', this._handlers.click);
      this._canvas.removeEventListener('mousemove', this._handlers.mousemove);
      this._canvas.removeEventListener('mouseleave', this._handlers.mouseleave);
    }
    window.removeEventListener('resize', this._handlers.resize);

    if (this._tooltip && this._tooltip.parentNode) {
      this._tooltip.parentNode.removeChild(this._tooltip);
    }

    this._container.innerHTML = '';
    this._container = null;
    this._canvas = null;
    this._ctx = null;
    this._grid = null;
    this._maskData = null;
    this._placedWords = null;
    this._handlers = null;
    this.options = null;
  }
}

/**
 * TagCloud 클래스 - 태그 클라우드 (심플 버전)
 * @class TagCloud
 */
class TagCloud {
  constructor(options = {}) {
    this.options = {
      container: null,
      tags: [],                  // [{ text: '태그', count: 10, href: '#' }, ...]
      minSize: 'sm',             // xs, sm, md, lg
      maxSize: 'xl',             // sm, md, lg, xl, 2xl
      showCount: false,
      sortBy: 'weight',          // weight, alpha, random
      layout: 'inline',          // inline, grid
      colorful: true,
      onClick: null,
      ...options
    };

    this._container = null;
    this._handlers = {};

    this._init();
  }

  _init() {
    this._container = typeof this.options.container === 'string'
      ? document.querySelector(this.options.container)
      : this.options.container;

    if (!this._container) {
      console.error('[TagCloud] Container not found');
      return;
    }

    this._render();
    this._bindEvents();
  }

  _render() {
    const { tags, minSize, maxSize, showCount, sortBy, layout, colorful } = this.options;
    if (!tags.length) return;

    this._container.className = `catui-tagcloud catui-tagcloud--${layout}`;

    // 정렬
    let sortedTags = [...tags];
    if (sortBy === 'alpha') {
      sortedTags.sort((a, b) => a.text.localeCompare(b.text));
    } else if (sortBy === 'random') {
      sortedTags.sort(() => Math.random() - 0.5);
    } else {
      sortedTags.sort((a, b) => (b.count || 0) - (a.count || 0));
    }

    // 크기 계산
    const counts = tags.map(t => t.count || 1);
    const minCount = Math.min(...counts);
    const maxCount = Math.max(...counts);
    const countRange = maxCount - minCount || 1;

    const sizes = ['xs', 'sm', 'md', 'lg', 'xl', '2xl'];
    const minSizeIndex = sizes.indexOf(minSize);
    const maxSizeIndex = sizes.indexOf(maxSize);
    const sizeRange = maxSizeIndex - minSizeIndex;

    const colors = ['primary', 'success', 'warning', 'error', 'purple', 'cyan', 'pink', 'orange'];

    const html = sortedTags.map((tag, index) => {
      const normalizedCount = (tag.count - minCount) / countRange;
      const sizeIndex = Math.round(minSizeIndex + normalizedCount * sizeRange);
      const size = sizes[sizeIndex];
      const color = colorful ? colors[index % colors.length] : 'default';

      return `
        <a class="catui-tag catui-tag--${size} catui-tag--${color}" 
           href="${tag.href || '#'}" 
           data-index="${index}">
          ${tag.text}
          ${showCount ? `<span class="catui-tag-count">${tag.count || 0}</span>` : ''}
        </a>
      `;
    }).join('');

    this._container.innerHTML = html;
  }

  _bindEvents() {
    this._handlers.click = (e) => {
      const tagEl = e.target.closest('.catui-tag');
      if (tagEl && this.options.onClick) {
        e.preventDefault();
        const index = parseInt(tagEl.dataset.index, 10);
        this.options.onClick(this.options.tags[index], e);
      }
    };
    this._container.addEventListener('click', this._handlers.click);
  }

  // Public API
  setTags(tags) {
    this.options.tags = tags;
    this._render();
  }

  addTag(tag) {
    this.options.tags.push(tag);
    this._render();
  }

  removeTag(text) {
    this.options.tags = this.options.tags.filter(t => t.text !== text);
    this._render();
  }

  destroy() {
    this._container?.removeEventListener('click', this._handlers.click);
    this._container.innerHTML = '';
    this._container = null;
    this._handlers = null;
    this.options = null;
  }
}

export { WordCloud, TagCloud };
export default { WordCloud, TagCloud };
