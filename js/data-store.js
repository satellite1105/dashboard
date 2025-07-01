/**
 * データストア管理モジュール
 * アプリケーション全体のデータを一元管理
 */

const DataStore = (function() {
    'use strict';

    // localStorageのキー
    const STORAGE_KEY = 'projectHub_data';
    
    // プライベート変数
    let data = null;
    
    // デフォルトデータ
    const defaultData = {
        // プロジェクトデータ
        projects: [],
        
        // タスクデータ
        tasks: [],
        
        // チームメンバー
        teamMembers: [],
        
        // アクティビティログ
        activities: [],
        
        // 通知
        notifications: [],
        
        // レポート設定
        reportSettings: {
            defaultPeriod: 'monthly',
            includeArchived: false,
            exportFormat: 'pdf'
        },
        
        // アプリケーション設定
        settings: {
            theme: 'dark',
            language: 'ja',
            notifications: {
                email: true,
                browser: true,
                slack: false
            },
            dateFormat: 'YYYY/MM/DD',
            weekStart: 'monday'
        },
        
        // ユーザー情報
        currentUser: {
            id: 1,
            name: '田中太郎',
            email: 'tanaka@example.com',
            role: 'manager',
            avatar: null,
            department: '開発部'
        }
    };

    // イベントリスナー管理
    const listeners = {};

    /**
     * localStorageからデータを読み込み
     */
    function loadFromStorage() {
        try {
            const savedData = localStorage.getItem(STORAGE_KEY);
            if (savedData) {
                return JSON.parse(savedData);
            }
        } catch (error) {
            console.error('データの読み込みに失敗しました:', error);
        }
        return null;
    }

    /**
     * localStorageにデータを保存
     */
    function saveToStorage() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        } catch (error) {
            console.error('データの保存に失敗しました:', error);
            // ストレージ容量エラーの場合は古いアクティビティを削除
            if (error.name === 'QuotaExceededError') {
                data.activities = data.activities.slice(0, 50);
                try {
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
                } catch (retryError) {
                    console.error('再試行も失敗しました:', retryError);
                }
            }
        }
    }

    // 初期データ生成
    function initializeData() {
        // localStorageからデータを読み込み
        const savedData = loadFromStorage();
        
        if (savedData) {
            // 保存されたデータがある場合は使用
            data = savedData;
            console.log('保存されたデータを読み込みました');
        } else {
            // 新規ユーザーの場合は初期データを生成
            data = JSON.parse(JSON.stringify(defaultData));
            
            // サンプルプロジェクト
            data.projects = [
                {
                    id: generateId(),
                    name: 'ECサイトリニューアル',
                    description: '既存ECサイトのUI/UX改善とパフォーマンス向上',
                    status: 'active',
                    priority: 'high',
                    startDate: '2024-01-15',
                    endDate: '2024-06-30',
                    progress: 65,
                    budget: 5000000,
                    spent: 3250000,
                    manager: 1,
                    members: [1, 2, 3],
                    tags: ['web', 'ecommerce', 'redesign'],
                    createdAt: '2024-01-10T09:00:00',
                    updatedAt: new Date().toISOString()
                },
                {
                    id: generateId(),
                    name: 'モバイルアプリ開発',
                    description: 'iOS/Android向けネイティブアプリの新規開発',
                    status: 'active',
                    priority: 'medium',
                    startDate: '2024-02-01',
                    endDate: '2024-08-31',
                    progress: 35,
                    budget: 8000000,
                    spent: 2800000,
                    manager: 2,
                    members: [2, 4, 5],
                    tags: ['mobile', 'ios', 'android'],
                    createdAt: '2024-01-20T10:30:00',
                    updatedAt: new Date().toISOString()
                },
                {
                    id: generateId(),
                    name: '社内システム統合',
                    description: '分散している社内システムの統合プロジェクト',
                    status: 'planning',
                    priority: 'low',
                    startDate: '2024-04-01',
                    endDate: '2024-12-31',
                    progress: 10,
                    budget: 3000000,
                    spent: 300000,
                    manager: 3,
                    members: [1, 3, 6],
                    tags: ['internal', 'integration'],
                    createdAt: '2024-02-15T14:00:00',
                    updatedAt: new Date().toISOString()
                }
            ];

            // サンプルタスク
            data.tasks = [
                {
                    id: generateId(),
                    projectId: data.projects[0].id,
                    title: 'トップページデザイン作成',
                    description: 'モダンでレスポンシブなデザインの作成',
                    status: 'completed',
                    priority: 'high',
                    assignee: 2,
                    dueDate: '2024-03-15',
                    completedDate: '2024-03-14',
                    estimatedHours: 40,
                    actualHours: 38,
                    tags: ['design', 'ui'],
                    createdAt: '2024-02-01T09:00:00',
                    updatedAt: '2024-03-14T17:00:00'
                },
                {
                    id: generateId(),
                    projectId: data.projects[0].id,
                    title: 'カート機能実装',
                    description: 'ショッピングカート機能の開発',
                    status: 'in_progress',
                    priority: 'high',
                    assignee: 1,
                    dueDate: '2024-03-30',
                    completedDate: null,
                    estimatedHours: 60,
                    actualHours: 25,
                    tags: ['backend', 'feature'],
                    createdAt: '2024-03-01T10:00:00',
                    updatedAt: new Date().toISOString()
                },
                {
                    id: generateId(),
                    projectId: data.projects[1].id,
                    title: 'API設計書作成',
                    description: 'RESTful APIの設計ドキュメント作成',
                    status: 'todo',
                    priority: 'medium',
                    assignee: 4,
                    dueDate: '2024-04-15',
                    completedDate: null,
                    estimatedHours: 20,
                    actualHours: 0,
                    tags: ['api', 'documentation'],
                    createdAt: '2024-03-10T11:00:00',
                    updatedAt: new Date().toISOString()
                }
            ];

            // サンプルチームメンバー
            data.teamMembers = [
                {
                    id: 1,
                    name: '田中太郎',
                    email: 'tanaka@example.com',
                    role: 'プロジェクトマネージャー',
                    department: '開発部',
                    skills: ['プロジェクト管理', 'JavaScript', 'Python'],
                    joinDate: '2020-04-01',
                    status: 'active',
                    workload: 85,
                    avatar: null
                },
                {
                    id: 2,
                    name: '佐藤花子',
                    email: 'sato@example.com',
                    role: 'UIデザイナー',
                    department: 'デザイン部',
                    skills: ['UI/UX', 'Figma', 'Adobe XD'],
                    joinDate: '2021-06-15',
                    status: 'active',
                    workload: 70,
                    avatar: null
                },
                {
                    id: 3,
                    name: '鈴木一郎',
                    email: 'suzuki@example.com',
                    role: 'バックエンドエンジニア',
                    department: '開発部',
                    skills: ['Java', 'Spring', 'AWS'],
                    joinDate: '2019-09-01',
                    status: 'active',
                    workload: 90,
                    avatar: null
                },
                {
                    id: 4,
                    name: '高橋美咲',
                    email: 'takahashi@example.com',
                    role: 'フロントエンドエンジニア',
                    department: '開発部',
                    skills: ['React', 'Vue.js', 'TypeScript'],
                    joinDate: '2022-01-10',
                    status: 'active',
                    workload: 65,
                    avatar: null
                },
                {
                    id: 5,
                    name: '伊藤健太',
                    email: 'ito@example.com',
                    role: 'QAエンジニア',
                    department: '品質保証部',
                    skills: ['テスト自動化', 'Selenium', 'Jest'],
                    joinDate: '2021-11-01',
                    status: 'active',
                    workload: 75,
                    avatar: null
                },
                {
                    id: 6,
                    name: '山田優子',
                    email: 'yamada@example.com',
                    role: 'データアナリスト',
                    department: '分析部',
                    skills: ['SQL', 'Python', 'Tableau'],
                    joinDate: '2020-08-20',
                    status: 'vacation',
                    workload: 0,
                    avatar: null
                }
            ];

            // 初期アクティビティ
            addActivity('システムが初期化されました', 'system');
            
            // 初期通知
            addNotification('ProjectHubへようこそ！', 'システムの使用を開始しました。', 'info');
            
            // 初期データを保存
            saveToStorage();
        }
    }

    // ID生成関数
    function generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // アクティビティ追加
    function addActivity(action, type = 'user', metadata = {}) {
        const activity = {
            id: generateId(),
            userId: data.currentUser.id,
            userName: data.currentUser.name,
            action: action,
            type: type, // user, system, project, task
            metadata: metadata,
            timestamp: new Date().toISOString()
        };
        
        data.activities.unshift(activity);
        
        // 最新100件のみ保持
        if (data.activities.length > 100) {
            data.activities = data.activities.slice(0, 100);
        }
        
        // データを保存
        saveToStorage();
        
        emit('activity:added', activity);
    }

    // 通知追加
    function addNotification(title, message, type = 'info') {
        const notification = {
            id: generateId(),
            title: title,
            message: message,
            type: type, // info, success, warning, error
            read: false,
            timestamp: new Date().toISOString()
        };
        
        data.notifications.unshift(notification);
        
        // データを保存
        saveToStorage();
        
        emit('notification:added', notification);
        
        return notification;
    }

    // イベント発火
    function emit(event, data) {
        if (listeners[event]) {
            listeners[event].forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in event listener for ${event}:`, error);
                }
            });
        }
    }

    // Public API
    return {
        // 初期化
        init() {
            initializeData();
            return this;
        },

        // イベントリスナー登録
        on(event, callback) {
            if (!listeners[event]) {
                listeners[event] = [];
            }
            listeners[event].push(callback);
            return this;
        },

        // イベントリスナー解除
        off(event, callback) {
            if (listeners[event]) {
                listeners[event] = listeners[event].filter(cb => cb !== callback);
            }
            return this;
        },

        // プロジェクト関連
        projects: {
            getAll() {
                return [...data.projects];
            },

            getById(id) {
                return data.projects.find(p => p.id === id);
            },

            create(project) {
                const newProject = {
                    id: generateId(),
                    ...project,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };
                data.projects.push(newProject);
                addActivity(`プロジェクト「${newProject.name}」を作成しました`, 'project', { projectId: newProject.id });
                saveToStorage();
                emit('project:created', newProject);
                return newProject;
            },

            update(id, updates) {
                const index = data.projects.findIndex(p => p.id === id);
                if (index !== -1) {
                    data.projects[index] = {
                        ...data.projects[index],
                        ...updates,
                        updatedAt: new Date().toISOString()
                    };
                    addActivity(`プロジェクト「${data.projects[index].name}」を更新しました`, 'project', { projectId: id });
                    saveToStorage();
                    emit('project:updated', data.projects[index]);
                    return data.projects[index];
                }
                return null;
            },

            delete(id) {
                const index = data.projects.findIndex(p => p.id === id);
                if (index !== -1) {
                    const deleted = data.projects.splice(index, 1)[0];
                    addActivity(`プロジェクト「${deleted.name}」を削除しました`, 'project', { projectId: id });
                    saveToStorage();
                    emit('project:deleted', deleted);
                    return true;
                }
                return false;
            },

            search(query) {
                const q = query.toLowerCase();
                return data.projects.filter(p => 
                    p.name.toLowerCase().includes(q) ||
                    p.description.toLowerCase().includes(q) ||
                    p.tags.some(tag => tag.toLowerCase().includes(q))
                );
            }
        },

        // タスク関連
        tasks: {
            getAll() {
                return [...data.tasks];
            },

            getByProject(projectId) {
                return data.tasks.filter(t => t.projectId === projectId);
            },

            getById(id) {
                return data.tasks.find(t => t.id === id);
            },

            create(task) {
                const newTask = {
                    id: generateId(),
                    ...task,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };
                data.tasks.push(newTask);
                addActivity(`タスク「${newTask.title}」を作成しました`, 'task', { taskId: newTask.id });
                saveToStorage();
                emit('task:created', newTask);
                return newTask;
            },

            update(id, updates) {
                const index = data.tasks.findIndex(t => t.id === id);
                if (index !== -1) {
                    const oldStatus = data.tasks[index].status;
                    data.tasks[index] = {
                        ...data.tasks[index],
                        ...updates,
                        updatedAt: new Date().toISOString()
                    };
                    
                    // ステータス変更の場合は特別な処理
                    if (updates.status && updates.status !== oldStatus) {
                        if (updates.status === 'completed') {
                            data.tasks[index].completedDate = new Date().toISOString();
                            addActivity(`タスク「${data.tasks[index].title}」を完了しました`, 'task', { taskId: id });
                        }
                    }
                    
                    saveToStorage();
                    emit('task:updated', data.tasks[index]);
                    return data.tasks[index];
                }
                return null;
            },

            delete(id) {
                const index = data.tasks.findIndex(t => t.id === id);
                if (index !== -1) {
                    const deleted = data.tasks.splice(index, 1)[0];
                    addActivity(`タスク「${deleted.title}」を削除しました`, 'task', { taskId: id });
                    saveToStorage();
                    emit('task:deleted', deleted);
                    return true;
                }
                return false;
            }
        },

        // チームメンバー関連
        teamMembers: {
            getAll() {
                return [...data.teamMembers];
            },

            getById(id) {
                return data.teamMembers.find(m => m.id === id);
            },

            getByProject(projectId) {
                const project = data.projects.find(p => p.id === projectId);
                if (project) {
                    return data.teamMembers.filter(m => project.members.includes(m.id));
                }
                return [];
            },

            create(member) {
                const newMember = {
                    id: data.teamMembers.length > 0 ? Math.max(...data.teamMembers.map(m => m.id)) + 1 : 1,
                    ...member,
                    workload: member.workload || 0,
                    avatar: member.avatar || null
                };
                data.teamMembers.push(newMember);
                addActivity(`チームメンバー「${newMember.name}」を追加しました`, 'user', { memberId: newMember.id });
                saveToStorage();
                emit('member:created', newMember);
                return newMember;
            },

            update(id, updates) {
                const index = data.teamMembers.findIndex(m => m.id === id);
                if (index !== -1) {
                    data.teamMembers[index] = {
                        ...data.teamMembers[index],
                        ...updates
                    };
                    saveToStorage();
                    emit('member:updated', data.teamMembers[index]);
                    return data.teamMembers[index];
                }
                return null;
            },

            delete(id) {
                const index = data.teamMembers.findIndex(m => m.id === id);
                if (index !== -1) {
                    const deleted = data.teamMembers.splice(index, 1)[0];
                    
                    // プロジェクトからメンバーを削除
                    data.projects.forEach(project => {
                        const memberIndex = project.members.indexOf(id);
                        if (memberIndex !== -1) {
                            project.members.splice(memberIndex, 1);
                        }
                        if (project.manager === id) {
                            project.manager = null;
                        }
                    });
                    
                    // タスクから担当者を削除
                    data.tasks.forEach(task => {
                        if (task.assignee === id) {
                            task.assignee = null;
                        }
                    });
                    
                    addActivity(`チームメンバー「${deleted.name}」を削除しました`, 'user', { memberId: id });
                    saveToStorage();
                    emit('member:deleted', deleted);
                    return true;
                }
                return false;
            }
        },

        // アクティビティ関連
        activities: {
            getRecent(limit = 20) {
                return data.activities.slice(0, limit);
            },

            getByProject(projectId) {
                return data.activities.filter(a => 
                    a.metadata && a.metadata.projectId === projectId
                );
            }
        },

        // 通知関連
        notifications: {
            getAll() {
                return [...data.notifications];
            },

            getUnread() {
                return data.notifications.filter(n => !n.read);
            },

            markAsRead(id) {
                const notification = data.notifications.find(n => n.id === id);
                if (notification) {
                    notification.read = true;
                    saveToStorage();
                    emit('notification:read', notification);
                    return true;
                }
                return false;
            },

            markAllAsRead() {
                data.notifications.forEach(n => n.read = true);
                saveToStorage();
                emit('notifications:allRead');
                return true;
            },

            add(title, message, type) {
                return addNotification(title, message, type);
            }
        },

        // 設定関連
        settings: {
            get(key) {
                return key ? data.settings[key] : { ...data.settings };
            },

            update(updates) {
                data.settings = {
                    ...data.settings,
                    ...updates
                };
                saveToStorage();
                emit('settings:updated', data.settings);
                return data.settings;
            }
        },

        // 現在のユーザー
        currentUser: {
            get() {
                return { ...data.currentUser };
            },

            update(updates) {
                data.currentUser = {
                    ...data.currentUser,
                    ...updates
                };
                saveToStorage();
                emit('user:updated', data.currentUser);
                return data.currentUser;
            }
        },

        // 統計情報取得
        getStats() {
            const now = new Date();
            const activeProjects = data.projects.filter(p => p.status === 'active').length;
            const totalTasks = data.tasks.length;
            const completedTasks = data.tasks.filter(t => t.status === 'completed').length;
            const activeTasks = data.tasks.filter(t => t.status === 'in_progress').length;
            const overdueTasks = data.tasks.filter(t => 
                t.status !== 'completed' && new Date(t.dueDate) < now
            ).length;

            // 完了率計算
            const completionRate = totalTasks > 0 
                ? Math.round((completedTasks / totalTasks) * 100) 
                : 0;

            // 予算使用率計算
            const totalBudget = data.projects.reduce((sum, p) => sum + p.budget, 0);
            const totalSpent = data.projects.reduce((sum, p) => sum + p.spent, 0);
            const budgetUsage = totalBudget > 0 
                ? Math.round((totalSpent / totalBudget) * 100) 
                : 0;

            return {
                activeProjects,
                totalTasks,
                completedTasks,
                activeTasks,
                overdueTasks,
                completionRate,
                totalBudget,
                totalSpent,
                budgetUsage,
                teamMembers: data.teamMembers.filter(m => m.status === 'active').length,
                unreadNotifications: data.notifications.filter(n => !n.read).length
            };
        },

        // デバッグ用
        _getData() {
            return data;
        },

        // 手動保存（特殊なケース用）
        saveToStorage,

        // データリセット
        resetAllData() {
            if (confirm('すべてのデータを削除して初期状態に戻しますか？この操作は取り消せません。')) {
                localStorage.removeItem(STORAGE_KEY);
                data = null;
                initializeData();
                emit('data:reset');
                return true;
            }
            return false;
        }
    };
})();

// グローバルに公開
window.DataStore = DataStore;