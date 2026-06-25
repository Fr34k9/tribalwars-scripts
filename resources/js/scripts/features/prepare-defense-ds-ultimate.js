import { Fr34kUtils } from '../fr34k.js';

const ALL_UNITS = ['spear','sword','axe','archer','spy','light','marcher','heavy','ram','catapult','knight','snob'];

export async function run() {
    const utils = new Fr34kUtils({ script_name: 'prepare_defense_ds_ultimate' });

    let ownVillages   = [];
    let worldSpeed    = 1;
    let unitSpeeds    = {};
    let plan          = [];  // Array of command objects
    let currentAttack = null; // Attack row data for the open modal
    const unitMemory  = {};  // attackId → { units } remembered between modal opens

    // ========== STYLES ==========

    $('<style>').text(`
        #pddu-loading-badge {
            position: fixed; top: 10px; right: 10px; z-index: 9999;
            background: #c8a96e; border: 2px solid #7a5c2e; border-radius: 6px;
            padding: 6px 14px; font-size: 13px; font-weight: bold; color: #3b2a0e;
            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        }
        #pddu-overlay {
            display: none; position: fixed; inset: 0; z-index: 9990;
            background: rgba(0,0,0,0.55);
        }
        #pddu-modal {
            position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
            z-index: 9995; background: #f4e4c1; border: 2px solid #7a5c2e;
            border-radius: 8px; padding: 20px; min-width: 520px; max-width: 680px;
            max-height: 90vh; overflow-y: auto; box-shadow: 0 6px 24px rgba(0,0,0,0.4);
        }
        #pddu-modal h3 {
            margin: 0 0 12px; font-size: 15px; color: #3b2a0e; border-bottom: 1px solid #c8a96e; padding-bottom: 6px;
        }
        #pddu-modal label { font-size: 12px; color: #4a3010; font-weight: bold; display: block; margin-bottom: 3px; }
        #pddu-modal select, #pddu-modal input[type="datetime-local"], #pddu-modal input[type="number"] {
            border: 1px solid #a07840; border-radius: 4px; background: #fff8ec;
            padding: 4px 6px; color: #3b2a0e; font-size: 12px;
        }
        #pddu-modal select { width: 100%; margin-bottom: 10px; }
        #pddu-modal input[type="datetime-local"] { width: 100%; margin-bottom: 10px; }
        .pddu-unit-grid {
            display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; margin-bottom: 10px;
        }
        .pddu-unit-cell {
            display: flex; flex-direction: column; align-items: center; gap: 2px;
            background: #ede0c0; border: 1px solid #c8a96e; border-radius: 4px; padding: 4px;
        }
        .pddu-unit-cell img { width: 24px; height: 24px; }
        .pddu-unit-cell span { font-size: 10px; color: #4a3010; }
        .pddu-unit-cell input { width: 100%; text-align: center; font-size: 11px; }
        .pddu-type-row { display: flex; gap: 16px; margin-bottom: 10px; align-items: center; }
        .pddu-type-row label { font-size: 13px; display: flex; align-items: center; gap: 4px; margin: 0; }
        #pddu-travel-info {
            background: #ede0c0; border: 1px solid #c8a96e; border-radius: 4px;
            padding: 8px 10px; margin-bottom: 10px; font-size: 12px; color: #3b2a0e; min-height: 40px;
        }
        #pddu-travel-info .pddu-warn { color: #c0392b; font-weight: bold; }
        .pddu-btn {
            border: 1px solid #7a5c2e; border-radius: 4px; padding: 5px 14px;
            cursor: pointer; font-size: 12px; font-weight: bold; color: #3b2a0e;
            background: linear-gradient(to bottom, #e8d09a, #c8a96e);
        }
        .pddu-btn:hover { background: linear-gradient(to bottom, #f0dca8, #d4b87a); }
        .pddu-btn-primary { background: linear-gradient(to bottom, #7ab87a, #4a9a4a); color: #fff; border-color: #2a6a2a; }
        .pddu-btn-primary:hover { background: linear-gradient(to bottom, #8acc8a, #5aaa5a); }
        .pddu-btn-danger { background: linear-gradient(to bottom, #d47a7a, #b04a4a); color: #fff; border-color: #7a2a2a; }
        .pddu-btn-danger:hover { background: linear-gradient(to bottom, #e48a8a, #c05a5a); }
        .pddu-modal-footer { display: flex; justify-content: space-between; align-items: center; margin-top: 10px; }
        .pddu-plus-btn {
            background: linear-gradient(to bottom, #7ab87a, #4a9a4a); color: #fff;
            border: 1px solid #2a6a2a; border-radius: 50%; width: 22px; height: 22px;
            cursor: pointer; font-size: 14px; line-height: 1; font-weight: bold;
            display: inline-flex; align-items: center; justify-content: center;
        }
        .pddu-plus-btn:hover { background: linear-gradient(to bottom, #8acc8a, #5aaa5a); }
        #pddu-panel {
            margin-top: 20px; background: #f4e4c1; border: 2px solid #7a5c2e;
            border-radius: 6px; padding: 14px;
        }
        #pddu-panel h3 { margin: 0 0 10px; font-size: 14px; color: #3b2a0e; }
        #pddu-plan-table-wrap { margin-bottom: 10px; }
        #pddu-panel-btns { display: flex; gap: 8px; }
        .pddu-section-label { font-size: 11px; font-weight: bold; color: #7a5c2e; margin-bottom: 4px; }
    `).appendTo('head');

    // ========== LOADING BADGE ==========

    const $badge = $('<div id="pddu-loading-badge">⏳ Preparing defense tool…</div>').appendTo('body');

    // ========== LOAD WORLD CONFIG (CACHED) ==========

    async function loadWorldConfig() {
        const cached = utils.getValue('worldConfig');
        if (cached) {
            try {
                const { speed, speeds } = JSON.parse(cached);
                worldSpeed = speed;
                unitSpeeds = speeds;
                return;
            } catch(e) {}
        }
        try {
            const [configXml, unitXml] = await Promise.all([
                $.get('/interface.php?func=get_config'),
                $.get('/interface.php?func=get_unit_info'),
            ]);
            const parser = new DOMParser();
            const cfgDoc = parser.parseFromString(configXml, 'text/xml');
            const speedEl = cfgDoc.querySelector('speed');
            if (speedEl) { const s = parseFloat(speedEl.textContent); if (!isNaN(s) && s > 0) worldSpeed = s; }
            const uiDoc = parser.parseFromString(unitXml, 'text/xml');
            ALL_UNITS.forEach(u => {
                const el = uiDoc.querySelector(`${u} speed`);
                const spd = el ? parseInt(el.textContent) : NaN;
                if (!isNaN(spd) && spd > 0) unitSpeeds[u] = spd;
            });
            utils.saveValue('worldConfig', JSON.stringify({ speed: worldSpeed, speeds: unitSpeeds }));
        } catch(e) { utils.logMessage('World config failed: ' + e, 'warn'); }
    }

    // ========== LOAD OWN VILLAGES ==========

    async function loadOwnVillages() {
        const villages = [];
        let page = 0, totalPages = 1;
        const parser = new DOMParser();
        while (page < totalPages) {
            const html = await $.get(`/game.php?village=${game_data.village.id}&screen=overview_villages&mode=units&type=complete&page=${page}`);
            const doc  = parser.parseFromString(html, 'text/html');
            if (page === 0) {
                let lp = 1;
                doc.querySelectorAll('.paged-nav-item').forEach(el => {
                    const n = parseInt(el.textContent.replace(/\[|\]/g,'').trim());
                    if (!isNaN(n) && n > lp) lp = n;
                });
                totalPages = lp;
            }
            const table = doc.querySelector('#units_table');
            if (!table) { page++; if (page < totalPages) await utils.sleep(300); continue; }
            table.querySelectorAll('tbody.row_marker').forEach(tbody => {
                const vn = tbody.querySelector('.quickedit-vn'); if (!vn) return;
                const villageId = parseInt(vn.getAttribute('data-id')); if (!villageId) return;
                if (villages.some(v => v.id === villageId)) return;
                const label = vn.querySelector('.quickedit-label') || vn;
                const lt    = label.textContent.trim();
                const cm    = lt.match(/\((\d+)\|(\d+)\)/); if (!cm) return;
                const x = parseInt(cm[1]), y = parseInt(cm[2]);
                const name = lt.replace(/\s*\(\d+\|\d+\).*$/,'').trim() || `Village ${villageId}`;
                const ownRow = tbody.querySelector('tr'); if (!ownRow) return;
                const items  = ownRow.querySelectorAll('td.unit-item');
                const troops = {};
                ALL_UNITS.forEach((u, i) => { troops[u] = parseInt(items[i]?.textContent?.trim()) || 0; });
                villages.push({ id: villageId, name, x, y, troops });
            });
            page++; if (page < totalPages) await utils.sleep(300);
        }
        return villages;
    }

    // ========== PLAN PERSISTENCE ==========

    function savePlan() {
        utils.saveValue('plan', JSON.stringify(plan));
    }

    function loadPlan() {
        try {
            const raw = utils.getValue('plan');
            if (raw) plan = JSON.parse(raw);
        } catch(e) { plan = []; }
    }

    // ========== COMMITTED TROOPS CALCULATION ==========

    function getCommitted() {
        const committed = {};
        plan.forEach(cmd => {
            const vid = cmd.fromVillageId;
            if (!committed[vid]) committed[vid] = {};
            ALL_UNITS.forEach(u => {
                committed[vid][u] = (committed[vid][u] || 0) + (cmd.units[u] || 0);
            });
        });
        return committed;
    }

    function getAvailableTroops(village) {
        const committed = getCommitted();
        const c = committed[village.id] || {};
        const avail = {};
        ALL_UNITS.forEach(u => { avail[u] = Math.max(0, (village.troops[u] || 0) - (c[u] || 0)); });
        return avail;
    }

    // ========== DATE HELPERS ==========

    function staemmeDateToMs(text) {
        const now = new Date();
        const [y, m, day] = [now.getFullYear(), now.getMonth() + 1, now.getDate()];
        text = text.replace(/(?:hüt um|heute um|today at)/g, `${y}-${m}-${day} `)
                   .replace(/(?:morn um|morgen um|tomorrow at)/g, `${y}-${m}-${day + 1} `)
                   .replace(/^am\s+(\d{1,2})\.(\d{2})\.(?:\d{4})?\s+um\s+/, (_, dd, mm) => `${y}-${mm}-${dd} `)
                   .replace(/^(\d{1,2})\.(\d{2})\.(?:\d{4})?\s*/, (_, dd, mm) => `${y}-${mm}-${dd} `);
        if (/:\d{3}$/.test(text)) text = text.replace(/:([^:]+)$/, '.$1');
        const match = text.match(/(\d{4})-(\d{1,2})-(\d{1,2}) (\d{2}):(\d{2}):(\d{2})\.(\d{3})/);
        if (!match) return null;
        return new Date(+match[1], +match[2]-1, +match[3], +match[4], +match[5], +match[6], +match[7]).getTime();
    }

    function msToDatetimeLocal(ms) {
        const d = new Date(ms);
        const pad = n => String(n).padStart(2,'0');
        const ms3 = String(d.getMilliseconds()).padStart(3,'0');
        return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${ms3}`;
    }

    function formatDuration(ms) {
        if (ms <= 0) return '00:00:00';
        const s = Math.floor(ms / 1000);
        return [Math.floor(s/3600), Math.floor((s%3600)/60), s%60].map(n => String(n).padStart(2,'0')).join(':');
    }

    function formatSendTime(ms) {
        const d = new Date(ms);
        const pad = n => String(n).padStart(2,'0');
        return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}:${String(d.getMilliseconds()).padStart(3,'0')}`;
    }

    // ========== TRAVEL TIME CALCULATION ==========

    function calcDistance(v1, v2) {
        const x2 = v2.x ?? v2.tx; const y2 = v2.y ?? v2.ty;
        let dx = Math.abs(v1.x - x2);
        let dy = Math.abs(v1.y - y2);
        dx = Math.min(dx, 1000 - dx);
        dy = Math.min(dy, 1000 - dy);
        return Math.sqrt(dx*dx + dy*dy);
    }

    function getSlowestSpeed(units) {
        let maxSpd = 0, slowestUnit = 'spear';
        ALL_UNITS.forEach(u => {
            if ((units[u] || 0) > 0) {
                const spd = unitSpeeds[u] || 30;
                if (spd > maxSpd) { maxSpd = spd; slowestUnit = u; }
            }
        });
        return { maxSpd, slowestUnit };
    }

    function calcTravelMs(fromVillage, toCoords, units) {
        const { maxSpd } = getSlowestSpeed(units);
        if (maxSpd === 0) return 0;
        const dist = calcDistance(fromVillage, toCoords);
        return Math.round(dist * maxSpd * 60000 / worldSpeed);
    }

    // ========== WORKBENCH EXPORT ==========

    function buildWorkbenchLine(cmd) {
        const units = cmd.units;
        const { slowestUnit } = getSlowestSpeed(units);
        const typeCode = cmd.type === 'support' ? 0 : 4;
        const unitStr  = ALL_UNITS.map(u => `${u}=${btoa(String(units[u] || 0))}`).join('/');
        return `${cmd.fromVillageId}&${cmd.toVillageId}&${slowestUnit}&${cmd.arrivalMs}&${typeCode}&false&false&${unitStr}`;
    }

    // ========== PARSE ATTACK ROWS ==========

    function parseAttackRows() {
        const rows = [];
        $('#incomings_table tr.nowrap').each(function() {
            const $r = $(this);
            const attackId     = parseInt($r.find('td:nth-child(1) .quickedit').attr('data-id'));
            const targetName   = $r.find('td:nth-child(2) a').first().text().trim();
            const targetHref   = $r.find('td:nth-child(2) a').first().attr('href') || '';
            const targetVidMatch = targetHref.match(/village=(\d+)/);
            const targetVid    = targetVidMatch ? parseInt(targetVidMatch[1]) : 0;
            const senderName   = $r.find('td:nth-child(3) a').first().text().trim();
            const senderHref   = $r.find('td:nth-child(3) a').first().attr('href') || '';
            const senderVidMatch = senderHref.match(/id=(\d+)/);
            const senderVid    = senderVidMatch ? parseInt(senderVidMatch[1]) : 0;
            const arrivalText  = $r.find('td:nth-child(6)').text().trim();
            const arrivalMs    = staemmeDateToMs(arrivalText);
            // Extract target coords from village data or from table text
            const coordMatch   = targetName.match(/\((\d+)\|(\d+)\)/);
            const tx = coordMatch ? parseInt(coordMatch[1]) : null;
            const ty = coordMatch ? parseInt(coordMatch[2]) : null;
            rows.push({ attackId, targetName, targetVid, senderName, senderVid, arrivalMs, tx, ty, $row: $r });
        });
        return rows;
    }

    // ========== PLAN LIST RENDER ==========

    function renderPlanList() {
        const $wrap = $('#pddu-plan-table-wrap');
        $wrap.empty();
        if (plan.length === 0) {
            $wrap.html('<p style="color:#888;font-style:italic;margin:0 0 10px">No commands planned yet.</p>');
            return;
        }
        const cid = game_data.village.id;
        let rows = '';
        plan.forEach((cmd, idx) => {
            const village   = ownVillages.find(v => v.id === cmd.fromVillageId);
            const typeLabel = cmd.type === 'support'
                ? '<img src="/graphic/command/support.png" style="vertical-align:-2px"> Support'
                : '<img src="/graphic/command/attack.png" style="vertical-align:-2px"> Attack';
            const fromLink  = village
                ? `<a href="/game.php?village=${cid}&screen=info_village&id=${cmd.fromVillageId}">${village.name} (${village.x}|${village.y})</a>`
                : `Village ${cmd.fromVillageId}`;
            const toLink    = `<a href="/game.php?village=${cid}&screen=info_village&id=${cmd.toVillageId}">${cmd.toVillageName}</a>`;
            const arrStr    = formatSendTime(cmd.arrivalMs);
            const unitSummary = ALL_UNITS.filter(u => (cmd.units[u]||0) > 0).map(u => `<img src="/graphic/unit/unit_${u}.png" style="width:16px;vertical-align:-2px" title="${u}"> ${cmd.units[u]}`).join(' ');
            const rowClass  = idx % 2 === 0 ? 'row_a' : 'row_b';
            rows += `<tr class="${rowClass}">
                <td>${typeLabel}</td>
                <td>${fromLink}</td>
                <td>${toLink}</td>
                <td>${arrStr}</td>
                <td>${unitSummary}</td>
                <td style="text-align:center"><button type="button" class="pddu-plan-remove" data-idx="${idx}" title="Remove" style="background:none;border:none;color:#b04a4a;cursor:pointer;font-size:16px;padding:0 2px">×</button></td>
            </tr>`;
        });
        $wrap.html(`
            <table class="vis" style="width:100%;margin-bottom:10px">
                <thead><tr>
                    <th>Type</th><th>From</th><th>To</th><th>Arrival</th><th>Units</th><th></th>
                </tr></thead>
                <tbody>${rows}</tbody>
            </table>
        `);
    }

    // ========== MODAL LOGIC ==========

    function buildModal() {
        $('body').append(`
            <div id="pddu-overlay"></div>
            <div id="pddu-modal" style="display:none">
                <h3 id="pddu-modal-title">Plan Defense</h3>
                <div class="pddu-section-label">Send from village</div>
                <select id="pddu-from-village"></select>
                <div class="pddu-section-label">Units to send</div>
                <div class="pddu-unit-grid" id="pddu-unit-grid"></div>
                <div class="pddu-section-label">Arrival time</div>
                <input type="datetime-local" id="pddu-arrival" step="0.001">
                <div class="pddu-section-label">Command type</div>
                <div class="pddu-type-row">
                    <label><input type="radio" name="pddu-type" value="support" checked> 🛡 Support</label>
                    <label><input type="radio" name="pddu-type" value="attack"> ⚔ Attack</label>
                </div>
                <div id="pddu-travel-info">Select a village and units to see travel info.</div>
                <div class="pddu-modal-footer">
                    <button class="pddu-btn" id="pddu-close-btn">Cancel</button>
                    <button class="pddu-btn pddu-btn-primary" id="pddu-add-btn">+ Add to Plan</button>
                </div>
            </div>
        `);

        // Build unit grid cells
        ALL_UNITS.forEach(u => {
            $('#pddu-unit-grid').append(`
                <div class="pddu-unit-cell">
                    <img src="/graphic/unit/unit_${u}.png" alt="${u}" title="${u}">
                    <span>${u}</span>
                    <input type="number" min="0" value="0" id="pddu-unit-${u}" data-unit="${u}">
                </div>
            `);
        });
    }

    function populateVillageDropdown(target) {
        const $sel = $('#pddu-from-village');
        const prevVal = $sel.val();
        $sel.empty();
        let sorted = [...ownVillages];
        if (target && target.tx != null) {
            sorted.sort((a, b) => calcDistance(a, target) - calcDistance(b, target));
        }
        sorted.forEach(v => {
            const avail   = getAvailableTroops(v);
            const nonZero = ALL_UNITS.filter(u => avail[u] > 0);
            const troopStr = nonZero.length > 0
                ? nonZero.map(u => `${u}:${avail[u]}`).join(' ')
                : 'no troops';
            const dist = (target && target.tx != null)
                ? ` | ${calcDistance(v, target).toFixed(1)} fields`
                : '';
            $sel.append(`<option value="${v.id}">${v.name} (${v.x}|${v.y})${dist} — ${troopStr}</option>`);
        });
        // Restore previous selection if still present
        if (prevVal && $sel.find(`option[value="${prevVal}"]`).length) $sel.val(prevVal);
    }

    function getSelectedVillage() {
        const vid = parseInt($('#pddu-from-village').val());
        return ownVillages.find(v => v.id === vid) || null;
    }

    function updateUnitMaxes() {
        const village = getSelectedVillage();
        if (!village) return;
        const avail = getAvailableTroops(village);
        ALL_UNITS.forEach(u => {
            const $inp = $(`#pddu-unit-${u}`);
            const max = avail[u] || 0;
            $inp.attr('max', max);
            if (parseInt($inp.val()) > max) $inp.val(max);
        });
    }

    function getCurrentUnits() {
        const units = {};
        ALL_UNITS.forEach(u => { units[u] = parseInt($(`#pddu-unit-${u}`).val()) || 0; });
        return units;
    }

    function updateTravelInfo() {
        if (!currentAttack) return;
        const village = getSelectedVillage();
        if (!village) return;
        const units = getCurrentUnits();
        const arrivalMs = new Date($('#pddu-arrival').val()).getTime();
        if (isNaN(arrivalMs)) { $('#pddu-travel-info').html('Invalid arrival time.'); return; }
        const toCoords = { x: currentAttack.tx, y: currentAttack.ty };
        if (toCoords.x == null) { $('#pddu-travel-info').html('Target coordinates unknown.'); return; }
        const hasUnits = ALL_UNITS.some(u => units[u] > 0);
        if (!hasUnits) { $('#pddu-travel-info').html('Select units to see travel time.'); return; }
        const travelMs  = calcTravelMs(village, toCoords, units);
        const sendMs    = arrivalMs - travelMs;
        const now       = Date.now();
        const travelStr = formatDuration(travelMs);
        const sendStr   = formatSendTime(sendMs);
        const timeLeft  = sendMs - now;
        const timeLeftStr = timeLeft > 0
            ? `<span style="color:#2a6a2a">Time to send: ${formatDuration(timeLeft)}</span>`
            : `<span class="pddu-warn">⚠ Send time already passed!</span>`;
        $('#pddu-travel-info').html(`Travel time: <b>${travelStr}</b> | Send by: <b>${sendStr}</b><br>${timeLeftStr}`);
    }

    function openModal(attack) {
        currentAttack = attack;
        $('#pddu-modal-title').text(`Plan: incoming → ${attack.targetName}`);
        if (attack.arrivalMs) {
            $('#pddu-arrival').val(msToDatetimeLocal(attack.arrivalMs));
        }
        $('input[name="pddu-type"][value="support"]').prop('checked', true);
        populateVillageDropdown(attack);
        updateUnitMaxes();
        // Restore remembered units for this attack, or zero out
        const remembered = unitMemory[attack.attackId];
        ALL_UNITS.forEach(u => {
            $(`#pddu-unit-${u}`).val(remembered ? (remembered[u] || 0) : 0);
        });
        updateTravelInfo();
        $('#pddu-overlay').show();
        $('#pddu-modal').show();
    }

    function closeModal() {
        $('#pddu-overlay').hide();
        $('#pddu-modal').hide();
        currentAttack = null;
    }

    // ========== PLAN PANEL ==========

    function buildPlanPanel() {
        $(`
            <div id="pddu-panel">
                <h3>🛡 Defense Plan</h3>
                <div id="pddu-plan-table-wrap"></div>
                <div id="pddu-panel-btns">
                    <button type="button" class="pddu-btn pddu-btn-primary" id="pddu-export-btn">📋 Export to Workbench</button>
                    <button type="button" class="pddu-btn pddu-btn-danger" id="pddu-clear-btn">🗑 Clear Plan</button>
                </div>
            </div>
        `).insertAfter('#incomings_table');
    }

    // ========== INJECT BUTTONS ==========

    function injectPlusButtons(attackRows) {
        // Add header
        $('#incomings_table thead tr').append('<th style="white-space:nowrap">Plan</th>');
        // Add button per row
        attackRows.forEach(attack => {
            const $btn = $(`<button type="button" class="pddu-plus-btn" title="Add to defense plan">+</button>`);
            $btn.on('click', () => openModal(attack));
            attack.$row.append($('<td style="text-align:center"></td>').append($btn));
        });
    }

    // ========== EVENTS ==========

    function bindEvents() {
        $('#pddu-overlay, #pddu-close-btn').on('click', closeModal);
        $('#pddu-modal').on('click', e => e.stopPropagation());

        $('#pddu-from-village').on('change', () => {
            updateUnitMaxes();
            ALL_UNITS.forEach(u => { $(`#pddu-unit-${u}`).val(0); });
            updateTravelInfo();
        });

        $('#pddu-unit-grid').on('input', 'input[type="number"]', () => {
            // Clamp to max
            ALL_UNITS.forEach(u => {
                const $inp = $(`#pddu-unit-${u}`);
                const max = parseInt($inp.attr('max')) || 0;
                const val = parseInt($inp.val()) || 0;
                if (val > max) $inp.val(max);
                if (val < 0)   $inp.val(0);
            });
            // Remember units for this attack so reopening the modal restores them
            if (currentAttack) unitMemory[currentAttack.attackId] = getCurrentUnits();
            updateTravelInfo();
        });

        $('#pddu-arrival').on('input', updateTravelInfo);
        $('input[name="pddu-type"]').on('change', updateTravelInfo);

        $('#pddu-add-btn').on('click', () => {
            if (!currentAttack) return;
            const village = getSelectedVillage();
            if (!village) { utils.uiMessage('Select a village first.', 3); return; }
            const units = getCurrentUnits();
            if (!ALL_UNITS.some(u => units[u] > 0)) { utils.uiMessage('Add at least one unit.', 3); return; }
            const arrivalMs = new Date($('#pddu-arrival').val()).getTime();
            if (isNaN(arrivalMs)) { utils.uiMessage('Invalid arrival time.', 3); return; }
            const type = $('input[name="pddu-type"]:checked').val();
            plan.push({
                fromVillageId:   village.id,
                fromVillageName: `${village.name} (${village.x}|${village.y})`,
                toVillageId:     currentAttack.targetVid,
                toVillageName:   currentAttack.targetName,
                arrivalMs,
                type,
                units,
            });
            delete unitMemory[currentAttack.attackId]; // reset remembered units for this attack
            savePlan();
            renderPlanList();
            closeModal();
            utils.uiMessage('Added to plan!', 2);
        });

        $('#pddu-plan-table-wrap').on('click', '.pddu-plan-remove', function() {
            const idx = parseInt($(this).data('idx'));
            plan.splice(idx, 1);
            savePlan();
            renderPlanList();
        });

        $('#pddu-export-btn').on('click', () => {
            if (plan.length === 0) { utils.uiMessage('Plan is empty.', 3); return; }
            const lines = plan.map(buildWorkbenchLine).join('\n');
            const ta = document.createElement('textarea');
            ta.value = lines;
            document.body.appendChild(ta);
            ta.select();
            ta.setSelectionRange(0, 99999);
            document.execCommand('copy');
            document.body.removeChild(ta);
            utils.uiMessage(`Copied ${plan.length} command(s) to clipboard!`, 4);
        });

        $('#pddu-clear-btn').on('click', () => {
            if (!confirm('Clear all planned commands?')) return;
            plan = [];
            savePlan();
            renderPlanList();
        });
    }

    // ========== MAIN ==========

    loadPlan();

    await Promise.all([loadWorldConfig(), loadOwnVillages().then(v => { ownVillages = v; })]);

    $badge.remove();

    if (ownVillages.length === 0) {
        utils.uiMessage('Prepare Defense: could not load own villages.', 5);
        return;
    }

    const attackRows = parseAttackRows();
    if (attackRows.length === 0) {
        utils.logMessage('No incoming attacks found on this page.', 'info');
    }

    buildModal();
    buildPlanPanel();
    injectPlusButtons(attackRows);
    renderPlanList();
    bindEvents();

    utils.finishScript(attackRows.length);
}
