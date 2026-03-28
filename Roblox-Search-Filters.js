// ==UserScript==
// @name 🔎 Roblox Search Filters v1.1.0
// @namespace http://tampermonkey.net/
// @version 1.1.0
// @description Adds a sidebar to filter searches on Roblox Discover & Charts (with shiny title)
// @author ru-bem
// @match https://www.roblox.com/discover/*
// @match https://www.roblox.com/charts/*
// @license GPL-3.0-or-later
// @grant none
// @downloadURL https://update.greasyfork.org/scripts/534860/%F0%9F%94%8E%20Roblox%20Search%20Filters%20v100.user.js
// @updateURL https://update.greasyfork.org/scripts/534860/%F0%9F%94%8E%20Roblox%20Search%20Filters%20v100.meta.js
// ==/UserScript==


(function() {
    'use strict';

    const config = {
        interfacePosition: { top: '50px', left: '0' },
        interfaceStyles: {
            position: 'fixed',
            backgroundColor: '#191a1f',
            border: '1px solid #222',
            padding: '25px 25px 25px 25px',
            borderRadius: '8px',
            zIndex: '9999',
            fontFamily: 'Arial, sans-serif',
            cursor: 'grab',
            boxShadow: '0 10px 10px rgba(0,0,0,0)'
        },

        //
        title: {
            main: "RSF",
            version: "v1.1.0",
            subtitle: "Roblox Search Filters",
            styles: {
                mainColor: '#add93b',
                glow: '0 0 12px #add93b',
                fontSizeMain: '40px',
                fontWeightMain: 'bold',
                versionColor: '#888888',
                subtitleColor: '#cccccc'
            }
        },

        layout: {
            spacing: {
              betweenGroups: '30px',
              betweenInputs: '5px'
            }
        },

      elementsOrder: [
          'approval',
          'players',
          'button'
        ],

        inputStyles: {
          width: '74px',
          padding: '5px',
          margin: '0',
          borderRadius: '8px',
          backgroundColor: '#222', color: 'white', border: '0px solid #333'
        },

        buttonStyles: {
          width: '100%',
          backgroundColor: '#335fff',
          color: 'white',
          padding: '12px 0',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          marginTop: '30px',
          fontWeight: 'bold'
        },

        defaultFilters: { minApproval: 80, maxApproval: 100, minPlayers: '', maxPlayers: '' },
        selectors: {
            gameCard: '.list-item.hover-game-tile.grid-tile',
            approvalPercentage: '.info-label.vote-percentage-label',
            activePlayers: '.info-label.playing-counts-label'
        },

        urlKeywords: ['/discover/?Keyword=', '/charts/']
    };

    // ========================== INTERFACE ==========================
    function createInterface() {
        if (document.getElementById('approval-filter-interface')) return;

        const interfaceDiv = document.createElement('div');
        interfaceDiv.id = 'approval-filter-interface';
        Object.assign(interfaceDiv.style, config.interfaceStyles);
        interfaceDiv.style.top = config.interfacePosition.top;
        interfaceDiv.style.left = config.interfacePosition.left;

        // === TITLE ===
        const titleContainer = document.createElement('div');
        titleContainer.style.textAlign = 'center';
        titleContainer.style.marginBottom = '50px';
        titleContainer.style.userSelect = 'none';

        // Linha 1: RSF + versão
        const mainLine = document.createElement('div');
        mainLine.style.display = 'flex';
        mainLine.style.alignItems = 'center';
        mainLine.style.justifyContent = 'center';
        mainLine.style.gap = '10px';

        const mainTitle = document.createElement('span');
        mainTitle.textContent = config.title.main;
        mainTitle.style.fontSize = config.title.styles.fontSizeMain;
        mainTitle.style.fontWeight = config.title.styles.fontWeightMain;
        mainTitle.style.color = config.title.styles.mainColor;
        mainTitle.style.textShadow = config.title.styles.glow;
        mainLine.appendChild(mainTitle);

        const versionSpan = document.createElement('span');
        versionSpan.textContent = config.title.version;
        versionSpan.style.fontSize = '14px';
        versionSpan.style.color = config.title.styles.versionColor;
        versionSpan.style.marginTop = '4px';
        mainLine.appendChild(versionSpan);

        const subtitle = document.createElement('div');
        subtitle.textContent = config.title.subtitle;
        subtitle.style.fontSize = '13px';
        subtitle.style.color = config.title.styles.subtitleColor;
        subtitle.style.marginTop = '2px';

        titleContainer.append(mainLine, subtitle);
        interfaceDiv.appendChild(titleContainer);

        // === filter groups ===
        const groups = {
            approval: createFilterGroup('👍 %Approval', 'minApproval', 'maxApproval'),
            players: createFilterGroup('▶️ Active Players', 'minPlayers', 'maxPlayers'),
            button: createButton()
        };

        config.elementsOrder.forEach(key => {
            if (groups[key]) {
                groups[key].style.marginBottom = config.layout.spacing.betweenGroups;
                interfaceDiv.appendChild(groups[key]);
            }
        });

        document.body.appendChild(interfaceDiv);
        makeDraggable(interfaceDiv);
        window._filterGroups = groups;
    }

    function createFilterGroup(title, minKey, maxKey) {
        const group = document.createElement('div');
        const titleElement = document.createElement('div');
        titleElement.textContent = title;
        titleElement.style.color = '#fff';
        titleElement.style.marginBottom = '10px';

        const inputsContainer = document.createElement('div');
        inputsContainer.style.display = 'flex';
        inputsContainer.style.flexDirection = 'column';
        inputsContainer.style.gap = config.layout.spacing.betweenInputs;

        const minInput = createInput('number', config.defaultFilters[minKey], 'MIN:', minKey);
        const maxInput = createInput('number', config.defaultFilters[maxKey], 'MAX:', maxKey);

        inputsContainer.append(minInput, maxInput);
        group.append(titleElement, inputsContainer);

        group.minInput = minInput.querySelector('input');
        group.maxInput = maxInput.querySelector('input');
        return group;
    }

    function createInput(type, value, labelText, key) {
        const container = document.createElement('div');
        container.style.display = 'flex';
        container.style.alignItems = 'center';
        container.style.gap = '10px';

        const label = document.createElement('label');
        label.textContent = labelText;
        label.style.color = '#ccc';
        label.style.minWidth = '60px';

        const input = document.createElement('input');
        input.type = type;
        input.value = value;
        input.id = `filter-${key}`;
        Object.assign(input.style, config.inputStyles);

        container.append(label, input);
        return container;
    }

    function createButton() {
        const button = document.createElement('button');
        button.textContent = 'Filter';
        Object.assign(button.style, config.buttonStyles);

        button.onclick = () => {
            const g = window._filterGroups;
            if (!g) return;
            filterGames(
                parseInt(g.approval.minInput.value) || 0,
                parseInt(g.approval.maxInput.value) || 100,
                parseInt(g.players.minInput.value) || 0,
                parseInt(g.players.maxInput.value) || Infinity
            );
        };
        return button;
    }

    function filterGames(minApproval, maxApproval, minPlayers, maxPlayers) {
        console.log('%c[Roblox Filter] Iniciando filtro...', 'color:#335fff;font-weight:bold', {minApproval, maxApproval, minPlayers, maxPlayers});

        let hiddenCount = 0, totalCards = 0;

        document.querySelectorAll(config.selectors.gameCard).forEach(card => {
            totalCards++;
            const approvalMatch = checkApproval(card, minApproval, maxApproval);
            const playersMatch   = checkPlayers(card, minPlayers, maxPlayers);

            card.style.display = (approvalMatch && playersMatch) ? '' : 'none';
            if (!approvalMatch || !playersMatch) hiddenCount++;
        });

        const container = document.getElementById('game-search-web-app');
        if (container) {
            const old = container.style.display;
            container.style.display = 'none';
            void container.offsetHeight;
            container.style.display = old || '';
        }
    }

    function checkApproval(card, min, max) {
        const el = card.querySelector(config.selectors.approvalPercentage);
        if (!el) return true;
        const percent = parseInt(el.textContent.replace(/\D/g, '')) || 0;
        return percent >= min && percent <= max;
    }

    function checkPlayers(card, min, max) {
        const el = card.querySelector(config.selectors.activePlayers);
        if (!el) return true;
        const count = parsePlayerCount(el.textContent);
        return count >= min && count <= max;
    }

    function parsePlayerCount(text) {
        if (!text) return 0;
        text = text.trim().toLowerCase().replace(/,/g, '');
        const num = parseFloat(text);
        if (text.endsWith('k')) return Math.floor(num * 1000);
        if (text.endsWith('m')) return Math.floor(num * 1000000);
        return num || 0;
    }

    function makeDraggable(element) {
        let isDragging = false, offset = [0, 0];
        element.addEventListener('mousedown', e => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON') return;
            isDragging = true;
            offset = [e.clientX - element.offsetLeft, e.clientY - element.offsetTop];
            element.style.cursor = 'grabbing';
        });
        document.addEventListener('mousemove', e => {
            if (!isDragging) return;
            element.style.left = `${e.clientX - offset[0]}px`;
            element.style.top  = `${e.clientY - offset[1]}px`;
        });
        document.addEventListener('mouseup', () => {
            isDragging = false;
            element.style.cursor = 'grab';
        });
    }

    // ========================== INIT ==========================
    if (config.urlKeywords.some(kw => location.href.includes(kw))) createInterface();

    new MutationObserver(() => {
        if (config.urlKeywords.some(kw => location.href.includes(kw))) createInterface();
    }).observe(document.body, { subtree: true, childList: true });
})();
