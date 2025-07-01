/**
 * メインアプリケーション管理
 * アプリケーション全体の初期化とルーティング制御
 */

const App = (function() {
    'use strict';

    // プライベート変数
    let currentPage = 'dashboard';
    let sidebarOpen = true;
    let initialized = false;

    // DOM要素のキャッシュ
    const elements = {};

    /**
     * DOM要素を取得してキャッシュ
     */
    function cacheElements() {
        elements.sidebar = document.getElementById('sidebar');
        elements.sidebarToggle = document.getElementById('sidebar-toggle');
        elements.mobileMenuToggle = document.getElementById('mobile-menu-toggle');
        elements.mainContent = document.querySelector('.main-content');
        elements.pageContent = document.getElementById('page-content');
        elements.navLinks = document.querySelectorAll('.nav-link');
        elements.notificationBtn = document.getElementById('notification-btn');
        elements.notificationDropdown = document.getElementById('notification-dropdown');
        elements.notificationCount = document.getElementById('notification-count');
        elements.notificationList = document.getElementById('notification-list');
        elements.userProfile = document.getElementById('user-profile');
        elements.userDropdown = document.getElementById('user-dropdown');
        elements.globalSearch = document.getElementById('global-search');
        elements.markAllRead = document.getElementById('mark-all-read');
        
        // サイドバートグルボタンをヘッダーに追加
        addHeaderToggleButton();
    }

    /**
     * イベントリスナーの設定
     */
    function setupEventListeners() {
        // サイドバートグル
        if (elements.sidebarToggle) {
            elements.sidebarToggle.addEventListener('click', toggleSidebar);
        }

        if (elements.mobileMenuToggle) {
            elements.mobileMenuToggle.addEventListener('click', toggleMobileSidebar);
        }

        // ナビゲーションリンク
        elements.navLinks.forEach(link => {
            link.addEventListener('click', handleNavigation);
        });

        // 通知関連
        if (elements.notificationBtn) {
            elements.notificationBtn.addEventListener('click', toggleNotifications);
        }

        if (elements.markAllRead) {
            elements.markAllRead.addEventListener('click', markAllNotificationsRead);
        }

        // ユーザープロファイル
        if (elements.userProfile) {
            elements.userProfile.addEventListener('click', toggleUserDropdown);
        }

        // グローバル検索
        if (elements.globalSearch) {
            elements.globalSearch.addEventListener('input', 
                Utils.debounce(handleGlobalSearch, 300)
            );
        }

        // 外側クリックでドロップダウンを閉じる
        document.addEventListener('click', handleOutsideClick);

        // ウィンドウリサイズ
        window.addEventListener('resize', Utils.throttle(handleResize, 200));

        // ブラウザの戻る/進むボタン対応
        window.addEventListener('popstate', handlePopState);

        // ユーザーメニューのリンク
        document.querySelectorAll('.user-menu-item').forEach(item => {
            item.addEventListener('click', handleUserMenuItem);
        });
    }

    /**
     * ヘッダーにサイドバートグルボタンを追加
     */
    function addHeaderToggleButton() {
        const headerLeft = document.querySelector('.header__left');
        if (!headerLeft) return;
        
        // 既存のモバイルメニューボタンの前にデスクトップ用トグルボタンを追加
        const desktopToggle = document.createElement('button');
        desktopToggle.className = 'desktop-sidebar-toggle';
        desktopToggle.id = 'desktop-sidebar-toggle';
        desktopToggle.setAttribute('aria-label', 'サイドバー切り替え');
        desktopToggle.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 12h18M3 6h18M3 18h18"/>
            </svg>
        `;
        
        // モバイルメニューボタンの前に挿入
        headerLeft.insertBefore(desktopToggle, headerLeft.firstChild);
        
        // イベントリスナーを追加
        desktopToggle.addEventListener('click', toggleSidebar);
        
        // 要素をキャッシュに追加
        elements.desktopSidebarToggle = desktopToggle;
        
        // 初期状態を設定
        updateToggleButtonVisibility();
    }

    /**
     * サイドバーの開閉
     */
    function toggleSidebar() {
        sidebarOpen = !sidebarOpen;
        
        if (sidebarOpen) {
            elements.sidebar.style.transform = 'translateX(0)';
            if (window.innerWidth > 768) {
                elements.mainContent.style.marginLeft = '260px';
            }
        } else {
            elements.sidebar.style.transform = 'translateX(-100%)';
            elements.mainContent.style.marginLeft = '0';
        }
        
        // トグルボタンの表示状態を更新
        updateToggleButtonVisibility();
        
        // 状態を保存
        localStorage.setItem('sidebarOpen', sidebarOpen);
    }

    /**
     * トグルボタンの表示状態を更新
     */
    function updateToggleButtonVisibility() {
        if (elements.desktopSidebarToggle) {
            // サイドバーが閉じているときはヘッダーのボタンを表示
            elements.desktopSidebarToggle.style.display = sidebarOpen ? 'none' : 'block';
        }
    }

    /**
     * モバイルサイドバーの開閉
     */
    function toggleMobileSidebar() {
        elements.sidebar.classList.toggle('mobile-open');
    }

    /**
     * ページナビゲーション処理
     */
    function handleNavigation(e) {
        e.preventDefault();
        
        const link = e.currentTarget;
        const page = link.getAttribute('data-page');
        
        if (page && page !== currentPage) {
            navigateToPage(page);
        }

        // モバイルの場合はサイドバーを閉じる
        if (window.innerWidth <= 768) {
            elements.sidebar.classList.remove('mobile-open');
        }
    }

    /**
     * ページ遷移処理
     */
    function navigateToPage(page) {
        // 現在のページと同じ場合は何もしない
        if (page === currentPage) {
            return;
        }

        console.log(`Navigating from ${currentPage} to ${page}`);

        // アクティブリンクの更新
        elements.navLinks.forEach(link => {
            if (link.getAttribute('data-page') === page) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });

        // ページコンテンツの更新
        loadPageContent(page);

        // URLの更新（履歴に追加）
        history.pushState({ page }, '', `#${page}`);
        
        currentPage = page;
    }

    /**
     * ページコンテンツの読み込み
     */
    function loadPageContent(page) {
        // ローディング表示
        elements.pageContent.innerHTML = '<div class="loading">読み込み中...</div>';

        try {
            // 各ページのレンダリング関数を呼び出し
            switch(page) {
                case 'dashboard':
                    Dashboard.render(elements.pageContent);
                    break;
                case 'projects':
                    Projects.render(elements.pageContent);
                    break;
                case 'reports':
                    Reports.render(elements.pageContent);
                    break;
                case 'team':
                    Team.render(elements.pageContent);
                    break;
                case 'settings':
                    Settings.render(elements.pageContent);
                    break;
                default:
                    elements.pageContent.innerHTML = '<div class="error">ページが見つかりません</div>';
            }
            console.log(`Successfully loaded page: ${page}`);
        } catch (error) {
            console.error(`Error loading page ${page}:`, error);
            elements.pageContent.innerHTML = '<div class="error">ページの読み込みに失敗しました</div>';
            Utils.toast.show('ページの読み込みに失敗しました', 'error');
        }
    }

    /**
     * 通知ドロップダウンの開閉
     */
    function toggleNotifications() {
        const isOpen = elements.notificationDropdown.classList.contains('active');
        
        if (!isOpen) {
            updateNotificationList();
        }
        
        elements.notificationDropdown.classList.toggle('active');
    }

    /**
     * 通知リストの更新
     */
    function updateNotificationList() {
        const notifications = DataStore.notifications.getAll();
        const unreadCount = notifications.filter(n => !n.read).length;
        
        // 未読数の更新
        elements.notificationCount.textContent = unreadCount;
        elements.notificationCount.style.display = unreadCount > 0 ? 'flex' : 'none';
        
        // 通知リストの更新
        if (notifications.length === 0) {
            elements.notificationList.innerHTML = `
                <div class="empty-state">
                    <p>新しい通知はありません</p>
                </div>
            `;
        } else {
            elements.notificationList.innerHTML = notifications.slice(0, 10).map(notification => `
                <div class="notification-item ${notification.read ? 'read' : ''}" data-id="${notification.id}">
                    <div class="notification-icon">
                        ${getNotificationIcon(notification.type)}
                    </div>
                    <div class="notification-content">
                        <p>${notification.title}</p>
                        <p class="notification-message">${notification.message}</p>
                        <span class="notification-time">${Utils.date.relative(notification.timestamp)}</span>
                    </div>
                </div>
            `).join('');
            
            // 通知アイテムのクリックイベント
            elements.notificationList.querySelectorAll('.notification-item').forEach(item => {
                item.addEventListener('click', () => {
                    const id = item.getAttribute('data-id');
                    DataStore.notifications.markAsRead(id);
                    item.classList.add('read');
                    updateNotificationCount();
                });
            });
        }
    }

    /**
     * 通知アイコンの取得
     */
    function getNotificationIcon(type) {
        const icons = {
            info: '💡',
            success: '✅',
            warning: '⚠️',
            error: '❌'
        };
        return icons[type] || '📢';
    }

    /**
     * すべての通知を既読にする
     */
    function markAllNotificationsRead() {
        DataStore.notifications.markAllAsRead();
        updateNotificationList();
        Utils.toast.show('すべての通知を既読にしました', 'success');
    }

    /**
     * 通知数の更新
     */
    function updateNotificationCount() {
        const unreadCount = DataStore.notifications.getUnread().length;
        elements.notificationCount.textContent = unreadCount;
        elements.notificationCount.style.display = unreadCount > 0 ? 'flex' : 'none';
    }

    /**
     * ユーザードロップダウンの開閉
     */
    function toggleUserDropdown() {
        elements.userDropdown.classList.toggle('active');
    }

    /**
     * ユーザーメニューアイテムのクリック処理
     */
    function handleUserMenuItem(e) {
        e.preventDefault();
        const href = e.currentTarget.getAttribute('href');
        
        if (href === '#logout') {
            handleLogout();
        } else if (href === '#profile' || href === '#account') {
            // 設定ページに遷移してから、該当タブを開く
            navigateToPage('settings');
            elements.userDropdown.classList.remove('active');
            
            // ページ遷移後にタブを切り替え
            setTimeout(() => {
                if (window.Settings) {
                    const tab = href === '#profile' ? 'profile' : 'account';
                    // タブボタンを探して直接クリック
                    const tabBtn = document.querySelector(`.tab-btn[onclick*="switchTab('${tab}')"]`);
                    if (tabBtn) {
                        tabBtn.click();
                    }
                }
            }, 100);
        }
    }

    /**
     * ログアウト処理
     */
    function handleLogout() {
        if (confirm('ログアウトしますか？')) {
            // 実際のアプリケーションではここでログアウト処理を実行
            Utils.toast.show('ログアウトしました', 'success');
            // ログイン画面へリダイレクト（デモでは再読み込み）
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        }
    }

    /**
     * グローバル検索処理
     */
    function handleGlobalSearch(e) {
        const query = e.target.value.trim();
        
        if (query.length < 2) {
            return;
        }
        
        // プロジェクトを検索
        const results = DataStore.projects.search(query);
        
        if (results.length > 0) {
            // 検索結果を表示（簡易版）
            Utils.toast.show(`${results.length}件のプロジェクトが見つかりました`, 'info');
        }
    }

    /**
     * 外側クリック処理
     */
    function handleOutsideClick(e) {
        // 通知ドロップダウン
        if (elements.notificationDropdown.classList.contains('active') &&
            !elements.notificationBtn.contains(e.target) &&
            !elements.notificationDropdown.contains(e.target)) {
            elements.notificationDropdown.classList.remove('active');
        }
        
        // ユーザードロップダウン
        if (elements.userDropdown.classList.contains('active') &&
            !elements.userProfile.contains(e.target) &&
            !elements.userDropdown.contains(e.target)) {
            elements.userDropdown.classList.remove('active');
        }
    }

    /**
     * ウィンドウリサイズ処理
     */
    function handleResize() {
        if (window.innerWidth <= 768) {
            elements.mainContent.style.marginLeft = '0';
            // モバイルではデスクトップ用トグルボタンを非表示
            if (elements.desktopSidebarToggle) {
                elements.desktopSidebarToggle.style.display = 'none';
            }
        } else {
            if (sidebarOpen) {
                elements.mainContent.style.marginLeft = '260px';
            }
            // デスクトップではトグルボタンの表示状態を更新
            updateToggleButtonVisibility();
        }
    }

    /**
     * ブラウザの戻る/進むボタン処理
     */
    function handlePopState(e) {
        const page = e.state?.page || 'dashboard';
        currentPage = page;
        
        elements.navLinks.forEach(link => {
            if (link.getAttribute('data-page') === page) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
        
        loadPageContent(page);
    }

    /**
     * ユーザー情報の更新
     */
    function updateUserInfo() {
        const user = DataStore.currentUser.get();
        
        // ユーザー名の更新
        if (elements.userProfile) {
            document.getElementById('user-name').textContent = user.name;
            document.getElementById('user-avatar').textContent = user.name.charAt(0);
        }
        
        // ドロップダウン内の情報更新
        const userNameLarge = elements.userDropdown.querySelector('.user-name-large');
        const userEmail = elements.userDropdown.querySelector('.user-email');
        const userAvatarLarge = elements.userDropdown.querySelector('.user-avatar-large');
        
        if (userNameLarge) userNameLarge.textContent = user.name;
        if (userEmail) userEmail.textContent = user.email;
        if (userAvatarLarge) userAvatarLarge.textContent = user.name.charAt(0);
    }

    /**
     * DataStoreイベントの設定
     */
    function setupDataStoreListeners() {
        // 通知の追加を監視
        DataStore.on('notification:added', () => {
            updateNotificationCount();
        });
        
        // ユーザー情報の更新を監視
        DataStore.on('user:updated', () => {
            updateUserInfo();
        });
        
        // アクティビティの追加を監視
        DataStore.on('activity:added', (activity) => {
            // ダッシュボードが表示されている場合は更新
            if (currentPage === 'dashboard') {
                Dashboard.updateActivity(activity);
            }
        });
    }

    /**
     * サイドバーの初期状態を復元
     */
    function restoreSidebarState() {
        const savedState = localStorage.getItem('sidebarOpen');
        if (savedState !== null) {
            sidebarOpen = savedState === 'true';
            if (!sidebarOpen) {
                elements.sidebar.style.transform = 'translateX(-100%)';
                elements.mainContent.style.marginLeft = '0';
            }
        }
        // トグルボタンの表示状態を更新
        updateToggleButtonVisibility();
    }

    /**
     * テーマの適用
     */
    function applyTheme(theme) {
        if (theme === 'dark') {
            document.body.setAttribute('data-color-scheme', 'dark');
        } else if (theme === 'light') {
            document.body.setAttribute('data-color-scheme', 'light');
        } else {
            // 自動の場合はOSの設定に従う
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            document.body.setAttribute('data-color-scheme', prefersDark ? 'dark' : 'light');
        }
    }

    // Public API
    return {
        /**
         * アプリケーションの初期化
         */
        init() {
            if (initialized) return;
            
            console.log('アプリケーションを初期化しています...');
            
            // DOM要素のキャッシュ
            cacheElements();
            
            // DataStoreの初期化
            DataStore.init();
            
            // 保存されているテーマを適用
            const settings = DataStore.settings.get();
            if (settings.theme) {
                applyTheme(settings.theme);
            }
            
            // イベントリスナーの設定
            setupEventListeners();
            setupDataStoreListeners();
            
            // サイドバー状態の復元
            restoreSidebarState();
            
            // ユーザー情報の初期表示
            updateUserInfo();
            
            // 通知数の初期表示
            updateNotificationCount();
            
            // 初期ページの読み込み
            const hash = window.location.hash.substring(1);
            const initialPage = hash || 'dashboard';
            navigateToPage(initialPage);
            
            // ウィンドウサイズの初期チェック
            handleResize();
            
            initialized = true;
            console.log('アプリケーションの初期化が完了しました');
            
            // 初期化完了通知
            Utils.toast.show('ProjectHubへようこそ！', 'success');
        },

        /**
         * 現在のページを取得
         */
        getCurrentPage() {
            return currentPage;
        },

        /**
         * ページ遷移
         */
        navigateTo(page) {
            navigateToPage(page);
        }
    };
})();

// DOMContentLoaded時に初期化
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

// グローバルに公開
window.App = App;