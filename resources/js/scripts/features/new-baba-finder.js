import { Fr34kUtils } from '../fr34k.js';

export function run() {
    const utils = new Fr34kUtils({ script_name: 'new_baba_finder' });

    $('h3:contains("Farm-Assi")').append('<img id="nbf_remove" style="margin-left:10px;cursor:pointer;" src="/graphic/buildings/main.png">');

    $('#nbf_remove').click(async function () {
        const results = await getAllCoords();
        let removed = 0, tagged = 0;

        $('#barbariansTable .overview_table.ra-table tbody tr td:nth-child(3) a').each(function () {
            const text = $(this).text().replace('\n', '').trim();
            if (results.includes(text)) {
                $(this).parent().parent().remove();
                removed++;
            } else {
                const href = $(this).parent().parent().find('td').last().find('a').attr('href');
                $(this).parent().parent().find('td').last().find('a').attr('href', href + '&light=10');
                tagged++;
            }
        });

        utils.logMessage(`Removed: ${removed}, Tagged: ${tagged}`);
        utils.finishScript(removed + tagged);
    });

    async function getAllCoords() {
        const current_village = game_data.village.id;
        const all_coords = [];
        let total_pages = 1, current_page = 0;

        while (current_page < total_pages) {
            const response = await $.get(`/game.php?village=${current_village}&screen=am_farm&order=distance&dir=asc&Farm_page=${current_page}`);
            $(response).find('#plunder_list tr[id^="village_"] td:nth-child(4) a').each(function () {
                const match = $(this).text().trim().match(/\(([^)]+)\)/);
                if (match) all_coords.push(match[1]);
            });
            utils.logMessage('Downloaded page ' + current_page, 'debug');
            if (total_pages <= 1) {
                total_pages = parseInt($(response).find('#plunder_list_nav .paged-nav-item').last().text().replace('[', '').replace(']', ''));
            }
            current_page++;
            await utils.sleep(500);
        }
        return all_coords;
    }
}
