// ==UserScript==
// @name         Baba Wall Clear
// @namespace    http://Fr34k.ch
// @version      1.0
// @description  Clear all Baba Walls
// @author       Fr34k
// @match        *.staemme.ch/game.php?village=*&screen=am_farm*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=staemme.ch
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    console.log("[Fr34k|Clear Baba Walls] Script aktiv");

    var FBWC = {
        prefix: "FBWC_",
        troops: [
            {
                axe: 20,
                ram: 5,
                spy: 1
            },
            {
                axe: 30,
                marcher: 10,
                ram: 5,
                spy: 1
            },
            {
                axe: 30,
                marcher: 10,
                ram: 8,
                spy: 1
            },
            {
                axe: 50,
                marcher: 30,
                ram: 12,
                spy: 1
            },
            {
                axe: 150,
                ram: 20,
                spy: 1
            },
        ],
        wait: 500,
        attack_green: true,
        max_new_tabs: 5,
        max_wall: 5,
        max_distance: 15,
    };

    $('h3:contains("Farm-Assi")').append('<img id="bmc_show_menu" style="margin-left: 10px; cursor: pointer;" src="/graphic/buildings/wall.png">');

    createMenu();

    function getUrls() {
        let urls = [];
        const attack_green = get_value('attack_green') == '1' ? true : false;
        const max_wall = get_value('max_wall') ? get_value('max_wall') : 5;
        const max_distance = get_value('max_distance') ? get_value('max_distance') : 15;

        $('#plunder_list')
            .find('tr')
            .filter((i, el) => $(el).attr('id'))
            .each((i, el) => {
            let wallLevel = parseInt($(el).find('td:nth-of-type(7)').text());
            let distance = parseInt($(el).find('td:nth-of-type(8)').text());
            let iconUrl = $(el).find('td:nth-of-type(2) img').attr('src');

            if (wallLevel < 1 || wallLevel > max_wall || distance > max_distance || (!attack_green && iconUrl.indexOf('green.png') >= 0)) {
                return;
            }

            let id = $(el).attr('id').match(/(\d+)/)[1];

            let current_village = game_data.village.id;
            let link = `/game.php?village=${current_village}&screen=place&target=${id}`;
            let troops = wallLevel <= FBWC.troops.length ? FBWC.troops[wallLevel - 1] : FBWC.troops[FBWC.troops.length - 1]
            let params = Object.keys(troops).map(u => `${u}=${troops[u]}`).join('&')
            urls.push(`${link}&${params}`);
        });
        return urls;
    }

    function openTabs(urls) {
        const max_tabs = get_value('max_tabs') ? get_value('max_tabs') : 10;
        urls = urls.slice(0, max_tabs);
        urls.forEach((url, i) => setTimeout(() => window.open(url, '_blank'), i * FBWC.wait));
    }

    function createMenu() {
        var checked = get_value('attack_green') == '1' ? ' checked="checked" ' : '';
        var max_wall = get_value('max_wall') ? get_value('max_wall') : 5;
        var max_distance = get_value('max_distance') ? get_value('max_distance') : 15;
        var max_tabs = get_value('max_tabs') ? get_value('max_tabs') : 10;
        var template = `<div id='wall_clearer_settings' class="vis" style="display: none;">
	<h4>Wall Clearer</h4>
	<table style="width:100%">
	 <tbody>
		<tr>
			<th style="text-align:center">Attack Green</th>
			<th style="text-align:center">Max Wall</th>
			<th style="text-align:center">Max Distance</th>
			<th style="text-align:center">Max Tabs</th>
			<th style="text-align:center"></th>
			<th style="text-align:center"></th>
		</tr>
		<tr>
		   <td style="text-align:center"><input type="checkbox" id="` + FBWC.prefix + 'attack_green' + `" ` + checked + `></td>
		   <td style="text-align:center"><input id="` + FBWC.prefix + 'max_wall' + `" type="text" value="` + max_wall + `"></td>
		   <td style="text-align:center"><input id="` + FBWC.prefix + 'max_distance' + `" type="text" value="` + max_distance + `"></td>
		   <td style="text-align:center"><input id="` + FBWC.prefix + 'max_tabs' + `" type="text" value="` + max_tabs + `"></td>
		   <td style="text-align:center"><button id='` + FBWC.prefix + 'save' + `'>Save</button></td>
		   <td style="text-align:center"><button id='` + FBWC.prefix + 'send' + `'>Send</button></td>
		</tr>
	 </tbody>
	</table>
</div>`;
        $('#am_widget_Farm').before(template);
    }

    $('#bmc_show_menu').click(function(){
        $('#wall_clearer_settings').toggle();
    });

    $('#' + FBWC.prefix + 'send').click(function(){
        let urls = getUrls();
        openTabs(urls);
    });

    $('#' + FBWC.prefix + 'save').click(function(){
        save_value('attack_green', $('#' + FBWC.prefix + 'attack_green').is(":checked") ? 1 : 0);
        save_value('max_wall', $('#' + FBWC.prefix + 'max_wall').val());
        save_value('max_distance', $('#' + FBWC.prefix + 'max_distance').val());
        save_value('max_tabs', $('#' + FBWC.prefix + 'max_tabs').val());
    });


    function save_value(variable, value) {
        localStorage.setItem(FBWC.prefix + '_' + variable, value);
    }

    function get_value(variable) {
        var value = localStorage.getItem(FBWC.prefix + '_' + variable);
        if( value == null ) value = false;
        return value;
    }

    // Your code here...
})();