// ==UserScript==
// @name         Tribe Leader Member Troops Overview
// @namespace    http://Fr34k.ch
// @version      1.0
// @description  Shows all tribe members troops/buildings/defense instead of only 1
// @author       You
// @match        https://*.staemme.ch/game.php?village=*&screen=ally&mode=members_*
// @match        https://*.staemme.ch/game.php?village=*&screen=info_village&id=*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=staemme.ch
// @grant        none
// ==/UserScript==

(async function () {
    if( window.location.href.indexOf('screen=ally') > 0 ) {
        $('#ally_content form').append("<span>Loading Members...<span id='tribe_members_overview_loading_counter'></span></span>");
        const memberUrls = await getMemberUrls();

        if (memberUrls.length) {
            $('#tribe_members_overview_loading_counter').text("0 / " + memberUrls.length);
            await processMemberUrls(memberUrls);
        }
    }

    if( window.location.href.indexOf('screen=info_village') > 0 ) {
        const playerID = game_data.player.id;
        const sitter = game_data.player.sitter;
        const allyId = game_data.player.ally;

        const troopsMemberPage = `/game.php?screen=ally&mode=members_troops&player_id=${VillageInfo.player_id}&village=${game_data.village.id}${sitter != 0 ? `&t=${playerID}` : ''}`;
        if( $('#content_value table table').first().find('tr td:contains("Stamm")').parent().find('a[href*="info_ally&id=' + allyId + '"]').length > 0 ) {
            getTroobsOfMemberVillage(troopsMemberPage);
        }
    }
})();

async function processMemberUrls(memberUrls) {
    let c = 0;
    for (const element of memberUrls) {
        c += 1;
        $('#tribe_members_overview_loading_counter').text(c + " / " + memberUrls.length);
        await getTroobsOfMember(element);
        await sleep(200);
    }
    $('#tribe_members_overview_loading_counter').text("Done");
}

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getTroobsOfMemberVillage(url) {
        const coordinates = $('#content_value table td:contains("Koordinate:")').last().parent().find('td:nth-child(2)').text();
        try {
            const data = await $.get(url);
            const $html_content = $(data);
            const $allyContent = $html_content.find('#ally_content .table-responsive');
            $allyContent.find('.info_box').remove();
            const headerRow = $allyContent.find('tbody tr').first().html();
            const troops = $allyContent.find('tbody tr:contains('+ coordinates +')').html();

            var template = `<table class="vis" style="width: 100%; padding-top: 20px;">
   <tbody>
      <tr>
         <th colspan="16">Truppen<span class="float_right hidden">Truppen ausserhalb werden ebenfalls angezeigt</span></th>
      </tr>
      <tr>` + headerRow + `</tr>
      <tr>` + troops + `</tr>
   </tbody>
</table>`;

            $('table.vis .edit_notes_row').parent().parent().parent().append(template);
        } catch (error) {
            console.error('Error fetching member data:', error);
        }
    }

async function getTroobsOfMember(url) {
    try {
        const data = await $.get(url);
        const $html_content = $(data);
        const $allyContent = $html_content.find('#ally_content .table-responsive');
        $allyContent.find('.info_box').remove();
        const username = $html_content.find('.input-nicer :selected').text();

        $('#ally_content').append('<h4>' + username + '</h4>');
        $('#ally_content').append($allyContent);
    } catch (error) {
        console.error('Error fetching member data:', error);
    }
}

async function getMemberUrls() {
    const mode = getParameterByName("mode");
    const playerID = game_data.player.id;
    const sitter = game_data.player.sitter;

    const troopsMemberPage = `/game.php?screen=ally&mode=${mode}&player_id=${playerID}&village=${game_data.village.id}${sitter != 0 ? `&t=${playerID}` : ''}`;

    try {
        const response = await $.get(troopsMemberPage);
        const options = $(response).find('.input-nicer option:not([disabled])');
        const memberUrls = [];

        options.each(function () {
            const playerId = parseInt(this.value);
            if (!isNaN(playerId)) {
                const url = `/game.php?screen=ally&mode=${mode}&player_id=${playerId}&village=${game_data.village.id}${sitter != 0 ? `&t=${playerID}` : ''}`;
                memberUrls.push(url);
            }
        });

        return memberUrls;
    } catch (error) {
        console.error('Error fetching member URLs:', error);
        return [];
    }
}

function getParameterByName(name) {
    const currentUrl = window.location.href;
    const url = new URL(currentUrl);
    return url.searchParams.get(name);
}
