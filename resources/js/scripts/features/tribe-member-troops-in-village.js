import { Fr34kUtils } from '../fr34k.js';

export async function run() {
    const utils = new Fr34kUtils({ script_name: 'tribe_member_troops_in_village' });

    const sitter  = game_data.player.sitter;
    const allyId  = game_data.player.ally;
    const troopsPage = `/game.php?screen=ally&mode=members_troops&player_id=${VillageInfo.player_id}&village=${game_data.village.id}${sitter != 0 ? `&t=${game_data.player.id}` : ''}`;

    if ($('#content_value table table').first().find(`tr td:contains("Stamm")`).parent().find(`a[href*="info_ally&id=${allyId}"]`).length > 0) {
        await getTroopsOfMember(troopsPage);
        utils.finishScript(1);
    }

    async function getTroopsOfMember(url) {
        const coordinates = $('#content_value table td:contains("Koordinate:")').last().parent().find('td:nth-child(2)').text();
        try {
            const data = await $.get(url);
            const $content = $(data).find('#ally_content .table-responsive');
            $content.find('.info_box').remove();
            const headerRow = $content.find('tbody tr').first().html();
            const troops    = $content.find(`tbody tr:contains(${coordinates})`).html();
            $('table.vis .edit_notes_row').parent().parent().parent().append(`
                <table class="vis" style="width:100%;padding-top:20px;">
                    <tbody>
                        <tr><th colspan="16">Truppen<span class="float_right hidden">Truppen ausserhalb werden ebenfalls angezeigt</span></th></tr>
                        <tr>${headerRow}</tr>
                        <tr>${troops}</tr>
                    </tbody>
                </table>`);
        } catch (e) {
            utils.logMessage('Error fetching member data: ' + e, 'error');
        }
    }
}
