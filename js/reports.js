/**
 * レポート機能
 * プロジェクトとタスクの分析レポートを生成・管理
 */

const Reports = (function() {
    'use strict';

    // プライベート変数
    let container = null;
    let charts = {
        projectOverview: null,
        taskCompletion: null,
        budgetAnalysis: null,
        teamPerformance: null
    };
    let currentPeriod = 'monthly';
    let currentFilters = {
        projects: 'all',
        dateRange: {
            start: null,
            end: null
        }
    };

    /**
     * レポートページのレンダリング
     */
    function render(element) {
        container = element;
        
        // デフォルトの日付範囲を設定（過去30日）
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - 30);
        
        currentFilters.dateRange = {
            start: Utils.date.format(startDate, 'YYYY-MM-DD'),
            end: Utils.date.format(endDate, 'YYYY-MM-DD')
        };

        container.innerHTML = `
            <div class="reports-page">
                <!-- ページヘッダー -->
                <div class="page-header">
                    <div class="page-header__left">
                        <h2>レポート</h2>
                        <p>プロジェクトの詳細な分析とレポート</p>
                    </div>
                    <div class="page-header__right">
                        <button class="btn btn--primary" onclick="Reports.generateCustomReport()">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                                <polyline points="14 2 14 8 20 8"/>
                                <line x1="16" y1="13" x2="8" y2="13"/>
                                <line x1="16" y1="17" x2="8" y2="17"/>
                            </svg>
                            カスタムレポート作成
                        </button>
                    </div>
                </div>

                <!-- フィルターバー -->
                <div class="report-filters">
                    <div class="filter-group">
                        <label class="filter-label">期間</label>
                        <select class="form-control" id="period-filter" onchange="Reports.changePeriod()">
                            <option value="weekly">週次</option>
                            <option value="monthly" selected>月次</option>
                            <option value="quarterly">四半期</option>
                            <option value="yearly">年次</option>
                            <option value="custom">カスタム</option>
                        </select>
                    </div>

                    <div class="filter-group">
                        <label class="filter-label">プロジェクト</label>
                        <select class="form-control" id="project-filter" onchange="Reports.applyFilters()">
                            <option value="all">すべてのプロジェクト</option>
                            ${DataStore.projects.getAll().map(p => 
                                `<option value="${p.id}">${p.name}</option>`
                            ).join('')}
                        </select>
                    </div>

                    <div class="filter-group date-range" id="custom-date-range" style="display: none;">
                        <label class="filter-label">開始日</label>
                        <input type="date" class="form-control" id="start-date" value="${currentFilters.dateRange.start}">
                        <label class="filter-label">終了日</label>
                        <input type="date" class="form-control" id="end-date" value="${currentFilters.dateRange.end}">
                        <button class="btn btn--sm btn--outline" onclick="Reports.applyDateRange()">適用</button>
                    </div>

                    <div class="filter-actions">
                        <button class="btn btn--outline" onclick="Reports.exportReport()">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                <polyline points="7 10 12 15 17 10"/>
                                <line x1="12" y1="15" x2="12" y2="3"/>
                            </svg>
                            エクスポート
                        </button>
                        <button class="btn btn--outline" onclick="Reports.printReport()">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="6 9 6 2 18 2 18 9"/>
                                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
                                <rect x="6" y="14" width="12" height="8"/>
                            </svg>
                            印刷
                        </button>
                    </div>
                </div>

                <!-- サマリーカード -->
                <div class="report-summary">
                    ${renderSummaryCards()}
                </div>

                <!-- レポートコンテンツ -->
                <div class="report-content">
                    <!-- プロジェクト概要 -->
                    <div class="report-section">
                        <div class="section-header">
                            <h3>プロジェクト概要</h3>
                            <p>期間中のプロジェクト進捗状況</p>
                        </div>
                        <div class="chart-container">
                            <canvas id="project-overview-chart"></canvas>
                        </div>
                    </div>

                    <!-- タスク完了率 -->
                    <div class="report-section">
                        <div class="section-header">
                            <h3>タスク完了率</h3>
                            <p>期間中のタスク完了状況の推移</p>
                        </div>
                        <div class="chart-container">
                            <canvas id="task-completion-chart"></canvas>
                        </div>
                    </div>

                    <!-- 予算分析 -->
                    <div class="report-section">
                        <div class="section-header">
                            <h3>予算分析</h3>
                            <p>プロジェクト別の予算使用状況</p>
                        </div>
                        <div class="chart-container">
                            <canvas id="budget-analysis-chart"></canvas>
                        </div>
                    </div>

                    <!-- チームパフォーマンス -->
                    <div class="report-section">
                        <div class="section-header">
                            <h3>チームパフォーマンス</h3>
                            <p>メンバー別のタスク完了数</p>
                        </div>
                        <div class="chart-container">
                            <canvas id="team-performance-chart"></canvas>
                        </div>
                    </div>

                    <!-- 詳細テーブル -->
                    <div class="report-section">
                        <div class="section-header">
                            <h3>プロジェクト詳細</h3>
                            <p>各プロジェクトの詳細データ</p>
                        </div>
                        <div class="report-table-container">
                            ${renderProjectTable()}
                        </div>
                    </div>

                    <!-- アクティビティログ -->
                    <div class="report-section">
                        <div class="section-header">
                            <h3>期間中のアクティビティ</h3>
                            <p>重要なアクティビティの記録</p>
                        </div>
                        <div class="activity-timeline">
                            ${renderActivityTimeline()}
                        </div>
                    </div>
                </div>

                <!-- レポートテンプレート -->
                <div class="report-templates">
                    <h3>レポートテンプレート</h3>
                    <div class="template-grid">
                        ${renderReportTemplates()}
                    </div>
                </div>
            </div>
        `;

        // チャートの初期化
        initializeCharts();
    }

    /**
     * サマリーカードのレンダリング
     */
    function renderSummaryCards() {
        const data = calculateSummaryData();

        return `
            <div class="summary-card">
                <div class="summary-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                    </svg>
                </div>
                <div class="summary-content">
                    <h4>完了プロジェクト</h4>
                    <div class="summary-value">${data.completedProjects}</div>
                    <div class="summary-change positive">
                        <span>前期比 +${data.projectGrowth}%</span>
                    </div>
                </div>
            </div>

            <div class="summary-card">
                <div class="summary-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="9 11 12 14 22 4"/>
                        <path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9c1.67 0 3.22.46 4.56 1.25"/>
                    </svg>
                </div>
                <div class="summary-content">
                    <h4>完了タスク</h4>
                    <div class="summary-value">${data.completedTasks}</div>
                    <div class="summary-change positive">
                        <span>完了率 ${data.taskCompletionRate}%</span>
                    </div>
                </div>
            </div>

            <div class="summary-card">
                <div class="summary-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="12" y1="1" x2="12" y2="23"/>
                        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                    </svg>
                </div>
                <div class="summary-content">
                    <h4>予算使用率</h4>
                    <div class="summary-value">${data.budgetUsage}%</div>
                    <div class="summary-change ${data.budgetStatus}">
                        <span>${data.budgetStatusText}</span>
                    </div>
                </div>
            </div>

            <div class="summary-card">
                <div class="summary-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                        <circle cx="12" cy="7" r="4"/>
                    </svg>
                </div>
                <div class="summary-content">
                    <h4>チーム生産性</h4>
                    <div class="summary-value">${data.teamProductivity}</div>
                    <div class="summary-change positive">
                        <span>タスク/人</span>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * サマリーデータの計算
     */
    function calculateSummaryData() {
        const projects = getFilteredProjects();
        const tasks = getFilteredTasks();
        const teamMembers = DataStore.teamMembers.getAll();

        const completedProjects = projects.filter(p => p.status === 'completed').length;
        const completedTasks = tasks.filter(t => t.status === 'completed').length;
        const totalBudget = projects.reduce((sum, p) => sum + p.budget, 0);
        const usedBudget = projects.reduce((sum, p) => sum + p.spent, 0);
        const budgetUsage = totalBudget > 0 ? Math.round((usedBudget / totalBudget) * 100) : 0;

        return {
            completedProjects,
            projectGrowth: 15, // 仮の値
            completedTasks,
            taskCompletionRate: tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0,
            budgetUsage,
            budgetStatus: budgetUsage > 80 ? 'negative' : 'positive',
            budgetStatusText: budgetUsage > 80 ? '予算超過注意' : '予算内',
            teamProductivity: teamMembers.length > 0 ? Math.round(completedTasks / teamMembers.length) : 0
        };
    }

    /**
     * フィルタリングされたプロジェクトを取得
     */
    function getFilteredProjects() {
        let projects = DataStore.projects.getAll();
        
        if (currentFilters.projects !== 'all') {
            projects = projects.filter(p => p.id === currentFilters.projects);
        }

        // 日付範囲でフィルタリング
        if (currentFilters.dateRange.start && currentFilters.dateRange.end) {
            projects = projects.filter(p => {
                const projectStart = new Date(p.startDate);
                const projectEnd = new Date(p.endDate);
                const filterStart = new Date(currentFilters.dateRange.start);
                const filterEnd = new Date(currentFilters.dateRange.end);
                
                return (projectStart <= filterEnd && projectEnd >= filterStart);
            });
        }

        return projects;
    }

    /**
     * フィルタリングされたタスクを取得
     */
    function getFilteredTasks() {
        let tasks = DataStore.tasks.getAll();
        
        if (currentFilters.projects !== 'all') {
            tasks = tasks.filter(t => t.projectId === currentFilters.projects);
        }

        // 日付範囲でフィルタリング
        if (currentFilters.dateRange.start && currentFilters.dateRange.end) {
            tasks = tasks.filter(t => {
                const taskDate = new Date(t.createdAt);
                const filterStart = new Date(currentFilters.dateRange.start);
                const filterEnd = new Date(currentFilters.dateRange.end);
                
                return taskDate >= filterStart && taskDate <= filterEnd;
            });
        }

        return tasks;
    }

    /**
     * チャートの初期化
     */
    function initializeCharts() {
        // プロジェクト概要チャート
        initProjectOverviewChart();
        
        // タスク完了率チャート
        initTaskCompletionChart();
        
        // 予算分析チャート
        initBudgetAnalysisChart();
        
        // チームパフォーマンスチャート
        initTeamPerformanceChart();
    }

    /**
     * プロジェクト概要チャートの初期化
     */
    function initProjectOverviewChart() {
        const ctx = document.getElementById('project-overview-chart');
        if (!ctx) return;

        const projects = getFilteredProjects();
        const statusCounts = {
            planning: projects.filter(p => p.status === 'planning').length,
            active: projects.filter(p => p.status === 'active').length,
            on_hold: projects.filter(p => p.status === 'on_hold').length,
            completed: projects.filter(p => p.status === 'completed').length
        };

        if (charts.projectOverview) {
            charts.projectOverview.destroy();
        }

        charts.projectOverview = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['計画中', '進行中', '保留中', '完了'],
                datasets: [{
                    data: [statusCounts.planning, statusCounts.active, statusCounts.on_hold, statusCounts.completed],
                    backgroundColor: [
                        'rgba(230, 129, 97, 0.8)',
                        'rgba(50, 184, 198, 0.8)',
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
                        position: 'right'
                    },
                    title: {
                        display: false
                    }
                }
            }
        });
    }

    /**
     * タスク完了率チャートの初期化
     */
    function initTaskCompletionChart() {
        const ctx = document.getElementById('task-completion-chart');
        if (!ctx) return;

        const data = generateTaskCompletionData();

        if (charts.taskCompletion) {
            charts.taskCompletion.destroy();
        }

        charts.taskCompletion = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.labels,
                datasets: [{
                    label: '完了タスク数',
                    data: data.completed,
                    borderColor: 'rgba(50, 184, 198, 1)',
                    backgroundColor: 'rgba(50, 184, 198, 0.1)',
                    tension: 0.4,
                    fill: true
                }, {
                    label: '累計タスク数',
                    data: data.total,
                    borderColor: 'rgba(167, 169, 169, 1)',
                    backgroundColor: 'rgba(167, 169, 169, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top'
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
     * 予算分析チャートの初期化
     */
    function initBudgetAnalysisChart() {
        const ctx = document.getElementById('budget-analysis-chart');
        if (!ctx) return;

        const projects = getFilteredProjects();
        const projectNames = projects.map(p => Utils.string.truncate(p.name, 20));
        const budgets = projects.map(p => p.budget);
        const spent = projects.map(p => p.spent);

        if (charts.budgetAnalysis) {
            charts.budgetAnalysis.destroy();
        }

        charts.budgetAnalysis = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: projectNames,
                datasets: [{
                    label: '予算',
                    data: budgets,
                    backgroundColor: 'rgba(167, 169, 169, 0.5)',
                    borderColor: 'rgba(167, 169, 169, 1)',
                    borderWidth: 1
                }, {
                    label: '使用済み',
                    data: spent,
                    backgroundColor: 'rgba(50, 184, 198, 0.8)',
                    borderColor: 'rgba(50, 184, 198, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(119, 124, 124, 0.1)'
                        },
                        ticks: {
                            callback: function(value) {
                                return Utils.number.currency(value);
                            }
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
     * チームパフォーマンスチャートの初期化
     */
    function initTeamPerformanceChart() {
        const ctx = document.getElementById('team-performance-chart');
        if (!ctx) return;

        const teamData = calculateTeamPerformance();

        if (charts.teamPerformance) {
            charts.teamPerformance.destroy();
        }

        charts.teamPerformance = new Chart(ctx, {
            type: 'horizontalBar',
            data: {
                labels: teamData.labels,
                datasets: [{
                    label: '完了タスク数',
                    data: teamData.completedTasks,
                    backgroundColor: 'rgba(50, 184, 198, 0.8)',
                    borderColor: 'rgba(50, 184, 198, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: 'y',
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(119, 124, 124, 0.1)'
                        }
                    },
                    y: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }

    /**
     * タスク完了データの生成
     */
    function generateTaskCompletionData() {
        // 期間に応じてラベルを生成
        const labels = [];
        const completed = [];
        const total = [];
        
        if (currentPeriod === 'weekly') {
            const days = ['月', '火', '水', '木', '金', '土', '日'];
            labels.push(...days);
            // 仮のデータ
            for (let i = 0; i < 7; i++) {
                completed.push(Math.floor(Math.random() * 10) + 5);
                total.push(Math.floor(Math.random() * 5) + 15);
            }
        } else if (currentPeriod === 'monthly') {
            for (let i = 1; i <= 30; i++) {
                labels.push(`${i}日`);
                completed.push(Math.floor(Math.random() * 5) + 2);
                total.push(Math.floor(Math.random() * 3) + 8);
            }
        }

        return { labels, completed, total };
    }

    /**
     * チームパフォーマンスの計算
     */
    function calculateTeamPerformance() {
        const teamMembers = DataStore.teamMembers.getAll();
        const tasks = getFilteredTasks();
        
        const performance = teamMembers.map(member => {
            const memberTasks = tasks.filter(t => t.assignee === member.id && t.status === 'completed');
            return {
                name: member.name,
                completedTasks: memberTasks.length
            };
        });

        // 完了タスク数で降順ソート
        performance.sort((a, b) => b.completedTasks - a.completedTasks);

        return {
            labels: performance.map(p => p.name),
            completedTasks: performance.map(p => p.completedTasks)
        };
    }

    /**
     * プロジェクトテーブルのレンダリング
     */
    function renderProjectTable() {
        const projects = getFilteredProjects();

        if (projects.length === 0) {
            return '<div class="empty-state">表示するプロジェクトがありません</div>';
        }

        return `
            <table class="report-table">
                <thead>
                    <tr>
                        <th>プロジェクト名</th>
                        <th>ステータス</th>
                        <th>進捗</th>
                        <th>期間</th>
                        <th>予算</th>
                        <th>使用済み</th>
                        <th>使用率</th>
                        <th>タスク</th>
                    </tr>
                </thead>
                <tbody>
                    ${projects.map(project => {
                        const tasks = DataStore.tasks.getByProject(project.id);
                        const completedTasks = tasks.filter(t => t.status === 'completed').length;
                        const budgetUsage = project.budget > 0 ? Math.round((project.spent / project.budget) * 100) : 0;
                        
                        return `
                            <tr>
                                <td><strong>${project.name}</strong></td>
                                <td><span class="status status--${project.status}">${getStatusLabel(project.status)}</span></td>
                                <td>
                                    <div class="progress-cell">
                                        <div class="progress-bar-small">
                                            <div class="progress-fill" style="width: ${project.progress}%"></div>
                                        </div>
                                        <span>${project.progress}%</span>
                                    </div>
                                </td>
                                <td>${Utils.date.format(project.startDate)} - ${Utils.date.format(project.endDate)}</td>
                                <td>${Utils.number.currency(project.budget)}</td>
                                <td>${Utils.number.currency(project.spent)}</td>
                                <td class="${budgetUsage > 80 ? 'text-danger' : ''}">${budgetUsage}%</td>
                                <td>${completedTasks}/${tasks.length}</td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        `;
    }

    /**
     * アクティビティタイムラインのレンダリング
     */
    function renderActivityTimeline() {
        const activities = DataStore.activities.getRecent(20);
        
        if (activities.length === 0) {
            return '<div class="empty-state">アクティビティがありません</div>';
        }

        const groupedActivities = Utils.array.groupBy(activities, activity => {
            return Utils.date.format(activity.timestamp, 'YYYY/MM/DD');
        });

        return Object.entries(groupedActivities).map(([date, dateActivities]) => `
            <div class="timeline-group">
                <div class="timeline-date">${date}</div>
                <div class="timeline-items">
                    ${dateActivities.map(activity => `
                        <div class="timeline-item">
                            <div class="timeline-time">${Utils.date.format(activity.timestamp, 'HH:mm')}</div>
                            <div class="timeline-content">
                                <div class="timeline-icon ${getActivityTypeClass(activity.type)}">
                                    ${getActivityIcon(activity.type)}
                                </div>
                                <div class="timeline-text">
                                    <strong>${activity.userName}</strong>が${activity.action}
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('');
    }

    /**
     * レポートテンプレートのレンダリング
     */
    function renderReportTemplates() {
        const templates = [
            {
                id: 'executive-summary',
                title: 'エグゼクティブサマリー',
                description: '経営層向けの概要レポート',
                icon: '📊'
            },
            {
                id: 'project-status',
                title: 'プロジェクトステータス',
                description: '全プロジェクトの詳細状況',
                icon: '📈'
            },
            {
                id: 'team-productivity',
                title: 'チーム生産性',
                description: 'メンバー別パフォーマンス分析',
                icon: '👥'
            },
            {
                id: 'budget-report',
                title: '予算レポート',
                description: '予算使用状況の詳細分析',
                icon: '💰'
            },
            {
                id: 'risk-assessment',
                title: 'リスクアセスメント',
                description: '潜在的リスクの評価',
                icon: '⚠️'
            },
            {
                id: 'custom-report',
                title: 'カスタムレポート',
                description: '独自のレポートを作成',
                icon: '⚙️'
            }
        ];

        return templates.map(template => `
            <div class="template-card" onclick="Reports.useTemplate('${template.id}')">
                <div class="template-icon">${template.icon}</div>
                <h4>${template.title}</h4>
                <p>${template.description}</p>
            </div>
        `).join('');
    }

    /**
     * アクティビティアイコンの取得
     */
    function getActivityIcon(type) {
        const icons = {
            system: '🔧',
            project: '📁',
            task: '✓',
            user: '👤'
        };
        return icons[type] || '📌';
    }

    /**
     * アクティビティタイプクラスの取得
     */
    function getActivityTypeClass(type) {
        const classes = {
            system: 'timeline-icon--system',
            project: 'timeline-icon--project',
            task: 'timeline-icon--task',
            user: 'timeline-icon--user'
        };
        return classes[type] || '';
    }

    /**
     * ステータスラベルの取得
     */
    function getStatusLabel(status) {
        const labels = {
            active: '進行中',
            planning: '計画中',
            completed: '完了',
            on_hold: '保留中'
        };
        return labels[status] || status;
    }

    /**
     * 期間の変更
     */
    function changePeriod() {
        const periodSelect = document.getElementById('period-filter');
        currentPeriod = periodSelect.value;

        if (currentPeriod === 'custom') {
            document.getElementById('custom-date-range').style.display = 'flex';
        } else {
            document.getElementById('custom-date-range').style.display = 'none';
            updateDateRangeFromPeriod();
        }
    }

    /**
     * 期間から日付範囲を更新
     */
    function updateDateRangeFromPeriod() {
        const endDate = new Date();
        const startDate = new Date();

        switch (currentPeriod) {
            case 'weekly':
                startDate.setDate(endDate.getDate() - 7);
                break;
            case 'monthly':
                startDate.setDate(endDate.getDate() - 30);
                break;
            case 'quarterly':
                startDate.setMonth(endDate.getMonth() - 3);
                break;
            case 'yearly':
                startDate.setFullYear(endDate.getFullYear() - 1);
                break;
        }

        currentFilters.dateRange = {
            start: Utils.date.format(startDate, 'YYYY-MM-DD'),
            end: Utils.date.format(endDate, 'YYYY-MM-DD')
        };

        render(container);
    }

    /**
     * レポート生成処理
     */
    function handleGenerateReport(e) {
        e.preventDefault();

        const formData = {
            name: document.getElementById('report-name').value,
            type: document.getElementById('report-type').value,
            sections: Array.from(document.querySelectorAll('input[name="sections"]:checked'))
                .map(cb => cb.value),
            period: document.getElementById('report-period').value,
            format: document.getElementById('report-format').value,
            notes: document.getElementById('report-notes').value
        };

        // モーダルを閉じる
        Utils.modal.hide(document.querySelector('.modal'));

        // レポート生成開始
        Utils.toast.show('レポートを生成しています...', 'info');

        setTimeout(() => {
            generateReport(formData);
        }, 1000);
    }

    /**
     * レポート生成
     */
    function generateReport(config) {
        const reportData = collectReportData(config);
        
        switch (config.format) {
            case 'pdf':
                Utils.toast.show('PDF形式でのエクスポートは準備中です', 'warning');
                // 代わりにHTMLとして表示
                displayHTMLReport(reportData, config);
                break;
            case 'excel':
                exportToExcel(reportData, config);
                break;
            case 'html':
                displayHTMLReport(reportData, config);
                break;
            case 'json':
                Utils.export.json(reportData, `${config.name}_${Utils.date.format(new Date(), 'YYYYMMDD')}.json`);
                Utils.toast.show('レポートをエクスポートしました', 'success');
                break;
        }
    }

    /**
     * レポートデータの収集
     */
    function collectReportData(config) {
        const data = {
            metadata: {
                name: config.name,
                generatedAt: new Date().toISOString(),
                period: config.period,
                type: config.type
            },
            sections: {}
        };

        if (config.sections.includes('overview')) {
            data.sections.overview = {
                projects: getFilteredProjects(),
                stats: calculateSummaryData()
            };
        }

        if (config.sections.includes('tasks')) {
            data.sections.tasks = {
                all: getFilteredTasks(),
                byStatus: Utils.array.groupBy(getFilteredTasks(), 'status'),
                byPriority: Utils.array.groupBy(getFilteredTasks(), 'priority')
            };
        }

        if (config.sections.includes('budget')) {
            data.sections.budget = calculateBudgetData();
        }

        if (config.sections.includes('team')) {
            data.sections.team = calculateTeamData();
        }

        if (config.sections.includes('risks')) {
            data.sections.risks = identifyRisks();
        }

        if (config.sections.includes('timeline')) {
            data.sections.timeline = generateTimeline();
        }

        if (config.notes) {
            data.notes = config.notes;
        }

        return data;
    }

    /**
     * HTMLレポートの表示
     */
    function displayHTMLReport(data, config) {
        const content = `
            <div class="report-preview">
                <div class="report-header">
                    <h1>${config.name}</h1>
                    <p>生成日時: ${Utils.date.format(data.metadata.generatedAt, 'YYYY/MM/DD HH:mm')}</p>
                </div>
                
                ${config.sections.map(section => renderReportSection(section, data.sections[section])).join('')}
                
                ${config.notes ? `
                    <div class="report-section">
                        <h2>備考</h2>
                        <p>${config.notes}</p>
                    </div>
                ` : ''}
            </div>
        `;

        const modal = Utils.modal.show(content, {
            title: 'レポートプレビュー',
            closeOnOverlay: true
        });

        // 印刷ボタンを追加
        const printBtn = document.createElement('button');
        printBtn.className = 'btn btn--primary';
        printBtn.textContent = '印刷';
        printBtn.onclick = () => window.print();
        
        const modalHeader = modal.querySelector('.modal__header');
        modalHeader.appendChild(printBtn);

        Utils.toast.show('レポートを生成しました', 'success');
    }

    /**
     * レポートセクションのレンダリング
     */
    function renderReportSection(sectionName, data) {
        if (!data) return '';

        const renderers = {
            overview: () => `
                <div class="report-section">
                    <h2>プロジェクト概要</h2>
                    <div class="stats-summary">
                        <p>アクティブプロジェクト: ${data.stats.activeProjects}</p>
                        <p>完了タスク: ${data.stats.completedTasks}</p>
                        <p>予算使用率: ${data.stats.budgetUsage}%</p>
                    </div>
                </div>
            `,
            tasks: () => `
                <div class="report-section">
                    <h2>タスク分析</h2>
                    <p>総タスク数: ${data.all.length}</p>
                    <div class="task-breakdown">
                        <h3>ステータス別</h3>
                        <ul>
                            ${Object.entries(data.byStatus).map(([status, tasks]) => 
                                `<li>${getTaskStatusLabel(status)}: ${tasks.length}件</li>`
                            ).join('')}
                        </ul>
                    </div>
                </div>
            `,
            budget: () => `
                <div class="report-section">
                    <h2>予算状況</h2>
                    <p>総予算: ${Utils.number.currency(data.totalBudget)}</p>
                    <p>使用済み: ${Utils.number.currency(data.totalSpent)}</p>
                    <p>残予算: ${Utils.number.currency(data.remaining)}</p>
                </div>
            `,
            team: () => `
                <div class="report-section">
                    <h2>チームパフォーマンス</h2>
                    <p>平均ワークロード: ${data.averageWorkload}%</p>
                    <p>アクティブメンバー: ${data.activeMembers}人</p>
                </div>
            `,
            risks: () => `
                <div class="report-section">
                    <h2>リスク評価</h2>
                    <ul>
                        ${data.map(risk => `<li>${risk.description} (${risk.level})</li>`).join('')}
                    </ul>
                </div>
            `,
            timeline: () => `
                <div class="report-section">
                    <h2>タイムライン</h2>
                    <p>期限が近いプロジェクト: ${data.upcoming.length}件</p>
                    <p>遅延中のタスク: ${data.overdue.length}件</p>
                </div>
            `
        };

        return renderers[sectionName] ? renderers[sectionName]() : '';
    }

    /**
     * 予算データの計算
     */
    function calculateBudgetData() {
        const projects = getFilteredProjects();
        const totalBudget = projects.reduce((sum, p) => sum + p.budget, 0);
        const totalSpent = projects.reduce((sum, p) => sum + p.spent, 0);
        
        return {
            totalBudget,
            totalSpent,
            remaining: totalBudget - totalSpent,
            byProject: projects.map(p => ({
                name: p.name,
                budget: p.budget,
                spent: p.spent,
                usage: p.budget > 0 ? Math.round((p.spent / p.budget) * 100) : 0
            }))
        };
    }

    /**
     * チームデータの計算
     */
    function calculateTeamData() {
        const members = DataStore.teamMembers.getAll();
        const activeMembers = members.filter(m => m.status === 'active');
        const totalWorkload = activeMembers.reduce((sum, m) => sum + m.workload, 0);
        
        return {
            totalMembers: members.length,
            activeMembers: activeMembers.length,
            averageWorkload: activeMembers.length > 0 ? Math.round(totalWorkload / activeMembers.length) : 0,
            byDepartment: Utils.array.groupBy(members, 'department')
        };
    }

    /**
     * リスクの特定
     */
    function identifyRisks() {
        const risks = [];
        const projects = getFilteredProjects();
        const tasks = getFilteredTasks();
        
        // 期限超過のプロジェクト
        const now = new Date();
        projects.forEach(project => {
            if (new Date(project.endDate) < now && project.status !== 'completed') {
                risks.push({
                    type: 'deadline',
                    level: '高',
                    description: `プロジェクト「${project.name}」が期限を超過しています`
                });
            }
        });
        
        // 高負荷のメンバー
        const members = DataStore.teamMembers.getAll();
        members.forEach(member => {
            if (member.workload > 90) {
                risks.push({
                    type: 'workload',
                    level: '中',
                    description: `${member.name}のワークロードが90%を超えています`
                });
            }
        });
        
        // 予算超過のリスク
        projects.forEach(project => {
            const usage = project.budget > 0 ? (project.spent / project.budget) * 100 : 0;
            if (usage > 80 && project.status !== 'completed') {
                risks.push({
                    type: 'budget',
                    level: usage > 90 ? '高' : '中',
                    description: `プロジェクト「${project.name}」の予算使用率が${Math.round(usage)}%です`
                });
            }
        });
        
        return risks;
    }

    /**
     * タイムラインの生成
     */
    function generateTimeline() {
        const projects = getFilteredProjects();
        const tasks = getFilteredTasks();
        const now = new Date();
        
        return {
            upcoming: projects.filter(p => {
                const daysUntilEnd = Utils.date.diffInDays(now, p.endDate);
                return daysUntilEnd <= 30 && daysUntilEnd > 0 && p.status !== 'completed';
            }),
            overdue: tasks.filter(t => {
                return new Date(t.dueDate) < now && t.status !== 'completed';
            })
        };
    }

    /**
     * Excelエクスポート（簡易版）
     */
    function exportToExcel(data, config) {
        // 簡易的なCSVエクスポートで代替
        const rows = [];
        rows.push(['レポート名', config.name]);
        rows.push(['生成日時', Utils.date.format(new Date(), 'YYYY/MM/DD HH:mm')]);
        rows.push([]);
        
        if (data.sections.overview) {
            rows.push(['## プロジェクト概要']);
            rows.push(['アクティブプロジェクト', data.sections.overview.stats.activeProjects]);
            rows.push(['完了タスク', data.sections.overview.stats.completedTasks]);
            rows.push(['予算使用率', data.sections.overview.stats.budgetUsage + '%']);
            rows.push([]);
        }
        
        // CSVとしてエクスポート
        const csvContent = rows.map(row => row.join(',')).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv' });
        Utils.export.download(blob, `${config.name}_${Utils.date.format(new Date(), 'YYYYMMDD')}.csv`);
        
        Utils.toast.show('レポートをエクスポートしました', 'success');
    }

    /**
     * テンプレートからレポート生成
     */
    function generateReportFromTemplate(template) {
        const config = {
            name: template.name,
            type: template.type,
            sections: template.sections,
            period: template.period,
            format: 'html'
        };
        
        generateReport(config);
    }

    /**
     * タスクステータスラベルの取得
     */
    function getTaskStatusLabel(status) {
        const labels = {
            todo: '未着手',
            in_progress: '進行中',
            completed: '完了'
        };
        return labels[status] || status;
    }

    // Public API
    return {
        render,

        /**
         * フィルターの適用
         */
        applyFilters() {
            currentFilters.projects = document.getElementById('project-filter').value;
            render(container);
        },

        /**
         * 日付範囲の適用
         */
        applyDateRange() {
            currentFilters.dateRange.start = document.getElementById('start-date').value;
            currentFilters.dateRange.end = document.getElementById('end-date').value;
            render(container);
        },

        /**
         * 期間の変更
         */
        changePeriod,

        /**
         * レポートのエクスポート
         */
        exportReport() {
            const reportData = {
                period: currentPeriod,
                dateRange: currentFilters.dateRange,
                summary: calculateSummaryData(),
                projects: getFilteredProjects(),
                tasks: getFilteredTasks()
            };

            Utils.export.json(reportData, `レポート_${Utils.date.format(new Date(), 'YYYYMMDD')}.json`);
            Utils.toast.show('レポートをエクスポートしました', 'success');
        },

        /**
         * レポートの印刷
         */
        printReport() {
            window.print();
            Utils.toast.show('印刷ダイアログを開きました', 'info');
        },

        /**
         * カスタムレポートの生成
         */
        generateCustomReport() {
            const content = `
                <form id="custom-report-form" class="report-form">
                    <div class="form-group">
                        <label class="form-label">レポート名 <span class="required">*</span></label>
                        <input type="text" class="form-control" id="report-name" required 
                               placeholder="例: 月次プロジェクト進捗レポート">
                    </div>

                    <div class="form-group">
                        <label class="form-label">レポートタイプ</label>
                        <select class="form-control" id="report-type">
                            <option value="summary">サマリーレポート</option>
                            <option value="detailed">詳細レポート</option>
                            <option value="comparison">比較レポート</option>
                            <option value="trend">トレンドレポート</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label class="form-label">含めるセクション</label>
                        <div class="checkbox-group">
                            <label class="checkbox-label">
                                <input type="checkbox" name="sections" value="overview" checked>
                                <span>プロジェクト概要</span>
                            </label>
                            <label class="checkbox-label">
                                <input type="checkbox" name="sections" value="tasks" checked>
                                <span>タスク分析</span>
                            </label>
                            <label class="checkbox-label">
                                <input type="checkbox" name="sections" value="budget" checked>
                                <span>予算状況</span>
                            </label>
                            <label class="checkbox-label">
                                <input type="checkbox" name="sections" value="team" checked>
                                <span>チームパフォーマンス</span>
                            </label>
                            <label class="checkbox-label">
                                <input type="checkbox" name="sections" value="risks">
                                <span>リスク評価</span>
                            </label>
                            <label class="checkbox-label">
                                <input type="checkbox" name="sections" value="timeline">
                                <span>タイムライン</span>
                            </label>
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">期間</label>
                            <select class="form-control" id="report-period">
                                <option value="weekly">週次</option>
                                <option value="monthly" selected>月次</option>
                                <option value="quarterly">四半期</option>
                                <option value="yearly">年次</option>
                                <option value="custom">カスタム</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">フォーマット</label>
                            <select class="form-control" id="report-format">
                                <option value="pdf">PDF</option>
                                <option value="excel">Excel</option>
                                <option value="html">HTML</option>
                                <option value="json">JSON</option>
                            </select>
                        </div>
                    </div>

                    <div class="form-group">
                        <label class="form-label">追加メモ</label>
                        <textarea class="form-control" id="report-notes" rows="3" 
                                  placeholder="レポートに含める追加情報やコメント"></textarea>
                    </div>

                    <div class="form-actions">
                        <button type="button" class="btn btn--outline" onclick="Utils.modal.hide(document.querySelector('.modal'))">
                            キャンセル
                        </button>
                        <button type="submit" class="btn btn--primary">
                            レポートを生成
                        </button>
                    </div>
                </form>
            `;

            const modal = Utils.modal.show(content, {
                title: 'カスタムレポートの作成',
                closeOnOverlay: false
            });

            // フォーム送信イベント
            document.getElementById('custom-report-form').addEventListener('submit', handleGenerateReport);
        },

        /**
         * テンプレートの使用
         */
        useTemplate(templateId) {
            const templates = {
                'executive-summary': {
                    name: 'エグゼクティブサマリー',
                    type: 'summary',
                    sections: ['overview', 'budget', 'risks'],
                    period: 'monthly'
                },
                'project-status': {
                    name: 'プロジェクトステータスレポート',
                    type: 'detailed',
                    sections: ['overview', 'tasks', 'timeline'],
                    period: 'weekly'
                },
                'team-productivity': {
                    name: 'チーム生産性レポート',
                    type: 'comparison',
                    sections: ['team', 'tasks'],
                    period: 'monthly'
                },
                'budget-report': {
                    name: '予算レポート',
                    type: 'detailed',
                    sections: ['budget', 'overview'],
                    period: 'quarterly'
                },
                'risk-assessment': {
                    name: 'リスクアセスメントレポート',
                    type: 'detailed',
                    sections: ['risks', 'overview', 'timeline'],
                    period: 'monthly'
                }
            };

            const template = templates[templateId];
            if (!template) {
                // カスタムレポートを表示
                this.generateCustomReport();
                return;
            }

            Utils.toast.show(`${template.name}を生成しています...`, 'info');
            
            // テンプレートに基づいてレポートを生成
            setTimeout(() => {
                generateReportFromTemplate(template);
            }, 1000);
        }
    };
})();

// グローバルに公開
window.Reports = Reports;