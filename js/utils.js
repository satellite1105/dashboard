/**
 * 共通ユーティリティ関数
 * アプリケーション全体で使用する汎用関数群
 */

const Utils = (function() {
    'use strict';

    return {
        /**
         * 日付フォーマット関数
         */
        date: {
            // 日付を指定フォーマットに変換
            format(date, format = 'YYYY/MM/DD') {
                const d = new Date(date);
                if (isNaN(d.getTime())) return '';

                const year = d.getFullYear();
                const month = String(d.getMonth() + 1).padStart(2, '0');
                const day = String(d.getDate()).padStart(2, '0');
                const hours = String(d.getHours()).padStart(2, '0');
                const minutes = String(d.getMinutes()).padStart(2, '0');
                const seconds = String(d.getSeconds()).padStart(2, '0');

                return format
                    .replace('YYYY', year)
                    .replace('MM', month)
                    .replace('DD', day)
                    .replace('HH', hours)
                    .replace('mm', minutes)
                    .replace('ss', seconds);
            },

            // 相対時間表示（例: 2時間前）
            relative(date) {
                const now = new Date();
                const target = new Date(date);
                const diff = now - target;
                const seconds = Math.floor(diff / 1000);
                const minutes = Math.floor(seconds / 60);
                const hours = Math.floor(minutes / 60);
                const days = Math.floor(hours / 24);
                const months = Math.floor(days / 30);
                const years = Math.floor(days / 365);

                if (seconds < 60) return 'たった今';
                if (minutes < 60) return `${minutes}分前`;
                if (hours < 24) return `${hours}時間前`;
                if (days < 30) return `${days}日前`;
                if (months < 12) return `${months}ヶ月前`;
                return `${years}年前`;
            },

            // 日付の差分を日数で取得
            diffInDays(date1, date2) {
                const d1 = new Date(date1);
                const d2 = new Date(date2);
                const diff = Math.abs(d2 - d1);
                return Math.floor(diff / (1000 * 60 * 60 * 24));
            },

            // 営業日計算
            addBusinessDays(date, days) {
                const result = new Date(date);
                let count = 0;
                
                while (count < days) {
                    result.setDate(result.getDate() + 1);
                    // 土日を除外
                    if (result.getDay() !== 0 && result.getDay() !== 6) {
                        count++;
                    }
                }
                
                return result;
            }
        },

        /**
         * 数値フォーマット関数
         */
        number: {
            // 数値をカンマ区切りで表示
            format(num) {
                if (num === null || num === undefined) return '0';
                return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
            },

            // 通貨フォーマット
            currency(num, symbol = '¥') {
                return symbol + this.format(num);
            },

            // パーセンテージ表示
            percentage(num, decimals = 0) {
                return num.toFixed(decimals) + '%';
            },

            // バイトサイズを読みやすい形式に変換
            formatBytes(bytes, decimals = 2) {
                if (bytes === 0) return '0 Bytes';
                
                const k = 1024;
                const dm = decimals < 0 ? 0 : decimals;
                const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
                
                const i = Math.floor(Math.log(bytes) / Math.log(k));
                
                return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
            }
        },

        /**
         * 文字列処理関数
         */
        string: {
            // 文字列を指定長で切り詰め
            truncate(str, length = 50, suffix = '...') {
                if (!str || str.length <= length) return str;
                return str.substring(0, length - suffix.length) + suffix;
            },

            // キャメルケースをケバブケースに変換
            toKebabCase(str) {
                return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
            },

            // イニシャル取得
            getInitials(name) {
                if (!name) return '';
                const parts = name.split(' ');
                if (parts.length >= 2) {
                    return parts[0][0] + parts[parts.length - 1][0];
                }
                return name.substring(0, 2);
            },

            // メールアドレスのバリデーション
            isValidEmail(email) {
                const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                return re.test(email);
            },

            // URLのバリデーション
            isValidUrl(url) {
                try {
                    new URL(url);
                    return true;
                } catch {
                    return false;
                }
            }
        },

        /**
         * 配列処理関数
         */
        array: {
            // 配列をグループ化
            groupBy(array, key) {
                return array.reduce((groups, item) => {
                    const group = (groups[item[key]] || []);
                    group.push(item);
                    groups[item[key]] = group;
                    return groups;
                }, {});
            },

            // 配列から重複を除去
            unique(array, key) {
                if (key) {
                    const seen = new Set();
                    return array.filter(item => {
                        const val = item[key];
                        if (seen.has(val)) return false;
                        seen.add(val);
                        return true;
                    });
                }
                return [...new Set(array)];
            },

            // 配列をソート
            sortBy(array, key, order = 'asc') {
                return [...array].sort((a, b) => {
                    const aVal = a[key];
                    const bVal = b[key];
                    
                    if (aVal < bVal) return order === 'asc' ? -1 : 1;
                    if (aVal > bVal) return order === 'asc' ? 1 : -1;
                    return 0;
                });
            }
        },

        /**
         * DOM操作関数
         */
        dom: {
            // 要素の作成
            createElement(tag, attributes = {}, children = []) {
                const element = document.createElement(tag);
                
                Object.entries(attributes).forEach(([key, value]) => {
                    if (key === 'className') {
                        element.className = value;
                    } else if (key === 'style' && typeof value === 'object') {
                        Object.assign(element.style, value);
                    } else if (key.startsWith('on') && typeof value === 'function') {
                        const event = key.substring(2).toLowerCase();
                        element.addEventListener(event, value);
                    } else {
                        element.setAttribute(key, value);
                    }
                });
                
                children.forEach(child => {
                    if (typeof child === 'string') {
                        element.appendChild(document.createTextNode(child));
                    } else if (child instanceof Node) {
                        element.appendChild(child);
                    }
                });
                
                return element;
            },

            // クラスの切り替え
            toggleClass(element, className) {
                element.classList.toggle(className);
            },

            // アニメーション付きでスクロール
            smoothScroll(target, duration = 300) {
                const targetPosition = target.getBoundingClientRect().top + window.pageYOffset;
                const startPosition = window.pageYOffset;
                const distance = targetPosition - startPosition;
                let startTime = null;

                function animation(currentTime) {
                    if (startTime === null) startTime = currentTime;
                    const timeElapsed = currentTime - startTime;
                    const run = ease(timeElapsed, startPosition, distance, duration);
                    window.scrollTo(0, run);
                    if (timeElapsed < duration) requestAnimationFrame(animation);
                }

                function ease(t, b, c, d) {
                    t /= d / 2;
                    if (t < 1) return c / 2 * t * t + b;
                    t--;
                    return -c / 2 * (t * (t - 2) - 1) + b;
                }

                requestAnimationFrame(animation);
            }
        },

        /**
         * トースト通知
         */
        toast: {
            show(message, type = 'info', duration = 3000) {
                const container = document.getElementById('toast-container');
                if (!container) return;

                const toast = Utils.dom.createElement('div', {
                    className: `toast toast--${type}`
                }, [
                    Utils.dom.createElement('div', { className: 'toast__content' }, [message]),
                    Utils.dom.createElement('button', {
                        className: 'toast__close',
                        onClick: () => this.hide(toast)
                    }, ['×'])
                ]);

                container.appendChild(toast);

                // アニメーション表示
                requestAnimationFrame(() => {
                    toast.classList.add('toast--show');
                });

                // 自動で非表示
                if (duration > 0) {
                    setTimeout(() => this.hide(toast), duration);
                }

                return toast;
            },

            hide(toast) {
                toast.classList.remove('toast--show');
                setTimeout(() => {
                    if (toast.parentNode) {
                        toast.parentNode.removeChild(toast);
                    }
                }, 300);
            }
        },

        /**
         * モーダル管理
         */
        modal: {
            show(content, options = {}) {
                const container = document.getElementById('modal-container');
                if (!container) return;

                const modal = Utils.dom.createElement('div', { className: 'modal' }, [
                    Utils.dom.createElement('div', { 
                        className: 'modal__overlay',
                        onClick: options.closeOnOverlay !== false ? () => this.hide(modal) : null
                    }),
                    Utils.dom.createElement('div', { className: 'modal__content' }, [
                        options.title && Utils.dom.createElement('div', { className: 'modal__header' }, [
                            Utils.dom.createElement('h3', {}, [options.title]),
                            Utils.dom.createElement('button', {
                                className: 'modal__close',
                                onClick: () => this.hide(modal)
                            }, [Utils.dom.createElement('span', {}, ['×'])])
                        ]),
                        Utils.dom.createElement('div', { className: 'modal__body' }, 
                            typeof content === 'string' ? [] : [content]
                        )
                    ])
                ]);

                container.appendChild(modal);

                // HTML文字列の場合は直接innerHTML を設定
                if (typeof content === 'string') {
                    const modalBody = modal.querySelector('.modal__body');
                    modalBody.innerHTML = content;
                }

                // アニメーション表示
                requestAnimationFrame(() => {
                    modal.classList.add('active');
                });

                // ESCキーで閉じる
                const escHandler = (e) => {
                    if (e.key === 'Escape') {
                        this.hide(modal);
                        document.removeEventListener('keydown', escHandler);
                    }
                };
                document.addEventListener('keydown', escHandler);

                return modal;
            },

            hide(modal) {
                modal.classList.remove('active');
                setTimeout(() => {
                    if (modal.parentNode) {
                        modal.parentNode.removeChild(modal);
                    }
                }, 300);
            }
        },

        /**
         * データのエクスポート
         */
        export: {
            // JSONファイルとしてダウンロード
            json(data, filename = 'data.json') {
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                this.download(blob, filename);
            },

            // CSVファイルとしてダウンロード
            csv(data, filename = 'data.csv') {
                if (!Array.isArray(data) || data.length === 0) return;

                const headers = Object.keys(data[0]);
                const csvContent = [
                    headers.join(','),
                    ...data.map(row => 
                        headers.map(header => {
                            const value = row[header];
                            return typeof value === 'string' && value.includes(',') 
                                ? `"${value}"` 
                                : value;
                        }).join(',')
                    )
                ].join('\n');

                const blob = new Blob([csvContent], { type: 'text/csv' });
                this.download(blob, filename);
            },

            // ファイルダウンロード
            download(blob, filename) {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }
        },

        /**
         * デバウンス関数
         */
        debounce(func, wait) {
            let timeout;
            return function executedFunction(...args) {
                const later = () => {
                    clearTimeout(timeout);
                    func(...args);
                };
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
            };
        },

        /**
         * スロットル関数
         */
        throttle(func, limit) {
            let inThrottle;
            return function(...args) {
                if (!inThrottle) {
                    func.apply(this, args);
                    inThrottle = true;
                    setTimeout(() => inThrottle = false, limit);
                }
            };
        },

        /**
         * カラーユーティリティ
         */
        color: {
            // ステータスに応じた色を取得
            getStatusColor(status) {
                const colors = {
                    active: 'var(--color-success)',
                    completed: 'var(--color-info)',
                    planning: 'var(--color-warning)',
                    on_hold: 'var(--color-error)',
                    todo: 'var(--color-warning)',
                    in_progress: 'var(--color-primary)',
                    done: 'var(--color-success)'
                };
                return colors[status] || 'var(--color-text-secondary)';
            },

            // 優先度に応じた色を取得
            getPriorityColor(priority) {
                const colors = {
                    high: 'var(--color-error)',
                    medium: 'var(--color-warning)',
                    low: 'var(--color-info)'
                };
                return colors[priority] || 'var(--color-text-secondary)';
            }
        },

        /**
         * バリデーション
         */
        validation: {
            required(value) {
                return value !== null && value !== undefined && value !== '';
            },

            minLength(value, length) {
                return value && value.length >= length;
            },

            maxLength(value, length) {
                return !value || value.length <= length;
            },

            pattern(value, pattern) {
                return pattern.test(value);
            },

            dateRange(startDate, endDate) {
                return new Date(startDate) <= new Date(endDate);
            }
        }
    };
})();

// グローバルに公開
window.Utils = Utils;