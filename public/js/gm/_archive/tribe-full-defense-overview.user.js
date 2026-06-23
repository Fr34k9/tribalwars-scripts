// ==UserScript==
// @name         Tribe Full Defense Overview
// @namespace    http://Fr34k.ch
// @version      2.0
// @description  Shows full defense information for everyone with this script and in the same tribe.
// @author       Fr34k
// @match        https://ch75.staemme.ch/game.php?*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=staemme.ch
// @require      https://laravel-test-tribalwars-scripts-laravel.ytyylb.easypanel.host/js/fr34k.js
// @require      https://cdn.datatables.net/1.13.6/js/jquery.dataTables.min.js
// @grant        none
// ==/UserScript==

(async function() {

    const config = {
        script_name: 'tribe_full_defense_overview',
    };

    const utils = new Fr34kUtils(config);

    const last_sync = utils.getValue('last_sync');
    const current_time = Date.now();
    const current_village = game_data.village.id;

    if (last_sync == null || current_time - last_sync > 60000) {
        let attacks = await get_all_own_attacks();
        sync_attacks_to_server(attacks);
    }

    let all_attacks = utils.getValue('all_attacks');

    if (all_attacks != null) {
        all_attacks = JSON.parse(all_attacks);

        let tribe_attack_counter = get_total_tribe_attacks_count(all_attacks);
        if (tribe_attack_counter > 0) {
            let template = `<td id="supports_tribe_cell" style="text-align: center; padding: 0 4px" class="box-item separate nowrap">
                <a href="#" class="supports_tribe_click">
                <img src="/graphic/unit/def.png" style="vertical-align: -2px" class="" data-title="Igehendi Untrstützig">
                <span id="supports_amount">${tribe_attack_counter}</span>
                </a>
                </td>`;
            $('#incomings_cell').parent().append(template);
            $('#header_commands').show();
        }
    }

    $('.supports_tribe_click').click(function(e) {
        e.preventDefault();
        utils.logMessage('Show Tribe attacks in table');

        let table_header = `<tr>
            <th>Command</th>
            <th>Target Player</th>
            <th>Target</th>
            <th>Sender Village</th>
            <th>Sender Player</th>
            <th>Arrival Time</th>
            <th>In</th>
        </tr>`;

        let div_player_last_update = "";
        let table_content = "";
        for (let key in all_attacks) {
            if (all_attacks.hasOwnProperty(key)) {
                let player_commands = JSON.parse(all_attacks[key].commands);
                let last_update = all_attacks[key].last_update;

                player_commands.forEach(function(command) {
                    let command_id = command[0];
                    let command_name = command[1];
                    let target_village = command[2];
                    let target_village_id = command[3];
                    let sender_village = command[4];
                    let sender_village_id = command[5];
                    let sender_player = command[6];
                    let sender_player_id = command[7];
                    let arrival_time = command[8];
                    let remaining_time = Math.round((arrival_time - Date.now()) / 1000);
                    let countdown = '<span id="countdown-' + command_id + '" data-ms="' + arrival_time + '">' + formatTime(remaining_time) + '</span>';
                    let arrival_string = staemme_ms_to_date(arrival_time);

                    if (arrival_time > Date.now()) {
                        table_content += `<tr>
                            <td><img src="/graphic/command/attack.png" alt="">${command_name}</td>
                            <td>${key}</td>
                            <td><a href="/game.php?village=${current_village}&amp;screen=info_village&amp;id=${target_village_id}">${target_village}</a></td>
                            <td><a href="/game.php?village=${current_village}&amp;screen=info_village&amp;id=${sender_village_id}">${sender_village}</a></td>
                            <td><a href="/game.php?village=${current_village}&amp;screen=info_player&amp;id=${sender_player_id}">${sender_player}</a></td>
                            <td data-order="${arrival_time}">${arrival_string}</td>
                            <td>${countdown}</td>
                        </tr>`;
                    }
                });
                div_player_last_update += `<tr>
                    <td>${key}</td>
                    <td>${staemme_ms_to_date(last_update * 1000)}</td>
                </tr>`;
            }
        }

        $('#content_value').html(`<h2>Ally Incs</h2>
        <table id='ally_incs'>
            <thead>${table_header}</thead>
            <tbody>${table_content}</tbody>
        </table>
        <div id="player_last_update" style="margin-top: 20px;">
            <h4>Last Updates</h4>
            <table>
                <thead><tr><th>Player</th><th>Last Update</th></tr></thead>
                <tbody>${div_player_last_update}</tbody>
            </table>
        </div>`);

        setInterval(function() {
            $('span[id^="countdown-"]').each(function() {
                let arrival_time = parseInt($(this).data('ms'));
                let remaining_time = Math.round((arrival_time - Date.now()) / 1000);
                $(this).text(formatTime(remaining_time));
            });
        }, 1000);

        const dataTableCSS = document.createElement('link');
        dataTableCSS.rel = 'stylesheet';
        dataTableCSS.type = 'text/css';
        dataTableCSS.href = 'https://cdn.datatables.net/1.13.6/css/jquery.dataTables.min.css';
        document.head.appendChild(dataTableCSS);

        $(document).ready(function() {
            new DataTable('#ally_incs', {
                "order": [[5, "asc"]],
                lengthMenu: [[100, 200, 500, -1], [100, 200, 500, 'All']],
                initComplete: function() {
                    this.api().columns([1, 4]).every(function() {
                        let column = this;
                        let select = document.createElement('select');
                        select.add(new Option(''));
                        column.header().replaceChildren(select);
                        select.addEventListener('change', function() {
                            var val = DataTable.util.escapeRegex(select.value);
                            column.search(val ? '^' + val + '$' : '', true, false).draw();
                        });
                        column.data().unique().sort().each(function(d) {
                            var val = $('<div/>').html(d).text();
                            select.add(new Option(val));
                        });
                    });
                }
            });
        });

        utils.finishScript(1);
    });

    function formatTime(seconds) {
        if (seconds <= 0) return '-00:00:01';
        let hours = Math.floor(seconds / 3600);
        let minutes = Math.floor((seconds - hours * 3600) / 60);
        let remainingSeconds = seconds - hours * 3600 - minutes * 60;
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
    }

    function get_total_tribe_attacks_count(all_attacks) {
        let counter = 0;
        for (let key in all_attacks) {
            if (all_attacks.hasOwnProperty(key)) {
                let player_commands = JSON.parse(all_attacks[key].commands);
                player_commands.forEach(function(command) {
                    if (command[8] > Date.now()) counter += 1;
                });
            }
        }
        return counter;
    }

    async function get_all_own_attacks() {
        utils.logMessage('Fetching attacks from overview page');
        let data = [];
        let response = await $.get('/game.php?village=' + current_village + '&screen=overview_villages&subtype=attacks&mode=incomings&page=-1&group=0&type=all');
        let incomings = $(response).find('#incomings_table tr.nowrap');

        incomings.each(function() {
            let row = $(this);
            let command_id = parseInt(row.find('td:nth-child(1) .quickedit').attr('data-id'));
            let command_name = row.find('td:nth-child(1) a').text().trim();
            let target_village = row.find('td:nth-child(2) a').text().trim();
            let target_village_id = parseInt(row.find('td:nth-child(2) a').attr('href').split('village=')[1].split('&')[0]);
            let sender_village = row.find('td:nth-child(3) a').text().trim();
            let sender_village_id = parseInt(row.find('td:nth-child(3) a').attr('href').split('id=')[1].split('&')[0]);
            let sender_player = row.find('td:nth-child(4) a').text().trim();
            let sender_player_id = parseInt(row.find('td:nth-child(4) a').attr('href').split('id=')[1].split('&')[0]);
            let arrival_time = staemme_date_to_ms(row.find('td:nth-child(6)').text().trim());

            data.push([command_id, command_name, target_village, target_village_id, sender_village, sender_village_id, sender_player, sender_player_id, arrival_time]);
        });

        utils.logMessage('Found ' + data.length + ' attacks');
        return data;
    }

    async function sync_attacks_to_server(attacks) {
        utils.logMessage('Syncing attacks to server');
        let world = game_data.world;
        let player = game_data.player.name;
        let ally = game_data.player.ally;

        let response = await $.ajax({
            url: 'https://greasemonkey.fr34k.ch/ds/tribe-full-defense-overview/index.php',
            type: 'POST',
            data: {
                world: world,
                player: player,
                ally: ally,
                attacks: JSON.stringify(attacks)
            }
        });

        utils.saveValue('all_attacks', response);
        utils.saveValue('last_sync', Date.now());
        utils.logMessage('Sync complete');
    }

    function staemme_date_to_ms(text) {
        var current_date = new Date();
        var time = text;
        time = time.replace("hüt um ", current_date.getFullYear() + '-' + (parseInt(current_date.getMonth()) + 1) + '-' + current_date.getDate() + ' ');
        time = time.replace("heute um ", current_date.getFullYear() + '-' + (parseInt(current_date.getMonth()) + 1) + '-' + current_date.getDate() + ' ');
        time = time.replace("morn um ", current_date.getFullYear() + '-' + (parseInt(current_date.getMonth()) + 1) + '-' + (parseInt(current_date.getDate()) + 1) + ' ');
        time = time.replace("morgen um ", current_date.getFullYear() + '-' + (parseInt(current_date.getMonth()) + 1) + '-' + (parseInt(current_date.getDate()) + 1) + ' ');
        if (/\d{3}$/.test(time)) time = time.replace(/:([^:]+)$/, '.$1');
        let time_ms = Date.parse(time + "Z");
        time_ms = parseInt(time_ms) - 3600000;
        return time_ms;
    }

    function staemme_ms_to_date(ms) {
        var current_date = new Date();
        var input_date = new Date(ms);
        var start = "";
        if (input_date.getDate() == current_date.getDate() && input_date.getMonth() == current_date.getMonth() && input_date.getFullYear() == current_date.getFullYear()) {
            start = "hüt um";
        }
        if (input_date.getDate() == parseInt(current_date.getDate() + 1) && input_date.getMonth() == current_date.getMonth() && input_date.getFullYear() == current_date.getFullYear()) {
            start = "morn um";
        }
        if (start == "") {
            start = input_date.getFullYear() + '-' + (parseInt(input_date.getMonth()) + 1) + '-' + input_date.getDate();
        }
        return start + ' ' + String(input_date.getHours()).padStart(2, '0') + ':' + String(input_date.getMinutes()).padStart(2, '0') + ':' + String(input_date.getSeconds()).padStart(2, '0') + ':' + String(input_date.getMilliseconds()).padStart(3, '0');
    }
})();
