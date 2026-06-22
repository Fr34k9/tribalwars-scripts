// ==UserScript==
// @name         Tribe leader - show troops of members in village
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        https://*.staemme.ch/game.php?village=*&screen=info_village&id=*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=staemme.ch
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    const playerID = game_data.player.id;
    const sitter = game_data.player.sitter;
    const allyId = game_data.player.ally;

    const troopsMemberPage = `/game.php?screen=ally&mode=members_troops&player_id=${VillageInfo.player_id}&village=${game_data.village.id}${sitter != 0 ? `&t=${playerID}` : ''}`;
    if( $('#content_value table table').first().find('tr td:contains("Stamm")').parent().find('a[href*="info_ally&id=' + allyId + '"]').length > 0 ) {
        getTroobsOfMember(troopsMemberPage);
    }

    async function getTroobsOfMember(url) {
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

    function getParameterByName(name) {
        const currentUrl = window.location.href;
        const url = new URL(currentUrl);
        return url.searchParams.get(name);
    }
})();