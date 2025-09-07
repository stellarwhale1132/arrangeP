                document.addEventListener('DOMContentLoaded', () => {
                    // --- DOM 元素獲取 ---
                    const imageGrid = document.getElementById('image-grid');
                    const uploadBtn = document.getElementById('upload-btn');
                    const imageUpload = document.getElementById('image-upload');
                    const noteInput = document.getElementById('note-input');
                    const tagInput = document.getElementById('tag-input');
                    const addItemBtn = document.getElementById('add-item-btn');
                    const dropZone = document.getElementById('drop-zone');

                    const categoryList = document.getElementById('category-list');
                    const newCategoryInput = document.getElementById('new-category-input');
                    const addCategoryBtn = document.getElementById('add-category-btn');
                    const tagListContainer = document.getElementById('tag-list');

                    const exportBtn = document.getElementById('export-data-btn');
                    const importBtn = document.getElementById('import-data-btn');
                    const importFileInput = document.getElementById('import-file-input');

                    const themeToggle = document.getElementById('theme-toggle');

                    const editModal = document.getElementById('edit-modal');
                    const closeModalBtn = document.querySelector('.close-btn');
                    const saveEditBtn = document.getElementById('save-edit-btn');
                    const editIdInput = document.getElementById('edit-id-input');
                    const editNoteInput = document.getElementById('edit-note-input');
                    const editTagInput = document.getElementById('edit-tag-input');
                    const editCategorySelect = document.getElementById('edit-category-select');

                    // --- 應用程式狀態管理 ---
                    let items = []; // 儲存所有圖片項目
                    let categories = ['預設分類']; // 儲存所有分類
                    let currentFilter = { type: 'all', value: 'all' }; // 當前篩選器

                    // --- 初始化 SortableJS 實現拖曳排序 (已優化) ---
                    let sortable = new Sortable(imageGrid, {
                        animation: 150,
                        ghostClass: 'sortable-ghost',
                        handle: '.drag-handle', // 指定只有這個 class 的元素才能觸發拖曳
                        onEnd: (evt) => {
                            const movedItem = items.find(item => item.id === evt.item.dataset.id);
                            if (!movedItem) return;

                            // 從原始位置刪除
                            items = items.filter(item => item.id !== evt.item.dataset.id);
                            // 插入到新位置
                            items.splice(evt.newIndex, 0, movedItem);

                            saveData();
                            // 注意：拖曳後不需要重新渲染整個畫面，避免閃爍
                        },
                    });

                    // --- 資料處理函式 ---

                    // 儲存資料到 localStorage
                    const saveData = () => {
                        const appData = {
                            items,
                            categories
                        };
                        localStorage.setItem('imageDataApp', JSON.stringify(appData));
                    };

                    // 從 localStorage 載入資料
                    const loadData = () => {
                        const savedData = localStorage.getItem('imageDataApp');
                        if (savedData) {
                            const appData = JSON.parse(savedData);
                            items = appData.items || [];
                            categories = appData.categories || ['預設分類'];
                        }
                    };

                    // --- 渲染函式 (將資料顯示在畫面上) ---

                    // 渲染所有項目 (圖片卡片)
                    const renderItems = () => {
                        imageGrid.innerHTML = ''; // 清空現有內容

                        const filteredItems = items.filter(item => {
                            if (currentFilter.type === 'all') return true;
                            if (currentFilter.type === 'favorites') return item.isFavorite;
                            if (currentFilter.type === 'uncategorized') return !item.category || item.category === "預設分類";
                            if (currentFilter.type === 'category') return item.category === currentFilter.value;
                            if (currentFilter.type === 'tag') return item.tags.includes(currentFilter.value);
                            return false;
                        });

                        filteredItems.forEach(item => {
                            const card = document.createElement('div');
                            card.className = 'image-card';
                            card.dataset.id = item.id;

                            const tagsHTML = item.tags.map(tag => `<span class="tag">${tag}</span>`).join('');

                            // 使用包含拖曳手柄的新版 HTML 模板
                            card.innerHTML = `
                                <img src="${item.imageData}" alt="Image">
                                <i class="fa-solid fa-star favorite-btn ${item.isFavorite ? 'is-favorite' : ''}"></i>
                                <div class="card-content">
                                    <p class="card-note">${item.note || '<i>無備註</i>'}</p>
                                    <div class="card-tags">${tagsHTML}</div>
                                    <div class="card-actions">
                                        <i class="fa-solid fa-grip-vertical drag-handle" title="按住拖曳排序"></i>
                                        <div class="action-buttons-group">
                                            <button class="action-btn btn-copy" title="複製備註"><i class="fa-solid fa-copy"></i></button>
                                            <button class="action-btn btn-edit" title="編輯"><i class="fa-solid fa-pencil"></i></button>
                                            <button class="action-btn btn-delete" title="刪除"><i class="fa-solid fa-trash"></i></button>
                                        </div>
                                    </div>
                                </div>
                            `;
                            imageGrid.appendChild(card);
                        });
                    };

                    // 渲染分類列表
                    const renderCategories = () => {
                        const customCategories = categoryList.querySelectorAll('li:not([data-category="all"]):not([data-category="favorites"]):not([data-category="uncategorized"])');
                        customCategories.forEach(li => li.remove());

                        const favoritesLi = categoryList.querySelector('li[data-category="favorites"]');

                        categories.forEach(cat => {
                            if (cat !== "預設分類") {
                                const li = document.createElement('li');
                                li.dataset.category = cat;
                                li.textContent = cat;
                                categoryList.insertBefore(li, favoritesLi.nextSibling);
                            }
                        });
                        updateActiveFilter();
                    };

                    // 渲染標籤雲
                    const renderTags = () => {
                        const allTags = new Set(items.flatMap(item => item.tags));
                        tagListContainer.innerHTML = '';
                        allTags.forEach(tag => {
                            const tagEl = document.createElement('span');
                            tagEl.className = 'tag';
                            tagEl.dataset.tag = tag;
                            tagEl.textContent = tag;
                            tagListContainer.appendChild(tagEl);
                        });
                         updateActiveFilter();
                    };

                    // 更新篩選器高亮狀態
                    const updateActiveFilter = () => {
                        document.querySelectorAll('.filter-list li, .tag-cloud .tag').forEach(el => {
                            el.classList.remove('active');
                            const type = el.dataset.category ? 'category' : 'tag';
                            const value = el.dataset.category || el.dataset.tag;

                            if ((currentFilter.type === 'all' && value === 'all') ||
                                (currentFilter.type === 'favorites' && value === 'favorites') ||
                                (currentFilter.type === 'uncategorized' && value === 'uncategorized') ||
                                (currentFilter.type === type && currentFilter.value === value)) {
                                el.classList.add('active');
                            }
                        });
                    };

                    // 刷新整個應用程式畫面
                    const refreshApp = () => {
                        renderCategories();
                        renderTags();
                        renderItems();
                    };

                    // --- 核心功能函式 ---

                    const handleFile = (file) => {
                        if (!file || !file.type.startsWith('image/')) return;

                        const reader = new FileReader();
                        reader.onload = (e) => {
                            const note = noteInput.value.trim();
                            const tags = tagInput.value.trim().split(/[,，\s]+/).filter(Boolean);

                            const newItem = {
                                id: Date.now().toString(),
                                imageData: e.target.result,
                                note: note,
                                tags: tags,
                                isFavorite: false,
                                category: '預設分類'
                            };

                            items.unshift(newItem);
                            saveData();
                            refreshApp();

                            noteInput.value = '';
                            tagInput.value = '';
                            imageUpload.value = '';
                        };
                        reader.readAsDataURL(file);
                    };

                    const handlePaste = (e) => {
                        const clipboardItems = (e.clipboardData || e.originalEvent.clipboardData).items;
                        for (const item of clipboardItems) {
                            if (item.kind === 'file' && item.type.startsWith('image/')) {
                                const file = item.getAsFile();

                                const reader = new FileReader();
                                reader.onload = (event) => {
                                    const newItem = {
                                        id: Date.now().toString(),
                                        imageData: event.target.result,
                                        note: '',
                                        tags: [],
                                        isFavorite: false,
                                        category: '預設分類'
                                    };

                                    items.unshift(newItem);
                                    saveData();
                                    refreshApp();
                                };
                                reader.readAsDataURL(file);
                                e.preventDefault();
                                break;
                            }
                        }
                    };

                    // --- 事件監聽器 ---

                    uploadBtn.addEventListener('click', () => imageUpload.click());
                    imageUpload.addEventListener('change', (e) => {
                        if (e.target.files.length > 0) handleFile(e.target.files[0]);
                    });
                    addItemBtn.addEventListener('click', () => {
                        if (imageUpload.files.length > 0) {
                            handleFile(imageUpload.files[0]);
                        } else alert('請先選擇一張圖片！');
                    });
                    window.addEventListener('paste', handlePaste);
                    dropZone.addEventListener('dragover', (e) => e.preventDefault());
                    dropZone.addEventListener('drop', (e) => {
                        e.preventDefault();
                        if (e.dataTransfer.files.length > 0) handleFile(e.dataTransfer.files[0]);
                    });

                    imageGrid.addEventListener('click', (e) => {
                        const target = e.target.closest('button.action-btn, .favorite-btn');
                        if (!target) return;

                        const card = target.closest('.image-card');
                        const id = card.dataset.id;

                        if (target.classList.contains('btn-copy')) {
                            const noteToCopy = items.find(item => item.id === id)?.note || '';
                            navigator.clipboard.writeText(noteToCopy).then(() => alert('備註已複製！'));
                        }

                        if (target.classList.contains('btn-delete')) {
                            if (confirm('確定要刪除這個項目嗎？')) {
                                items = items.filter(item => item.id !== id);
                                saveData();
                                refreshApp();
                            }
                        }

                        if (target.classList.contains('btn-edit')) {
                            const item = items.find(item => item.id === id);
                            if(item) {
                                editIdInput.value = id;
                                editNoteInput.value = item.note;
                                editTagInput.value = item.tags.join(', ');

                                editCategorySelect.innerHTML = '';
                                ['預設分類', ...categories.filter(c => c !== '預設分類')].forEach(cat => {
                                    const option = document.createElement('option');
                                    option.value = cat;
                                    option.textContent = cat;
                                    if (item.category === cat) option.selected = true;
                                    editCategorySelect.appendChild(option);
                                });

                                editModal.style.display = 'flex';
                            }
                        }

                        if (target.classList.contains('favorite-btn')) {
                            const item = items.find(item => item.id === id);
                            if (item) {
                                item.isFavorite = !item.isFavorite;
                                saveData();
                                refreshApp();
                            }
                        }
                    });

                    closeModalBtn.addEventListener('click', () => editModal.style.display = 'none');
                    window.addEventListener('click', (e) => {
                        if (e.target === editModal) editModal.style.display = 'none';
                    });

                    saveEditBtn.addEventListener('click', () => {
                        const id = editIdInput.value;
                        const item = items.find(item => item.id === id);
                        if(item) {
                            item.note = editNoteInput.value.trim();
                            item.tags = editTagInput.value.trim().split(/[,，\s]+/).filter(Boolean);
                            item.category = editCategorySelect.value;
                            saveData();
                            refreshApp();
                            editModal.style.display = 'none';
                        }
                    });

                    addCategoryBtn.addEventListener('click', () => {
                        const newCategory = newCategoryInput.value.trim();
                        if (newCategory && !categories.includes(newCategory) && newCategory !== '預設分類') {
                            categories.push(newCategory);
                            saveData();
                            renderCategories();
                            newCategoryInput.value = '';
                        } else if (!newCategory) {
                            alert('分類名稱不能為空！');
                        } else {
                            alert('該分類已存在！');
                        }
                    });
                    newCategoryInput.addEventListener('keypress', (e) => {
                        if (e.key === 'Enter') addCategoryBtn.click();
                    });

                    categoryList.addEventListener('click', (e) => {
                        if (e.target.tagName === 'LI') {
                            const category = e.target.dataset.category;
                            if (['favorites', 'uncategorized', 'all'].includes(category)) {
                                currentFilter = { type: category, value: category };
                            } else {
                                currentFilter = { type: 'category', value: category };
                            }
                            updateActiveFilter();
                            renderItems();
                        }
                    });

                    tagListContainer.addEventListener('click', (e) => {
                         if (e.target.classList.contains('tag')) {
                            const tag = e.target.dataset.tag;
                            if(currentFilter.type === 'tag' && currentFilter.value === tag) {
                                currentFilter = { type: 'all', value: 'all' };
                            } else {
                                currentFilter = { type: 'tag', value: tag };
                            }
                            updateActiveFilter();
                            renderItems();
                        }
                    });

                    exportBtn.addEventListener('click', () => {
                        if (items.length === 0) return alert('沒有資料可以匯出。');
                        const dataStr = JSON.stringify({ items, categories });
                        const dataBlob = new Blob([dataStr], { type: 'application/json' });
                        const url = URL.createObjectURL(dataBlob);
                        const a = document.createElement('a');
                        a.href = url;
                        const timestamp = new Date().toISOString().slice(0, 19).replace('T', '_').replace(/:/g, '-');
                        a.download = `image_data_backup_${timestamp}.json`;
                        a.click();
                        URL.revokeObjectURL(url);
                    });

                    importBtn.addEventListener('click', () => importFileInput.click());
                    importFileInput.addEventListener('change', (e) => {
                        const file = e.target.files[0];
                        if (file) {
                            if (!confirm('匯入將會覆蓋現有所有資料，確定要繼續嗎？')) {
                                e.target.value = '';
                                return;
                            }
                            const reader = new FileReader();
                            reader.onload = (event) => {
                                try {
                                    const importedData = JSON.parse(event.target.result);
                                    if (importedData.items && importedData.categories) {
                                        items = importedData.items;
                                        categories = importedData.categories;
                                        saveData();
                                        refreshApp();
                                        alert('資料匯入成功！');
                                    } else alert('檔案格式不正確。');
                                } catch (err) {
                                    alert('讀取檔案失敗，請確認檔案為正確的 JSON 格式。');
                                } finally {
                                    e.target.value = '';
                                }
                            };
                            reader.readAsText(file);
                        }
                    });

                    themeToggle.addEventListener('change', () => {
                        document.body.classList.toggle('dark-mode', themeToggle.checked);
                        localStorage.setItem('theme', themeToggle.checked ? 'dark' : 'light');
                    });

                    const loadTheme = () => {
                        const savedTheme = localStorage.getItem('theme');
                        if (savedTheme === 'dark') {
                            document.body.classList.add('dark-mode');
                            themeToggle.checked = true;
                        } else {
                            document.body.classList.remove('dark-mode');
                            themeToggle.checked = false;
                        }
                    };

                    // --- 應用程式啟動 ---
                    loadData();
                    loadTheme();
                    refreshApp();
                });
