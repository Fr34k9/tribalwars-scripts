// ==UserScript==
// @name         Tribe Full Defense Overview
// @namespace    http://Fr34k.ch
// @version      1.5
// @description  Shows full defense information for everyone with this script and in the same tribe.
// @author       Fr34k
// @match        https://ch75.staemme.ch/game.php?*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=staemme.ch
// @require      https://cdn.datatables.net/1.13.6/js/jquery.dataTables.min.js
// @grant        none
// ==/UserScript==

(async function() {
    console.log('Script aktiv: Tribe Full Defense Overview');
    const PREFIX = 'tfdo';

    // Function to work every 10 minutes
    const last_sync = localStorage.getItem(PREFIX + '_last_sync');
    const current_time = Date.now();
    const current_village = game_data.village.id;

    if( last_sync == null || current_time - last_sync > 60000 ) {
        // Get all attacks from overview page
        let attacks = await get_all_own_attacks();
        // Sync attacks to server
        sync_attacks_to_server(attacks);
    }

    let all_attacks = localStorage.getItem(PREFIX + '_all_attacks');

    if( all_attacks != null ) {
        all_attacks = JSON.parse( all_attacks );
        
        // Show total tribe attacks in header
        let tribe_attack_counter = get_total_tribe_attacks_count(all_attacks);
        if( tribe_attack_counter > 0 ) {
            let template = `<td id="supports_tribe_cell" style="text-align: center; padding: 0 4px" class="box-item separate nowrap">
                <a href="#" class="supports_tribe_click">
                <img src="/graphic/unit/def.png" style="vertical-align: -2px" class="" data-title="Igehendi Untrstützig">
                <span id="supports_amount">` + tribe_attack_counter + `</span>
                </a>
                </td>`;
            $('#incomings_cell').parent().append(template);
            $('#header_commands').show();
        }

        // Show attacks in info_village
        /*if( window.location.href.indexOf("screen=info_village") > 0 ) {
            // Show interface for village
            // Show all attacks of village
        }*/
    }

    $('.supports_tribe_click').click(function(e){
        e.preventDefault();
        console.log('Show Tribe attacks in table');

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
            if ( all_attacks.hasOwnProperty(key) ) {
                let player_commands = JSON.parse( all_attacks[key].commands );
                let last_update = all_attacks[key].last_update;

                player_commands.forEach(function(command){
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

                    if( arrival_time > Date.now() ) {
                        table_content += `<tr>
                        <td><img src="/graphic/command/attack.png" alt="">` + command_name + `</td>
                        <td>` + key + `</td>
                        <td><a href="/game.php?village=` + current_village + `&amp;screen=info_village&amp;id=` + target_village_id + `">` + target_village + `</a></td>
                        <td><a href="/game.php?village=` + current_village + `&amp;screen=info_village&amp;id=` + sender_village_id + `">` + sender_village + `</a></td>
                        <td><a href="/game.php?village=` + current_village + `&amp;screen=info_player&amp;id=` + sender_player_id + `">` + sender_player + `</a></td>
                        <td data-order="` + arrival_time + `">` + arrival_string + `</td>
                        <td>` + countdown + `</td>
                    </tr>`;
                    }
                });
                div_player_last_update += `<tr>
                    <td>` + key + `</td>
                    <td>` + staemme_ms_to_date(last_update*1000) + `</td>
                </tr>`;
            }
        }

        $('#content_value').html(`<h2>Ally Incs</h2>
        <table id='ally_incs'>
            <thead>
                ` + table_header + `
            </thead>
            <tbody>
                ` + table_content + `
            </tbody>
        </table>
        <div id="player_last_update" style="margin-top: 20px;">
            <h4>Last Updates</h4>
            <div>
                <table>
                    <thead>
                        <tr>
                            <th>Player</th>
                            <th>Last Update</th>
                        </tr>
                    </thead>
                    <tbody>
                        ` + div_player_last_update + `
                    </tbody>
                </table>
            </div>
        </div>`);

        // Update countdown every second
        setInterval(function() {
            $('span[id^="countdown-"]').each(function() {
                let arrival_time = parseInt($(this).data('ms'));
                let remaining_time = Math.round((arrival_time - Date.now()) / 1000);
                $(this).text( formatTime(remaining_time) );
            });
        }, 1000);

        // Add DataTables css
        const dataTableCSS = document.createElement('link');
        dataTableCSS.rel = 'stylesheet';
        dataTableCSS.type = 'text/css';
        dataTableCSS.href = 'https://cdn.datatables.net/1.13.6/css/jquery.dataTables.min.css';
        document.head.appendChild(dataTableCSS);

        $(document).ready(function() {
            new DataTable('#ally_incs', {
                "order": [[ 5, "asc" ]],
                lengthMenu: [
                    [100, 200, 500, -1],
                    [100, 200, 500, 'All']
                ],
                initComplete: function () {
                    this.api()
                        .columns([1,4])
                        .every(function () {
                            let column = this;
                
                            // Create select element
                            let select = document.createElement('select');
                            select.add(new Option(''));
                            column.header().replaceChildren(select);
                
                            // Apply listener for user change in value
                            select.addEventListener('change', function () {
                                var val = DataTable.util.escapeRegex(select.value);
                                column
                                    .search(val ? '^' + val + '$' : '', true, false)
                                    .draw();
                            });
                
                            // Add list of options
                            column
                                .data()
                                .unique()
                                .sort()
                                .each(function (d, j) {
                                    var val = $('<div/>').html(d).text();
                                    select.add(new Option(val));
                                });
                        });
                }
            });
        });
    });

    function formatTime(seconds) {
      	if(seconds <= 0) return '-00:00:01';
        let hours = Math.floor(seconds / 3600);
        let minutes = Math.floor((seconds - (hours * 3600)) / 60);
        let remainingSeconds = seconds - (hours * 3600) - (minutes * 60);
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    function get_total_tribe_attacks_count(all_attacks) {
        let counter = 0;
        for (let key in all_attacks) {
            if (all_attacks.hasOwnProperty(key)) {
                let player_commands = JSON.parse( all_attacks[key].commands );

                player_commands.forEach(function(command){
                    let arrival_time = command[8];

                    if( arrival_time > Date.now() ) {
                        counter += 1;
                    }
                });
            }
        }

        return counter;
    }

    async function get_all_own_attacks() {
        console.log('Get all Attacks from Overview-Page');

        let data = [];
        let response = await $.get('/game.php?village=' + current_village + '&screen=overview_villages&subtype=attacks&mode=incomings&page=-1&group=0&type=all' );
        let incomings = $(response).find('#incomings_table tr.nowrap');

        incomings.each(function(){
            let row = $(this);
            let command_id = parseInt( row.find('td:nth-child(1) .quickedit').attr('data-id') );
            let command_name = row.find('td:nth-child(1) a').text().trim();
            let target_village = row.find('td:nth-child(2) a').text().trim();
            let target_village_id = parseInt( row.find('td:nth-child(2) a').attr('href').split('village=')[1].split('&')[0] );
            let sender_village = row.find('td:nth-child(3) a').text().trim();
            let sender_village_id = parseInt( row.find('td:nth-child(3) a').attr('href').split('id=')[1].split('&')[0] );
            let sender_player = row.find('td:nth-child(4) a').text().trim();
            let sender_player_id = parseInt( row.find('td:nth-child(4) a').attr('href').split('id=')[1].split('&')[0] );
            let arrival_time = staemme_date_to_ms( row.find('td:nth-child(6)').text().trim() );

            data.push([
                command_id,
                command_name,
                target_village,
                target_village_id,
                sender_village,
                sender_village_id,
                sender_player,
                sender_player_id,
                arrival_time
            ]);
        });
        console.log('Found ' + data.length + ' attacks');
        return data;
    }

    async function sync_attacks_to_server(attacks) {
        console.log('Save all Attacks');
        // call url with all attacks
        let world = game_data.world;
        let player = game_data.player.name;
        let ally = game_data.player.ally;
        let attacks_param = JSON.stringify(attacks);

        let response = await $.ajax({
            url: 'https://greasemonkey.fr34k.ch/ds/tribe-full-defense-overview/index.php',
            type: 'POST',
            data: {
                world: world,
                player: player,
                ally: ally,
                attacks: attacks_param
            }
        });

        localStorage.setItem(PREFIX + '_all_attacks', response );
        localStorage.setItem(PREFIX + '_last_sync', Date.now() );

        console.log('Sync Complete');
    }

    function staemme_date_to_ms( text ) {
        var current_date = new Date();
        var time = text;
        time = time.replace("hüt um ", current_date.getFullYear()+'-'+(parseInt(current_date.getMonth())+1)+'-'+current_date.getDate()+' '); //Replace heute um durch Datum
        time = time.replace("heute um ", current_date.getFullYear()+'-'+(parseInt(current_date.getMonth())+1)+'-'+current_date.getDate()+' '); //Replace heute um durch Datum
        time = time.replace("morn um ", current_date.getFullYear()+'-'+(parseInt(current_date.getMonth())+1)+'-'+(parseInt(current_date.getDate())+1)+' '); //Replace morgen um durch Datum von morgen
        time = time.replace("morgen um ", current_date.getFullYear()+'-'+(parseInt(current_date.getMonth())+1)+'-'+(parseInt(current_date.getDate())+1)+' '); //Replace morgen um durch Datum von morgen

      	// Check if the string contains milliseconds (ends with :xxx)
        if (/\d{3}$/.test(time)) {
          // Replace the last colon with an empty string
  				time = time.replace(/:([^:]+)$/, '.$1');
        }

        let time_ms = Date.parse(time+"Z");
        //time_ms = parseInt(time_ms) - 7200000; // Sommerzeit
        time_ms = parseInt(time_ms) - 3600000; // Winterzeit
        return time_ms;
    }

    function staemme_ms_to_date( ms ) {
        var current_date = new Date();
        var input_date = new Date(ms);

        var start = "";
        if( 
            input_date.getDate() == current_date.getDate() &&
            input_date.getMonth() == current_date.getMonth() &&
            input_date.getFullYear() == current_date.getFullYear()
        ) {
            start = "hüt um";
        }

        if(
            input_date.getDate() == parseInt(current_date.getDate()+1) &&
            input_date.getMonth() == current_date.getMonth() &&
            input_date.getFullYear() == current_date.getFullYear()
        ) {
            start = "morn um";
        }

        if( start == "" ) {
            start = input_date.getFullYear()+'-'+(parseInt(input_date.getMonth())+1)+'-'+input_date.getDate();
        }
        const hours = String(input_date.getHours()).padStart(2, '0');
        const minutes = String(input_date.getMinutes()).padStart(2, '0');
        const seconds = String(input_date.getSeconds()).padStart(2, '0');
        const miliseconds = String(input_date.getMilliseconds()).padStart(3, '0');

        return start + ' ' + hours + ':' + minutes + ':' + seconds + ':' + miliseconds;
    }
})();