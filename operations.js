// ==UserScript==
// @name         Iframe Admin 操作脚本
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  在包含 index.php?g=admin 的 iframe 中执行 DOM 操作
// @author       You
// @match        *://*/*
// @match        https://admin.ecentime.com/yifenqian_zdm_admin/index.php?g=admin*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    // 等待 iframe 加载
    function waitForIframeAndInject() {
        const iframes = document.getElementsByTagName('iframe');
        for (let iframe of iframes) {
            const src = iframe.getAttribute('src');
            if (src && src.includes('index.php?g=admin&m=post&a=edit')) {
                if (iframe.contentWindow && iframe.contentDocument.readyState === 'complete') {
                    performDomOperations(iframe.contentDocument);
                } else {
                    iframe.addEventListener('load', () => performDomOperations(iframe.contentDocument));
                }
                return;
            }
        }

        // 如果未找到符合条件的 iframe，则对当前页面进行操作
        if(document.location.href.includes('index.php?g=admin&m=post&a=edit')){
            performDomOperations(document);
        }
    }

    // 执行 DOM 操作（通用）
    function performDomOperations(doc) {
        try {
            if (!doc) return;

            // 示例操作：改变标题内容
            const titleEl = doc.querySelector('h1');
            if (titleEl) {
                titleEl.textContent = '[Tampermonkey 插件已注入] ' + titleEl.textContent;
            }

            // 插入按钮到指定元素内
            const targetTable = doc.querySelector('#info_form table.table_form.inner_table');
            if (targetTable) {
                const btn = doc.createElement('button');
                btn.innerText = '获取富文本链接';
                btn.style.margin = '10px';
                btn.style.display = 'block';
                btn.onclick = onCustomButtonClick;
                targetTable.parentNode.insertBefore(btn, targetTable.nextSibling);


                // 添加“获取单品链接”按钮
                const singleBtn = doc.createElement('button');
                singleBtn.innerText = '获取单品链接';
                singleBtn.style.margin = '10px';
                singleBtn.style.display = 'block';
                singleBtn.onclick = onGetSingleProductLinks;

                btn.parentNode.insertBefore(singleBtn, btn.nextSibling);

            }
        } catch (e) {
            console.error('DOM 操作失败:', e);
        }
    }

    // 自定义按钮点击处理函数
    function onCustomButtonClick(event) {
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
        const parser = new DOMParser();
        const htmlDoc = parser.parseFromString(textarea.value, 'text/html');
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
                addButton.innerText = '添至相关链接';
                addButton.onclick = (event) => onAddRelatedLinkClick(event, href, linkText);

                line.appendChild(anchor);
                line.appendChild(addButton);
                resultContainer.appendChild(line);
            });
        }

        // 插入到按钮下方
        event.target.parentNode.insertBefore(resultContainer, event.target.nextSibling);
    }

    // 处理“添加至相关链接”的点击逻辑
    function onAddRelatedLinkClick(event, link, text = '') {
        event.preventDefault(); // 阻止默认提交
        event.stopPropagation(); // 阻止冒泡行为

        const doc = document;
        const container = doc.querySelector('.linksList');
        if (!container) {
            alert('未找到 .linksList 容器');
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
                const linkText = `单品|${(nameInput && nameInput.value.trim()) || '单品|'}`;

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
                anchor.addEventListener('click', (e) => {
                    e.preventDefault();
                    navigator.clipboard.writeText(href).then(() => {
                        console.log('链接已复制到剪贴板:\n' + href);
                    }).catch(err => {
                        console.error('复制失败:', err);
                    });
                });

                const addButton = doc.createElement('button');
                addButton.innerText = '添至相关链接';
                addButton.onclick = (e) => onAddRelatedLinkClick(e, href, linkText);

                line.appendChild(anchor);
                line.appendChild(addButton);
                resultContainer.appendChild(line);
            });
        }

        // 插入展示到当前按钮下方
        event.target.parentNode.insertBefore(resultContainer, event.target.nextSibling);
    }
    // 初始化
    waitForIframeAndInject();
})();
