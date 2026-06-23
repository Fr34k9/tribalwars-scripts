import { Fr34kUtils } from '../fr34k.js';

export function run() {
    const utils = new Fr34kUtils({ script_name: 'ultra_timing' });

    const CONFIG = {
        randomizeMs:  0,
        fireEarlyMs:  33,
        beforeMs:     15,
        afterMs:      15,
        spinWindowMs: 400,
        warmupMs:     2500,
    };

    let dauer = 0, goalTime = 0, absendeTime = 0, mode = 'exact', interval = 0, intervalIdDsUltimate = 0;
    let connectionWarmed = false;

    const param_arrival_time = getParameterByName('at');
    const currentUrl = window.location.href;

    // Anchors server time to performance.now() using Navigation Timing API responseStart
    const Clock = {
        anchorOffset: null,
        init() {
            const nav = performance.getEntriesByType('navigation')[0];
            if (nav && typeof Timing !== 'undefined' && Timing.initial_server_time) {
                this.anchorOffset = Timing.initial_server_time - nav.responseStart;
            } else {
                const serverNow = Timing.initial_server_time + Timing.getElapsedTimeSinceLoad() + Timing.offset_to_server;
                this.anchorOffset = serverNow - performance.now();
            }
            console.log(`UT Clock: offset=${this.anchorOffset.toFixed(1)}`);
        },
        now() {
            if (this.anchorOffset === null) this.init();
            return performance.now() + this.anchorOffset;
        },
    };

    if (currentUrl.includes('&screen=place&'))           handlePlaceScreen(param_arrival_time);
    if (currentUrl.includes('&try=confirm'))             handleConfirmScreen(param_arrival_time);
    if (currentUrl.includes('screen=place&village='))   closeTabIfAutoSent();
    if (currentUrl.includes('ds-ultimate.de') && currentUrl.includes('attackPlanner')) handleDsUltimate();

    $('.removeRemindTime').click(clearRemindTime);
    $('.command-row').each(addRemindIcon);
    $('.ultratiming_remind_time').click(storeReminderTime);
    $('.ultra_timing_start').click(startUltraTiming);

    function handlePlaceScreen(arrivalTime) {
        if (currentUrl.includes('&target=') && arrivalTime) {
            updateCommandFormAction(arrivalTime);
            setTimeout(setUnitValues, 100);
            autoClickSend();
        }
    }

    function handleConfirmScreen(arrivalTime) {
        Clock.init();
        let textfield_value = localStorage.getItem('remindTime') || '';
        if (arrivalTime) textfield_value = staemmeMsToDate(parseInt(atob(arrivalTime)));
        $('#troop_confirm_train').before(createUltraTimingTable(textfield_value));
        if (arrivalTime) autoSetTiming();
    }

    function closeTabIfAutoSent() {
        const lastAutoSent = localStorage.getItem('ut_last_auto_sent') || 0;
        if (Date.now() - parseInt(lastAutoSent) < 30000) {
            setTimeout(window.close, getRandomDelay(2000, 5000));
        }
    }

    function handleDsUltimate() {
        $('#datatablesHeader2').append('<input type="checkbox" id="autoSend" class="mr-1"><label for="autoSend">Auto-Send</label>');
        setTimeout(dsUltimateTableReady, 1000);
        intervalIdDsUltimate = setInterval(autoSendAttack, 5000);
    }

    function updateCommandFormAction(arrivalTime) {
        const old = $('#command-data-form').attr('action');
        $('#command-data-form').attr('action', old + '&at=' + arrivalTime);
    }

    function setUnitValues() {
        const baseMin = Math.ceil(game_data.village.points / 100);
        const unitPopulation = utils.unitPopulationCost;

        game_data.units.forEach(unit => {
            let val = getParameterByName(unit) || '';
            const unitMax = parseInt($('#unit_input_' + unit).data('all-count'));
            if (val.toLowerCase() === 'min' || val == 99999) {
                val = Math.ceil(baseMin / (unitPopulation[unit] || 1));
            } else {
                val = val.replace('alle', unitMax);
                try { val = eval(val) || ''; } catch (e) { val = ''; }
            }
            if (val > unitMax && val != 99999) val = unitMax;
            $('#unit_input_' + unit).val(val);
        });
    }

    function autoClickSend() {
        const isSupport = getParameterByName('uttype') === 'support';
        const btnSelector = isSupport ? '#target_support' : '#target_attack';
        const delay = getRandomDelay(1000, 4000);
        if (!$(btnSelector).length || $('.error_box').length) {
            setTimeout(window.close, delay);
        } else {
            setTimeout(() => $(btnSelector).click(), delay);
        }
    }

    function autoSetTiming() {
        localStorage.setItem('ut_last_auto_sent', Date.now());
        setTimeout(() => $('#ultra_timing_exact').click(), getRandomDelay(1000, 3000));
    }

    function startUltraTiming() {
        $('#command-data-form').attr('action', $('#command-data-form').attr('action') + '&utsent=1');
        mode = $(this).hasClass('before') ? 'before' : $(this).hasClass('after') ? 'after' : 'exact';
        dauer = parseInt($('.relative_time').data('duration')) * 1000;
        goalTime = staemmeDateToMs($('#ultra_timing_final_time').val());
        absendeTime = goalTime - dauer;
        connectionWarmed = false;
        clearInterval(interval);
        if (localStorage.getItem('ankunftZeitInMS')) interval = setInterval(prepareSend, 250);
    }

    function computeFireTime() {
        const jitter = CONFIG.randomizeMs > 0 ? Math.floor(Math.random() * CONFIG.randomizeMs) : 0;
        const targetArrival = mode === 'before' ? absendeTime - CONFIG.beforeMs - jitter
            : mode === 'after' ? absendeTime + CONFIG.afterMs + jitter
            : absendeTime;
        return targetArrival - CONFIG.fireEarlyMs;
    }

    function prepareSend() {
        const fireTime = computeFireTime();
        const remaining = fireTime - Clock.now();
        $('.ultraTimingTimeLeft').text(`${(remaining / 1000).toFixed(1)}s [${mode}]`);
        if (remaining < CONFIG.warmupMs && !connectionWarmed) {
            connectionWarmed = true;
            fetch('/graphic/delete.png?' + Math.random(), { cache: 'no-store' }).catch(() => {});
        }
        if (remaining < CONFIG.spinWindowMs) {
            clearInterval(interval);
            finalSend(fireTime);
        }
    }

    function finalSend(fireTime) {
        const btn = document.querySelector('#troop_confirm_go') || document.querySelector('#troop_confirm_submit');
        if (!btn) { console.error('UT: confirm button not found!'); return; }
        const perfDeadline = fireTime - Clock.anchorOffset;
        while (performance.now() < perfDeadline) { /* spin */ }
        btn.click();
        utils.finishScript(1);
        console.log(`UT fired | mode=${mode} | target=${fireTime.toFixed(0)} | clock=${Clock.now().toFixed(1)} | fireEarlyMs=${CONFIG.fireEarlyMs}`);
    }

    function getParameterByName(name) { return new URL(window.location.href).searchParams.get(name); }
    function getRandomDelay(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

    function clearRemindTime() {
        localStorage.setItem('remindTime', '');
        localStorage.setItem('ankunftZeitInMS', '');
        $('#ultra_timing').remove();
    }

    function addRemindIcon() {
        $(this).append('<td><img class="ultratiming_remind_time" style="cursor:pointer;" src="/graphic/group_jump.png" title="Zeit merken"></td>');
    }

    function storeReminderTime() {
        const time = $(this).closest('tr').find('td').eq(1).text();
        localStorage.setItem('remindTime', time);
        localStorage.setItem('ankunftZeitInMS', staemmeDateToMs(time));
    }

    function createUltraTimingTable(value) {
        return `<table id="ultra_timing" class="vis" width="360" style="margin-top:10px;">
            <tbody>
                <tr><th colspan="2">Ultra-Timing <img class="removeRemindTime" src="/graphic/delete.png" style="cursor:pointer;" height=10px></th></tr>
                <tr><td>Davor / Exakt / Danach</td><td>
                    <img class="ultra_timing_start before" src="/graphic/group_left.png" title="Davor (-${CONFIG.beforeMs}ms)" style="cursor:pointer;margin-right:25px;">
                    <span id="ultra_timing_exact" class="ultra_timing_start exact" title="Exakt auf die ms" style="cursor:pointer;margin-right:25px;font-size:14px;vertical-align:middle;">&#127919;</span>
                    <img id="ultra_timing_after" class="ultra_timing_start after" src="/graphic/group_right.png" title="Danach (+${CONFIG.afterMs}ms)" style="cursor:pointer;">
                </td></tr>
                <tr><td>Zielzeit:</td><td><input type="text" id="ultra_timing_final_time" value="${value}"></td></tr>
                <tr><td>Zeit übrig</td><td class="ultraTimingTimeLeft"></td></tr>
            </tbody>
        </table>`;
    }

    function staemmeDateToMs(text) {
        const d = new Date();
        text = text.replace(/(?:hüt um|heute um)/g,  `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()} `)
                   .replace(/(?:morn um|morgen um)/g, `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate() + 1} `);
        if (/:\d{3}$/.test(text)) text = text.replace(/:([^:]+)$/, '.$1');
        return Date.parse(text + 'Z') - 7200000;
    }

    function staemmeMsToDate(ms) {
        const d = new Date(ms), now = new Date();
        const same = (o) => d.getDate() === now.getDate() + o && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        const prefix = same(0) ? 'hüt um' : same(1) ? 'morn um' : `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
        return `${prefix} ${[d.getHours(), d.getMinutes(), d.getSeconds(), d.getMilliseconds()]
            .map((n, i) => String(n).padStart(i === 3 ? 3 : 2, '0')).join(':')}`;
    }

    function dsUltimateTableReady() {
        const table = document.getElementById('data1');
        if (!table || table.rows.length <= 1) return;
        $('#data1 tbody tr').each(function () {
            const link = $(this).find('a.text-success');
            let href = link.attr('href');
            if (!href || href.includes('&at=')) return;
            let arrival = convertDateFormat($(this).find('td:nth-child(8)').text());
            href += '&at=' + btoa(staemmeDateToMs(arrival));
            if ($(this).find('[data-content="Unterstützung"]').length > 0) href += '&uttype=support';
            link.attr('href', href);
        });
    }

    function autoSendAttack() {
        if (!$('#autoSend').is(':checked')) return;
        $('#data1 tbody tr').each(function () {
            if ($(this).html().indexOf('fa-play-circle') < 0) return;
            const goal_time = parseInt($(this).find('countdown').attr('date'));
            if (Math.floor(Date.now() / 1000) - goal_time < -30) return;
            dsUltimateTableReady();
            const link = $(this).find('a.text-success i');
            setTimeout(() => link.click(), 500);
        });
    }

    function convertDateFormat(input) {
        if (!/^\d{2}\.\d{2}\.\d{4}/.test(input)) return input;
        const [datePart, timePart] = input.split(' ');
        const [day, month, year] = datePart.split('.');
        return `${year}-${month}-${day} ${timePart}`;
    }
}
