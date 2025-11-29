/**
 * CATUI Mobile Examples - SPA Application
 */

CATUI.ready(async () => {
  console.log('[App] CATUI Mobile v' + CATUI.version);
  
  // 페이지별 타이틀
  const titles = {
    'views/home.html': 'CATUI Mobile',
    'views/touch.html': '터치 & 제스처',
    'views/device.html': '디바이스 정보',
    'views/state.html': '상태 관리',
    'views/more.html': '더보기'
  };
  
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
    CATUI('.nav-item').removeClass('active');
    CATUI(`[data-nav="${navKey}"]`).addClass('active');
    CATUI('.header-title').text(titles[path] || 'CATUI Mobile');
  });
  
  // 초기 뷰
  CATUI.router.navigate('views/home.html');

  // ========================================
  // Left Drawer
  // ========================================
  try {
    const Overlays = await CATUI.use('overlays');
    
    const menuItems = [
      { icon: 'home', label: '홈', nav: 'home' },
      { icon: 'touch_app', label: '터치 & 제스처', nav: 'touch', outlined: true },
      { icon: 'smartphone', label: '디바이스 정보', nav: 'device', outlined: true },
      { icon: 'data_object', label: '상태 관리', nav: 'state', outlined: true },
      { icon: 'more_horiz', label: '더보기', nav: 'more', outlined: true }
    ];
    
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
