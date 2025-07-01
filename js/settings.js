/**
 * 設定管理機能
 * アプリケーション設定とユーザープロファイルの管理
 */

const Settings = (function() {
    'use strict';

    // プライベート変数
    let container = null;
    let currentTab = 'profile';
    let hasUnsavedChanges = false;

    /**
     * 設定ページのレンダリング
     */
    function render(element) {
        container = element;
        const user = DataStore.currentUser.get();
        const settings = DataStore.settings.get();

        container.innerHTML = `
            <div class="settings-page">
                <!-- ページヘッダー -->
                <div class="page-header">
                    <div class="page-header__left">
                        <h2>設定</h2>
                        <p>アカウントとアプリケーションの設定を管理</p>
                    </div>
                    <div class="page-header__right" id="settings-actions">
                        <button class="btn btn--outline" onclick="Settings.resetSettings()">
                            初期設定に戻す
                        </button>
                        <button class="btn btn--primary" onclick="Settings.saveSettings()" id="save-settings-btn" disabled>
                            保存
                        </button>
                    </div>
                </div>

                <!-- タブナビゲーション -->
                <div class="settings-tabs">
                    <button class="tab-btn ${currentTab === 'profile' ? 'active' : ''}" 
                            onclick="Settings.switchTab('profile')">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                            <circle cx="12" cy="7" r="4"/>
                        </svg>
                        プロフィール
                    </button>
                    <button class="tab-btn ${currentTab === 'account' ? 'active' : ''}" 
                            onclick="Settings.switchTab('account')">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="3" y="11" width="18" height="10" rx="2" ry="2"/>
                            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                        </svg>
                        アカウント
                    </button>
                    <button class="tab-btn ${currentTab === 'appearance' ? 'active' : ''}" 
                            onclick="Settings.switchTab('appearance')">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="5"/>
                            <line x1="12" y1="1" x2="12" y2="3"/>
                            <line x1="12" y1="21" x2="12" y2="23"/>
                            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                            <line x1="1" y1="12" x2="3" y2="12"/>
                            <line x1="21" y1="12" x2="23" y2="12"/>
                            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                        </svg>
                        外観
                    </button>
                    <button class="tab-btn ${currentTab === 'notifications' ? 'active' : ''}" 
                            onclick="Settings.switchTab('notifications')">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                        </svg>
                        通知
                    </button>
                    <button class="tab-btn ${currentTab === 'integrations' ? 'active' : ''}" 
                            onclick="Settings.switchTab('integrations')">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M6 3h12l4 6-10 13L2 9z"/>
                        </svg>
                        連携
                    </button>
                    <button class="tab-btn ${currentTab === 'advanced' ? 'active' : ''}" 
                            onclick="Settings.switchTab('advanced')">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="3"/>
                            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                        </svg>
                        詳細設定
                    </button>
                </div>

                <!-- タブコンテンツ -->
                <div class="settings-content" id="settings-content">
                    ${renderTabContent()}
                </div>
            </div>
        `;

        // イベントリスナーの設定
        setupEventListeners();
    }

    /**
     * タブコンテンツのレンダリング
     */
    function renderTabContent() {
        switch (currentTab) {
            case 'profile':
                return renderProfileTab();
            case 'account':
                return renderAccountTab();
            case 'appearance':
                return renderAppearanceTab();
            case 'notifications':
                return renderNotificationsTab();
            case 'integrations':
                return renderIntegrationsTab();
            case 'advanced':
                return renderAdvancedTab();
            default:
                return '';
        }
    }

    /**
     * プロフィールタブのレンダリング
     */
    function renderProfileTab() {
        const user = DataStore.currentUser.get();

        return `
            <div class="settings-section">
                <h3>プロフィール設定</h3>
                <p>あなたの基本情報を管理します</p>

                <form id="profile-form" class="settings-form">
                    <div class="form-row">
                        <div class="avatar-upload">
                            <div class="avatar-preview">
                                ${user.avatar ? `<img src="${user.avatar}" alt="Avatar">` : user.name.charAt(0)}
                            </div>
                            <button type="button" class="btn btn--sm btn--outline" onclick="Settings.uploadAvatar()">
                                画像を変更
                            </button>
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">名前</label>
                            <input type="text" class="form-control" id="user-name" value="${user.name}" 
                                   onchange="Settings.markAsChanged()">
                        </div>
                        <div class="form-group">
                            <label class="form-label">メールアドレス</label>
                            <input type="email" class="form-control" id="user-email" value="${user.email}" 
                                   onchange="Settings.markAsChanged()">
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">役職</label>
                            <input type="text" class="form-control" id="user-role" value="${user.role}" 
                                   onchange="Settings.markAsChanged()">
                        </div>
                        <div class="form-group">
                            <label class="form-label">部署</label>
                            <select class="form-control" id="user-department" onchange="Settings.markAsChanged()">
                                <option value="開発部" ${user.department === '開発部' ? 'selected' : ''}>開発部</option>
                                <option value="デザイン部" ${user.department === 'デザイン部' ? 'selected' : ''}>デザイン部</option>
                                <option value="品質保証部" ${user.department === '品質保証部' ? 'selected' : ''}>品質保証部</option>
                                <option value="分析部" ${user.department === '分析部' ? 'selected' : ''}>分析部</option>
                                <option value="営業部" ${user.department === '営業部' ? 'selected' : ''}>営業部</option>
                            </select>
                        </div>
                    </div>

                    <div class="form-group">
                        <label class="form-label">自己紹介</label>
                        <textarea class="form-control" id="user-bio" rows="4" 
                                  placeholder="あなたについて教えてください" 
                                  onchange="Settings.markAsChanged()">${user.bio || ''}</textarea>
                    </div>
                </form>
            </div>
        `;
    }

    /**
     * アカウントタブのレンダリング
     */
    function renderAccountTab() {
        return `
            <div class="settings-section">
                <h3>アカウント設定</h3>
                <p>セキュリティとプライバシーの設定</p>

                <div class="settings-group">
                    <h4>パスワード変更</h4>
                    <form id="password-form" class="settings-form">
                        <div class="form-group">
                            <label class="form-label">現在のパスワード</label>
                            <input type="password" class="form-control" id="current-password">
                        </div>
                        <div class="form-group">
                            <label class="form-label">新しいパスワード</label>
                            <input type="password" class="form-control" id="new-password">
                            <small class="form-hint">8文字以上で、英数字と記号を含めてください</small>
                        </div>
                        <div class="form-group">
                            <label class="form-label">新しいパスワード（確認）</label>
                            <input type="password" class="form-control" id="confirm-password">
                        </div>
                        <button type="button" class="btn btn--primary" onclick="Settings.changePassword()">
                            パスワードを変更
                        </button>
                    </form>
                </div>

                <div class="settings-group">
                    <h4>二要素認証</h4>
                    <p>アカウントのセキュリティを強化します</p>
                    <div class="two-factor-status">
                        <span class="status-indicator inactive">無効</span>
                        <button class="btn btn--outline" onclick="Settings.toggleTwoFactor()">
                            有効にする
                        </button>
                    </div>
                </div>

                <div class="settings-group">
                    <h4>ログインセッション</h4>
                    <p>現在アクティブなセッション</p>
                    <div class="session-list">
                        <div class="session-item">
                            <div class="session-info">
                                <strong>現在のセッション</strong>
                                <p>Chrome - Windows 10</p>
                                <p class="session-time">最終アクセス: たった今</p>
                            </div>
                        </div>
                    </div>
                    <button class="btn btn--outline" onclick="Settings.logoutAllSessions()">
                        他のセッションをすべてログアウト
                    </button>
                </div>
            </div>

            <div class="settings-section danger-zone">
                <h3>危険な操作</h3>
                <div class="danger-item">
                    <div>
                        <h4>アカウントを削除</h4>
                        <p>この操作は取り消せません。すべてのデータが完全に削除されます。</p>
                    </div>
                    <button class="btn btn--danger" onclick="Settings.deleteAccount()">
                        アカウントを削除
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * 外観タブのレンダリング
     */
    function renderAppearanceTab() {
        const settings = DataStore.settings.get();

        return `
            <div class="settings-section">
                <h3>外観設定</h3>
                <p>アプリケーションの見た目をカスタマイズ</p>

                <div class="settings-group">
                    <h4>テーマ</h4>
                    <div class="theme-selector">
                        <label class="theme-option ${settings.theme === 'light' ? 'active' : ''}">
                            <input type="radio" name="theme" value="light" 
                                   ${settings.theme === 'light' ? 'checked' : ''}
                                   onchange="Settings.changeTheme('light')">
                            <div class="theme-preview theme-light">
                                <div class="preview-header"></div>
                                <div class="preview-content">
                                    <div class="preview-sidebar"></div>
                                    <div class="preview-main"></div>
                                </div>
                            </div>
                            <span>ライト</span>
                        </label>

                        <label class="theme-option ${settings.theme === 'dark' ? 'active' : ''}">
                            <input type="radio" name="theme" value="dark" 
                                   ${settings.theme === 'dark' ? 'checked' : ''}
                                   onchange="Settings.changeTheme('dark')">
                            <div class="theme-preview theme-dark">
                                <div class="preview-header"></div>
                                <div class="preview-content">
                                    <div class="preview-sidebar"></div>
                                    <div class="preview-main"></div>
                                </div>
                            </div>
                            <span>ダーク</span>
                        </label>

                        <label class="theme-option ${settings.theme === 'auto' ? 'active' : ''}">
                            <input type="radio" name="theme" value="auto" 
                                   ${settings.theme === 'auto' ? 'checked' : ''}
                                   onchange="Settings.changeTheme('auto')">
                            <div class="theme-preview theme-auto">
                                <div class="preview-header"></div>
                                <div class="preview-content">
                                    <div class="preview-sidebar"></div>
                                    <div class="preview-main"></div>
                                </div>
                            </div>
                            <span>自動</span>
                        </label>
                    </div>
                </div>

                <div class="settings-group">
                    <h4>表示設定</h4>
                    <div class="settings-list">
                        <div class="settings-item">
                            <div>
                                <strong>コンパクトモード</strong>
                                <p>要素間のスペースを狭くして、より多くの情報を表示</p>
                            </div>
                            <label class="switch">
                                <input type="checkbox" ${settings.compactMode ? 'checked' : ''} 
                                       onchange="Settings.toggleCompactMode()">
                                <span class="slider"></span>
                            </label>
                        </div>

                        <div class="settings-item">
                            <div>
                                <strong>アニメーション</strong>
                                <p>画面遷移やインタラクションのアニメーション効果</p>
                            </div>
                            <label class="switch">
                                <input type="checkbox" ${settings.animations !== false ? 'checked' : ''} 
                                       onchange="Settings.toggleAnimations()">
                                <span class="slider"></span>
                            </label>
                        </div>
                    </div>
                </div>

                <div class="settings-group">
                    <h4>フォントサイズ</h4>
                    <div class="font-size-selector">
                        <button class="font-size-btn ${settings.fontSize === 'small' ? 'active' : ''}" 
                                onclick="Settings.changeFontSize('small')">
                            <span style="font-size: 12px;">A</span>
                            <span>小</span>
                        </button>
                        <button class="font-size-btn ${(!settings.fontSize || settings.fontSize === 'medium') ? 'active' : ''}" 
                                onclick="Settings.changeFontSize('medium')">
                            <span style="font-size: 14px;">A</span>
                            <span>中</span>
                        </button>
                        <button class="font-size-btn ${settings.fontSize === 'large' ? 'active' : ''}" 
                                onclick="Settings.changeFontSize('large')">
                            <span style="font-size: 16px;">A</span>
                            <span>大</span>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * 通知タブのレンダリング
     */
    function renderNotificationsTab() {
        const settings = DataStore.settings.get();

        return `
            <div class="settings-section">
                <h3>通知設定</h3>
                <p>通知の受け取り方法を管理</p>

                <div class="settings-group">
                    <h4>通知チャンネル</h4>
                    <div class="settings-list">
                        <div class="settings-item">
                            <div>
                                <strong>メール通知</strong>
                                <p>重要な更新をメールで受け取る</p>
                            </div>
                            <label class="switch">
                                <input type="checkbox" ${settings.notifications.email ? 'checked' : ''} 
                                       onchange="Settings.toggleNotification('email')">
                                <span class="slider"></span>
                            </label>
                        </div>

                        <div class="settings-item">
                            <div>
                                <strong>ブラウザ通知</strong>
                                <p>デスクトップ通知を表示</p>
                            </div>
                            <label class="switch">
                                <input type="checkbox" ${settings.notifications.browser ? 'checked' : ''} 
                                       onchange="Settings.toggleNotification('browser')">
                                <span class="slider"></span>
                            </label>
                        </div>

                        <div class="settings-item">
                            <div>
                                <strong>Slack通知</strong>
                                <p>Slackワークスペースに通知を送信</p>
                            </div>
                            <label class="switch">
                                <input type="checkbox" ${settings.notifications.slack ? 'checked' : ''} 
                                       onchange="Settings.toggleNotification('slack')">
                                <span class="slider"></span>
                            </label>
                        </div>
                    </div>
                </div>

                <div class="settings-group">
                    <h4>通知タイプ</h4>
                    <div class="notification-types">
                        <label class="checkbox-label">
                            <input type="checkbox" checked onchange="Settings.markAsChanged()">
                            <span>新しいタスクの割り当て</span>
                        </label>
                        <label class="checkbox-label">
                            <input type="checkbox" checked onchange="Settings.markAsChanged()">
                            <span>タスクの期限接近</span>
                        </label>
                        <label class="checkbox-label">
                            <input type="checkbox" checked onchange="Settings.markAsChanged()">
                            <span>プロジェクトのステータス変更</span>
                        </label>
                        <label class="checkbox-label">
                            <input type="checkbox" onchange="Settings.markAsChanged()">
                            <span>コメントとメンション</span>
                        </label>
                        <label class="checkbox-label">
                            <input type="checkbox" onchange="Settings.markAsChanged()">
                            <span>週次レポート</span>
                        </label>
                        <label class="checkbox-label">
                            <input type="checkbox" onchange="Settings.markAsChanged()">
                            <span>システムアップデート</span>
                        </label>
                    </div>
                </div>

                <div class="settings-group">
                    <h4>通知スケジュール</h4>
                    <div class="schedule-settings">
                        <div class="settings-item">
                            <div>
                                <strong>通知を無効にする時間帯</strong>
                                <p>指定した時間帯は通知を送信しません</p>
                            </div>
                            <div class="time-range">
                                <input type="time" class="form-control" value="22:00" onchange="Settings.markAsChanged()">
                                <span>〜</span>
                                <input type="time" class="form-control" value="08:00" onchange="Settings.markAsChanged()">
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * 連携タブのレンダリング
     */
    function renderIntegrationsTab() {
        return `
            <div class="settings-section">
                <h3>外部サービス連携</h3>
                <p>他のツールやサービスとの連携を管理</p>

                <div class="integrations-grid">
                    <div class="integration-card">
                        <div class="integration-icon">
                            <img src="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><rect fill='%234A154B' width='24' height='24'/><text x='12' y='16' text-anchor='middle' fill='white' font-size='12'>S</text></svg>" alt="Slack">
                        </div>
                        <h4>Slack</h4>
                        <p>チームコミュニケーションツール</p>
                        <div class="integration-status connected">
                            <span class="status-dot"></span>
                            <span>接続済み</span>
                        </div>
                        <button class="btn btn--sm btn--outline" onclick="Settings.configureIntegration('slack')">
                            設定
                        </button>
                    </div>

                    <div class="integration-card">
                        <div class="integration-icon">
                            <img src="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><rect fill='%23181717' width='24' height='24'/><text x='12' y='16' text-anchor='middle' fill='white' font-size='12'>G</text></svg>" alt="GitHub">
                        </div>
                        <h4>GitHub</h4>
                        <p>コード管理とコラボレーション</p>
                        <div class="integration-status">
                            <span class="status-dot"></span>
                            <span>未接続</span>
                        </div>
                        <button class="btn btn--sm btn--primary" onclick="Settings.connectIntegration('github')">
                            接続
                        </button>
                    </div>

                    <div class="integration-card">
                        <div class="integration-icon">
                            <img src="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><rect fill='%230052CC' width='24' height='24'/><text x='12' y='16' text-anchor='middle' fill='white' font-size='12'>J</text></svg>" alt="Jira">
                        </div>
                        <h4>Jira</h4>
                        <p>プロジェクト管理ツール</p>
                        <div class="integration-status">
                            <span class="status-dot"></span>
                            <span>未接続</span>
                        </div>
                        <button class="btn btn--sm btn--primary" onclick="Settings.connectIntegration('jira')">
                            接続
                        </button>
                    </div>

                    <div class="integration-card">
                        <div class="integration-icon">
                            <img src="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><rect fill='%234285F4' width='24' height='24'/><text x='12' y='16' text-anchor='middle' fill='white' font-size='12'>G</text></svg>" alt="Google">
                        </div>
                        <h4>Google Workspace</h4>
                        <p>ドキュメントとカレンダー</p>
                        <div class="integration-status connected">
                            <span class="status-dot"></span>
                            <span>接続済み</span>
                        </div>
                        <button class="btn btn--sm btn--outline" onclick="Settings.configureIntegration('google')">
                            設定
                        </button>
                    </div>

                    <div class="integration-card">
                        <div class="integration-icon">
                            <img src="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><rect fill='%237C3AED' width='24' height='24'/><text x='12' y='16' text-anchor='middle' fill='white' font-size='12'>Z</text></svg>" alt="Zapier">
                        </div>
                        <h4>Zapier</h4>
                        <p>自動化とワークフロー</p>
                        <div class="integration-status">
                            <span class="status-dot"></span>
                            <span>未接続</span>
                        </div>
                        <button class="btn btn--sm btn--primary" onclick="Settings.connectIntegration('zapier')">
                            接続
                        </button>
                    </div>

                    <div class="integration-card">
                        <div class="integration-icon">
                            <img src="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><rect fill='%230078D4' width='24' height='24'/><text x='12' y='16' text-anchor='middle' fill='white' font-size='12'>T</text></svg>" alt="Teams">
                        </div>
                        <h4>Microsoft Teams</h4>
                        <p>チームコラボレーション</p>
                        <div class="integration-status">
                            <span class="status-dot"></span>
                            <span>未接続</span>
                        </div>
                        <button class="btn btn--sm btn--primary" onclick="Settings.connectIntegration('teams')">
                            接続
                        </button>
                    </div>
                </div>

                <div class="settings-group">
                    <h4>API設定</h4>
                    <p>外部アプリケーションからのアクセスを管理</p>
                    <div class="api-tokens">
                        <div class="token-item">
                            <div class="token-info">
                                <strong>個人用APIトークン</strong>
                                <p>作成日: 2024-01-15</p>
                                <code class="token-preview">sk_test_••••••••••••••••</code>
                            </div>
                            <button class="btn btn--sm btn--outline" onclick="Settings.regenerateToken()">
                                再生成
                            </button>
                        </div>
                    </div>
                    <button class="btn btn--primary" onclick="Settings.createNewToken()">
                        新しいトークンを作成
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * 詳細設定タブのレンダリング
     */
    function renderAdvancedTab() {
        const settings = DataStore.settings.get();

        return `
            <div class="settings-section">
                <h3>詳細設定</h3>
                <p>高度な設定オプション</p>

                <div class="settings-group">
                    <h4>地域と言語</h4>
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">言語</label>
                            <select class="form-control" id="language-select" onchange="Settings.changeLanguage()">
                                <option value="ja" ${settings.language === 'ja' ? 'selected' : ''}>日本語</option>
                                <option value="en" ${settings.language === 'en' ? 'selected' : ''}>English</option>
                                <option value="zh" ${settings.language === 'zh' ? 'selected' : ''}>中文</option>
                                <option value="ko" ${settings.language === 'ko' ? 'selected' : ''}>한국어</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">タイムゾーン</label>
                            <select class="form-control" id="timezone-select" onchange="Settings.markAsChanged()">
                                <option value="Asia/Tokyo" selected>東京 (GMT+9)</option>
                                <option value="America/New_York">ニューヨーク (GMT-5)</option>
                                <option value="Europe/London">ロンドン (GMT)</option>
                                <option value="Asia/Shanghai">上海 (GMT+8)</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div class="settings-group">
                    <h4>日付と時刻</h4>
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">日付形式</label>
                            <select class="form-control" id="date-format" onchange="Settings.changeDateFormat()">
                                <option value="YYYY/MM/DD" ${settings.dateFormat === 'YYYY/MM/DD' ? 'selected' : ''}>2024/03/15</option>
                                <option value="DD/MM/YYYY" ${settings.dateFormat === 'DD/MM/YYYY' ? 'selected' : ''}>15/03/2024</option>
                                <option value="MM/DD/YYYY" ${settings.dateFormat === 'MM/DD/YYYY' ? 'selected' : ''}>03/15/2024</option>
                                <option value="YYYY-MM-DD" ${settings.dateFormat === 'YYYY-MM-DD' ? 'selected' : ''}>2024-03-15</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">週の開始日</label>
                            <select class="form-control" id="week-start" onchange="Settings.markAsChanged()">
                                <option value="monday" ${settings.weekStart === 'monday' ? 'selected' : ''}>月曜日</option>
                                <option value="sunday" ${settings.weekStart === 'sunday' ? 'selected' : ''}>日曜日</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div class="settings-group">
                    <h4>データとプライバシー</h4>
                    <div class="settings-list">
                        <div class="settings-item">
                            <div>
                                <strong>使用状況データの収集</strong>
                                <p>品質向上のため匿名化されたデータを収集</p>
                            </div>
                            <label class="switch">
                                <input type="checkbox" checked onchange="Settings.markAsChanged()">
                                <span class="slider"></span>
                            </label>
                        </div>
                        <div class="settings-item">
                            <div>
                                <strong>エラーレポート</strong>
                                <p>問題が発生した際に自動的にレポートを送信</p>
                            </div>
                            <label class="switch">
                                <input type="checkbox" checked onchange="Settings.markAsChanged()">
                                <span class="slider"></span>
                            </label>
                        </div>
                    </div>
                </div>

                <div class="settings-group">
                    <h4>データ管理</h4>
                    <div class="data-actions">
                        <button class="btn btn--outline" onclick="Settings.exportAllData()">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                <polyline points="7 10 12 15 17 10"/>
                                <line x1="12" y1="15" x2="12" y2="3"/>
                            </svg>
                            すべてのデータをエクスポート
                        </button>
                        <button class="btn btn--outline" onclick="Settings.importData()">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                <polyline points="17 8 12 3 7 8"/>
                                <line x1="12" y1="3" x2="12" y2="15"/>
                            </svg>
                            データをインポート
                        </button>
                        <button class="btn btn--outline" onclick="Settings.clearCache()">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="3 6 5 6 21 6"/>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                            </svg>
                            キャッシュをクリア
                        </button>
                        <button class="btn btn--danger" onclick="Settings.resetAllData()">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M3 6h18"/>
                                <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                                <path d="M19 6v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6"/>
                                <line x1="10" y1="11" x2="10" y2="17"/>
                                <line x1="14" y1="11" x2="14" y2="17"/>
                            </svg>
                            すべてのデータをリセット
                        </button>
                    </div>
                </div>

                <div class="settings-group">
                    <h4>実験的機能</h4>
                    <p class="warning-text">これらの機能は開発中で、不安定な場合があります</p>
                    <div class="settings-list">
                        <div class="settings-item">
                            <div>
                                <strong>AI アシスタント</strong>
                                <p>AIによるタスク提案と自動化</p>
                            </div>
                            <label class="switch">
                                <input type="checkbox" onchange="Settings.toggleExperimental('ai')">
                                <span class="slider"></span>
                            </label>
                        </div>
                        <div class="settings-item">
                            <div>
                                <strong>高度な分析</strong>
                                <p>機械学習を使用した予測分析</p>
                            </div>
                            <label class="switch">
                                <input type="checkbox" onchange="Settings.toggleExperimental('analytics')">
                                <span class="slider"></span>
                            </label>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * イベントリスナーの設定
     */
    function setupEventListeners() {
        // フォームの変更を監視
        const forms = container.querySelectorAll('form');
        forms.forEach(form => {
            form.addEventListener('submit', e => e.preventDefault());
        });
    }

    /**
     * 変更フラグを立てる
     */
    function markAsChanged() {
        hasUnsavedChanges = true;
        const saveBtn = document.getElementById('save-settings-btn');
        if (saveBtn) {
            saveBtn.disabled = false;
        }
    }

    /**
     * テーマの変更
     */
    function changeTheme(theme) {
        const settings = DataStore.settings.get();
        settings.theme = theme;
        DataStore.settings.update(settings);

        // テーマを適用
        applyTheme(theme);
        
        // 選択状態を更新
        document.querySelectorAll('.theme-option').forEach(option => {
            option.classList.remove('active');
        });
        event.target.closest('.theme-option').classList.add('active');

        Utils.toast.show('テーマを変更しました', 'success');
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

    // Public API
    return {
        render,

        /**
         * タブの切り替え
         */
        switchTab(tab) {
            currentTab = tab;
            const content = document.getElementById('settings-content');
            if (content) {
                content.innerHTML = renderTabContent();
            }
            
            // タブボタンのアクティブ状態を更新
            document.querySelectorAll('.tab-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            
            // クリックされたボタンを取得（event.targetが存在する場合のみ）
            if (event && event.target) {
                const clickedBtn = event.target.closest('.tab-btn');
                if (clickedBtn) {
                    clickedBtn.classList.add('active');
                }
            } else {
                // event.targetが存在しない場合は、data属性で該当するボタンを探す
                const targetBtn = document.querySelector(`.tab-btn[onclick*="'${tab}'"]`);
                if (targetBtn) {
                    targetBtn.classList.add('active');
                }
            }
            
            setupEventListeners();
        },

        /**
         * 設定の保存
         */
        saveSettings() {
            if (currentTab === 'profile') {
                const userData = {
                    name: document.getElementById('user-name').value,
                    email: document.getElementById('user-email').value,
                    role: document.getElementById('user-role').value,
                    department: document.getElementById('user-department').value,
                    bio: document.getElementById('user-bio').value
                };
                
                DataStore.currentUser.update(userData);
            }

            hasUnsavedChanges = false;
            document.getElementById('save-settings-btn').disabled = true;
            
            Utils.toast.show('設定を保存しました', 'success');
        },

        /**
         * 設定のリセット
         */
        resetSettings() {
            if (confirm('すべての設定を初期状態に戻しますか？')) {
                DataStore.settings.update({
                    theme: 'dark',
                    language: 'ja',
                    notifications: {
                        email: true,
                        browser: true,
                        slack: false
                    },
                    dateFormat: 'YYYY/MM/DD',
                    weekStart: 'monday'
                });
                
                render(container);
                Utils.toast.show('設定を初期化しました', 'success');
            }
        },

        /**
         * 変更フラグ
         */
        markAsChanged,

        /**
         * テーマ変更
         */
        changeTheme,

        /**
         * アバターアップロード
         */
        uploadAvatar() {
            Utils.toast.show('アバターアップロード機能は開発中です', 'info');
        },

        /**
         * パスワード変更
         */
        changePassword() {
            const currentPassword = document.getElementById('current-password').value;
            const newPassword = document.getElementById('new-password').value;
            const confirmPassword = document.getElementById('confirm-password').value;

            if (!currentPassword || !newPassword || !confirmPassword) {
                Utils.toast.show('すべてのフィールドを入力してください', 'error');
                return;
            }

            if (newPassword !== confirmPassword) {
                Utils.toast.show('新しいパスワードが一致しません', 'error');
                return;
            }

            // 実際のアプリケーションではサーバーに送信
            Utils.toast.show('パスワードを変更しました', 'success');
            
            // フォームをクリア
            document.getElementById('password-form').reset();
        },

        /**
         * 二要素認証の切り替え
         */
        toggleTwoFactor() {
            Utils.toast.show('二要素認証の設定機能は開発中です', 'info');
        },

        /**
         * すべてのセッションをログアウト
         */
        logoutAllSessions() {
            if (confirm('他のすべてのセッションからログアウトしますか？')) {
                Utils.toast.show('他のセッションをログアウトしました', 'success');
            }
        },

        /**
         * アカウント削除
         */
        deleteAccount() {
            if (confirm('本当にアカウントを削除しますか？この操作は取り消せません。')) {
                if (confirm('最終確認：すべてのデータが削除されます。続行しますか？')) {
                    Utils.toast.show('アカウントを削除しました', 'success');
                    setTimeout(() => {
                        window.location.reload();
                    }, 1000);
                }
            }
        },

        /**
         * 通知設定の切り替え
         */
        toggleNotification(type) {
            const settings = DataStore.settings.get();
            settings.notifications[type] = !settings.notifications[type];
            DataStore.settings.update(settings);
            markAsChanged();
        },

        /**
         * フォントサイズ変更
         */
        changeFontSize(size) {
            const settings = DataStore.settings.get();
            settings.fontSize = size;
            DataStore.settings.update(settings);

            // フォントサイズを適用
            document.body.className = document.body.className.replace(/font-size-\w+/, '');
            document.body.classList.add(`font-size-${size}`);

            // ボタンのアクティブ状態を更新
            document.querySelectorAll('.font-size-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            event.target.closest('.font-size-btn').classList.add('active');
        },

        /**
         * コンパクトモードの切り替え
         */
        toggleCompactMode() {
            const settings = DataStore.settings.get();
            settings.compactMode = !settings.compactMode;
            DataStore.settings.update(settings);

            document.body.classList.toggle('compact-mode', settings.compactMode);
        },

        /**
         * アニメーションの切り替え
         */
        toggleAnimations() {
            const settings = DataStore.settings.get();
            settings.animations = !settings.animations;
            DataStore.settings.update(settings);

            document.body.classList.toggle('no-animations', !settings.animations);
        },

        /**
         * 言語変更
         */
        changeLanguage() {
            const language = document.getElementById('language-select').value;
            const settings = DataStore.settings.get();
            settings.language = language;
            DataStore.settings.update(settings);

            Utils.toast.show('言語設定を変更しました。再読み込みが必要です。', 'info');
            markAsChanged();
        },

        /**
         * 日付形式変更
         */
        changeDateFormat() {
            const format = document.getElementById('date-format').value;
            const settings = DataStore.settings.get();
            settings.dateFormat = format;
            DataStore.settings.update(settings);
            markAsChanged();
        },

        /**
         * 連携設定
         */
        connectIntegration(service) {
            Utils.toast.show(`${service}との連携機能は開発中です`, 'info');
        },

        configureIntegration(service) {
            Utils.toast.show(`${service}の設定画面は開発中です`, 'info');
        },

        /**
         * APIトークン管理
         */
        createNewToken() {
            Utils.toast.show('APIトークンの作成機能は開発中です', 'info');
        },

        regenerateToken() {
            if (confirm('既存のトークンは無効になります。続行しますか？')) {
                Utils.toast.show('APIトークンを再生成しました', 'success');
            }
        },

        /**
         * データ管理
         */
        exportAllData() {
            const allData = {
                user: DataStore.currentUser.get(),
                settings: DataStore.settings.get(),
                projects: DataStore.projects.getAll(),
                tasks: DataStore.tasks.getAll(),
                teamMembers: DataStore.teamMembers.getAll(),
                activities: DataStore.activities.getRecent(1000)
            };

            Utils.export.json(allData, `projecthub_backup_${Utils.date.format(new Date(), 'YYYYMMDD')}.json`);
            Utils.toast.show('すべてのデータをエクスポートしました', 'success');
        },

        importData() {
            Utils.toast.show('データインポート機能は開発中です', 'info');
        },

        clearCache() {
            if (confirm('キャッシュをクリアしますか？')) {
                // 実際のアプリケーションではキャッシュをクリア
                Utils.toast.show('キャッシュをクリアしました', 'success');
            }
        },

        /**
         * すべてのデータをリセット
         */
        resetAllData() {
            if (DataStore.resetAllData()) {
                Utils.toast.show('すべてのデータをリセットしました', 'success');
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
            }
        },

        /**
         * 実験的機能の切り替え
         */
        toggleExperimental(feature) {
            Utils.toast.show(`実験的機能「${feature}」の設定を変更しました`, 'info');
        }
    };
})();

// グローバルに公開
window.Settings = Settings;