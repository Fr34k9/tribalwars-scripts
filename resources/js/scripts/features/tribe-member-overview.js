import { Fr34kUtils } from '../fr34k.js';

export async function run() {
    const utils = new Fr34kUtils({ script_name: 'tribe_member_overview' });
    const url = window.location.href;

    if (url.includes('screen=ally')) {
        $('#ally_content form').append("<span>Loading Members...<span id='tribe_members_overview_loading_counter'></span></span>");
        const memberUrls = await getMemberUrls();
        if (memberUrls.length) {
            $('#tribe_members_overview_loading_counter').text('0 / ' + memberUrls.length);
            await processMemberUrls(memberUrls);
            utils.finishScript(memberUrls.length);
        }
    }

    if (url.includes('screen=info_village')) {
        const sitter = game_data.player.sitter;
        const allyId = game_data.player.ally;
        const troopsPage = `/game.php?screen=ally&mode=members_troops&player_id=${VillageInfo.player_id}&village=${game_data.village.id}${sitter != 0 ? `&t=${game_data.player.id}` : ''}`;
        if ($('#content_value table table').first().find(`tr td:contains("Stamm")`).parent().find(`a[href*="info_ally&id=${allyId}"]`).length > 0) {
            await fetchAndAppendTroops(troopsPage);
            utils.finishScript(1);
        }
    }

    async function processMemberUrls(urls) {
        let c = 0;
        for (const url of urls) {
            $('#tribe_members_overview_loading_counter').text(`${++c} / ${urls.length}`);
            await fetchAndAppendMember(url);
            await utils.sleep(200);
        }
        $('#tribe_members_overview_loading_counter').text('Done');
    }

    async function fetchAndAppendTroops(url) {
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
            utils.logMessage('Error fetching village troops: ' + e, 'error');
        }
    }

    async function fetchAndAppendMember(url) {
        try {
            const data = await $.get(url);
            const $content = $(data).find('#ally_content .table-responsive');
            $content.find('.info_box').remove();
            const username = $(data).find('.input-nicer :selected').text();
            $('#ally_content').append(`<h4>${username}</h4>`).append($content);
        } catch (e) {
            utils.logMessage('Error fetching member: ' + e, 'error');
        }
    }

    async function getMemberUrls() {
        const mode     = utils.getParameterByName('mode');
        const playerID = game_data.player.id;
        const sitter   = game_data.player.sitter;
        const baseUrl  = `/game.php?screen=ally&mode=${mode}&player_id=${playerID}&village=${game_data.village.id}${sitter != 0 ? `&t=${playerID}` : ''}`;
        try {
            const response = await $.get(baseUrl);
            const urls = [];
            $(response).find('.input-nicer option:not([disabled])').each(function () {
                const pid = parseInt(this.value);
                if (!isNaN(pid)) urls.push(`/game.php?screen=ally&mode=${mode}&player_id=${pid}&village=${game_data.village.id}${sitter != 0 ? `&t=${playerID}` : ''}`);
            });
            return urls;
        } catch (e) {
            utils.logMessage('Error fetching member URLs: ' + e, 'error');
            return [];
        }
    }
}
