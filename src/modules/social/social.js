/**
 * CATUI Mobile - Social Module
 * ChatUI, Comments, ShareButtons, Reactions
 * @module social
 */

/**
 * ChatUI 클래스 - 채팅 인터페이스
 * @class ChatUI
 */
class ChatUI {
  constructor(options = {}) {
    this.options = {
      container: null,
      messages: [],               // 초기 메시지 배열
      currentUser: { id: 'me', name: '나', avatar: '' },
      placeholder: '메시지를 입력하세요...',
      sendButtonText: '',
      showTimestamp: true,
      showAvatar: true,
      showTypingIndicator: true,
      maxHeight: '400px',
      onSend: null,               // (message) => Promise<void>
      onLoadMore: null,           // () => Promise<messages[]>
      dateFormat: 'HH:mm',
      ...options
    };

    this._container = null;
    this._messagesEl = null;
    this._inputEl = null;
    this._handlers = {};
    this._isLoading = false;
    this._typingTimeout = null;

    this._init();
  }

  _init() {
    this._container = typeof this.options.container === 'string'
      ? document.querySelector(this.options.container)
      : this.options.container;

    if (!this._container) {
      console.error('[ChatUI] Container not found');
      return;
    }

    this._render();
    this._bindEvents();
    this._scrollToBottom();
  }

  _render() {
    this._container.className = 'catui-chat';
    this._container.innerHTML = `
      <div class="catui-chat-messages" style="max-height: ${this.options.maxHeight}"></div>
      <div class="catui-chat-typing" style="display: none;">
        <span class="catui-chat-typing-dots">
          <span></span><span></span><span></span>
        </span>
        <span class="catui-chat-typing-text">입력 중...</span>
      </div>
      <div class="catui-chat-input">
        <input type="text" class="catui-chat-input-field" placeholder="${this.options.placeholder}">
        <button class="catui-chat-send-btn">
          ${this.options.sendButtonText || '<span class="material-icons">send</span>'}
        </button>
      </div>
    `;

    this._messagesEl = this._container.querySelector('.catui-chat-messages');
    this._inputEl = this._container.querySelector('.catui-chat-input-field');
    this._typingEl = this._container.querySelector('.catui-chat-typing');

    // 초기 메시지 렌더링
    this._renderMessages(this.options.messages);
  }

  _renderMessages(messages) {
    const html = messages.map(msg => this._renderMessage(msg)).join('');
    this._messagesEl.innerHTML = html;
  }

  _renderMessage(msg) {
    const isMe = msg.userId === this.options.currentUser.id;
    const time = this.options.showTimestamp ? this._formatTime(msg.timestamp) : '';
    const avatar = this.options.showAvatar && !isMe ?
      `<div class="catui-chat-avatar" style="background-image: url('${msg.avatar || ''}')">
        ${!msg.avatar ? msg.userName?.charAt(0) || '?' : ''}
      </div>` : '';

    return `
      <div class="catui-chat-message ${isMe ? 'catui-chat-message--me' : 'catui-chat-message--other'}" data-id="${msg.id}">
        ${avatar}
        <div class="catui-chat-bubble">
          ${!isMe ? `<div class="catui-chat-name">${msg.userName || ''}</div>` : ''}
          <div class="catui-chat-text">${this._escapeHtml(msg.text)}</div>
          ${time ? `<div class="catui-chat-time">${time}</div>` : ''}
        </div>
      </div>
    `;
  }

  _bindEvents() {
    // 전송 버튼
    this._handlers.sendClick = () => this._sendMessage();
    this._container.querySelector('.catui-chat-send-btn')
      .addEventListener('click', this._handlers.sendClick);

    // Enter 키
    this._handlers.keydown = (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this._sendMessage();
      }
    };
    this._inputEl.addEventListener('keydown', this._handlers.keydown);

    // 스크롤 (더 보기)
    if (this.options.onLoadMore) {
      this._handlers.scroll = () => {
        if (this._messagesEl.scrollTop === 0 && !this._isLoading) {
          this._loadMore();
        }
      };
      this._messagesEl.addEventListener('scroll', this._handlers.scroll, { passive: true });
    }
  }

  async _sendMessage() {
    const text = this._inputEl.value.trim();
    if (!text) return;

    const message = {
      id: Date.now().toString(),
      userId: this.options.currentUser.id,
      userName: this.options.currentUser.name,
      avatar: this.options.currentUser.avatar,
      text,
      timestamp: new Date()
    };

    this._inputEl.value = '';
    this.addMessage(message);

    if (this.options.onSend) {
      try {
        await this.options.onSend(message);
      } catch (error) {
        console.error('[ChatUI] Send failed:', error);
      }
    }
  }

  async _loadMore() {
    if (this._isLoading) return;
    this._isLoading = true;

    try {
      const messages = await this.options.onLoadMore?.();
      if (messages?.length) {
        const scrollHeight = this._messagesEl.scrollHeight;
        this.prependMessages(messages);
        // 스크롤 위치 유지
        this._messagesEl.scrollTop = this._messagesEl.scrollHeight - scrollHeight;
      }
    } catch (error) {
      console.error('[ChatUI] Load more failed:', error);
    } finally {
      this._isLoading = false;
    }
  }

  _formatTime(date) {
    if (!date) return '';
    const d = new Date(date);
    const hours = d.getHours().toString().padStart(2, '0');
    const mins = d.getMinutes().toString().padStart(2, '0');
    return `${hours}:${mins}`;
  }

  _escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  _scrollToBottom() {
    this._messagesEl.scrollTop = this._messagesEl.scrollHeight;
  }

  // Public API
  addMessage(message) {
    const html = this._renderMessage(message);
    this._messagesEl.insertAdjacentHTML('beforeend', html);
    this._scrollToBottom();
  }

  prependMessages(messages) {
    const html = messages.map(msg => this._renderMessage(msg)).join('');
    this._messagesEl.insertAdjacentHTML('afterbegin', html);
  }

  showTyping(show = true) {
    if (this._typingEl) {
      this._typingEl.style.display = show ? 'flex' : 'none';
      if (show) this._scrollToBottom();
    }
  }

  clear() {
    this._messagesEl.innerHTML = '';
  }

  focus() {
    this._inputEl?.focus();
  }

  destroy() {
    if (this._typingTimeout) clearTimeout(this._typingTimeout);

    this._container.querySelector('.catui-chat-send-btn')
      ?.removeEventListener('click', this._handlers.sendClick);
    this._inputEl?.removeEventListener('keydown', this._handlers.keydown);
    if (this._handlers.scroll) {
      this._messagesEl?.removeEventListener('scroll', this._handlers.scroll);
    }

    this._container.innerHTML = '';
    this._container = null;
    this._messagesEl = null;
    this._inputEl = null;
    this._typingEl = null;
    this._handlers = null;
    this.options = null;
  }
}

/**
 * Comments 클래스 - 댓글 시스템
 * @class Comments
 */
class Comments {
  constructor(options = {}) {
    this.options = {
      container: null,
      comments: [],               // 초기 댓글 배열
      currentUser: null,          // { id, name, avatar }
      allowReply: true,
      allowEdit: true,
      allowDelete: true,
      maxDepth: 3,                // 답글 최대 깊이
      placeholder: '댓글을 입력하세요...',
      emptyText: '첫 번째 댓글을 남겨보세요!',
      onSubmit: null,             // (comment, parentId?) => Promise
      onEdit: null,               // (commentId, newText) => Promise
      onDelete: null,             // (commentId) => Promise
      onLike: null,               // (commentId) => Promise
      ...options
    };

    this._container = null;
    this._handlers = {};
    this._editingId = null;
    this._replyingId = null;

    this._init();
  }

  _init() {
    this._container = typeof this.options.container === 'string'
      ? document.querySelector(this.options.container)
      : this.options.container;

    if (!this._container) {
      console.error('[Comments] Container not found');
      return;
    }

    this._render();
    this._bindEvents();
  }

  _render() {
    this._container.className = 'catui-comments';
    this._updateComments();
  }

  _updateComments() {
    const { comments, currentUser, emptyText } = this.options;

    let html = '';

    // 댓글 입력 폼
    if (currentUser) {
      html += `
        <div class="catui-comments-form">
          <div class="catui-comments-avatar" style="background-image: url('${currentUser.avatar || ''}')">
            ${!currentUser.avatar ? currentUser.name?.charAt(0) || '?' : ''}
          </div>
          <div class="catui-comments-input-wrap">
            <textarea class="catui-comments-input" placeholder="${this.options.placeholder}" rows="1"></textarea>
            <button class="catui-comments-submit btn btn-primary btn-sm">등록</button>
          </div>
        </div>
      `;
    }

    // 댓글 목록
    html += '<div class="catui-comments-list">';
    if (comments.length === 0) {
      html += `<div class="catui-comments-empty">${emptyText}</div>`;
    } else {
      html += this._renderComments(comments, 0);
    }
    html += '</div>';

    this._container.innerHTML = html;
  }

  _renderComments(comments, depth) {
    return comments.map(comment => this._renderComment(comment, depth)).join('');
  }

  _renderComment(comment, depth) {
    const { currentUser, allowReply, allowEdit, allowDelete, maxDepth } = this.options;
    const isOwner = currentUser?.id === comment.userId;
    const canReply = allowReply && depth < maxDepth;
    const time = this._formatDate(comment.createdAt);

    let actionsHtml = '';
    if (currentUser) {
      actionsHtml = `
        <div class="catui-comment-actions">
          <button class="catui-comment-action catui-comment-like ${comment.liked ? 'is-liked' : ''}" data-id="${comment.id}">
            <span class="material-icons">${comment.liked ? 'favorite' : 'favorite_border'}</span>
            ${comment.likes || ''}
          </button>
          ${canReply ? `<button class="catui-comment-action catui-comment-reply-btn" data-id="${comment.id}">답글</button>` : ''}
          ${isOwner && allowEdit ? `<button class="catui-comment-action catui-comment-edit-btn" data-id="${comment.id}">수정</button>` : ''}
          ${isOwner && allowDelete ? `<button class="catui-comment-action catui-comment-delete-btn" data-id="${comment.id}">삭제</button>` : ''}
        </div>
      `;
    }

    let repliesHtml = '';
    if (comment.replies?.length) {
      repliesHtml = `<div class="catui-comment-replies">${this._renderComments(comment.replies, depth + 1)}</div>`;
    }

    return `
      <div class="catui-comment" data-id="${comment.id}" data-depth="${depth}">
        <div class="catui-comment-avatar" style="background-image: url('${comment.avatar || ''}')">
          ${!comment.avatar ? comment.userName?.charAt(0) || '?' : ''}
        </div>
        <div class="catui-comment-content">
          <div class="catui-comment-header">
            <span class="catui-comment-name">${comment.userName || '익명'}</span>
            <span class="catui-comment-time">${time}</span>
          </div>
          <div class="catui-comment-text">${this._escapeHtml(comment.text)}</div>
          ${actionsHtml}
          ${repliesHtml}
        </div>
      </div>
    `;
  }

  _bindEvents() {
    this._handlers.click = async (e) => {
      const target = e.target.closest('button');
      if (!target) return;

      const id = target.dataset.id;

      if (target.classList.contains('catui-comments-submit')) {
        await this._handleSubmit();
      } else if (target.classList.contains('catui-comment-like')) {
        await this._handleLike(id);
      } else if (target.classList.contains('catui-comment-reply-btn')) {
        this._handleReply(id);
      } else if (target.classList.contains('catui-comment-edit-btn')) {
        this._handleEdit(id);
      } else if (target.classList.contains('catui-comment-delete-btn')) {
        await this._handleDelete(id);
      }
    };
    this._container.addEventListener('click', this._handlers.click);

    // Textarea 자동 높이 조절
    this._handlers.input = (e) => {
      if (e.target.classList.contains('catui-comments-input')) {
        e.target.style.height = 'auto';
        e.target.style.height = e.target.scrollHeight + 'px';
      }
    };
    this._container.addEventListener('input', this._handlers.input);
  }

  async _handleSubmit(parentId = null) {
    const input = this._container.querySelector('.catui-comments-input');
    const text = input?.value.trim();
    if (!text) return;

    const { currentUser, onSubmit } = this.options;
    const comment = {
      id: Date.now().toString(),
      userId: currentUser.id,
      userName: currentUser.name,
      avatar: currentUser.avatar,
      text,
      createdAt: new Date(),
      likes: 0,
      liked: false
    };

    input.value = '';
    input.style.height = 'auto';

    try {
      await onSubmit?.(comment, parentId);
      this.addComment(comment, parentId);
    } catch (error) {
      console.error('[Comments] Submit failed:', error);
    }
  }

  async _handleLike(id) {
    try {
      await this.options.onLike?.(id);
      // UI 업데이트는 외부에서 setComments로 처리
    } catch (error) {
      console.error('[Comments] Like failed:', error);
    }
  }

  _handleReply(id) {
    // 답글 입력 UI 표시 (간단 구현)
    const comment = this._container.querySelector(`.catui-comment[data-id="${id}"]`);
    if (!comment) return;

    // 기존 답글 폼 제거
    this._container.querySelectorAll('.catui-comment-reply-form').forEach(el => el.remove());

    const form = document.createElement('div');
    form.className = 'catui-comment-reply-form';
    form.innerHTML = `
      <textarea class="catui-comments-input" placeholder="답글을 입력하세요..." rows="1"></textarea>
      <div class="catui-comment-reply-actions">
        <button class="btn btn-sm btn-outline catui-reply-cancel">취소</button>
        <button class="btn btn-sm btn-primary catui-reply-submit" data-parent="${id}">등록</button>
      </div>
    `;
    comment.querySelector('.catui-comment-content').appendChild(form);
    form.querySelector('textarea').focus();
  }

  _handleEdit(id) {
    // 수정 기능 (간단 구현)
    const comment = this._container.querySelector(`.catui-comment[data-id="${id}"]`);
    const textEl = comment?.querySelector('.catui-comment-text');
    if (!textEl) return;

    const currentText = textEl.textContent;
    textEl.innerHTML = `
      <textarea class="catui-comment-edit-input">${currentText}</textarea>
      <div class="catui-comment-edit-actions">
        <button class="btn btn-sm btn-outline catui-edit-cancel">취소</button>
        <button class="btn btn-sm btn-primary catui-edit-save" data-id="${id}">저장</button>
      </div>
    `;
  }

  async _handleDelete(id) {
    if (!confirm('댓글을 삭제하시겠습니까?')) return;

    try {
      await this.options.onDelete?.(id);
      this.removeComment(id);
    } catch (error) {
      console.error('[Comments] Delete failed:', error);
    }
  }

  _formatDate(date) {
    if (!date) return '';
    const d = new Date(date);
    const now = new Date();
    const diff = now - d;

    if (diff < 60000) return '방금 전';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}분 전`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}시간 전`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}일 전`;
    return d.toLocaleDateString();
  }

  _escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Public API
  addComment(comment, parentId = null) {
    if (parentId) {
      const parent = this._findComment(this.options.comments, parentId);
      if (parent) {
        parent.replies = parent.replies || [];
        parent.replies.push(comment);
      }
    } else {
      this.options.comments.unshift(comment);
    }
    this._updateComments();
  }

  removeComment(id) {
    this._removeFromArray(this.options.comments, id);
    this._updateComments();
  }

  _findComment(comments, id) {
    for (const c of comments) {
      if (c.id === id) return c;
      if (c.replies) {
        const found = this._findComment(c.replies, id);
        if (found) return found;
      }
    }
    return null;
  }

  _removeFromArray(comments, id) {
    const idx = comments.findIndex(c => c.id === id);
    if (idx !== -1) {
      comments.splice(idx, 1);
      return true;
    }
    for (const c of comments) {
      if (c.replies && this._removeFromArray(c.replies, id)) return true;
    }
    return false;
  }

  setComments(comments) {
    this.options.comments = comments;
    this._updateComments();
  }

  getComments() {
    return this.options.comments;
  }

  destroy() {
    this._container?.removeEventListener('click', this._handlers.click);
    this._container?.removeEventListener('input', this._handlers.input);
    this._container.innerHTML = '';
    this._container = null;
    this._handlers = null;
    this.options = null;
  }
}

/**
 * ShareButtons 클래스 - 소셜 공유 버튼
 * @class ShareButtons
 */
class ShareButtons {
  constructor(options = {}) {
    this.options = {
      container: null,
      url: window.location.href,
      title: document.title,
      description: '',
      image: '',
      platforms: ['kakao', 'facebook', 'twitter', 'link'], // 기본 플랫폼
      layout: 'horizontal',     // horizontal, vertical, floating
      size: 'md',               // sm, md, lg
      showLabel: false,
      onShare: null,            // (platform) => void
      onCopy: null,             // () => void
      kakaoKey: null,           // 카카오 SDK 앱 키
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
      console.error('[ShareButtons] Container not found');
      return;
    }

    this._render();
    this._bindEvents();
  }

  _getPlatformConfig() {
    return {
      kakao: { icon: 'chat', label: '카카오톡', color: '#FEE500', textColor: '#000' },
      facebook: { icon: 'facebook', label: '페이스북', color: '#1877F2', textColor: '#fff' },
      twitter: { icon: 'tag', label: '트위터', color: '#1DA1F2', textColor: '#fff' },
      linkedin: { icon: 'work', label: '링크드인', color: '#0A66C2', textColor: '#fff' },
      whatsapp: { icon: 'phone', label: '왓츠앱', color: '#25D366', textColor: '#fff' },
      telegram: { icon: 'send', label: '텔레그램', color: '#0088CC', textColor: '#fff' },
      email: { icon: 'email', label: '이메일', color: '#EA4335', textColor: '#fff' },
      sms: { icon: 'sms', label: '문자', color: '#34B7F1', textColor: '#fff' },
      link: { icon: 'link', label: '링크복사', color: '#6B7280', textColor: '#fff' }
    };
  }

  _render() {
    const { platforms, layout, size, showLabel } = this.options;
    const configs = this._getPlatformConfig();

    this._container.className = `catui-share catui-share--${layout} catui-share--${size}`;

    const html = platforms.map(platform => {
      const config = configs[platform];
      if (!config) return '';

      return `
        <button class="catui-share-btn catui-share-btn--${platform} ${showLabel ? 'has-label' : ''}" 
                data-platform="${platform}"
                style="background: ${config.color}; color: ${config.textColor};"
                title="${config.label}">
          <span class="material-icons">${config.icon}</span>
          ${showLabel ? `<span class="catui-share-label">${config.label}</span>` : ''}
        </button>
      `;
    }).join('');

    this._container.innerHTML = html;
  }

  _bindEvents() {
    this._handlers.click = (e) => {
      const btn = e.target.closest('.catui-share-btn');
      if (!btn) return;

      const platform = btn.dataset.platform;
      this._share(platform);
    };
    this._container.addEventListener('click', this._handlers.click);
  }

  _share(platform) {
    const { url, title, description, onShare, onCopy } = this.options;
    const encodedUrl = encodeURIComponent(url);
    const encodedTitle = encodeURIComponent(title);
    const encodedDesc = encodeURIComponent(description);

    let shareUrl = '';

    switch (platform) {
      case 'kakao':
        this._shareKakao();
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
        break;
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`;
        break;
      case 'telegram':
        shareUrl = `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`;
        break;
      case 'email':
        shareUrl = `mailto:?subject=${encodedTitle}&body=${encodedDesc}%0A%0A${encodedUrl}`;
        break;
      case 'sms':
        shareUrl = `sms:?body=${encodedTitle}%20${encodedUrl}`;
        break;
      case 'link':
        this._copyLink();
        onCopy?.();
        onShare?.(platform);
        return;
    }

    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400');
    }
    onShare?.(platform);
  }

  _shareKakao() {
    const { url, title, description, image, kakaoKey } = this.options;

    if (typeof Kakao !== 'undefined' && kakaoKey) {
      if (!Kakao.isInitialized()) {
        Kakao.init(kakaoKey);
      }
      Kakao.Link.sendDefault({
        objectType: 'feed',
        content: {
          title,
          description,
          imageUrl: image,
          link: { mobileWebUrl: url, webUrl: url }
        },
        buttons: [{ title: '자세히 보기', link: { mobileWebUrl: url, webUrl: url } }]
      });
    } else {
      // Kakao SDK 없으면 웹 공유
      const shareUrl = `https://story.kakao.com/share?url=${encodeURIComponent(url)}`;
      window.open(shareUrl, '_blank', 'width=600,height=400');
    }
  }

  async _copyLink() {
    try {
      await navigator.clipboard.writeText(this.options.url);
      this._showToast('링크가 복사되었습니다');
    } catch (error) {
      // Fallback
      const input = document.createElement('input');
      input.value = this.options.url;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      this._showToast('링크가 복사되었습니다');
    }
  }

  _showToast(message) {
    // 간단한 토스트 (CATUI Toast 사용 가능하면 사용)
    const toast = document.createElement('div');
    toast.className = 'catui-share-toast';
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      bottom: 100px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0,0,0,0.8);
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      z-index: 9999;
      animation: fadeInUp 0.3s ease;
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
  }

  // Public API
  setUrl(url) {
    this.options.url = url;
  }

  setTitle(title) {
    this.options.title = title;
  }

  share(platform) {
    this._share(platform);
  }

  destroy() {
    this._container?.removeEventListener('click', this._handlers.click);
    this._container.innerHTML = '';
    this._container = null;
    this._handlers = null;
    this.options = null;
  }
}

/**
 * Reactions 클래스 - 이모지 리액션
 * @class Reactions
 */
class Reactions {
  constructor(options = {}) {
    this.options = {
      container: null,
      reactions: [
        { type: 'like', emoji: '👍', label: '좋아요' },
        { type: 'love', emoji: '❤️', label: '좋아요' },
        { type: 'haha', emoji: '😂', label: '웃겨요' },
        { type: 'wow', emoji: '😮', label: '놀라워요' },
        { type: 'sad', emoji: '😢', label: '슬퍼요' },
        { type: 'angry', emoji: '😠', label: '화나요' }
      ],
      counts: {},               // { like: 10, love: 5, ... }
      userReaction: null,       // 현재 사용자의 리액션
      style: 'popup',           // popup, inline, minimal
      showCounts: true,
      animated: true,
      onReact: null,            // (reactionType, prevType) => Promise
      ...options
    };

    this._container = null;
    this._handlers = {};
    this._popupVisible = false;
    this._holdTimer = null;

    this._init();
  }

  _init() {
    this._container = typeof this.options.container === 'string'
      ? document.querySelector(this.options.container)
      : this.options.container;

    if (!this._container) {
      console.error('[Reactions] Container not found');
      return;
    }

    this._render();
    this._bindEvents();
  }

  _render() {
    const { style } = this.options;

    this._container.className = `catui-reactions catui-reactions--${style}`;

    if (style === 'inline') {
      this._container.innerHTML = this._renderInline();
    } else if (style === 'minimal') {
      this._container.innerHTML = this._renderMinimal();
    } else {
      this._container.innerHTML = this._renderPopup();
    }
  }

  _renderPopup() {
    const { reactions, userReaction, showCounts, counts } = this.options;
    const currentReaction = reactions.find(r => r.type === userReaction);
    const totalCount = Object.values(counts).reduce((a, b) => a + b, 0);

    return `
      <div class="catui-reactions-trigger ${userReaction ? 'is-reacted' : ''}" data-type="${userReaction || 'like'}">
        <span class="catui-reactions-emoji">${currentReaction?.emoji || '👍'}</span>
        <span class="catui-reactions-label">${currentReaction?.label || '좋아요'}</span>
        ${showCounts && totalCount ? `<span class="catui-reactions-count">${totalCount}</span>` : ''}
      </div>
      <div class="catui-reactions-popup">
        ${reactions.map(r => `
          <button class="catui-reactions-item ${r.type === userReaction ? 'is-selected' : ''}" 
                  data-type="${r.type}" title="${r.label}">
            <span class="catui-reactions-item-emoji">${r.emoji}</span>
          </button>
        `).join('')}
      </div>
    `;
  }

  _renderInline() {
    const { reactions, userReaction, showCounts, counts } = this.options;

    return `
      <div class="catui-reactions-inline">
        ${reactions.map(r => `
          <button class="catui-reactions-item ${r.type === userReaction ? 'is-selected' : ''}" 
                  data-type="${r.type}" title="${r.label}">
            <span class="catui-reactions-item-emoji">${r.emoji}</span>
            ${showCounts && counts[r.type] ? `<span class="catui-reactions-item-count">${counts[r.type]}</span>` : ''}
          </button>
        `).join('')}
      </div>
    `;
  }

  _renderMinimal() {
    const { counts, userReaction } = this.options;
    const totalCount = Object.values(counts).reduce((a, b) => a + b, 0);

    // 상위 3개 이모지 표시
    const topReactions = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([type]) => this.options.reactions.find(r => r.type === type)?.emoji)
      .filter(Boolean);

    return `
      <button class="catui-reactions-minimal-btn ${userReaction ? 'is-reacted' : ''}">
        <span class="catui-reactions-emojis">${topReactions.join('') || '👍'}</span>
        ${totalCount ? `<span class="catui-reactions-count">${totalCount}</span>` : ''}
      </button>
    `;
  }

  _bindEvents() {
    const { style } = this.options;

    if (style === 'popup') {
      // 트리거 클릭 - 기본 좋아요
      this._handlers.triggerClick = () => {
        const current = this.options.userReaction;
        this._react(current ? null : 'like');
      };

      // 길게 누르기 - 팝업 표시
      this._handlers.triggerDown = (e) => {
        e.preventDefault();
        this._holdTimer = setTimeout(() => {
          this._showPopup(true);
        }, 500);
      };

      this._handlers.triggerUp = () => {
        if (this._holdTimer) {
          clearTimeout(this._holdTimer);
          this._holdTimer = null;
        }
      };

      const trigger = this._container.querySelector('.catui-reactions-trigger');
      trigger?.addEventListener('click', this._handlers.triggerClick);
      trigger?.addEventListener('mousedown', this._handlers.triggerDown);
      trigger?.addEventListener('touchstart', this._handlers.triggerDown, { passive: false });
      trigger?.addEventListener('mouseup', this._handlers.triggerUp);
      trigger?.addEventListener('touchend', this._handlers.triggerUp);
      trigger?.addEventListener('mouseleave', this._handlers.triggerUp);

      // 팝업 아이템 클릭
      this._handlers.popupClick = (e) => {
        const item = e.target.closest('.catui-reactions-item');
        if (item) {
          const type = item.dataset.type;
          this._react(type === this.options.userReaction ? null : type);
          this._showPopup(false);
        }
      };
      this._container.querySelector('.catui-reactions-popup')
        ?.addEventListener('click', this._handlers.popupClick);

      // 외부 클릭 시 팝업 닫기
      this._handlers.outsideClick = (e) => {
        if (!this._container.contains(e.target)) {
          this._showPopup(false);
        }
      };
      document.addEventListener('click', this._handlers.outsideClick);

    } else {
      // inline, minimal
      this._handlers.itemClick = (e) => {
        const item = e.target.closest('.catui-reactions-item, .catui-reactions-minimal-btn');
        if (item) {
          const type = item.dataset.type || 'like';
          this._react(type === this.options.userReaction ? null : type);
        }
      };
      this._container.addEventListener('click', this._handlers.itemClick);
    }
  }

  _showPopup(show) {
    const popup = this._container.querySelector('.catui-reactions-popup');
    if (popup) {
      popup.classList.toggle('is-visible', show);
      this._popupVisible = show;
    }
  }

  async _react(type) {
    const prevType = this.options.userReaction;

    // 카운트 업데이트
    if (prevType && this.options.counts[prevType]) {
      this.options.counts[prevType]--;
    }
    if (type) {
      this.options.counts[type] = (this.options.counts[type] || 0) + 1;
    }

    this.options.userReaction = type;
    this._render();
    this._bindEvents();

    try {
      await this.options.onReact?.(type, prevType);
    } catch (error) {
      console.error('[Reactions] React failed:', error);
      // 롤백
      if (prevType) this.options.counts[prevType]++;
      if (type && this.options.counts[type]) this.options.counts[type]--;
      this.options.userReaction = prevType;
      this._render();
      this._bindEvents();
    }
  }

  // Public API
  setReaction(type) {
    this.options.userReaction = type;
    this._render();
    this._bindEvents();
  }

  setCounts(counts) {
    this.options.counts = counts;
    this._render();
    this._bindEvents();
  }

  getReaction() {
    return this.options.userReaction;
  }

  getCounts() {
    return this.options.counts;
  }

  destroy() {
    if (this._holdTimer) clearTimeout(this._holdTimer);

    // document 레벨 이벤트 제거
    if (this._handlers.outsideClick) {
      document.removeEventListener('click', this._handlers.outsideClick);
    }

    const trigger = this._container?.querySelector('.catui-reactions-trigger');
    if (trigger) {
      trigger.removeEventListener('click', this._handlers.triggerClick);
      trigger.removeEventListener('mousedown', this._handlers.triggerDown);
      trigger.removeEventListener('touchstart', this._handlers.triggerDown);
      trigger.removeEventListener('mouseup', this._handlers.triggerUp);
      trigger.removeEventListener('touchend', this._handlers.triggerUp);
      trigger.removeEventListener('mouseleave', this._handlers.triggerUp);
    }

    this._container?.querySelector('.catui-reactions-popup')
      ?.removeEventListener('click', this._handlers.popupClick);

    if (this._handlers.itemClick) {
      this._container?.removeEventListener('click', this._handlers.itemClick);
    }

    this._container.innerHTML = '';
    this._container = null;
    this._handlers = null;
    this.options = null;
  }
}

export { ChatUI, Comments, ShareButtons, Reactions };
export default { ChatUI, Comments, ShareButtons, Reactions };
