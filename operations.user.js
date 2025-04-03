// ==UserScript==
// @name         ECENTIME Admin 助手
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  在包含 index.php?g=admin 的 iframe 中执行 DOM 操作
// @author       You
// @match        https://admin.ecentime.com/yifenqian_zdm_admin/index.php?g=admin*
// @downloadURL  https://raw.githubusercontent.com/your-org/tm-scripts/main/scripts/operations.user.js
// @updateURL    https://raw.githubusercontent.com/your-org/tm-scripts/main/scripts/operations.user.js
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    // 等待 iframe 加载
    function waitForIframeAndInject() {
        const iframes = document.getElementsByTagName('iframe');
        for (let iframe of iframes) {
            const src = iframe.getAttribute('src');
            if (src) {
                try {
                    const url = new URL(src, window.location.origin);  // 兼容相对路径
                    const params = new URLSearchParams(url.search);

                    if (
                        params.get('g') === 'admin' &&
                        params.get('m') === 'post' &&
                        ['add', 'edit'].includes(params.get('a'))
                    ) {
                        if (iframe.contentWindow && iframe.contentDocument.readyState === 'complete') {
                            performDomOperations(iframe.contentDocument);
                        } else {
                            iframe.addEventListener('load', () => performDomOperations(iframe.contentDocument));
                        }
                        return;
                    }
                } catch (e) {
                    console.warn('URL 解析失败:', e);
                }
            }
        }

        // 如果未找到符合条件的 iframe，则对当前页面进行操作
        try {
            const url = new URL(window.location.href);  // 当前页面 URL
            const params = new URLSearchParams(url.search);

            if (
                params.get('g') === 'admin' &&
                params.get('m') === 'post' &&
                ['edit', 'add'].includes(params.get('a'))
            ) {
                performDomOperations(document);
            }
        } catch (e) {
            console.warn('页面 URL 解析失败:', e);
        }
    }

    // 执行 DOM 操作（通用）
    function performDomOperations(doc) {
        try {
            if (!doc) return;

            // 添加“获取相关链接”按钮
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
                addButton.innerText = '👆加相关链接';
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
        const url = `https://aitools.yifenqian.fr/view_sp_html?mall_id=${mallId}&brand_id=${brandId}&code=${encodeURIComponent(code)}`;
        window.open(url, '_blank');
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

    // 初始化
    waitForIframeAndInject();
})();