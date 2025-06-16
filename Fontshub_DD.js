// ==UserScript==
// @name         FontsHub Direct Download
// @namespace    https://fontshub.pro/
// @version      1.0
// @description  Adds a direct download button to Fontshub.pro
// @author       ru-bem
// @match        https://fontshub.pro/
// @match        https://fontshub.pro/category/*
// @match        https://fontshub.pro/font/*
// @grant        GM_download
// @grant        GM_xmlhttpRequest
// @connect      fontshub.pro
// @license      GPL-3.0-or-later
// @downloadURL  https://raw.githubusercontent.com/ru-bem/JS_scripts/refs/heads/main/Fontshub_DD.js
// ==/UserScript==

(function() {
    'use strict';

    // Botão de estilo
    const style = document.createElement('style');
    style.textContent = `
        .fm-download-btn {
            display: inline-block;
            padding: 6px 12px;
            margin-left: 16px;
            margin-top: 0px;
            background-color: #28a745;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
        }
        .fm-download-btn:disabled {
            opacity: 0.6;
            cursor: default;
        }
    `;
    document.head.appendChild(style);

    // Extrai ID do HTML da página de fonte
    function parseFontId(htmlText) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlText, 'text/html');
        const wrap = doc.querySelector('#fontPage');
        return wrap ? wrap.getAttribute('data-id') : null;
    }

    // Dispara download via GM_download
    function triggerDownload(id) {
        const url = `https://fontshub.pro/f-files/${id}/font.zip`;
        GM_download({ url, name: `${id}.zip`, saveAs: false });
    }

    // Handler para listagem de fontes
    function onListDownloadClick(fontLink, button) {
        button.disabled = true;
        button.textContent = 'Carregando...';
        GM_xmlhttpRequest({
            method: 'GET',
            url: fontLink,
            onload: res => {
                const id = parseFontId(res.responseText);
                if (id) triggerDownload(id);
                else alert('ID da fonte não encontrado');
                button.textContent = 'Download';
                button.disabled = false;
            },
            onerror: () => {
                alert('Erro ao carregar página da fonte');
                button.textContent = 'Download';
                button.disabled = false;
            }
        });
    }

    // Handler para página de fonte
    function onPageDownloadClick(button) {
        const wrap = document.querySelector('#fontPage');
        if (!wrap) return alert('ID da fonte não encontrado');
        const id = wrap.getAttribute('data-id');
        button.disabled = true;
        button.textContent = 'Baixando...';
        triggerDownload(id);
        button.textContent = 'Download';
        button.disabled = false;
    }

    // Insere botões nas listagens
    function addButtonsToList() {
        const grid = document.querySelector('.fonts-grid-wrap');
        if (!grid) return;
        grid.querySelectorAll('.font-box').forEach(box => {
            if (box.dataset.fmBtnAdded) return;
            const linkEl = box.querySelector('a[href*="/font/"]');
            if (!linkEl) return;
            const href = linkEl.href;
            const btn = document.createElement('button');
            btn.textContent = 'Download';
            btn.className = 'fm-download-btn';
            btn.addEventListener('click', e => {
                e.preventDefault();
                onListDownloadClick(href, btn);
            });
            box.appendChild(btn);
            box.dataset.fmBtnAdded = '1';
        });
    }

    // Insere botão na página de fonte
    function addButtonToPage() {
        if (!window.location.pathname.startsWith('/font/')) return;
        if (document.querySelector('.fm-download-btn[data-page]')) return;
        const titleEl = document.querySelector('.font-h1');
        if (!titleEl) return;
        const btn = document.createElement('button');
        btn.textContent = 'Download';
        btn.className = 'fm-download-btn';
        btn.setAttribute('data-page', '1');
        btn.addEventListener('click', () => onPageDownloadClick(btn));
        // Insere logo após o título
        titleEl.insertAdjacentElement('afterend', btn);
    }

    // Observador para DOM dinâmico
    const obs = new MutationObserver(() => {
        addButtonsToList();
        addButtonToPage();
    });
    obs.observe(document.body, { childList: true, subtree: true });

    // Execução inicial
    addButtonsToList();
    addButtonToPage();
})();
