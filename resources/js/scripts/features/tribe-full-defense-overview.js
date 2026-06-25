import { Fr34kUtils } from '../fr34k.js';

export async function run() {
    const utils = new Fr34kUtils({ script_name: 'tribe_full_defense_overview' });

    const current_village = game_data.village.id;
    const last_sync = utils.getValue('last_sync');

    if (last_sync == null || Date.now() - last_sync > 60000) {
        const attacks = await getAllOwnAttacks();
        syncAttacksToServer(attacks);
    }

    const stored = utils.getValue('all_attacks');
    if (!stored) return;

    const all_attacks = JSON.parse(stored);
    const tribe_attack_counter = getTotalTribeAttacksCount(all_attacks);

    if (tribe_attack_counter > 0) {
        $('#incomings_cell').parent().append(`
            <td id="supports_tribe_cell" style="text-align:center;padding:0 4px" class="box-item separate nowrap">
                <a href="#" class="supports_tribe_click">
                    <img src="/graphic/unit/def.png" style="vertical-align:-2px">
                    <span id="supports_amount">${tribe_attack_counter}</span>
                </a>
            </td>`);
        $('#header_commands').show();
    }

    $('.supports_tribe_click').click(function (e) {
        e.preventDefault();

        let table_content = '', div_player_last_update = '';
        for (const key in all_attacks) {
            if (!all_attacks.hasOwnProperty(key)) continue;
            const player_commands = JSON.parse(all_attacks[key].commands);
            player_commands.forEach(cmd => {
                const [id, name, target_v, target_vid, sender_v, sender_vid, sender_p, sender_pid, arrival] = cmd;
                if (arrival <= Date.now()) return;
                const countdown = `<span id="countdown-${id}" data-ms="${arrival}">${formatTime(Math.round((arrival - Date.now()) / 1000))}</span>`;
                table_content += `<tr>
                    <td><img src="/graphic/command/attack.png"> ${name}</td>
                    <td>${key}</td>
                    <td><a href="/game.php?village=${current_village}&screen=info_village&id=${target_vid}">${target_v}</a></td>
                    <td><a href="/game.php?village=${current_village}&screen=info_village&id=${sender_vid}">${sender_v}</a></td>
                    <td><a href="/game.php?village=${current_village}&screen=info_player&id=${sender_pid}">${sender_p}</a></td>
                    <td data-order="${arrival}">${staemmeMsToDate(arrival)}</td>
                    <td>${countdown}</td>
                </tr>`;
            });
            div_player_last_update += `<tr><td>${key}</td><td>${staemmeMsToDate(all_attacks[key].last_update * 1000)}</td></tr>`;
        }

        $('#content_value').html(`
            <h2>Ally Incs</h2>
            <table id="ally_incs">
                <thead><tr><th>Command</th><th>Target Player</th><th>Target</th><th>Sender Village</th><th>Sender Player</th><th>Arrival Time</th><th>In</th></tr></thead>
                <tbody>${table_content}</tbody>
            </table>
            <div style="margin-top:20px">
                <h4>Last Updates</h4>
                <table><thead><tr><th>Player</th><th>Last Update</th></tr></thead><tbody>${div_player_last_update}</tbody></table>
            </div>`);

        setInterval(() => {
            $('span[id^="countdown-"]').each(function () {
                $(this).text(formatTime(Math.round((parseInt($(this).data('ms')) - Date.now()) / 1000)));
            });
        }, 1000);

        const css = document.createElement('link');
        css.rel = 'stylesheet'; css.type = 'text/css';
        css.href = 'https://cdn.datatables.net/1.13.6/css/jquery.dataTables.min.css';
        document.head.appendChild(css);

        $.getScript('https://cdn.datatables.net/1.13.6/js/jquery.dataTables.min.js', () => {
            new DataTable('#ally_incs', {
                order: [[5, 'asc']],
                lengthMenu: [[100, 200, 500, -1], [100, 200, 500, 'All']],
                initComplete() {
                    this.api().columns([1, 4]).every(function () {
                        const col = this;
                        const sel = document.createElement('select');
                        sel.add(new Option(''));
                        col.header().replaceChildren(sel);
                        sel.addEventListener('change', () => {
                            col.search(sel.value ? `^${DataTable.util.escapeRegex(sel.value)}$` : '', true, false).draw();
                        });
                        col.data().unique().sort().each(d => sel.add(new Option($('<div/>').html(d).text())));
                    });
                },
            });
        });

        utils.finishScript(1);
    });

    function formatTime(s) {
        if (s <= 0) return '-00:00:01';
        return [Math.floor(s / 3600), Math.floor((s % 3600) / 60), s % 60]
            .map(n => String(n).padStart(2, '0')).join(':');
    }

    function getTotalTribeAttacksCount(attacks) {
        let n = 0;
        for (const key in attacks) {
            if (!attacks.hasOwnProperty(key)) continue;
            JSON.parse(attacks[key].commands).forEach(cmd => { if (cmd[8] > Date.now()) n++; });
        }
        return n;
    }

    async function getAllOwnAttacks() {
        utils.logMessage('Fetching attacks from overview');
        const response = await $.get(`/game.php?village=${current_village}&screen=overview_villages&subtype=attacks&mode=incomings&page=-1&group=0&type=all`);
        const data = [];
        $(response).find('#incomings_table tr.nowrap').each(function () {
            const r = $(this);
            const iconSrc = r.find('td:nth-child(1) .icon-container img').first().attr('src') ?? '';
            const type = iconSrc.includes('attack_large') ? 'big'
                       : iconSrc.includes('attack_medium') ? 'medium'
                       : iconSrc.includes('attack_small') ? 'small'
                       : 'unknown';
            data.push([
                parseInt(r.find('td:nth-child(1) .quickedit').attr('data-id')),
                r.find('td:nth-child(1) .quickedit-label').text().trim(),
                r.find('td:nth-child(2) a').text().trim(),
                parseInt(r.find('td:nth-child(2) a').attr('href').split('village=')[1]),
                r.find('td:nth-child(3) a').text().trim(),
                parseInt(r.find('td:nth-child(3) a').attr('href').split('id=')[1]),
                r.find('td:nth-child(4) a').text().trim(),
                parseInt(r.find('td:nth-child(4) a').attr('href').split('id=')[1]),
                staemmeDateToMs(r.find('td:nth-child(6)').text().trim()),
                type,
            ]);
        });
        return data;
    }

    async function syncAttacksToServer(attacks) {
        try {
            const response = await $.ajax({
                url: `${utils.serverUrl}ds/tribe-full-defense-overview`,
                type: 'POST',
                data: { world: game_data.world, player: game_data.player.name, ally: game_data.player.ally, attacks: JSON.stringify(attacks) },
            });
            utils.saveValue('all_attacks', JSON.stringify(response));
            utils.saveValue('last_sync', Date.now());
        } catch (e) {
            utils.logMessage('Sync failed', 'error');
        }
    }

    function staemmeDateToMs(text) {
        const now = new Date();
        const [y, m, day] = [now.getFullYear(), now.getMonth() + 1, now.getDate()];
        text = text.replace(/(?:hüt um|heute um|today at)\s*/g, `${y}-${m}-${day} `)
                   .replace(/(?:morn um|morgen um|tomorrow at)\s*/g, `${y}-${m}-${day + 1} `)
                   .replace(/^am\s+(\d{1,2})\.(\d{2})\.(?:\d{4})?\s+um\s+/, (_, dd, mm) => `${y}-${mm}-${dd} `)
                   .replace(/^(\d{1,2})\.(\d{2})\.(?:\d{4})?\s*/, (_, dd, mm) => `${y}-${mm}-${dd} `);
        if (/:\d{3}$/.test(text)) text = text.replace(/:([^:]+)$/, '.$1');
        const match = text.match(/(\d{4})-(\d{1,2})-(\d{1,2}) (\d{2}):(\d{2}):(\d{2})\.(\d{3})/);
        if (!match) return null;
        return new Date(+match[1], +match[2] - 1, +match[3], +match[4], +match[5], +match[6], +match[7]).getTime();
    }

    function staemmeMsToDate(ms) {
        const d = new Date(ms), now = new Date();
        const sameDay = d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        const nextDay = d.getDate() === now.getDate() + 1 && d.getMonth() === now.getMonth();
        const prefix = sameDay ? 'hüt um' : nextDay ? 'morn um' : `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
        return `${prefix} ${[d.getHours(), d.getMinutes(), d.getSeconds()].map(n => String(n).padStart(2, '0')).join(':')}:${String(d.getMilliseconds()).padStart(3, '0')}`;
    }
}
