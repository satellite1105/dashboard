/**
 * チーム管理機能
 * チームメンバーの管理とパフォーマンス分析
 */

const Team = (function() {
    'use strict';

    // プライベート変数
    let container = null;
    let currentView = 'grid'; // grid, list, chart
    let currentMember = null;
    let filters = {
        department: 'all',
        status: 'all',
        search: ''
    };
    let charts = {
        workload: null,
        skills: null,
        performance: null
    };

    /**
     * チームページのレンダリング
     */
    function render(element) {
        container = element;

        container.innerHTML = `
            <div class="team-page">
                <!-- ページヘッダー -->
                <div class="page-header">
                    <div class="page-header__left">
                        <h2>チーム</h2>
                        <p>チームメンバーの管理とパフォーマンス分析</p>
                    </div>
                    <div class="page-header__right">
                        <button class="btn btn--primary" onclick="Team.showAddMemberModal()">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                                <circle cx="8.5" cy="7" r="4"/>
                                <line x1="20" y1="8" x2="20" y2="14"/>
                                <line x1="23" y1="11" x2="17" y2="11"/>
                            </svg>
                            メンバーを追加
                        </button>
                    </div>
                </div>

                <!-- ツールバー -->
                <div class="toolbar">
                    <div class="toolbar__left">
                        <!-- ビュー切り替え -->
                        <div class="view-switcher">
                            <button class="view-btn ${currentView === 'grid' ? 'active' : ''}" 
                                    onclick="Team.switchView('grid')" title="グリッド表示">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <rect x="3" y="3" width="7" height="7"/>
                                    <rect x="14" y="3" width="7" height="7"/>
                                    <rect x="14" y="14" width="7" height="7"/>
                                    <rect x="3" y="14" width="7" height="7"/>
                                </svg>
                            </button>
                            <button class="view-btn ${currentView === 'list' ? 'active' : ''}" 
                                    onclick="Team.switchView('list')" title="リスト表示">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <line x1="8" y1="6" x2="21" y2="6"/>
                                    <line x1="8" y1="12" x2="21" y2="12"/>
                                    <line x1="8" y1="18" x2="21" y2="18"/>
                                    <line x1="3" y1="6" x2="3.01" y2="6"/>
                                    <line x1="3" y1="12" x2="3.01" y2="12"/>
                                    <line x1="3" y1="18" x2="3.01" y2="18"/>
                                </svg>
                            </button>
                            <button class="view-btn ${currentView === 'chart' ? 'active' : ''}" 
                                    onclick="Team.switchView('chart')" title="チャート表示">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <line x1="18" y1="20" x2="18" y2="10"/>
                                    <line x1="12" y1="20" x2="12" y2="4"/>
                                    <line x1="6" y1="20" x2="6" y2="14"/>
                                </svg>
                            </button>
                        </div>

                        <!-- フィルター -->
                        <select class="form-control filter-select" id="department-filter" onchange="Team.applyFilters()">
                            <option value="all">すべての部署</option>
                            <option value="開発部">開発部</option>
                            <option value="デザイン部">デザイン部</option>
                            <option value="品質保証部">品質保証部</option>
                            <option value="分析部">分析部</option>
                        </select>

                        <select class="form-control filter-select" id="status-filter" onchange="Team.applyFilters()">
                            <option value="all">すべてのステータス</option>
                            <option value="active">アクティブ</option>
                            <option value="vacation">休暇中</option>
                            <option value="inactive">非アクティブ</option>
                        </select>
                    </div>

                    <div class="toolbar__right">
                        <!-- 検索 -->
                        <div class="search-box">
                            <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="11" cy="11" r="8"/>
                                <path d="m21 21-4.35-4.35"/>
                            </svg>
                            <input type="text" class="search-input" id="member-search" 
                                   placeholder="メンバーを検索..." 
                                   oninput="Team.handleSearch()">
                        </div>

                        <!-- エクスポート -->
                        <button class="btn btn--outline" onclick="Team.exportTeamData()">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                <polyline points="7 10 12 15 17 10"/>
                                <line x1="12" y1="15" x2="12" y2="3"/>
                            </svg>
                            エクスポート
                        </button>
                    </div>
                </div>

                <!-- チーム統計 -->
                <div class="team-stats">
                    ${renderTeamStats()}
                </div>

                <!-- コンテンツエリア -->
                <div class="team-content" id="team-content">
                    ${renderTeamView()}
                </div>
            </div>
        `;

        // イベントリスナーの設定
        setupEventListeners();
    }

    /**
     * チーム統計のレンダリング
     */
    function renderTeamStats() {
        const members = DataStore.teamMembers.getAll();
        const activeMembers = members.filter(m => m.status === 'active');
        const averageWorkload = activeMembers.length > 0 
            ? Math.round(activeMembers.reduce((sum, m) => sum + m.workload, 0) / activeMembers.length)
            : 0;
        const overloadedMembers = activeMembers.filter(m => m.workload > 85).length;
        const skills = members.reduce((all, m) => [...all, ...m.skills], []);
        const uniqueSkills = [...new Set(skills)].length;

        return `
            <div class="team-stat-card">
                <div class="stat-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                        <circle cx="9" cy="7" r="4"/>
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                    </svg>
                </div>
                <div class="stat-content">
                    <div class="stat-label">総メンバー数</div>
                    <div class="stat-value">${members.length}</div>
                    <div class="stat-sub">${activeMembers.length} アクティブ</div>
                </div>
            </div>

            <div class="team-stat-card">
                <div class="stat-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                    </svg>
                </div>
                <div class="stat-content">
                    <div class="stat-label">平均ワークロード</div>
                    <div class="stat-value">${averageWorkload}%</div>
                    <div class="stat-sub ${overloadedMembers > 0 ? 'text-warning' : ''}">
                        ${overloadedMembers > 0 ? `${overloadedMembers}人が高負荷` : '適正範囲'}
                    </div>
                </div>
            </div>

            <div class="team-stat-card">
                <div class="stat-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                    </svg>
                </div>
                <div class="stat-content">
                    <div class="stat-label">総スキル数</div>
                    <div class="stat-value">${uniqueSkills}</div>
                    <div class="stat-sub">多様な専門性</div>
                </div>
            </div>

            <div class="team-stat-card">
                <div class="stat-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"/>
                        <polyline points="12 6 12 12 16 14"/>
                    </svg>
                </div>
                <div class="stat-content">
                    <div class="stat-label">平均勤続年数</div>
                    <div class="stat-value">${calculateAverageTenure()}</div>
                    <div class="stat-sub">安定したチーム</div>
                </div>
            </div>
        `;
    }

    /**
     * 平均勤続年数の計算
     */
    function calculateAverageTenure() {
        const members = DataStore.teamMembers.getAll();
        const now = new Date();
        
        const totalDays = members.reduce((sum, member) => {
            const joinDate = new Date(member.joinDate);
            const days = Utils.date.diffInDays(joinDate, now);
            return sum + days;
        }, 0);

        const averageDays = totalDays / members.length;
        const years = Math.floor(averageDays / 365);
        const months = Math.floor((averageDays % 365) / 30);

        return `${years}年${months}ヶ月`;
    }

    /**
     * チームビューのレンダリング
     */
    function renderTeamView() {
        const members = getFilteredMembers();

        if (currentView === 'grid') {
            return renderGridView(members);
        } else if (currentView === 'list') {
            return renderListView(members);
        } else if (currentView === 'chart') {
            return renderChartView();
        }
        return '';
    }

    /**
     * グリッドビューのレンダリング
     */
    function renderGridView(members) {
        if (members.length === 0) {
            return `
                <div class="empty-state">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" opacity="0.3">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                        <circle cx="9" cy="7" r="4"/>
                    </svg>
                    <h3>メンバーが見つかりません</h3>
                    <p>検索条件を変更するか、新しいメンバーを追加してください</p>
                </div>
            `;
        }

        return `
            <div class="member-grid">
                ${members.map(member => renderMemberCard(member)).join('')}
            </div>
        `;
    }

    /**
     * メンバーカードのレンダリング
     */
    function renderMemberCard(member) {
        const projects = DataStore.projects.getAll().filter(p => 
            p.members.includes(member.id) && p.status === 'active'
        );
        const tasks = DataStore.tasks.getAll().filter(t => 
            t.assignee === member.id && t.status !== 'completed'
        );

        return `
            <div class="member-card" data-member-id="${member.id}">
                <div class="member-card__header">
                    <div class="member-avatar-large">
                        ${member.avatar || member.name.charAt(0)}
                    </div>
                    <div class="member-status status--${member.status}"></div>
                </div>

                <div class="member-card__body">
                    <h3 class="member-name">${member.name}</h3>
                    <p class="member-role">${member.role}</p>
                    <p class="member-department">${member.department}</p>

                    <div class="member-workload">
                        <div class="workload-header">
                            <span>ワークロード</span>
                            <span class="${getWorkloadClass(member.workload)}">${member.workload}%</span>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill ${getWorkloadClass(member.workload)}" 
                                 style="width: ${member.workload}%"></div>
                        </div>
                    </div>

                    <div class="member-stats">
                        <div class="member-stat">
                            <span class="stat-label">プロジェクト</span>
                            <span class="stat-value">${projects.length}</span>
                        </div>
                        <div class="member-stat">
                            <span class="stat-label">タスク</span>
                            <span class="stat-value">${tasks.length}</span>
                        </div>
                    </div>

                    <div class="member-skills">
                        ${member.skills.slice(0, 3).map(skill => 
                            `<span class="skill-tag">${skill}</span>`
                        ).join('')}
                        ${member.skills.length > 3 ? 
                            `<span class="skill-more">+${member.skills.length - 3}</span>` : ''}
                    </div>
                </div>

                <div class="member-card__footer">
                    <button class="btn btn--sm btn--outline" onclick="Team.showMemberDetail('${member.id}')">
                        詳細を見る
                    </button>
                    <button class="btn btn--sm btn--primary" onclick="Team.assignTask('${member.id}')">
                        タスクを割り当て
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * リストビューのレンダリング
     */
    function renderListView(members) {
        if (members.length === 0) {
            return `
                <div class="empty-state">
                    <h3>メンバーが見つかりません</h3>
                </div>
            `;
        }

        return `
            <div class="member-table-container">
                <table class="member-table">
                    <thead>
                        <tr>
                            <th>名前</th>
                            <th>役職</th>
                            <th>部署</th>
                            <th>ステータス</th>
                            <th>ワークロード</th>
                            <th>プロジェクト</th>
                            <th>タスク</th>
                            <th>入社日</th>
                            <th>アクション</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${members.map(member => renderMemberRow(member)).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    /**
     * メンバー行のレンダリング
     */
    function renderMemberRow(member) {
        const projects = DataStore.projects.getAll().filter(p => 
            p.members.includes(member.id) && p.status === 'active'
        );
        const tasks = DataStore.tasks.getAll().filter(t => 
            t.assignee === member.id && t.status !== 'completed'
        );

        return `
            <tr>
                <td>
                    <div class="member-info">
                        <span class="avatar-small">${member.avatar || member.name.charAt(0)}</span>
                        <span>${member.name}</span>
                    </div>
                </td>
                <td>${member.role}</td>
                <td>${member.department}</td>
                <td><span class="status status--${member.status}">${getStatusLabel(member.status)}</span></td>
                <td>
                    <div class="workload-cell">
                        <div class="progress-bar-small">
                            <div class="progress-fill ${getWorkloadClass(member.workload)}" 
                                 style="width: ${member.workload}%"></div>
                        </div>
                        <span class="${getWorkloadClass(member.workload)}">${member.workload}%</span>
                    </div>
                </td>
                <td>${projects.length}</td>
                <td>${tasks.length}</td>
                <td>${Utils.date.format(member.joinDate)}</td>
                <td>
                    <div class="action-buttons">
                        <button class="icon-btn" onclick="Team.showMemberDetail('${member.id}')" title="詳細">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                <circle cx="12" cy="12" r="3"/>
                            </svg>
                        </button>
                        <button class="icon-btn" onclick="Team.editMember('${member.id}')" title="編集">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }

    /**
     * チャートビューのレンダリング
     */
    function renderChartView() {
        return `
            <div class="team-charts">
                <!-- ワークロード分布 -->
                <div class="chart-section">
                    <div class="section-header">
                        <h3>ワークロード分布</h3>
                        <p>メンバー別の現在の負荷状況</p>
                    </div>
                    <div class="chart-container">
                        <canvas id="workload-chart"></canvas>
                    </div>
                </div>

                <!-- スキル分布 -->
                <div class="chart-section">
                    <div class="section-header">
                        <h3>スキル分布</h3>
                        <p>チーム全体のスキルセット</p>
                    </div>
                    <div class="chart-container">
                        <canvas id="skills-chart"></canvas>
                    </div>
                </div>

                <!-- パフォーマンス推移 -->
                <div class="chart-section">
                    <div class="section-header">
                        <h3>チームパフォーマンス</h3>
                        <p>月別のタスク完了数推移</p>
                    </div>
                    <div class="chart-container">
                        <canvas id="performance-chart"></canvas>
                    </div>
                </div>

                <!-- 部署別人員 -->
                <div class="chart-section">
                    <div class="section-header">
                        <h3>部署別人員構成</h3>
                        <p>各部署の人数分布</p>
                    </div>
                    <div class="chart-container-small">
                        <canvas id="department-chart"></canvas>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * メンバー詳細の表示
     */
    function showMemberDetail(memberId) {
        const member = DataStore.teamMembers.getById(memberId);
        if (!member) return;

        currentMember = member;
        
        const projects = DataStore.projects.getAll().filter(p => 
            p.members.includes(member.id)
        );
        const tasks = DataStore.tasks.getAll().filter(t => 
            t.assignee === member.id
        );
        const completedTasks = tasks.filter(t => t.status === 'completed');

        const content = `
            <div class="member-detail">
                <!-- 基本情報 -->
                <div class="member-detail__header">
                    <div class="member-avatar-xlarge">
                        ${member.avatar || member.name.charAt(0)}
                    </div>
                    <div class="member-detail__info">
                        <h2>${member.name}</h2>
                        <p class="member-title">${member.role} - ${member.department}</p>
                        <p class="member-email">${member.email}</p>
                        <div class="member-badges">
                            <span class="status status--${member.status}">${getStatusLabel(member.status)}</span>
                            <span class="badge">入社: ${Utils.date.format(member.joinDate)}</span>
                        </div>
                    </div>
                    <div class="member-detail__actions">
                        <button class="btn btn--outline" onclick="Team.editMember('${member.id}')">
                            プロフィール編集
                        </button>
                        <button class="btn btn--primary" onclick="Team.sendMessage('${member.id}')">
                            メッセージを送る
                        </button>
                    </div>
                </div>

                <!-- 統計情報 -->
                <div class="member-stats-grid">
                    <div class="stat-card">
                        <h4>ワークロード</h4>
                        <div class="big-number ${getWorkloadClass(member.workload)}">${member.workload}%</div>
                        <div class="progress-bar-large">
                            <div class="progress-fill ${getWorkloadClass(member.workload)}" 
                                 style="width: ${member.workload}%"></div>
                        </div>
                    </div>

                    <div class="stat-card">
                        <h4>プロジェクト</h4>
                        <div class="big-number">${projects.length}</div>
                        <p>アクティブ: ${projects.filter(p => p.status === 'active').length}</p>
                    </div>

                    <div class="stat-card">
                        <h4>タスク完了率</h4>
                        <div class="big-number">${tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0}%</div>
                        <p>${completedTasks.length} / ${tasks.length} タスク</p>
                    </div>

                    <div class="stat-card">
                        <h4>勤続期間</h4>
                        <div class="big-number">${calculateTenure(member.joinDate)}</div>
                        <p>経験豊富なメンバー</p>
                    </div>
                </div>

                <!-- スキル -->
                <div class="member-section">
                    <h3>スキル</h3>
                    <div class="skills-list">
                        ${member.skills.map(skill => `
                            <div class="skill-item">
                                <span class="skill-name">${skill}</span>
                                <div class="skill-level">
                                    ${renderSkillLevel(getSkillLevel(skill))}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <!-- 現在のプロジェクト -->
                <div class="member-section">
                    <h3>担当プロジェクト</h3>
                    <div class="project-list">
                        ${projects.length > 0 ? projects.map(project => `
                            <div class="project-item-small">
                                <div class="project-info">
                                    <h4>${project.name}</h4>
                                    <p>役割: ${getProjectRole(member.id, project)}</p>
                                    <div class="project-meta">
                                        <span class="status status--${project.status}">${getStatusLabel(project.status)}</span>
                                        <span>進捗: ${project.progress}%</span>
                                    </div>
                                </div>
                                <button class="btn btn--sm btn--outline" 
                                        onclick="App.navigateTo('projects'); Projects.showProjectDetail('${project.id}')">
                                    詳細
                                </button>
                            </div>
                        `).join('') : '<p class="empty-message">現在担当しているプロジェクトはありません</p>'}
                    </div>
                </div>

                <!-- 最近のアクティビティ -->
                <div class="member-section">
                    <h3>最近のアクティビティ</h3>
                    <div class="activity-list-small">
                        ${renderMemberActivities(member.id)}
                    </div>
                </div>
            </div>
        `;

        Utils.modal.show(content, {
            title: 'メンバー詳細',
            closeOnOverlay: true
        });
    }

    /**
     * フィルタリングされたメンバーを取得
     */
    function getFilteredMembers() {
        let members = DataStore.teamMembers.getAll();

        // 部署フィルター
        if (filters.department !== 'all') {
            members = members.filter(m => m.department === filters.department);
        }

        // ステータスフィルター
        if (filters.status !== 'all') {
            members = members.filter(m => m.status === filters.status);
        }

        // 検索フィルター
        if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            members = members.filter(m => 
                m.name.toLowerCase().includes(searchLower) ||
                m.role.toLowerCase().includes(searchLower) ||
                m.email.toLowerCase().includes(searchLower) ||
                m.skills.some(skill => skill.toLowerCase().includes(searchLower))
            );
        }

        return members;
    }

    /**
     * ワークロードクラスの取得
     */
    function getWorkloadClass(workload) {
        if (workload >= 85) return 'workload-high';
        if (workload >= 70) return 'workload-medium';
        return 'workload-low';
    }

    /**
     * ステータスラベルの取得
     */
    function getStatusLabel(status) {
        const labels = {
            active: 'アクティブ',
            vacation: '休暇中',
            inactive: '非アクティブ'
        };
        return labels[status] || status;
    }

    /**
     * 勤続期間の計算
     */
    function calculateTenure(joinDate) {
        const days = Utils.date.diffInDays(joinDate, new Date());
        const years = Math.floor(days / 365);
        const months = Math.floor((days % 365) / 30);
        
        if (years > 0) {
            return `${years}年${months > 0 ? `${months}ヶ月` : ''}`;
        }
        return `${months}ヶ月`;
    }

    /**
     * スキルレベルの取得（仮実装）
     */
    function getSkillLevel(skill) {
        // 実際のアプリケーションではメンバーごとのスキルレベルを管理
        return Math.floor(Math.random() * 5) + 1;
    }

    /**
     * スキルレベルのレンダリング
     */
    function renderSkillLevel(level) {
        const stars = [];
        for (let i = 1; i <= 5; i++) {
            stars.push(`<span class="star ${i <= level ? 'filled' : ''}">★</span>`);
        }
        return stars.join('');
    }

    /**
     * プロジェクトでの役割取得
     */
    function getProjectRole(memberId, project) {
        if (project.manager === memberId) return 'プロジェクトマネージャー';
        return 'チームメンバー';
    }

    /**
     * メンバーのアクティビティレンダリング
     */
    function renderMemberActivities(memberId) {
        const activities = DataStore.activities.getRecent(50)
            .filter(a => a.userId === memberId)
            .slice(0, 5);

        if (activities.length === 0) {
            return '<p class="empty-message">最近のアクティビティはありません</p>';
        }

        return activities.map(activity => `
            <div class="activity-item-small">
                <span class="activity-time">${Utils.date.relative(activity.timestamp)}</span>
                <span class="activity-action">${activity.action}</span>
            </div>
        `).join('');
    }

    /**
     * チャートの初期化
     */
    function initializeCharts() {
        setTimeout(() => {
            if (currentView === 'chart') {
                initWorkloadChart();
                initSkillsChart();
                initPerformanceChart();
                initDepartmentChart();
            }
        }, 100);
    }

    /**
     * ワークロードチャートの初期化
     */
    function initWorkloadChart() {
        const ctx = document.getElementById('workload-chart');
        if (!ctx) return;

        const members = getFilteredMembers();
        const data = members.map(m => ({
            name: m.name,
            workload: m.workload
        })).sort((a, b) => b.workload - a.workload);

        if (charts.workload) {
            charts.workload.destroy();
        }

        charts.workload = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.map(d => d.name),
                datasets: [{
                    label: 'ワークロード (%)',
                    data: data.map(d => d.workload),
                    backgroundColor: data.map(d => {
                        if (d.workload >= 85) return 'rgba(255, 84, 89, 0.8)';
                        if (d.workload >= 70) return 'rgba(230, 129, 97, 0.8)';
                        return 'rgba(50, 184, 198, 0.8)';
                    }),
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        grid: {
                            color: 'rgba(119, 124, 124, 0.1)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }

    /**
     * スキルチャートの初期化
     */
    function initSkillsChart() {
        const ctx = document.getElementById('skills-chart');
        if (!ctx) return;

        const members = getFilteredMembers();
        const allSkills = members.reduce((skills, member) => {
            member.skills.forEach(skill => {
                skills[skill] = (skills[skill] || 0) + 1;
            });
            return skills;
        }, {});

        const sortedSkills = Object.entries(allSkills)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);

        if (charts.skills) {
            charts.skills.destroy();
        }

        charts.skills = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: sortedSkills.map(s => s[0]),
                datasets: [{
                    label: 'スキル保有者数',
                    data: sortedSkills.map(s => s[1]),
                    backgroundColor: 'rgba(50, 184, 198, 0.2)',
                    borderColor: 'rgba(50, 184, 198, 1)',
                    pointBackgroundColor: 'rgba(50, 184, 198, 1)',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: 'rgba(50, 184, 198, 1)'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    r: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(119, 124, 124, 0.1)'
                        }
                    }
                }
            }
        });
    }

    /**
     * パフォーマンスチャートの初期化
     */
    function initPerformanceChart() {
        const ctx = document.getElementById('performance-chart');
        if (!ctx) return;

        // 仮のデータ（実際はDataStoreから集計）
        const months = ['1月', '2月', '3月', '4月', '5月', '6月'];
        const taskData = months.map(() => Math.floor(Math.random() * 50) + 30);

        if (charts.performance) {
            charts.performance.destroy();
        }

        charts.performance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: months,
                datasets: [{
                    label: '完了タスク数',
                    data: taskData,
                    borderColor: 'rgba(50, 184, 198, 1)',
                    backgroundColor: 'rgba(50, 184, 198, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(119, 124, 124, 0.1)'
                        }
                    },
                    x: {
                        grid: {
                            color: 'rgba(119, 124, 124, 0.1)'
                        }
                    }
                }
            }
        });
    }

    /**
     * 部署別チャートの初期化
     */
    function initDepartmentChart() {
        const ctx = document.getElementById('department-chart');
        if (!ctx) return;

        const members = DataStore.teamMembers.getAll();
        const departments = members.reduce((deps, member) => {
            deps[member.department] = (deps[member.department] || 0) + 1;
            return deps;
        }, {});

        if (charts.department) {
            charts.department.destroy();
        }

        charts.department = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(departments),
                datasets: [{
                    data: Object.values(departments),
                    backgroundColor: [
                        'rgba(50, 184, 198, 0.8)',
                        'rgba(230, 129, 97, 0.8)',
                        'rgba(255, 193, 7, 0.8)',
                        'rgba(167, 169, 169, 0.8)'
                    ],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    /**
     * イベントリスナーの設定
     */
    function setupEventListeners() {
        // チャートビューの場合は初期化
        if (currentView === 'chart') {
            initializeCharts();
        }
    }

    /**
     * メンバー追加処理
     */
    function handleAddMember(e) {
        e.preventDefault();

        const formData = {
            name: document.getElementById('member-name').value,
            email: document.getElementById('member-email').value,
            role: document.getElementById('member-role').value,
            department: document.getElementById('member-department').value,
            skills: document.getElementById('member-skills').value
                .split(',')
                .map(skill => skill.trim())
                .filter(skill => skill),
            joinDate: document.getElementById('member-join-date').value,
            status: document.getElementById('member-status').value,
            workload: 0,
            avatar: null
        };

        // バリデーション
        if (!formData.name || !formData.email || !formData.role) {
            Utils.toast.show('必須項目を入力してください', 'error');
            return;
        }

        if (!Utils.string.isValidEmail(formData.email)) {
            Utils.toast.show('正しいメールアドレスを入力してください', 'error');
            return;
        }

        // メンバーを追加
        DataStore.teamMembers.create(formData);

        // モーダルを閉じる
        Utils.modal.hide(document.querySelector('.modal'));

        // 成功メッセージ
        Utils.toast.show('メンバーを追加しました', 'success');

        // リストを更新
        render(container);
    }

    /**
     * メンバー更新処理
     */
    function handleUpdateMember(e, memberId) {
        e.preventDefault();

        const formData = {
            name: document.getElementById('member-name').value,
            email: document.getElementById('member-email').value,
            role: document.getElementById('member-role').value,
            department: document.getElementById('member-department').value,
            skills: document.getElementById('member-skills').value
                .split(',')
                .map(skill => skill.trim())
                .filter(skill => skill),
            workload: parseInt(document.getElementById('member-workload').value) || 0,
            status: document.getElementById('member-status').value
        };

        // メンバー更新
        DataStore.teamMembers.update(memberId, formData);

        // モーダルを閉じる
        Utils.modal.hide(document.querySelector('.modal'));

        // 成功メッセージ
        Utils.toast.show('メンバー情報を更新しました', 'success');

        // リストを更新
        render(container);
    }

    // Public API
    return {
        render,

        /**
         * ビューの切り替え
         */
        switchView(view) {
            currentView = view;
            document.getElementById('team-content').innerHTML = renderTeamView();
            
            // ビューボタンのアクティブ状態を更新
            document.querySelectorAll('.view-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            event.target.closest('.view-btn').classList.add('active');
            
            // チャートビューの場合は初期化
            if (view === 'chart') {
                initializeCharts();
            }
        },

        /**
         * フィルターの適用
         */
        applyFilters() {
            filters.department = document.getElementById('department-filter').value;
            filters.status = document.getElementById('status-filter').value;
            document.getElementById('team-content').innerHTML = renderTeamView();
            
            if (currentView === 'chart') {
                initializeCharts();
            }
        },

        /**
         * 検索処理
         */
        handleSearch() {
            filters.search = document.getElementById('member-search').value;
            document.getElementById('team-content').innerHTML = renderTeamView();
        },

        /**
         * メンバー詳細表示
         */
        showMemberDetail,

        /**
         * メンバー追加モーダル
         */
        showAddMemberModal() {
            const content = `
                <form id="add-member-form" class="member-form">
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">名前 <span class="required">*</span></label>
                            <input type="text" class="form-control" id="member-name" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">メールアドレス <span class="required">*</span></label>
                            <input type="email" class="form-control" id="member-email" required>
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">役職 <span class="required">*</span></label>
                            <input type="text" class="form-control" id="member-role" required 
                                   placeholder="例: フロントエンドエンジニア">
                        </div>
                        <div class="form-group">
                            <label class="form-label">部署</label>
                            <select class="form-control" id="member-department">
                                <option value="開発部">開発部</option>
                                <option value="デザイン部">デザイン部</option>
                                <option value="品質保証部">品質保証部</option>
                                <option value="分析部">分析部</option>
                                <option value="営業部">営業部</option>
                            </select>
                        </div>
                    </div>

                    <div class="form-group">
                        <label class="form-label">スキル（カンマ区切り）</label>
                        <input type="text" class="form-control" id="member-skills" 
                               placeholder="例: JavaScript, React, TypeScript">
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">入社日</label>
                            <input type="date" class="form-control" id="member-join-date" 
                                   value="${Utils.date.format(new Date(), 'YYYY-MM-DD')}">
                        </div>
                        <div class="form-group">
                            <label class="form-label">ステータス</label>
                            <select class="form-control" id="member-status">
                                <option value="active">アクティブ</option>
                                <option value="vacation">休暇中</option>
                                <option value="inactive">非アクティブ</option>
                            </select>
                        </div>
                    </div>

                    <div class="form-actions">
                        <button type="button" class="btn btn--outline" onclick="Utils.modal.hide(document.querySelector('.modal'))">
                            キャンセル
                        </button>
                        <button type="submit" class="btn btn--primary">
                            メンバーを追加
                        </button>
                    </div>
                </form>
            `;

            const modal = Utils.modal.show(content, {
                title: '新規メンバー追加',
                closeOnOverlay: false
            });

            // フォーム送信イベント
            document.getElementById('add-member-form').addEventListener('submit', handleAddMember);
        },

        /**
         * メンバー編集
         */
        editMember(memberId) {
            const member = DataStore.teamMembers.getById(memberId);
            if (!member) return;

            const content = `
                <form id="edit-member-form" class="member-form">
                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">名前 <span class="required">*</span></label>
                            <input type="text" class="form-control" id="member-name" value="${member.name}" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">メールアドレス <span class="required">*</span></label>
                            <input type="email" class="form-control" id="member-email" value="${member.email}" required>
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">役職 <span class="required">*</span></label>
                            <input type="text" class="form-control" id="member-role" value="${member.role}" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">部署</label>
                            <select class="form-control" id="member-department">
                                <option value="開発部" ${member.department === '開発部' ? 'selected' : ''}>開発部</option>
                                <option value="デザイン部" ${member.department === 'デザイン部' ? 'selected' : ''}>デザイン部</option>
                                <option value="品質保証部" ${member.department === '品質保証部' ? 'selected' : ''}>品質保証部</option>
                                <option value="分析部" ${member.department === '分析部' ? 'selected' : ''}>分析部</option>
                                <option value="営業部" ${member.department === '営業部' ? 'selected' : ''}>営業部</option>
                            </select>
                        </div>
                    </div>

                    <div class="form-group">
                        <label class="form-label">スキル（カンマ区切り）</label>
                        <input type="text" class="form-control" id="member-skills" 
                               value="${member.skills.join(', ')}">
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">ワークロード（%）</label>
                            <input type="number" class="form-control" id="member-workload" 
                                   min="0" max="100" value="${member.workload}">
                        </div>
                        <div class="form-group">
                            <label class="form-label">ステータス</label>
                            <select class="form-control" id="member-status">
                                <option value="active" ${member.status === 'active' ? 'selected' : ''}>アクティブ</option>
                                <option value="vacation" ${member.status === 'vacation' ? 'selected' : ''}>休暇中</option>
                                <option value="inactive" ${member.status === 'inactive' ? 'selected' : ''}>非アクティブ</option>
                            </select>
                        </div>
                    </div>

                    <div class="form-actions">
                        <button type="button" class="btn btn--outline" onclick="Utils.modal.hide(document.querySelector('.modal'))">
                            キャンセル
                        </button>
                        <button type="submit" class="btn btn--primary">
                            更新
                        </button>
                    </div>
                </form>
            `;

            const modal = Utils.modal.show(content, {
                title: 'メンバー情報編集',
                closeOnOverlay: false
            });

            // フォーム送信イベント
            document.getElementById('edit-member-form').addEventListener('submit', (e) => {
                e.preventDefault();
                handleUpdateMember(e, memberId);
            });
        },

        /**
         * タスク割り当て
         */
        assignTask(memberId) {
            App.navigateTo('projects');
            Utils.toast.show('プロジェクトページからタスクを作成してください', 'info');
        },

        /**
         * メッセージ送信
         */
        sendMessage(memberId) {
            Utils.toast.show('メッセージ機能は開発中です', 'info');
        },

        /**
         * チームデータのエクスポート
         */
        exportTeamData() {
            const members = getFilteredMembers();
            const exportData = members.map(m => ({
                '名前': m.name,
                'メールアドレス': m.email,
                '役職': m.role,
                '部署': m.department,
                'ステータス': getStatusLabel(m.status),
                'ワークロード': m.workload + '%',
                'スキル': m.skills.join(', '),
                '入社日': m.joinDate
            }));

            Utils.export.csv(exportData, `チームメンバー_${Utils.date.format(new Date(), 'YYYYMMDD')}.csv`);
            Utils.toast.show('チームデータをエクスポートしました', 'success');
        }
    };
})();

// グローバルに公開
window.Team = Team;