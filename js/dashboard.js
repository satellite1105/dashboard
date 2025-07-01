/**
 * ダッシュボード機能
 * プロジェクトの概要、統計、アクティビティを表示
 */

const Dashboard = (function() {
    'use strict';

    // プライベート変数
    let container = null;
    let charts = {
        weekly: null,
        projectProgress: null,
        taskDistribution: null
    };

    /**
     * ダッシュボードのレンダリング
     */
    function render(element) {
        container = element;
        const stats = DataStore.getStats();
        const projects = DataStore.projects.getAll();
        const activities = DataStore.activities.getRecent(10);
        const tasks = DataStore.tasks.getAll();

        container.innerHTML = `
            <div class="dashboard-content">
                <!-- ヘッダー -->
                <div class="dashboard-header">
                    <h2>ダッシュボード</h2>
                    <p>プロジェクトの進捗状況を一目で確認</p>
                </div>

                <!-- 統計カード -->
                <div class="stats-grid">
                    ${renderStatCard('アクティブプロジェクト', stats.activeProjects, 'project', getProjectTrend())}
                    ${renderStatCard('完了タスク', stats.completedTasks, 'task-complete', getTaskTrend())}
                    ${renderStatCard('チームメンバー', stats.teamMembers, 'team', { value: 0, label: '変化なし' })}
                    ${renderStatCard('完了率', stats.completionRate + '%', 'progress', getCompletionTrend())}
                </div>

                <!-- メイングリッド -->
                <div class="dashboard-grid">
                    <!-- 週間進捗チャート -->
                    <div class="card chart-card">
                        <div class="card-header">
                            <div>
                                <h3>週間タスク進捗</h3>
                                <p>今週のタスク完了状況</p>
                            </div>
                            <button class="btn btn--sm btn--outline" onclick="Dashboard.exportWeeklyData()">
                                エクスポート
                            </button>
                        </div>
                        <div class="chart-container">
                            <canvas id="weekly-chart"></canvas>
                        </div>
                    </div>

                    <!-- プロジェクト一覧 -->
                    <div class="card">
                        <div class="card-header">
                            <div>
                                <h3>プロジェクト進捗</h3>
                                <p>各プロジェクトの進行状況</p>
                            </div>
                            <a href="#projects" class="btn btn--sm btn--outline" onclick="App.navigateTo('projects')">
                                すべて見る
                            </a>
                        </div>
                        <div class="projects-list">
                            ${renderProjectsList(projects.slice(0, 5))}
                        </div>
                    </div>

                    <!-- アクティビティ -->
                    <div class="card">
                        <div class="card-header">
                            <div>
                                <h3>最近のアクティビティ</h3>
                            </div>
                        </div>
                        <div class="activity-list" id="activity-list">
                            ${renderActivityList(activities)}
                        </div>
                    </div>

                    <!-- タスク分布チャート -->
                    <div class="card">
                        <div class="card-header">
                            <div>
                                <h3>タスク分布</h3>
                                <p>ステータス別タスク数</p>
                            </div>
                        </div>
                        <div class="chart-container-small">
                            <canvas id="task-distribution-chart"></canvas>
                        </div>
                    </div>

                    <!-- クイックアクション -->
                    <div class="card">
                        <div class="card-header">
                            <div>
                                <h3>クイックアクション</h3>
                            </div>
                        </div>
                        <div class="quick-actions">
                            <button class="quick-action-btn" onclick="Dashboard.showNewProjectModal()">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <line x1="12" y1="5" x2="12" y2="19"/>
                                    <line x1="5" y1="12" x2="19" y2="12"/>
                                </svg>
                                <span>新規プロジェクト</span>
                            </button>
                            <button class="quick-action-btn" onclick="Dashboard.showNewTaskModal()">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M9 11l3 3L22 4"/>
                                    <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
                                </svg>
                                <span>新規タスク</span>
                            </button>
                            <button class="quick-action-btn" onclick="Dashboard.generateReport()">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                                    <polyline points="14 2 14 8 20 8"/>
                                    <line x1="16" y1="13" x2="8" y2="13"/>
                                    <line x1="16" y1="17" x2="8" y2="17"/>
                                </svg>
                                <span>レポート生成</span>
                            </button>
                        </div>
                    </div>

                    <!-- 予算概要 -->
                    <div class="card">
                        <div class="card-header">
                            <div>
                                <h3>予算使用状況</h3>
                                <p>プロジェクト全体の予算管理</p>
                            </div>
                        </div>
                        <div class="budget-overview">
                            <div class="budget-stat">
                                <span class="budget-label">総予算</span>
                                <span class="budget-value">${Utils.number.currency(stats.totalBudget)}</span>
                            </div>
                            <div class="budget-stat">
                                <span class="budget-label">使用済み</span>
                                <span class="budget-value">${Utils.number.currency(stats.totalSpent)}</span>
                            </div>
                            <div class="budget-stat">
                                <span class="budget-label">使用率</span>
                                <span class="budget-value">${stats.budgetUsage}%</span>
                            </div>
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: ${stats.budgetUsage}%"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // チャートの初期化
        initializeCharts();
        
        // イベントリスナーの設定
        setupEventListeners();
    }

    /**
     * 統計カードのレンダリング
     */
    function renderStatCard(title, value, type, trend) {
        const trendClass = trend.value > 0 ? 'positive' : trend.value < 0 ? 'negative' : 'neutral';
        const trendIcon = trend.value > 0 ? '↑' : trend.value < 0 ? '↓' : '→';
        
        return `
            <div class="stat-card">
                <div class="stat-card__icon">
                    ${getStatIcon(type)}
                </div>
                <div class="stat-card__content">
                    <h3>${title}</h3>
                    <div class="stat-card__number">${value}</div>
                    <div class="stat-card__change ${trendClass}">
                        ${trendIcon} ${Math.abs(trend.value)}% ${trend.label}
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * 統計アイコンの取得
     */
    function getStatIcon(type) {
        const icons = {
            'project': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>',
            'task-complete': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 11 12 14 22 4"/><path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9c1.67 0 3.22.46 4.56 1.25"/></svg>',
            'team': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
            'progress': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>'
        };
        return icons[type] || '';
    }

    /**
     * プロジェクトリストのレンダリング
     */
    function renderProjectsList(projects) {
        if (projects.length === 0) {
            return '<div class="empty-state">プロジェクトがありません</div>';
        }

        return projects.map(project => `
            <div class="project-item" data-project-id="${project.id}">
                <div class="project-info">
                    <div class="project-header">
                        <div class="project-name">${project.name}</div>
                        <span class="project-status status status--${project.status}">
                            ${getStatusLabel(project.status)}
                        </span>
                    </div>
                    <div class="project-meta">
                        <span class="project-date">期限: ${Utils.date.format(project.endDate)}</span>
                        <span class="project-manager">担当: ${getManagerName(project.manager)}</span>
                    </div>
                    <div class="project-progress">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${project.progress}%"></div>
                        </div>
                        <span>${project.progress}%</span>
                    </div>
                </div>
            </div>
        `).join('');
    }

    /**
     * アクティビティリストのレンダリング
     */
    function renderActivityList(activities) {
        if (activities.length === 0) {
            return '<div class="empty-state">アクティビティがありません</div>';
        }

        return activities.map(activity => `
            <div class="activity-item">
                <div class="activity-avatar">${getActivityAvatar(activity)}</div>
                <div class="activity-content">
                    <div class="activity-text">
                        <strong>${activity.userName}</strong>が${activity.action}
                    </div>
                    <div class="activity-time">${Utils.date.relative(activity.timestamp)}</div>
                </div>
            </div>
        `).join('');
    }

    /**
     * アクティビティアバターの取得
     */
    function getActivityAvatar(activity) {
        if (activity.type === 'system') return '🔧';
        if (activity.type === 'project') return '📁';
        if (activity.type === 'task') return '✓';
        return activity.userName.charAt(0);
    }

    /**
     * チャートの初期化
     */
    function initializeCharts() {
        // 週間タスク進捗チャート
        initWeeklyChart();
        
        // タスク分布チャート
        initTaskDistributionChart();
    }

    /**
     * 週間チャートの初期化
     */
    function initWeeklyChart() {
        const ctx = document.getElementById('weekly-chart');
        if (!ctx) return;

        const weekData = generateWeeklyData();

        if (charts.weekly) {
            charts.weekly.destroy();
        }

        charts.weekly = new Chart(ctx, {
            type: 'line',
            data: {
                labels: weekData.labels,
                datasets: [{
                    label: '完了タスク',
                    data: weekData.completed,
                    borderColor: 'rgba(50, 184, 198, 1)',
                    backgroundColor: 'rgba(50, 184, 198, 0.1)',
                    tension: 0.4,
                    fill: true
                }, {
                    label: '新規タスク',
                    data: weekData.created,
                    borderColor: 'rgba(230, 129, 97, 1)',
                    backgroundColor: 'rgba(230, 129, 97, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                    }
                },
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
     * タスク分布チャートの初期化
     */
    function initTaskDistributionChart() {
        const ctx = document.getElementById('task-distribution-chart');
        if (!ctx) return;

        const tasks = DataStore.tasks.getAll();
        const distribution = {
            todo: tasks.filter(t => t.status === 'todo').length,
            in_progress: tasks.filter(t => t.status === 'in_progress').length,
            completed: tasks.filter(t => t.status === 'completed').length
        };

        if (charts.taskDistribution) {
            charts.taskDistribution.destroy();
        }

        charts.taskDistribution = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['未着手', '進行中', '完了'],
                datasets: [{
                    data: [distribution.todo, distribution.in_progress, distribution.completed],
                    backgroundColor: [
                        'rgba(230, 129, 97, 0.8)',
                        'rgba(50, 184, 198, 0.8)',
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
                        position: 'bottom',
                    }
                }
            }
        });
    }

    /**
     * 週間データの生成
     */
    function generateWeeklyData() {
        const days = ['月', '火', '水', '木', '金', '土', '日'];
        const today = new Date();
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay() + 1);

        const completed = [];
        const created = [];

        // 仮のデータ生成（実際のアプリケーションではDataStoreから取得）
        for (let i = 0; i < 7; i++) {
            completed.push(Math.floor(Math.random() * 10) + 2);
            created.push(Math.floor(Math.random() * 8) + 1);
        }

        return {
            labels: days,
            completed,
            created
        };
    }

    /**
     * トレンドデータの取得
     */
    function getProjectTrend() {
        // 実際のアプリケーションでは過去のデータと比較
        return { value: 12, label: '先月比' };
    }

    function getTaskTrend() {
        return { value: 8, label: '先週比' };
    }

    function getCompletionTrend() {
        return { value: 5, label: '先月比' };
    }

    /**
     * ステータスラベルの取得
     */
    function getStatusLabel(status) {
        const labels = {
            'active': '進行中',
            'planning': '計画中',
            'completed': '完了',
            'on_hold': '保留中'
        };
        return labels[status] || status;
    }

    /**
     * マネージャー名の取得
     */
    function getManagerName(managerId) {
        const member = DataStore.teamMembers.getById(managerId);
        return member ? member.name : '未割当';
    }

    /**
     * イベントリスナーの設定
     */
    function setupEventListeners() {
        // プロジェクトアイテムのクリック
        container.querySelectorAll('.project-item').forEach(item => {
            item.addEventListener('click', () => {
                const projectId = item.getAttribute('data-project-id');
                showProjectDetails(projectId);
            });
        });
    }

    /**
     * プロジェクト詳細の表示
     */
    function showProjectDetails(projectId) {
        const project = DataStore.projects.getById(projectId);
        if (!project) return;

        const content = `
            <div class="project-details">
                <h4>${project.name}</h4>
                <p>${project.description}</p>
                <div class="project-details-grid">
                    <div>
                        <strong>ステータス:</strong> ${getStatusLabel(project.status)}
                    </div>
                    <div>
                        <strong>進捗:</strong> ${project.progress}%
                    </div>
                    <div>
                        <strong>期間:</strong> ${Utils.date.format(project.startDate)} 〜 ${Utils.date.format(project.endDate)}
                    </div>
                    <div>
                        <strong>予算:</strong> ${Utils.number.currency(project.budget)}
                    </div>
                </div>
            </div>
        `;

        Utils.modal.show(content, {
            title: 'プロジェクト詳細',
            closeOnOverlay: true
        });
    }

    // Public API
    return {
        /**
         * ダッシュボードのレンダリング
         */
        render,

        /**
         * アクティビティの更新
         */
        updateActivity(activity) {
            const activityList = document.getElementById('activity-list');
            if (!activityList) return;

            const activities = DataStore.activities.getRecent(10);
            activityList.innerHTML = renderActivityList(activities);
        },

        /**
         * 新規プロジェクトモーダルの表示
         */
        showNewProjectModal() {
            App.navigateTo('projects');
            setTimeout(() => {
                if (window.Projects && typeof Projects.showNewProjectModal === 'function') {
                    Projects.showNewProjectModal();
                }
            }, 200);
        },

        /**
         * 新規タスクモーダルの表示
         */
        showNewTaskModal() {
            App.navigateTo('projects');
            setTimeout(() => {
                Utils.toast.show('プロジェクトページから新規タスクを作成できます', 'info');
            }, 200);  // setTimeoutを追加
        },

        /**
         * レポート生成
         */
        generateReport() {
            App.navigateTo('reports');
        },

        /**
         * 週間データのエクスポート
         */
        exportWeeklyData() {
            const weekData = generateWeeklyData();
            const exportData = weekData.labels.map((label, index) => ({
                '曜日': label,
                '完了タスク': weekData.completed[index],
                '新規タスク': weekData.created[index]
            }));

            Utils.export.csv(exportData, `週間タスク進捗_${Utils.date.format(new Date(), 'YYYYMMDD')}.csv`);
            Utils.toast.show('CSVファイルをダウンロードしました', 'success');
        }
    };
})();

// グローバルに公開
window.Dashboard = Dashboard;