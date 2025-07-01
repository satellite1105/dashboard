/**
 * プロジェクト管理機能
 * プロジェクトとタスクの作成・編集・削除・管理
 */

const Projects = (function() {
    'use strict';

    // プライベート変数
    let container = null;
    let currentProject = null;
    let currentView = 'list'; // list, kanban, detail
    let filters = {
        status: 'all',
        priority: 'all',
        search: ''
    };

    /**
     * プロジェクトページのレンダリング
     */
    function render(element) {
        container = element;

        container.innerHTML = `
            <div class="projects-page">
                <!-- ページヘッダー -->
                <div class="page-header">
                    <div class="page-header__left">
                        <h2>プロジェクト</h2>
                        <p>すべてのプロジェクトを管理</p>
                    </div>
                    <div class="page-header__right">
                        <button class="btn btn--primary" onclick="Projects.showNewProjectModal()">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="12" y1="5" x2="12" y2="19"/>
                                <line x1="5" y1="12" x2="19" y2="12"/>
                            </svg>
                            新規プロジェクト
                        </button>
                    </div>
                </div>

                <!-- ツールバー -->
                <div class="toolbar">
                    <div class="toolbar__left">
                        <!-- ビュー切り替え -->
                        <div class="view-switcher">
                            <button class="view-btn ${currentView === 'list' ? 'active' : ''}" 
                                    onclick="Projects.switchView('list')" title="リスト表示">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <line x1="8" y1="6" x2="21" y2="6"/>
                                    <line x1="8" y1="12" x2="21" y2="12"/>
                                    <line x1="8" y1="18" x2="21" y2="18"/>
                                    <line x1="3" y1="6" x2="3.01" y2="6"/>
                                    <line x1="3" y1="12" x2="3.01" y2="12"/>
                                    <line x1="3" y1="18" x2="3.01" y2="18"/>
                                </svg>
                            </button>
                            <button class="view-btn ${currentView === 'kanban' ? 'active' : ''}" 
                                    onclick="Projects.switchView('kanban')" title="カンバン表示">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                                    <line x1="9" y1="3" x2="9" y2="21"/>
                                    <line x1="15" y1="3" x2="15" y2="21"/>
                                </svg>
                            </button>
                        </div>

                        <!-- フィルター -->
                        <select class="form-control filter-select" id="status-filter" onchange="Projects.applyFilters()">
                            <option value="all">すべてのステータス</option>
                            <option value="active">進行中</option>
                            <option value="planning">計画中</option>
                            <option value="completed">完了</option>
                            <option value="on_hold">保留中</option>
                        </select>

                        <select class="form-control filter-select" id="priority-filter" onchange="Projects.applyFilters()">
                            <option value="all">すべての優先度</option>
                            <option value="high">高</option>
                            <option value="medium">中</option>
                            <option value="low">低</option>
                        </select>
                    </div>

                    <div class="toolbar__right">
                        <!-- 検索 -->
                        <div class="search-box">
                            <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="11" cy="11" r="8"/>
                                <path d="m21 21-4.35-4.35"/>
                            </svg>
                            <input type="text" class="search-input" id="project-search" 
                                   placeholder="プロジェクトを検索..." 
                                   onchange="Projects.applyFilters()">
                        </div>

                        <!-- エクスポート -->
                        <button class="btn btn--outline" onclick="Projects.exportProjects()">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                <polyline points="7 10 12 15 17 10"/>
                                <line x1="12" y1="15" x2="12" y2="3"/>
                            </svg>
                            エクスポート
                        </button>
                    </div>
                </div>

                <!-- コンテンツエリア -->
                <div class="projects-content" id="projects-content">
                    ${renderProjectsView()}
                </div>
            </div>
        `;

        // イベントリスナーの設定
        setupEventListeners();
        
        // カンバンビューの場合は初期化時にもドラッグ&ドロップを設定
        if (currentView === 'kanban') {
            setTimeout(() => {
                initializeKanbanDragDrop();
            }, 100);
        }
    }

    /**
     * プロジェクトビューのレンダリング
     */
    function renderProjectsView() {
        const projects = getFilteredProjects();

        if (currentView === 'list') {
            return renderListView(projects);
        } else if (currentView === 'kanban') {
            return renderKanbanView(projects);
        }
        return '';
    }

    /**
     * リストビューのレンダリング
     */
    function renderListView(projects) {
        if (projects.length === 0) {
            return `
                <div class="empty-state">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" opacity="0.3">
                        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
                        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
                    </svg>
                    <h3>プロジェクトが見つかりません</h3>
                    <p>新しいプロジェクトを作成して始めましょう</p>
                    <button class="btn btn--primary" onclick="Projects.showNewProjectModal()">
                        プロジェクトを作成
                    </button>
                </div>
            `;
        }

        return `
            <div class="projects-list">
                ${projects.map(project => renderProjectCard(project)).join('')}
            </div>
        `;
    }

    /**
     * プロジェクトカードのレンダリング
     */
    function renderProjectCard(project) {
        const manager = DataStore.teamMembers.getById(project.manager);
        const tasks = DataStore.tasks.getByProject(project.id);
        const completedTasks = tasks.filter(t => t.status === 'completed').length;
        const totalTasks = tasks.length;

        return `
            <div class="project-card" data-project-id="${project.id}">
                <div class="project-card__header">
                    <h3 class="project-card__title">${project.name}</h3>
                    <div class="project-card__actions">
                        <button class="icon-btn" onclick="Projects.editProject('${project.id}')" title="編集">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                        </button>
                        <button class="icon-btn" onclick="Projects.deleteProject('${project.id}')" title="削除">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="3 6 5 6 21 6"/>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                            </svg>
                        </button>
                    </div>
                </div>

                <div class="project-card__body">
                    <p class="project-card__description">${project.description}</p>
                    
                    <div class="project-card__meta">
                        <span class="status status--${project.status}">${getStatusLabel(project.status)}</span>
                        <span class="priority priority--${project.priority}">${getPriorityLabel(project.priority)}</span>
                        <span class="deadline">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                                <line x1="16" y1="2" x2="16" y2="6"/>
                                <line x1="8" y1="2" x2="8" y2="6"/>
                                <line x1="3" y1="10" x2="21" y2="10"/>
                            </svg>
                            ${Utils.date.format(project.endDate)}
                        </span>
                    </div>

                    <div class="project-card__progress">
                        <div class="progress-header">
                            <span>進捗</span>
                            <span>${project.progress}%</span>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${project.progress}%"></div>
                        </div>
                    </div>

                    <div class="project-card__stats">
                        <div class="stat">
                            <span class="stat-label">タスク</span>
                            <span class="stat-value">${completedTasks}/${totalTasks}</span>
                        </div>
                        <div class="stat">
                            <span class="stat-label">予算</span>
                            <span class="stat-value">${Math.round((project.spent / project.budget) * 100)}%</span>
                        </div>
                        <div class="stat">
                            <span class="stat-label">マネージャー</span>
                            <span class="stat-value">${manager ? manager.name : '未割当'}</span>
                        </div>
                    </div>

                    <div class="project-card__team">
                        ${renderTeamAvatars(project.members)}
                        <span class="team-count">+${project.members.length}人</span>
                    </div>
                </div>

                <div class="project-card__footer">
                    <button class="btn btn--sm btn--outline" onclick="Projects.showProjectDetail('${project.id}')">
                        詳細を見る
                    </button>
                    <button class="btn btn--sm btn--primary" onclick="Projects.showNewTaskModal('${project.id}')">
                        タスクを追加
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * カンバンビューのレンダリング
     */
    function renderKanbanView(projects) {
        const columns = {
            planning: { title: '計画中', projects: [] },
            active: { title: '進行中', projects: [] },
            on_hold: { title: '保留中', projects: [] },
            completed: { title: '完了', projects: [] }
        };

        // プロジェクトをステータスごとに分類
        projects.forEach(project => {
            if (columns[project.status]) {
                columns[project.status].projects.push(project);
            }
        });

        return `
            <div class="kanban-board">
                ${Object.entries(columns).map(([status, column]) => `
                    <div class="kanban-column" data-status="${status}">
                        <div class="kanban-column__header">
                            <h3>${column.title}</h3>
                            <span class="kanban-count">${column.projects.length}</span>
                        </div>
                        <div class="kanban-column__content" data-status="${status}">
                            ${column.projects.map(project => renderKanbanCard(project)).join('')}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    /**
     * カンバンカードのレンダリング
     */
    function renderKanbanCard(project) {
        const tasks = DataStore.tasks.getByProject(project.id);
        const completedTasks = tasks.filter(t => t.status === 'completed').length;

        return `
            <div class="kanban-card" draggable="true" data-project-id="${project.id}">
                <div class="kanban-card__header">
                    <h4>${project.name}</h4>
                    <span class="priority priority--${project.priority}"></span>
                </div>
                <div class="kanban-card__body">
                    <div class="kanban-card__progress">
                        <div class="progress-bar-small">
                            <div class="progress-fill" style="width: ${project.progress}%"></div>
                        </div>
                        <span>${project.progress}%</span>
                    </div>
                    <div class="kanban-card__meta">
                        <span>${completedTasks}/${tasks.length} タスク</span>
                        <span>${Utils.date.format(project.endDate)}</span>
                    </div>
                    <div class="kanban-card__team">
                        ${renderTeamAvatars(project.members.slice(0, 3))}
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * チームアバターのレンダリング
     */
    function renderTeamAvatars(memberIds) {
        return memberIds.slice(0, 3).map(id => {
            const member = DataStore.teamMembers.getById(id);
            if (!member) return '';
            return `<span class="avatar" title="${member.name}">${member.name.charAt(0)}</span>`;
        }).join('');
    }

    /**
     * プロジェクトのフィルタリング
     */
    function getFilteredProjects() {
        let projects = DataStore.projects.getAll();

        // ステータスフィルター
        if (filters.status !== 'all') {
            projects = projects.filter(p => p.status === filters.status);
        }

        // 優先度フィルター
        if (filters.priority !== 'all') {
            projects = projects.filter(p => p.priority === filters.priority);
        }

        // 検索フィルター
        if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            projects = projects.filter(p => 
                p.name.toLowerCase().includes(searchLower) ||
                p.description.toLowerCase().includes(searchLower) ||
                p.tags.some(tag => tag.toLowerCase().includes(searchLower))
            );
        }

        return projects;
    }

    /**
     * 新規プロジェクトモーダルの表示
     */
    function showNewProjectModal() {
        const teamMembers = DataStore.teamMembers.getAll();
        
        const content = `
            <form id="new-project-form" class="project-form">
                <div class="form-group">
                    <label class="form-label">プロジェクト名 <span class="required">*</span></label>
                    <input type="text" class="form-control" id="project-name" required>
                </div>

                <div class="form-group">
                    <label class="form-label">説明</label>
                    <textarea class="form-control" id="project-description" rows="3"></textarea>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">開始日 <span class="required">*</span></label>
                        <input type="date" class="form-control" id="project-start-date" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">終了日 <span class="required">*</span></label>
                        <input type="date" class="form-control" id="project-end-date" required>
                    </div>
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label class="form-label">ステータス</label>
                        <select class="form-control" id="project-status">
                            <option value="planning">計画中</option>
                            <option value="active">進行中</option>
                            <option value="on_hold">保留中</option>
                            <option value="completed">完了</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="form-label">優先度</label>
                        <select class="form-control" id="project-priority">
                            <option value="low">低</option>
                            <option value="medium" selected>中</option>
                            <option value="high">高</option>
                        </select>
                    </div>
                </div>

                <div class="form-group">
                    <label class="form-label">予算</label>
                    <input type="number" class="form-control" id="project-budget" min="0">
                </div>

                <div class="form-group">
                    <label class="form-label">プロジェクトマネージャー</label>
                    <select class="form-control" id="project-manager">
                        <option value="">選択してください</option>
                        ${teamMembers.map(member => 
                            `<option value="${member.id}">${member.name}</option>`
                        ).join('')}
                    </select>
                </div>

                <div class="form-group">
                    <label class="form-label">チームメンバー</label>
                    <div class="member-checkboxes">
                        ${teamMembers.map(member => `
                            <label class="checkbox-label">
                                <input type="checkbox" name="team-members" value="${member.id}">
                                <span>${member.name}</span>
                            </label>
                        `).join('')}
                    </div>
                </div>

                <div class="form-group">
                    <label class="form-label">タグ（カンマ区切り）</label>
                    <input type="text" class="form-control" id="project-tags" placeholder="例: web, デザイン, 緊急">
                </div>

                <div class="form-actions">
                    <button type="button" class="btn btn--outline" onclick="Utils.modal.hide(document.querySelector('.modal'))">
                        キャンセル
                    </button>
                    <button type="submit" class="btn btn--primary">
                        プロジェクトを作成
                    </button>
                </div>
            </form>
        `;

        const modal = Utils.modal.show(content, {
            title: '新規プロジェクト',
            closeOnOverlay: false
        });

        // フォーム送信イベント
        document.getElementById('new-project-form').addEventListener('submit', handleCreateProject);
    }

    /**
     * プロジェクト作成処理
     */
    function handleCreateProject(e) {
        e.preventDefault();

        const formData = {
            name: document.getElementById('project-name').value,
            description: document.getElementById('project-description').value,
            startDate: document.getElementById('project-start-date').value,
            endDate: document.getElementById('project-end-date').value,
            status: document.getElementById('project-status').value,
            priority: document.getElementById('project-priority').value,
            budget: parseInt(document.getElementById('project-budget').value) || 0,
            spent: 0,
            manager: parseInt(document.getElementById('project-manager').value) || null,
            members: Array.from(document.querySelectorAll('input[name="team-members"]:checked'))
                .map(cb => parseInt(cb.value)),
            tags: document.getElementById('project-tags').value
                .split(',')
                .map(tag => tag.trim())
                .filter(tag => tag),
            progress: 0
        };

        // バリデーション
        if (!formData.name || !formData.startDate || !formData.endDate) {
            Utils.toast.show('必須項目を入力してください', 'error');
            return;
        }

        if (new Date(formData.startDate) > new Date(formData.endDate)) {
            Utils.toast.show('終了日は開始日より後に設定してください', 'error');
            return;
        }

        // プロジェクト作成
        const newProject = DataStore.projects.create(formData);
        
        // モーダルを閉じる
        Utils.modal.hide(document.querySelector('.modal'));
        
        // 成功メッセージ
        Utils.toast.show('プロジェクトを作成しました', 'success');
        
        // リストを更新
        updateProjectsView();
    }

    /**
     * プロジェクト編集
     */
    function editProject(projectId) {
        const project = DataStore.projects.getById(projectId);
        if (!project) return;

        // 編集モーダルを表示（新規作成と同じフォームを使い、値を設定）
        showNewProjectModal();
        
        // フォームに既存の値を設定
        setTimeout(() => {
            document.getElementById('project-name').value = project.name;
            document.getElementById('project-description').value = project.description;
            document.getElementById('project-start-date').value = project.startDate;
            document.getElementById('project-end-date').value = project.endDate;
            document.getElementById('project-status').value = project.status;
            document.getElementById('project-priority').value = project.priority;
            document.getElementById('project-budget').value = project.budget;
            document.getElementById('project-manager').value = project.manager || '';
            document.getElementById('project-tags').value = project.tags.join(', ');

            // チームメンバーのチェックボックス
            project.members.forEach(memberId => {
                const checkbox = document.querySelector(`input[name="team-members"][value="${memberId}"]`);
                if (checkbox) checkbox.checked = true;
            });

            // モーダルタイトルとボタンテキストを変更
            document.querySelector('.modal__header h3').textContent = 'プロジェクト編集';
            document.querySelector('.modal button[type="submit"]').textContent = '更新';

            // フォーム送信イベントを更新処理に変更
            const form = document.getElementById('new-project-form');
            form.removeEventListener('submit', handleCreateProject);
            form.addEventListener('submit', (e) => handleUpdateProject(e, projectId));
        }, 100);
    }

    /**
     * プロジェクト更新処理
     */
    function handleUpdateProject(e, projectId) {
        e.preventDefault();

        const formData = {
            name: document.getElementById('project-name').value,
            description: document.getElementById('project-description').value,
            startDate: document.getElementById('project-start-date').value,
            endDate: document.getElementById('project-end-date').value,
            status: document.getElementById('project-status').value,
            priority: document.getElementById('project-priority').value,
            budget: parseInt(document.getElementById('project-budget').value) || 0,
            manager: parseInt(document.getElementById('project-manager').value) || null,
            members: Array.from(document.querySelectorAll('input[name="team-members"]:checked'))
                .map(cb => parseInt(cb.value)),
            tags: document.getElementById('project-tags').value
                .split(',')
                .map(tag => tag.trim())
                .filter(tag => tag)
        };

        // プロジェクト更新
        DataStore.projects.update(projectId, formData);
        
        // モーダルを閉じる
        Utils.modal.hide(document.querySelector('.modal'));
        
        // 成功メッセージ
        Utils.toast.show('プロジェクトを更新しました', 'success');
        
        // リストを更新
        updateProjectsView();
    }

    /**
     * プロジェクト削除
     */
    function deleteProject(projectId) {
        const project = DataStore.projects.getById(projectId);
        if (!project) return;

        if (confirm(`プロジェクト「${project.name}」を削除しますか？\nこの操作は取り消せません。`)) {
            DataStore.projects.delete(projectId);
            Utils.toast.show('プロジェクトを削除しました', 'success');
            updateProjectsView();
        }
    }

    /**
     * タスク作成処理
     */
    function handleCreateTask(e, projectId) {
        e.preventDefault();

        const formData = {
            projectId: projectId,
            title: document.getElementById('task-title').value,
            description: document.getElementById('task-description').value,
            status: document.getElementById('task-status').value,
            priority: document.getElementById('task-priority').value,
            assignee: parseInt(document.getElementById('task-assignee').value) || null,
            dueDate: document.getElementById('task-due-date').value,
            estimatedHours: parseFloat(document.getElementById('task-estimated-hours').value) || 0,
            actualHours: 0,
            tags: document.getElementById('task-tags').value
                .split(',')
                .map(tag => tag.trim())
                .filter(tag => tag)
        };

        // バリデーション
        if (!formData.title) {
            Utils.toast.show('タスク名を入力してください', 'error');
            return;
        }

        // タスク作成
        const newTask = DataStore.tasks.create(formData);
        
        // モーダルを閉じる
        Utils.modal.hide(document.querySelector('.modal'));
        
        // 成功メッセージ
        Utils.toast.show('タスクを作成しました', 'success');
        
        // タスクボードを更新
        if (currentView === 'detail' && currentProject) {
            const tasks = DataStore.tasks.getByProject(currentProject.id);
            document.getElementById('task-board').innerHTML = renderTaskBoard(tasks);
            initializeTaskManagement(currentProject);
        }
    }

    /**
     * タスク更新処理
     */
    function handleUpdateTask(e, taskId) {
        e.preventDefault();

        const formData = {
            title: document.getElementById('task-title').value,
            description: document.getElementById('task-description').value,
            status: document.getElementById('task-status').value,
            priority: document.getElementById('task-priority').value,
            assignee: parseInt(document.getElementById('task-assignee').value) || null,
            dueDate: document.getElementById('task-due-date').value,
            estimatedHours: parseFloat(document.getElementById('task-estimated-hours').value) || 0,
            actualHours: parseFloat(document.getElementById('task-actual-hours').value) || 0,
            tags: document.getElementById('task-tags').value
                .split(',')
                .map(tag => tag.trim())
                .filter(tag => tag)
        };

        // タスク更新
        DataStore.tasks.update(taskId, formData);
        
        // モーダルを閉じる
        Utils.modal.hide(document.querySelector('.modal'));
        
        // 成功メッセージ
        Utils.toast.show('タスクを更新しました', 'success');
        
        // タスクボードを更新
        if (currentView === 'detail' && currentProject) {
            const tasks = DataStore.tasks.getByProject(currentProject.id);
            document.getElementById('task-board').innerHTML = renderTaskBoard(tasks);
            initializeTaskManagement(currentProject);
            updateProjectProgress(currentProject.id);
        }
    }

    /**
     * プロジェクト詳細表示
     */
    function showProjectDetail(projectId) {
        const project = DataStore.projects.getById(projectId);
        if (!project) return;

        currentProject = project;
        currentView = 'detail';
        
        const content = document.getElementById('projects-content');
        content.innerHTML = renderProjectDetail(project);
        
        // タスク管理の初期化
        initializeTaskManagement(project);
    }

    /**
     * プロジェクト詳細のレンダリング
     */
    function renderProjectDetail(project) {
        const tasks = DataStore.tasks.getByProject(project.id);
        const members = DataStore.teamMembers.getByProject(project.id);
        const manager = DataStore.teamMembers.getById(project.manager);

        return `
            <div class="project-detail">
                <!-- 戻るボタン -->
                <button class="back-btn" onclick="Projects.backToList()">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="19" y1="12" x2="5" y2="12"/>
                        <polyline points="12 19 5 12 12 5"/>
                    </svg>
                    プロジェクト一覧に戻る
                </button>

                <!-- プロジェクトヘッダー -->
                <div class="project-detail__header">
                    <div>
                        <h2>${project.name}</h2>
                        <p>${project.description}</p>
                    </div>
                    <div class="project-detail__actions">
                        <button class="btn btn--outline" onclick="Projects.editProject('${project.id}')">
                            編集
                        </button>
                        <button class="btn btn--primary" onclick="Projects.showNewTaskModal('${project.id}')">
                            タスクを追加
                        </button>
                    </div>
                </div>

                <!-- プロジェクト情報 -->
                <div class="project-info-grid">
                    <div class="info-card">
                        <h4>基本情報</h4>
                        <div class="info-item">
                            <span class="info-label">ステータス</span>
                            <span class="status status--${project.status}">${getStatusLabel(project.status)}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">優先度</span>
                            <span class="priority priority--${project.priority}">${getPriorityLabel(project.priority)}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">期間</span>
                            <span>${Utils.date.format(project.startDate)} 〜 ${Utils.date.format(project.endDate)}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">残り日数</span>
                            <span>${Utils.date.diffInDays(new Date(), project.endDate)}日</span>
                        </div>
                    </div>

                    <div class="info-card">
                        <h4>進捗状況</h4>
                        <div class="progress-section">
                            <div class="progress-header">
                                <span>全体進捗</span>
                                <span>${project.progress}%</span>
                            </div>
                            <div class="progress-bar-large">
                                <div class="progress-fill" style="width: ${project.progress}%"></div>
                            </div>
                        </div>
                        <div class="info-item">
                            <span class="info-label">タスク</span>
                            <span>${tasks.filter(t => t.status === 'completed').length} / ${tasks.length} 完了</span>
                        </div>
                    </div>

                    <div class="info-card">
                        <h4>予算</h4>
                        <div class="info-item">
                            <span class="info-label">総予算</span>
                            <span>${Utils.number.currency(project.budget)}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">使用済み</span>
                            <span>${Utils.number.currency(project.spent)}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">残予算</span>
                            <span>${Utils.number.currency(project.budget - project.spent)}</span>
                        </div>
                        <div class="budget-bar">
                            <div class="budget-fill" style="width: ${(project.spent / project.budget) * 100}%"></div>
                        </div>
                    </div>

                    <div class="info-card">
                        <h4>チーム</h4>
                        <div class="info-item">
                            <span class="info-label">マネージャー</span>
                            <span>${manager ? manager.name : '未割当'}</span>
                        </div>
                        <div class="team-members">
                            ${members.map(member => `
                                <div class="team-member">
                                    <span class="avatar">${member.name.charAt(0)}</span>
                                    <div>
                                        <div class="member-name">${member.name}</div>
                                        <div class="member-role">${member.role}</div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>

                <!-- タスク管理 -->
                <div class="task-management">
                    <div class="task-management__header">
                        <h3>タスク管理</h3>
                        <div class="task-filters">
                            <select class="form-control" id="task-status-filter" onchange="Projects.filterTasks()">
                                <option value="all">すべて</option>
                                <option value="todo">未着手</option>
                                <option value="in_progress">進行中</option>
                                <option value="completed">完了</option>
                            </select>
                            <select class="form-control" id="task-assignee-filter" onchange="Projects.filterTasks()">
                                <option value="all">すべての担当者</option>
                                ${members.map(member => 
                                    `<option value="${member.id}">${member.name}</option>`
                                ).join('')}
                            </select>
                        </div>
                    </div>
                    <div class="task-board" id="task-board">
                        ${renderTaskBoard(tasks)}
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * タスクボードのレンダリング
     */
    function renderTaskBoard(tasks) {
        const columns = {
            todo: { title: '未着手', tasks: [] },
            in_progress: { title: '進行中', tasks: [] },
            completed: { title: '完了', tasks: [] }
        };

        tasks.forEach(task => {
            if (columns[task.status]) {
                columns[task.status].tasks.push(task);
            }
        });

        return Object.entries(columns).map(([status, column]) => `
            <div class="task-column" data-status="${status}">
                <div class="task-column__header">
                    <h4>${column.title}</h4>
                    <span class="task-count">${column.tasks.length}</span>
                </div>
                <div class="task-column__content" data-status="${status}">
                    ${column.tasks.map(task => renderTaskCard(task)).join('')}
                </div>
            </div>
        `).join('');
    }

    /**
     * タスクカードのレンダリング
     */
    function renderTaskCard(task) {
        const assignee = DataStore.teamMembers.getById(task.assignee);

        return `
            <div class="task-card" draggable="true" data-task-id="${task.id}">
                <div class="task-card__header">
                    <h5>${task.title}</h5>
                    <span class="priority priority--${task.priority}"></span>
                </div>
                <p class="task-card__description">${task.description}</p>
                <div class="task-card__meta">
                    <span class="task-assignee">
                        ${assignee ? `<span class="avatar-small">${assignee.name.charAt(0)}</span> ${assignee.name}` : '未割当'}
                    </span>
                    <span class="task-due-date">
                        ${Utils.date.format(task.dueDate)}
                    </span>
                </div>
                <div class="task-card__actions">
                    <button class="icon-btn-small" onclick="Projects.editTask('${task.id}')" title="編集">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                    </button>
                    <button class="icon-btn-small" onclick="Projects.deleteTask('${task.id}')" title="削除">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                        </svg>
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * タスク管理の初期化
     */
    function initializeTaskManagement(project) {
        // ドラッグ&ドロップの設定
        const taskCards = document.querySelectorAll('.task-card');
        const taskColumns = document.querySelectorAll('.task-column__content');

        taskCards.forEach(card => {
            card.addEventListener('dragstart', handleDragStart);
            card.addEventListener('dragend', handleDragEnd);
        });

        taskColumns.forEach(column => {
            column.addEventListener('dragover', handleDragOver);
            column.addEventListener('drop', handleDrop);
            column.addEventListener('dragleave', handleDragLeave);
        });
    }

    /**
     * ドラッグ&ドロップのイベントハンドラー
     */
    let draggedElement = null;

    function handleDragStart(e) {
        draggedElement = e.target;
        e.target.classList.add('dragging');
    }

    function handleDragEnd(e) {
        e.target.classList.remove('dragging');
    }

    function handleDragOver(e) {
        e.preventDefault();
        e.currentTarget.classList.add('drag-over');
    }

    function handleDragLeave(e) {
        e.currentTarget.classList.remove('drag-over');
    }

    function handleDrop(e) {
        e.preventDefault();
        e.currentTarget.classList.remove('drag-over');

        if (draggedElement && e.currentTarget.classList.contains('task-column__content')) {
            const taskId = draggedElement.getAttribute('data-task-id');
            const newStatus = e.currentTarget.getAttribute('data-status');

            // タスクのステータスを更新
            DataStore.tasks.update(taskId, { status: newStatus });

            // タスクボードを再レンダリング
            const tasks = DataStore.tasks.getByProject(currentProject.id);
            document.getElementById('task-board').innerHTML = renderTaskBoard(tasks);
            
            // ドラッグ&ドロップを再初期化
            initializeTaskManagement(currentProject);

            // プロジェクトの進捗を更新
            updateProjectProgress(currentProject.id);

            Utils.toast.show('タスクのステータスを更新しました', 'success');
        }
    }

    /**
     * プロジェクト進捗の更新
     */
    function updateProjectProgress(projectId) {
        const tasks = DataStore.tasks.getByProject(projectId);
        if (tasks.length === 0) return;

        const completedTasks = tasks.filter(t => t.status === 'completed').length;
        const progress = Math.round((completedTasks / tasks.length) * 100);

        DataStore.projects.update(projectId, { progress });
    }

    /**
     * イベントリスナーの設定
     */
    function setupEventListeners() {
        // 検索入力
        const searchInput = document.getElementById('project-search');
        if (searchInput) {
            searchInput.addEventListener('input', Utils.debounce(() => {
                filters.search = searchInput.value;
                updateProjectsView();
            }, 300));
        }

        // カンバンビューの場合はドラッグ&ドロップを初期化
        if (currentView === 'kanban') {
            initializeKanbanDragDrop();
        }
    }

    /**
     * カンバンのドラッグ&ドロップ初期化（シンプル版）
     */
    function initializeKanbanDragDrop() {
        const kanbanCards = document.querySelectorAll('.kanban-card');
        const kanbanColumns = document.querySelectorAll('.kanban-column__content');

        // カードにイベントリスナーを設定
        kanbanCards.forEach(card => {
            card.addEventListener('dragstart', handleKanbanDragStart);
            card.addEventListener('dragend', handleKanbanDragEnd);
        });

        // 列にイベントリスナーを設定
        kanbanColumns.forEach(column => {
            column.addEventListener('dragover', handleKanbanDragOver);
            column.addEventListener('drop', handleKanbanDrop);
            column.addEventListener('dragenter', handleKanbanDragEnter);
            column.addEventListener('dragleave', handleKanbanDragLeave);
        });
    }

    /**
     * カンバンドラッグ&ドロップのイベントハンドラー（シンプル版）
     */
    let draggedProjectId = null;

    function handleKanbanDragStart(e) {
        const card = e.target.closest('.kanban-card');
        if (card) {
            draggedProjectId = card.getAttribute('data-project-id');
            card.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
            console.log('Drag start - Project ID:', draggedProjectId);
        }
    }

    function handleKanbanDragEnd(e) {
        const card = e.target.closest('.kanban-card');
        if (card) {
            card.classList.remove('dragging');
        }
        
        // すべての列からdrag-overクラスを削除
        document.querySelectorAll('.kanban-column__content').forEach(col => {
            col.classList.remove('drag-over');
        });
    }

    function handleKanbanDragEnter(e) {
        const column = e.target.closest('.kanban-column__content');
        if (column) {
            column.classList.add('drag-over');
        }
    }

    function handleKanbanDragOver(e) {
        e.preventDefault();
        const column = e.target.closest('.kanban-column__content');
        if (column) {
            e.dataTransfer.dropEffect = 'move';
        }
    }

    function handleKanbanDragLeave(e) {
        const column = e.target.closest('.kanban-column__content');
        if (column && e.target === column) {
            column.classList.remove('drag-over');
        }
    }

    function handleKanbanDrop(e) {
        e.preventDefault();
        
        const dropColumn = e.target.closest('.kanban-column__content');
        if (!dropColumn || !draggedProjectId) {
            return;
        }
        
        dropColumn.classList.remove('drag-over');
        
        const newStatus = dropColumn.getAttribute('data-status');
        console.log('Drop - Project ID:', draggedProjectId, 'New Status:', newStatus);
        
        if (newStatus) {
            // プロジェクトのステータスを更新
            DataStore.projects.update(draggedProjectId, { status: newStatus });
            Utils.toast.show('プロジェクトのステータスを更新しました', 'success');
            
            // ビューを更新
            updateProjectsView();
        }
        
        draggedProjectId = null;
    }

    /**
     * プロジェクトビューの更新
     */
    function updateProjectsView() {
        const content = document.getElementById('projects-content');
        if (content && currentView !== 'detail') {
            content.innerHTML = renderProjectsView();
            
            // カンバンビューの場合はドラッグ&ドロップを再初期化
            if (currentView === 'kanban') {
                setTimeout(() => {
                    initializeKanbanDragDrop();
                }, 100);
            }
        }
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
     * 優先度ラベルの取得
     */
    function getPriorityLabel(priority) {
        const labels = {
            high: '高',
            medium: '中',
            low: '低'
        };
        return labels[priority] || priority;
    }

    // Public API
    return {
        render,
        showNewProjectModal,
        showNewTaskModal(projectId) {
            const project = DataStore.projects.getById(projectId);
            if (!project) return;

            const teamMembers = DataStore.teamMembers.getByProject(projectId);

            const content = `
                <form id="new-task-form" class="task-form">
                    <div class="form-group">
                        <label class="form-label">タスク名 <span class="required">*</span></label>
                        <input type="text" class="form-control" id="task-title" required>
                    </div>

                    <div class="form-group">
                        <label class="form-label">説明</label>
                        <textarea class="form-control" id="task-description" rows="3"></textarea>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">ステータス</label>
                            <select class="form-control" id="task-status">
                                <option value="todo">未着手</option>
                                <option value="in_progress">進行中</option>
                                <option value="completed">完了</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">優先度</label>
                            <select class="form-control" id="task-priority">
                                <option value="low">低</option>
                                <option value="medium" selected>中</option>
                                <option value="high">高</option>
                            </select>
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">担当者</label>
                            <select class="form-control" id="task-assignee">
                                <option value="">未割当</option>
                                ${teamMembers.map(member => 
                                    `<option value="${member.id}">${member.name}</option>`
                                ).join('')}
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">期限</label>
                            <input type="date" class="form-control" id="task-due-date">
                        </div>
                    </div>

                    <div class="form-group">
                        <label class="form-label">見積時間（時間）</label>
                        <input type="number" class="form-control" id="task-estimated-hours" min="0" step="0.5">
                    </div>

                    <div class="form-group">
                        <label class="form-label">タグ（カンマ区切り）</label>
                        <input type="text" class="form-control" id="task-tags" placeholder="例: バグ修正, UI改善">
                    </div>

                    <div class="form-actions">
                        <button type="button" class="btn btn--outline" onclick="Utils.modal.hide(document.querySelector('.modal'))">
                            キャンセル
                        </button>
                        <button type="submit" class="btn btn--primary">
                            タスクを作成
                        </button>
                    </div>
                </form>
            `;

            const modal = Utils.modal.show(content, {
                title: '新規タスク',
                closeOnOverlay: false
            });

            // フォーム送信イベント
            document.getElementById('new-task-form').addEventListener('submit', (e) => {
                e.preventDefault();
                handleCreateTask(e, projectId);
            });
        },
        editProject,
        deleteProject,
        showProjectDetail,
        editTask(taskId) {
            const task = DataStore.tasks.getById(taskId);
            if (!task) return;

            const project = DataStore.projects.getById(task.projectId);
            const teamMembers = DataStore.teamMembers.getByProject(task.projectId);

            const content = `
                <form id="edit-task-form" class="task-form">
                    <div class="form-group">
                        <label class="form-label">タスク名 <span class="required">*</span></label>
                        <input type="text" class="form-control" id="task-title" value="${task.title}" required>
                    </div>

                    <div class="form-group">
                        <label class="form-label">説明</label>
                        <textarea class="form-control" id="task-description" rows="3">${task.description || ''}</textarea>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">ステータス</label>
                            <select class="form-control" id="task-status">
                                <option value="todo" ${task.status === 'todo' ? 'selected' : ''}>未着手</option>
                                <option value="in_progress" ${task.status === 'in_progress' ? 'selected' : ''}>進行中</option>
                                <option value="completed" ${task.status === 'completed' ? 'selected' : ''}>完了</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">優先度</label>
                            <select class="form-control" id="task-priority">
                                <option value="low" ${task.priority === 'low' ? 'selected' : ''}>低</option>
                                <option value="medium" ${task.priority === 'medium' ? 'selected' : ''}>中</option>
                                <option value="high" ${task.priority === 'high' ? 'selected' : ''}>高</option>
                            </select>
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">担当者</label>
                            <select class="form-control" id="task-assignee">
                                <option value="">未割当</option>
                                ${teamMembers.map(member => 
                                    `<option value="${member.id}" ${task.assignee === member.id ? 'selected' : ''}>${member.name}</option>`
                                ).join('')}
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">期限</label>
                            <input type="date" class="form-control" id="task-due-date" value="${task.dueDate || ''}">
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label class="form-label">見積時間（時間）</label>
                            <input type="number" class="form-control" id="task-estimated-hours" 
                                   min="0" step="0.5" value="${task.estimatedHours || ''}">
                        </div>
                        <div class="form-group">
                            <label class="form-label">実績時間（時間）</label>
                            <input type="number" class="form-control" id="task-actual-hours" 
                                   min="0" step="0.5" value="${task.actualHours || ''}">
                        </div>
                    </div>

                    <div class="form-group">
                        <label class="form-label">タグ（カンマ区切り）</label>
                        <input type="text" class="form-control" id="task-tags" 
                               value="${task.tags ? task.tags.join(', ') : ''}">
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
                title: 'タスク編集',
                closeOnOverlay: false
            });

            // フォーム送信イベント
            document.getElementById('edit-task-form').addEventListener('submit', (e) => {
                e.preventDefault();
                handleUpdateTask(e, taskId);
            });
        },
        deleteTask(taskId) {
            if (confirm('このタスクを削除しますか？')) {
                DataStore.tasks.delete(taskId);
                const tasks = DataStore.tasks.getByProject(currentProject.id);
                document.getElementById('task-board').innerHTML = renderTaskBoard(tasks);
                initializeTaskManagement(currentProject);
                updateProjectProgress(currentProject.id);
                Utils.toast.show('タスクを削除しました', 'success');
            }
        },
        switchView(view) {
            currentView = view;
            updateProjectsView();
            
            // ビューボタンのアクティブ状態を更新
            document.querySelectorAll('.view-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            event.target.closest('.view-btn').classList.add('active');
            
            // カンバンビューの場合はドラッグ&ドロップを初期化
            if (view === 'kanban') {
                setTimeout(() => {
                    initializeKanbanDragDrop();
                }, 100);
            }
        },
        applyFilters() {
            filters.status = document.getElementById('status-filter').value;
            filters.priority = document.getElementById('priority-filter').value;
            updateProjectsView();
        },
        filterTasks() {
            if (!currentProject) return;
            
            const statusFilter = document.getElementById('task-status-filter').value;
            const assigneeFilter = document.getElementById('task-assignee-filter').value;
            
            let tasks = DataStore.tasks.getByProject(currentProject.id);
            
            // ステータスフィルター
            if (statusFilter !== 'all') {
                tasks = tasks.filter(t => t.status === statusFilter);
            }
            
            // 担当者フィルター
            if (assigneeFilter !== 'all') {
                tasks = tasks.filter(t => t.assignee === parseInt(assigneeFilter));
            }
            
            // タスクボードを再描画
            document.getElementById('task-board').innerHTML = renderTaskBoard(tasks);
            initializeTaskManagement(currentProject);
        },
        backToList() {
            currentView = 'list';
            currentProject = null;
            
            // コンテンツを再レンダリング
            const content = document.getElementById('projects-content');
            if (content) {
                content.innerHTML = renderProjectsView();
                // イベントリスナーの再設定
                setupEventListeners();
            }
        },
        exportProjects() {
            const projects = getFilteredProjects();
            const exportData = projects.map(p => ({
                'プロジェクト名': p.name,
                '説明': p.description,
                'ステータス': getStatusLabel(p.status),
                '優先度': getPriorityLabel(p.priority),
                '進捗': p.progress + '%',
                '開始日': p.startDate,
                '終了日': p.endDate,
                '予算': p.budget,
                '使用済み': p.spent
            }));

            Utils.export.csv(exportData, `プロジェクト一覧_${Utils.date.format(new Date(), 'YYYYMMDD')}.csv`);
            Utils.toast.show('プロジェクトデータをエクスポートしました', 'success');
        }
    };
})();

// グローバルに公開
window.Projects = Projects;