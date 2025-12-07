// ==UserScript==
// @name         ECENTIME Admin 助手
// @namespace    http://tampermonkey.net/
// @version      1.9
// @description  在包含 index.php?g=admin 的 iframe 中执行 DOM 操作
// @author       You
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_deleteValue
// @match        https://admin.ecentime.com/yifenqian_zdm_admin/index.php?g=admin*
// @downloadURL  https://raw.githubusercontent.com/your-org/tm-scripts/main/scripts/operations.user.js
// @updateURL    https://raw.githubusercontent.com/your-org/tm-scripts/main/scripts/operations.user.js
// @connect      ecttools.ecentime.com
// @grant        unsafeWindow
// ==/UserScript==

(function () {
    'use strict';

    // 等待 iframe 加载
    function waitForIframeAndInject() {
        // 如果未找到符合条件的 iframe，则对当前页面进行操作
        try {
            const url = window.location;  // 直接用现有 location 对象
            const params = new URLSearchParams(url.search);
            const g = params.get('g');
            const m = params.get('m');
            const a = params.get('a');
            const menuid = params.get('menuid');

            if (g === 'admin' && m === 'post') {
                window.addEventListener('load', () => {
                    if (['edit', 'add', 'add_ai'].includes(a)) {
                        performDomOperations(document);
                    } else if (a === 'post_time_publish') {
                        performPostTimeScheduleOperations(document);
                    } else if (a === 'index_all' && menuid === '471') {
                        performPostIndexOperations(document);
                    }
                });
            }
        } catch (e) {
            console.warn('页面 URL 解析失败:', e);
        }
    }

    let domOperated = false;
    // 执行 DOM 操作（通用）
    function performDomOperations(doc) {
        try {
            if (!doc) return;

            if (domOperated) {
                console.log('Already performed, skip.');
                return; // ✅ 如果已经执行过，就不再继续
            }
            domOperated = true; // ✅ 标记为已执行

            console.log('performDomOperations running...');

            // 添加"获取相关链接"按钮
            const targetTable = doc.querySelector('#info_form table.table_form.inner_table');
            if (targetTable) {
                const relatedBtn = doc.createElement('button');
                relatedBtn.innerText = '获取相关链接';
                relatedBtn.style.margin = '10px';
                relatedBtn.style.display = 'block';
                relatedBtn.style.width = '100%';
                relatedBtn.onclick = onGetRelatedLinks;
                targetTable.parentNode.insertBefore(relatedBtn, targetTable.nextSibling);

                const singleBtn = doc.createElement('button');
                singleBtn.innerText = '获取单品链接';
                singleBtn.style.margin = '10px';
                singleBtn.style.display = 'block';
                singleBtn.style.width = '100%';
                singleBtn.onclick = onGetSingleProductLinks;
                relatedBtn.parentNode.insertBefore(singleBtn, relatedBtn.nextSibling);

                const richTextBtn = doc.createElement('button');
                richTextBtn.innerText = '获取富文本链接';
                richTextBtn.style.margin = '10px';
                richTextBtn.style.display = 'block';
                richTextBtn.style.width = '100%';
                richTextBtn.onclick = onRichTextBtnClick;
                singleBtn.parentNode.insertBefore(richTextBtn, singleBtn.nextSibling);

                const mallBtn = doc.createElement('button');
                mallBtn.innerText = '寻找商城卖点';
                mallBtn.style.margin = '10px';
                mallBtn.style.display = 'block';
                mallBtn.style.width = '100%';
                mallBtn.onclick = onFindMallSellingPoints;
                richTextBtn.parentNode.insertBefore(mallBtn, richTextBtn.nextSibling);

                const brandBtn = doc.createElement('button');
                brandBtn.innerText = '寻找品牌卖点';
                brandBtn.style.margin = '10px';
                brandBtn.style.display = 'block';
                brandBtn.style.width = '100%';
                brandBtn.onclick = onFindBrandSellingPoints;
                mallBtn.parentNode.insertBefore(brandBtn, mallBtn.nextSibling);

                const chatgptBtn = doc.createElement('input');
                //添加id为chatgpt-fill-btn
                chatgptBtn.id = 'chatgpt-fill-btn';
                chatgptBtn.type = 'button';
                chatgptBtn.value = 'Chatgpt 填充';
                chatgptBtn.style.padding = '2px 20px';
                chatgptBtn.style.cursor = 'pointer';
                chatgptBtn.onclick = function(event) {
                    // 先执行ChatGPT填充功能
                    onChatgptFill(event);
                };
                
                // 将按钮放置到id为info的textarea所在的td标签的尾部
                const infoTextarea = doc.querySelector('#info');
                if (infoTextarea) {
                    const infoTd = infoTextarea.closest('td');
                    if (infoTd) {
                        infoTd.appendChild(chatgptBtn);
                    } else {
                        // 如果找不到td，则使用原来的位置
                        brandBtn.parentNode.insertBefore(chatgptBtn, brandBtn.nextSibling);
                    }
                } else {
                    // 如果找不到#info textarea，则使用原来的位置
                    brandBtn.parentNode.insertBefore(chatgptBtn, brandBtn.nextSibling);
                }
                
            }

            // 在简易单品标题下添加激活链接编辑按钮
            // 首先查找所有包含simpleProductContainer的tr
            const simpleProductTds = doc.querySelectorAll('td.simpleProductContainer');
            let found = false;
            
            for (let td of simpleProductTds) {
                const tr = td.closest('tr');
                if (!tr) continue;
                
                // 在同一个tr中查找包含"简易单品"的th
                const thInSameRow = tr.querySelector('th');
                if (thInSameRow && thInSameRow.textContent.includes('简易单品')) {
                    addEditButtonToSimpleProduct(doc, thInSameRow);
                    found = true;
                    break;
                }
            }
            
            // 如果上述方法都没找到，使用原来的方法作为备选
            if (!found) {
                const thElements = doc.querySelectorAll('th');
                for (let th of thElements) {
                    if (th.textContent.includes('简易单品')) {
                        // 检查这个th是否与simpleProductContainer相关
                        const tr = th.closest('tr');
                        if (tr) {
                            const nextTr = tr.nextElementSibling;
                            if (nextTr && nextTr.querySelector('td.simpleProductContainer')) {
                                addEditButtonToSimpleProduct(doc, th);
                                break;
                            }
                        }
                    }
                }
            }
        } catch (e) {
            console.error('DOM 操作失败:', e);
        }
    }

    // 自定义按钮点击处理函数
    function onRichTextBtnClick(event) {
        event.preventDefault(); // 阻止默认提交
        event.stopPropagation(); // 阻止冒泡行为

        const doc = event.target.ownerDocument;
        const textarea = doc.querySelector('#info');
        if (!textarea) {
            alert('未找到 #info 文本区域');
            return;
        }

        // 创建用于显示链接的容器（如果已存在先清除）
        let resultContainer = doc.querySelector('#tampermonkey-link-results');
        if (resultContainer) {
            resultContainer.remove();
        }
        resultContainer = doc.createElement('div');
        resultContainer.id = 'tampermonkey-link-results';
        resultContainer.style.margin = '10px 0';

        // 提取链接（使用 DOMParser 解析 HTML）
        const editor = unsafeWindow.editor;
        const htmlDoc = new DOMParser().parseFromString(editor.getData(), 'text/html');
        const links = htmlDoc.querySelectorAll('a[href]');

        if (links.length === 0) {
            resultContainer.innerText = '未找到任何链接';
        } else {
            links.forEach(link => {
                const href = link.getAttribute('href');
                const linkText = (link.textContent && link.textContent.trim()) || '图片';

                const line = doc.createElement('div');
                line.style.margin = '4px 8px';

                const anchor = doc.createElement('a');
                anchor.href = href;
                anchor.innerText = linkText;
                anchor.style.marginRight = '10px';
                anchor.style.cursor = 'pointer';
                anchor.style.color = '#007bff';
                anchor.style.textDecoration = 'underline';
                anchor.addEventListener('click', (e) => {
                    e.preventDefault();
                    navigator.clipboard.writeText(href).then(() => {
                        console.log('链接已复制到剪贴板:\n' + href);
                    }).catch(err => {
                        console.error('复制失败:', err);
                    });
                });

                const addButton = doc.createElement('button');
                addButton.innerText = '👆加相关链接';
                addButton.onclick = (event) => onAddRelatedLinkClick(event, href, linkText);

                const addSimpleProductButton = doc.createElement('button');
                addSimpleProductButton.innerText = '增加相关单品';
                addSimpleProductButton.style.marginLeft = '10px';
                addSimpleProductButton.onclick = (e) => onAddSimpleProductClick(e, href, doc);

                line.appendChild(anchor);
                line.appendChild(addButton);
                line.appendChild(addSimpleProductButton);
                resultContainer.appendChild(line);
            });
        }

        // 插入到按钮下方
        event.target.parentNode.insertBefore(resultContainer, event.target.nextSibling);
    }

    // 处理"添加至相关链接"的点击逻辑
    function onAddRelatedLinkClick(event, link, text = '') {
        event.preventDefault(); // 阻止默认提交
        event.stopPropagation(); // 阻止冒泡行为

        const doc = document;
        let container = doc.querySelector('.linksList');
        if (!container) {
            console.warn('未找到 .linksList，尝试寻找 td.post_link_box #sortable');
            const td = doc.querySelector('td.post_link_box');
            if (td) {
                container = td.querySelector('#sortable');
            }
        }
        if (!container) {
            alert('未找到添加链接的容器');
            return;
        }

        const wrapper = doc.createElement('div');
        wrapper.className = 'post_link_list';
        wrapper.innerHTML = `
        <label>URL: </label>
        <input type="text" name="moreLink[]" value="" hidden="">
        <input type="text" name="moreOriLink[]" class="input-text" value="${link}" placeholder="链接地址" size="80" onmouseover="this.title=this.value" title="${link}">
        <img src="" class="valid_hint">
        <input type="text" name="moreDes[]" class="input-text" placeholder="描述" value="${text}">
        <a href="javascript:void(0);" class="link_delete_btn">删除</a>
    `;
        container.appendChild(wrapper);
    }

    // 处理"增加相关单品"的点击逻辑
    function onAddSimpleProductClick(event, linkUrl, doc) {
        event.preventDefault(); // 阻止默认提交
        event.stopPropagation(); // 阻止冒泡行为

        // 查找 #addMoreSimpleProduct 元素
        const addMoreSimpleProductBtn = doc.querySelector('#addMoreSimpleProduct');
        if (!addMoreSimpleProductBtn) {
            alert('未找到 #addMoreSimpleProduct 元素');
            return;
        }

        // 查找 #addMoreSimpleProduct 前一个 input 元素
        let prevInput = null;
        
        // 查找前一个兄弟元素（直接是input或包含input）
        let prevSibling = addMoreSimpleProductBtn.previousElementSibling;
        while (prevSibling) {
            if (prevSibling.tagName === 'INPUT') {
                prevInput = prevSibling;
                break;
            }
            // 如果前一个兄弟元素包含 input，取最后一个
            const inputsInSibling = prevSibling.querySelectorAll('input');
            if (inputsInSibling.length > 0) {
                prevInput = inputsInSibling[inputsInSibling.length - 1];
                break;
            }
            prevSibling = prevSibling.previousElementSibling;
        }

        if (!prevInput) {
            alert('未找到 #addMoreSimpleProduct 前一个 input 元素');
            console.warn('查找失败，尝试查找的元素:', addMoreSimpleProductBtn);
            return;
        }

        // 将链接URL填入 input
        prevInput.value = linkUrl;
        
        // 触发 input 的 change 和 input 事件，确保页面能识别值的变化
        const changeEvent = new Event('change', { bubbles: true });
        const inputEvent = new Event('input', { bubbles: true });
        prevInput.dispatchEvent(changeEvent);
        prevInput.dispatchEvent(inputEvent);

        // 触发 #addMoreSimpleProduct 的 click 事件
        // 使用 click() 方法更可靠，兼容性更好
        try {
            addMoreSimpleProductBtn.click();
        } catch (e) {
            // 如果 click() 方法失败，尝试使用 MouseEvent
            const view = doc.defaultView || doc.parentWindow || window;
            const clickEvent = new MouseEvent('click', {
                bubbles: true,
                cancelable: true,
                view: view
            });
            addMoreSimpleProductBtn.dispatchEvent(clickEvent);
        }
        try {
            $.zhiphp.tip({
                content: '该链接已生成单品',
                icon: 'success'
            });
        } catch (e) {
            console.log('已填入链接URL并触发点击事件:', linkUrl);
        }
    }

    function onGetSingleProductLinks(event) {
        event.preventDefault();
        event.stopPropagation();

        const doc = event.target.ownerDocument;
        const container = doc.querySelector('td.simpleProductContainer');

        if (!container) {
            alert('未找到 simpleProductContainer 区域');
            return;
        }

        const products = container.querySelectorAll('div.fast_created_product');
        const list = Array.from(products).slice(0, 10); // 限制最多取10个

        // 清除旧的展示
        let resultContainer = doc.querySelector('#tampermonkey-single-list');
        if (resultContainer) {
            resultContainer.remove();
        }
        resultContainer = doc.createElement('div');
        resultContainer.id = 'tampermonkey-single-list';
        resultContainer.style.margin = '10px 0';

        if (list.length === 0) {
            resultContainer.innerText = '未找到任何商品链接';
        } else {
            list.forEach(product => {
                const linkInput = product.querySelector('input[name="moreSimpleProductLinkOri[]"]');
                const nameInput = product.querySelector('input[name="moreSimpleProductName[]"]');

                const href = linkInput ? linkInput.value : '';
                const linkText = `${(nameInput && nameInput.value.trim()) || ''}`;

                if (!href) return;

                const line = doc.createElement('div');
                line.style.margin = '4px 8px';

                const anchor = doc.createElement('a');
                anchor.href = href;
                anchor.innerText = linkText;
                anchor.style.marginRight = '10px';
                anchor.style.cursor = 'pointer';
                anchor.style.color = '#007bff';
                anchor.style.textDecoration = 'underline';

                const copyButton = doc.createElement('button');
                copyButton.innerText = '复制链接';
                copyButton.onclick = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const formattedLink = `<a target="_blank" rel="noopener noreferrer" href="${href}">${linkText}&nbsp;&gt;&gt;</a>`;
                    const blob = new Blob([formattedLink], { type: 'text/html' });
                    const data = [new ClipboardItem({ 'text/html': blob })];
                    navigator.clipboard.write(data).then(() => {
                        console.log('格式化链接已复制到剪贴板:\n' + formattedLink);
                    }).catch(err => {
                        console.error('复制失败:', err);
                    });
                };

                const addButton = doc.createElement('button');
                addButton.innerText = '👆加相关链接';
                addButton.style.marginLeft = '10px';
                addButton.onclick = (e) => onAddRelatedLinkClick(e, href, `单品|${linkText}`);

                line.appendChild(anchor);
                line.appendChild(copyButton);
                line.appendChild(addButton);
                resultContainer.appendChild(line);
            });
        }

        // 插入展示到当前按钮下方
        event.target.parentNode.insertBefore(resultContainer, event.target.nextSibling);
    }

    function onFindMallSellingPoints(event) {
        event.preventDefault();
        event.stopPropagation();

        const doc = event.target.ownerDocument;
        const select = doc.querySelector('select[name="mall_id"]');
        if (!select) {
            alert('未找到 mall_id 下拉框');
            return;
        }
        const mallId = select.value;
        const brandSelect = doc.querySelector('#brands');
        const brandId = brandSelect ? brandSelect.value : '';
        const code = 'gSn7C@^7P^K4F03i';
        const url = `https://ecttools.ecentime.com/view_sp_html?mall_id=${mallId}&brand_id=${brandId}&code=${encodeURIComponent(code)}`;
        window.open(url, '_blank');
    }

    function onFindBrandSellingPoints(event) {
        event.preventDefault();
        event.stopPropagation();

        const doc = event.target.ownerDocument;
        const brandSelect = doc.querySelector('#brands');
        if (!brandSelect) {
            alert('未找到 #brands 元素');
            return;
        }
        const brandId = brandSelect.value;
        if (!brandId) {
            alert('请先选择品牌');
            return;
        }
        const code = 'gSn7C@^7P^K4F03i';
        const url = `https://ecttools.ecentime.com/view_brand_sp_html?brand_id=${brandId}&code=${encodeURIComponent(code)}`;
        window.open(url, '_blank');
    }

    function onChatgptFill(event) {
        event.preventDefault();

        const doc = event.target.ownerDocument;
        
        // 创建模态框背景
        const modalOverlay = doc.createElement('div');
        //添加ID为chatgpt-fill-modal-overlay
        modalOverlay.id = 'chatgpt-fill-modal-overlay';
        modalOverlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.5);
            z-index: 10000;
            display: flex;
            justify-content: center;
            align-items: center;
        `;

        // 创建模态框内容
        const modalContent = doc.createElement('div');
        modalContent.style.cssText = `
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            width: 500px;
            max-width: 90%;
            max-height: 80%;
            overflow-y: auto;
        `;

        modalContent.innerHTML = `
            <h3 style="margin-top: 0; margin-bottom: 15px;">ChatGPT 填充</h3>
            <div style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px; font-weight: bold;">内容类型：</label>
                <select id="contentType" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;">
                    <option value="backend">详情内容</option>
                    <option value="resume_products">单品信息</option>
                </select>
            </div>
            <div style="margin-bottom: 20px;">
                <label style="display: block; margin-bottom: 5px; font-weight: bold;">输入内容：</label>
                <textarea id="userInput" style="width: 100%; height: 150px; padding: 8px; border: 1px solid #ccc; border-radius: 4px; resize: vertical;" placeholder="请输入要填充的内容..."></textarea>
            </div>
            <div style="text-align: right;">
                <button id="cancelBtn" style="margin-right: 10px; padding: 8px 16px; border: 1px solid #ccc; background: #f5f5f5; border-radius: 4px; cursor: pointer;">取消</button>
                <button id="confirmBtn" style="padding: 8px 16px; border: none; background: #007bff; color: white; border-radius: 4px; cursor: pointer;">确定</button>
            </div>
        `;

        modalOverlay.appendChild(modalContent);
        doc.body.appendChild(modalOverlay);

        // 绑定事件
        const cancelBtn = modalContent.querySelector('#cancelBtn');
        const confirmBtn = modalContent.querySelector('#confirmBtn');
        const contentType = modalContent.querySelector('#contentType');
        const userInput = modalContent.querySelector('#userInput');

        // 取消按钮事件
        cancelBtn.onclick = () => {
            doc.body.removeChild(modalOverlay);
        };

        // 确定按钮事件
        confirmBtn.onclick = () => {
            const selectedType = contentType.value;
            const inputText = userInput.value.trim();

            if (!inputText) {
                alert('请输入内容');
                return;
            }

            // 发送请求
            sendChatgptRequest(selectedType, inputText, doc);
            doc.body.removeChild(modalOverlay);
        };

        // 点击背景关闭模态框
        modalOverlay.onclick = (e) => {
            if (e.target === modalOverlay) {
                doc.body.removeChild(modalOverlay);
            }
        };
    }

    // 获取指定名称的cookie
    function getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) {
            return parts.pop().split(';').shift();
        }
        return null;
    }

    function sendChatgptRequest(templateName, userInput, doc) {
        const requestData = {
            template_name: templateName,
            user_input: userInput
        };

        // 显示加载状态
        const loadingDiv = doc.createElement('div');
        loadingDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 20px;
            border-radius: 8px;
            z-index: 10001;
        `;
        loadingDiv.textContent = '正在处理中...';
        doc.body.appendChild(loadingDiv);

        // 获取当前网站的admin cookie
        const adminCookie = getCookie('admin');
        
        const cookieParam = adminCookie ? `&token=${adminCookie}` : '';
        
        // 使用GM_xmlhttpRequest发送POST请求
        GM_xmlhttpRequest({
            method: 'POST',
            url: `https://ecttools.ecentime.com/chatgpt/call?code=Am4TbRp1GiZS5g!5${cookieParam}`,
            headers: {
                'Content-Type': 'application/json',
            },
            data: JSON.stringify(requestData),
            onload: function(response) {
                doc.body.removeChild(loadingDiv);
                
                if (response.status >= 200 && response.status < 300) {
                    try {
                        const data = JSON.parse(response.responseText);
                        console.log('ChatGPT API 响应:', data);
                        
                        if (data && data.response) {
                            try {
                                // 解析返回的JSON字符串
                                const responseData = JSON.parse(data.response);
                                
                                // 更新CKEditor内容
                                updateCKEditorContent(responseData, doc);
                                
                            } catch (parseError) {
                                console.error('解析响应数据失败:', parseError);
                                alert('响应数据格式错误，请检查API返回内容');
                            }
                        } else {
                            alert('API返回数据格式不正确');
                        }
                    } catch (parseError) {
                        console.error('解析响应失败:', parseError);
                        alert('响应数据解析失败');
                    }
                } else {
                    console.error('HTTP error! status:', response.status);
                    alert('请求失败: HTTP ' + response.status);
                }
            },
            onerror: function(error) {
                doc.body.removeChild(loadingDiv);
                console.error('ChatGPT API 请求失败:', error);
                alert('请求失败: ' + error.message);
            }
        });
    }

    function updateCKEditorContent(responseData, doc) {
        try {
            // 检查是否存在CKEditor实例
            if (typeof unsafeWindow.editor === 'undefined' || !unsafeWindow.editor) {
                alert('未找到CKEditor实例，请确保富文本编辑器已加载');
                return;
            }

            const editor = unsafeWindow.editor;
            
            // 获取现有内容
            const existingContent = editor.getData();
           
            // 将新内容拼接到现有内容之后
            const combinedContent = existingContent + responseData.description;
            editor.setData(combinedContent);
            
            console.log('CKEditor内容已更新:', responseData.description);
        } catch (error) {
            console.error('更新CKEditor内容失败:', error);
        }
    }

    function onGetRelatedLinks(event) {
        event.preventDefault();
        event.stopPropagation();

        const doc = event.target.ownerDocument;
        const containers = doc.querySelectorAll('div.linksList');
        if (!containers.length) {
            alert('未找到 .linksList 容器');
            return;
        }

        let resultContainer = doc.querySelector('#tampermonkey-related-links');
        if (resultContainer) {
            resultContainer.remove();
        }
        resultContainer = doc.createElement('div');
        resultContainer.id = 'tampermonkey-related-links';
        resultContainer.style.margin = '10px 0';

        containers.forEach(container => {
            const items = container.querySelectorAll('div.post_link_list');
            items.forEach(item => {
                const linkInput = item.querySelector('input[name="moreOriLink[]"]');
                const textInput = item.querySelector('input[name="moreDes[]"]');

                const href = linkInput ? linkInput.value : '';
                const text = textInput ? textInput.value : '';

                if (!href || !text) return;

                const line = doc.createElement('div');
                line.style.margin = '4px 8px';

                const anchor = doc.createElement('a');
                anchor.href = href;
                anchor.target = '_blank';
                anchor.rel = 'noopener noreferrer';
                anchor.innerText = `${text}>>`;
                anchor.style.marginRight = '10px';
                anchor.style.cursor = 'pointer';
                anchor.style.color = '#007bff';
                anchor.style.textDecoration = 'underline';

                const copyButton = doc.createElement('button');
                copyButton.innerText = '复制链接';
                copyButton.onclick = (event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    const formattedLink = `<a target="_blank" rel="noopener noreferrer" href="${href}">${text}&nbsp;&gt;&gt;</a>`;
                    const blob = new Blob([formattedLink], { type: 'text/html' });
                    const data = [new ClipboardItem({ 'text/html': blob })];
                    navigator.clipboard.write(data).then(() => {
                        console.log('格式化链接已复制到剪贴板:\n' + formattedLink);
                    }).catch(err => {
                        console.error('复制失败:', err);
                    });
                };

                line.appendChild(anchor);
                line.appendChild(copyButton);
                resultContainer.appendChild(line);
            });
        });

        event.target.parentNode.insertBefore(resultContainer, event.target.nextSibling);
    }

    // 新增函数
    function performPostTimeScheduleOperations(doc) {
        try {
            if (!doc) return;
            console.log('执行 post_time_publish 页面操作');

            // 获取第一个非 search_form 的 table
            const table = Array.from(doc.querySelectorAll('table'))
                .find(table => !table.classList.contains('search_form'));

            if (!table) return;

            const rows = Array.from(table.querySelectorAll('tr'));
            rows.forEach(row => {
                const tds = Array.from(row.querySelectorAll('td'));
                tds.forEach((td, index) => {
                    if (index < 2) return; // 跳过前两列

                    const isEmpty = td.innerHTML.trim() === '';
                    const hasNoPostClass = !td.classList.contains('no_post');

                    if (isEmpty && hasNoPostClass) {
                        const dateInput = doc.querySelector('form[name="searchform"] input[name="date"]');
                        const date = dateInput ? dateInput.value : '';
                        const timeCell = row.querySelector('td');
                        const timeText = timeCell ? timeCell.textContent.trim() : '';
                        const fullDateTime = `${date} ${timeText}`;

                        const link = doc.createElement('a');
                        link.href = 'javascript:void(0);';
                        link.setAttribute('data-title', '添加顶置任务');
                        link.setAttribute('data-before', '');
                        link.setAttribute('data-time', fullDateTime);
                        link.textContent = '添加顶置任务';

                        link.addEventListener('click', onTopTaskLinkClick);

                        td.innerHTML = '';
                        td.appendChild(link);
                    }
                });
            });

        } catch (e) {
            console.error('post_time_publish DOM 操作失败:', e);
        }
    }

    function onTopTaskLinkClick(event) {
        event.preventDefault();
        event.stopPropagation();

        const time = event.currentTarget.getAttribute('data-time') || '';
        const title = event.currentTarget.getAttribute('data-title') || '';
        unsafeWindow.$.dialog({
            title: title,
        content: `
      <div class="dialog_content">
          <form id="tm-schedule-form" action="/yifenqian_zdm_admin/index.php?g=admin&m=schedule_task&a=add" method="post">
              <label>折扣 ID: <input type="text" name="post_id" required></label><br>
              <input type="hidden" name="type" value="0">
              <input type="hidden" name="commentator" value="69421">
              <input type="hidden" name="discount_status" value="0">
              <input type="hidden" name="ajax" value="1">
              <input type="hidden" name="status" value="1">
              <input type="hidden" name="schedule_time" value="${time}">
          </form>
      </div>
  `,
            okValue: '确定',
            ok: function () {
                const form = document.getElementById('tm-schedule-form');
                if (!form) return;

                const formData = new FormData(form);
                fetch(form.action, {
                    method: form.method,
                    body: formData,
                    credentials: 'include'
                })
                .then(response => response.json())
                .then(data => {
                    console.log('提交成功:', data);
                    window.location.reload();
                })
                .catch(error => {
                    console.error('提交失败:', error);
                    alert('提交失败');
                });
            }
        });
    }

    // 新增函数：处理文章列表页面
    function performPostIndexOperations(doc) {
        try {
            if (!doc) return;

            if (domOperated) {
                console.log('Already performed, skip.');
                return;
            }
            domOperated = true;

            const tableListDiv = doc.querySelector('div.table_list');
            if (!tableListDiv) return;

            const table = tableListDiv.querySelector('table');
            if (!table) return;

            const rows = table.querySelectorAll('tbody tr');

            rows.forEach(row => {
                const lastTd = row.querySelector('td:last-child');
                if (!lastTd) return;

                // 获取第二个td中的链接文本（dealId）
                const secondTd = row.querySelector('td:nth-child(2)');
                if (!secondTd) return;

                const dealIdLink = secondTd.querySelector('a');
                if (!dealIdLink) return;
                const dealId = dealIdLink.textContent.trim();

                // 创建评论链接
                const commentLink = doc.createElement('a');
                const commentUrl = `https://admin.ecentime.com/yifenqian_zdm_admin/index.php?g=admin&m=post&a=comments&id=${dealId}`;
                commentLink.href = commentUrl;
                commentLink.textContent = ' | 评论';

                // 添加到最后一个td中
                lastTd.appendChild(commentLink);
            });
        } catch (e) {
            console.error('❌ post index DOM 操作失败:', e);
        }
    }

    // 在简易单品标题下添加激活链接编辑按钮
    function addEditButtonToSimpleProduct(doc, thElement) {
        try {
            // 检查th元素是否已经包含按钮，避免重复添加
            if (thElement.querySelector('.tm-edit-button')) {
                return;
            }

            // 创建换行符
            const br = doc.createElement('br');
            
            // 创建按钮
            const editBtn = doc.createElement('button');
            editBtn.className = 'tm-edit-button';
            editBtn.innerText = '激活链接编辑';
            editBtn.style.margin = '3px 0';
            editBtn.style.padding = '2px 6px';
            editBtn.style.fontSize = '12px';
            editBtn.style.cursor = 'pointer';
            editBtn.onclick = onActivateLinkEdit;

            // 将换行符和按钮添加到th元素中
            thElement.appendChild(br);
            thElement.appendChild(editBtn);
        } catch (e) {
            console.error('添加激活链接编辑按钮失败:', e);
        }
    }

    // 激活链接编辑按钮点击处理
    function onActivateLinkEdit(event) {
        event.preventDefault();
        event.stopPropagation();

        const doc = event.target.ownerDocument;
        const button = event.target;
        
        // 查找所有class为fast_created_product的元素下的readonly input
        const fastCreatedProducts = doc.querySelectorAll('.fast_created_product');
        let editedCount = 0;

        fastCreatedProducts.forEach(product => {
            const readonlyInputs = product.querySelectorAll('input[readonly]');
            readonlyInputs.forEach(input => {
                input.removeAttribute('readonly');
                editedCount++;
            });
        });

        console.log(`已激活 ${editedCount} 个输入框的编辑功能`);
    }

    // 初始化
    waitForIframeAndInject();
})();
