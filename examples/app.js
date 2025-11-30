/**
 * CATUI Mobile Examples - SPA Application
 */

CATUI.ready(async () => {
  console.log('[App] CATUI Mobile v' + CATUI.version);
  
  // ========================================
  // iOS 엣지 스와이프 뒤로가기 방지 (touch.html 방식 적용)
  // ========================================
  const preventEdgeSwipe = () => {
    // 엣지 가드 요소에 CATUI.touch 적용
    const leftGuard = document.querySelector('.edge-swipe-guard--left');
    const rightGuard = document.querySelector('.edge-swipe-guard--right');
    
    if (leftGuard) {
      CATUI(leftGuard).css({ touchAction: 'none', overscrollBehavior: 'none' });
      CATUI.touch(leftGuard, { preventScroll: true });
    }
    if (rightGuard) {
      CATUI(rightGuard).css({ touchAction: 'none', overscrollBehavior: 'none' });
      CATUI.touch(rightGuard, { preventScroll: true });
    }
    
    // 전체 문서에서 엣지 스와이프 감지
    let startX = 0;
    const edgeThreshold = 30;
    
    document.addEventListener('touchstart', (e) => {
      startX = e.touches[0].clientX;
    }, { passive: true });
    
    document.addEventListener('touchmove', (e) => {
      const screenWidth = window.innerWidth;
      // 왼쪽 또는 오른쪽 엣지에서 시작한 경우
      if (startX < edgeThreshold || startX > screenWidth - edgeThreshold) {
        e.preventDefault();
      }
    }, { passive: false });
    
    // History API로 뒤로가기 방지 (SPA 백업)
    history.pushState(null, '', location.href);
    window.addEventListener('popstate', () => {
      history.pushState(null, '', location.href);
    });
  };
  
  preventEdgeSwipe();
  
  // ========================================
  // 네비게이션 메뉴 데이터
  // ========================================
  const menuItems = [
    { icon: 'home', label: '홈', nav: 'home' },
    { icon: 'widgets', label: '컴포넌트', nav: 'components', outlined: true },
    { icon: 'dashboard', label: '레이아웃', nav: 'layout', outlined: true },
    { icon: 'edit_note', label: '폼', nav: 'forms-demo', outlined: true },
    { icon: 'analytics', label: '데이터', nav: 'data', outlined: true },
    { icon: 'image', label: '미디어', nav: 'media', outlined: true },
    { icon: 'layers', label: '오버레이', nav: 'overlays', outlined: true },
    { icon: 'explore', label: '네비게이션', nav: 'navigation-demo', outlined: true },
    { icon: 'date_range', label: '선택기', nav: 'pickers', outlined: true },
    { icon: 'tune', label: '셀렉터', nav: 'selectors-demo', outlined: true },
    { icon: 'notifications', label: '피드백', nav: 'feedback-demo', outlined: true },
    { icon: 'view_carousel', label: '캐러셀', nav: 'carousel-demo', outlined: true },
    { icon: 'format_list_numbered', label: '페이지네이션', nav: 'pagination-demo', outlined: true },
    { icon: 'swap_vert', label: '스크롤', nav: 'scroll-demo', outlined: true },
    { icon: 'forum', label: '소셜', nav: 'social-demo', outlined: true },
    { icon: 'grid_view', label: '그리드', nav: 'grid-menu-demo', outlined: true },
    { icon: 'cloud', label: '워드클라우드', nav: 'wordcloud-demo', outlined: true },
    { icon: 'swipe', label: '리스트', nav: 'list-demo', outlined: true },
    { icon: 'lock', label: '인증', nav: 'auth-demo', outlined: true },
    { icon: 'search', label: '검색', nav: 'search-demo', outlined: true },
    { icon: 'phone_iphone', label: '모바일', nav: 'mobile', outlined: true },
    { icon: 'touch_app', label: '터치', nav: 'touch', outlined: true },
    { icon: 'more_horiz', label: '더보기', nav: 'more', outlined: true }
  ];
  
  // ========================================
  // 하단 네비게이션 렌더링
  // ========================================
  const renderBottomNav = () => {
    const navHtml = menuItems.map((item, index) => `
      <a class="nav-item${index === 0 ? ' active' : ''}" catui-href="views/${item.nav}.html" data-nav="${item.nav}">
        <span class="material-icons${item.outlined ? '-outlined' : ''}">${item.icon}</span>
        <span>${item.label}</span>
      </a>
    `).join('');
    CATUI('.app-nav').html(navHtml);
  };
  
  renderBottomNav();
  
  // ========================================
  // 테마
  // ========================================
  const setTheme = (theme) => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('catui-theme', theme);
    CATUI('#theme-btn').text(theme === 'dark' ? 'light_mode' : 'dark_mode');
    CATUI('meta[name="theme-color"]').attr('content', theme === 'dark' ? '#1f2937' : '#667eea');
  };
  
  setTheme(localStorage.getItem('catui-theme') || 'light');
  
  CATUI('#theme-btn').on('click', () => {
    setTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark');
  });

  // ========================================
  // 라우터 훅
  // ========================================
  CATUI.router.afterLoad((path) => {
    const navKey = path.replace('views/', '').replace('.html', '');
    // 하단 네비게이션 & Drawer 모두 active 처리
    CATUI('.nav-item, .drawer-item').removeClass('active');
    CATUI(`[data-nav="${navKey}"]`).addClass('active');
  });
  
  // 초기 뷰
  CATUI.router.navigate('views/home.html');

  // ========================================
  // Left Drawer
  // ========================================
  try {
    const Overlays = await CATUI.use('overlays');
    
    const drawer = new Overlays.Drawer({
      position: 'left',
      width: '280px',
      title: 'CATUI Mobile',
      animationDuration: 250,
      content: `
        <nav class="drawer-nav">
          ${menuItems.map(item => `
            <a class="drawer-item" catui-href="views/${item.nav}.html" data-nav="${item.nav}">
              <span class="material-icons${item.outlined ? '-outlined' : ''}">${item.icon}</span>
              <span>${item.label}</span>
            </a>
          `).join('')}
        </nav>
        <div class="drawer-footer">
          <div class="drawer-info">
            <span class="material-icons-outlined">info</span>
            <span>CATUI Mobile v${CATUI.version}</span>
          </div>
        </div>
      `
    });
    
    CATUI('#menu-btn').on('click', () => drawer.open());
    CATUI(drawer._element).on('click', (e) => {
      if (e.target.closest('[catui-href]')) drawer.close();
    });
    
  } catch (e) {
    console.warn('[App] Drawer 실패:', e.message);
  }
});
