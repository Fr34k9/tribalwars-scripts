// ==UserScript==
// @name         New Baba Finder
// @namespace    http://Fr34k.ch
// @version      1.0
// @description  Searching for new babas to attack.
// @author       Fr34k
// @match        *.staemme.ch/game.php?village=*&screen=am_farm*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=staemme.ch
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    $('h3:contains("Farm-Assi")').append('<img id="nbf_remove" style="margin-left: 10px; cursor: pointer;" src="/graphic/buildings/main.png">');

    $('#nbf_remove').click(function(){
        getAllCoords().then(results => {
            $('#barbariansTable .overview_table.ra-table tbody tr td:nth-child(3) a').each(function(){
                var text = $(this).text().replace("\n","").trim();

                if( results.includes(text) ) {
                    $(this).parent().parent().remove();
                } else {
                    let current_href = $(this).parent().parent().find('td').last().find('a').attr('href');
                    $(this).parent().parent().find('td').last().find('a').attr('href', current_href + '&light=10');
                }

            });
        });
    });

    async function getAllCoords() {
        let current_village = game_data.village.id;
        let all_coords = [];

        let total_pages = 1;
        let current_page = 0;
        while( current_page < total_pages ) {
            let response = await $.get('/game.php?village=' + current_village + '&screen=am_farm&order=distance&dir=asc&Farm_page=' + current_page );
            let coords = $(response).find('#plunder_list').find('tr[id^="village_"] td:nth-child(4) a');
            const regex = /\(([^)]+)\)/;

            coords.each(function(){
                let text = $(this).text().trim();
                const match = text.match(regex);

                if( match ) {
                    all_coords.push(match[1]);
                }
            });
            console.log("Downloaded page " + current_page );

            if( total_pages <= 1 ) total_pages = parseInt( $(response).find('#plunder_list_nav .paged-nav-item').last().text().replace("[","").replace("]","") );
            current_page += 1;
            all_coords.push(coords);
            sleep(500);
        }
        return all_coords;
    }

    function sleep(ms) {
        const start = new Date().getTime();
        while (new Date().getTime() - start < ms) {}
    }


    // Your code here...
})();