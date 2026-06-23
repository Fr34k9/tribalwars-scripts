import { Fr34kUtils } from '../fr34k.js';

export function run() {
    const utils = new Fr34kUtils({ script_name: 'baba_wall_clearer' });

    const TROOPS = [
        { axe: 20, ram: 5, spy: 1 },
        { axe: 30, marcher: 10, ram: 5, spy: 1 },
        { axe: 30, marcher: 10, ram: 8, spy: 1 },
        { axe: 50, marcher: 30, ram: 12, spy: 1 },
        { axe: 150, ram: 20, spy: 1 },
    ];
    const WAIT_MS = 500;

    $('h3:contains("Farm-Assi")').append('<img id="bmc_show_menu" style="margin-left:10px;cursor:pointer;" src="/graphic/buildings/wall.png">');

    function createMenu() {
        const checked = utils.getValue('attack_green') == '1' ? 'checked="checked"' : '';
        const max_wall     = utils.getValue('max_wall')     || 5;
        const max_distance = utils.getValue('max_distance') || 15;
        const max_tabs     = utils.getValue('max_tabs')     || 10;

        $('#am_widget_Farm').before(`
        <div id="wall_clearer_settings" class="vis" style="display:none;">
            <h4>Wall Clearer</h4>
            <table style="width:100%"><tbody>
                <tr>
                    <th style="text-align:center">Attack Green</th>
                    <th style="text-align:center">Max Wall</th>
                    <th style="text-align:center">Max Distance</th>
                    <th style="text-align:center">Max Tabs</th>
                    <th></th><th></th>
                </tr>
                <tr>
                    <td style="text-align:center"><input type="checkbox" id="fbwc_attack_green" ${checked}></td>
                    <td style="text-align:center"><input id="fbwc_max_wall" type="text" value="${max_wall}"></td>
                    <td style="text-align:center"><input id="fbwc_max_distance" type="text" value="${max_distance}"></td>
                    <td style="text-align:center"><input id="fbwc_max_tabs" type="text" value="${max_tabs}"></td>
                    <td style="text-align:center"><button id="fbwc_save">Save</button></td>
                    <td style="text-align:center"><button id="fbwc_send">Send</button></td>
                </tr>
            </tbody></table>
        </div>`);
    }

    function getUrls() {
        const attack_green = utils.getValue('attack_green') == '1';
        const max_wall     = utils.getValue('max_wall')     || 5;
        const max_distance = utils.getValue('max_distance') || 15;
        const urls = [];

        $('#plunder_list').find('tr').filter((i, el) => $(el).attr('id')).each((i, el) => {
            const wallLevel = parseInt($(el).find('td:nth-of-type(7)').text());
            const distance  = parseInt($(el).find('td:nth-of-type(8)').text());
            const iconUrl   = $(el).find('td:nth-of-type(2) img').attr('src');
            if (wallLevel < 1 || wallLevel > max_wall || distance > max_distance || (!attack_green && iconUrl.includes('green.png'))) return;
            const id     = $(el).attr('id').match(/(\d+)/)[1];
            const troops = wallLevel <= TROOPS.length ? TROOPS[wallLevel - 1] : TROOPS[TROOPS.length - 1];
            const params = Object.keys(troops).map(u => `${u}=${troops[u]}`).join('&');
            urls.push(`/game.php?village=${game_data.village.id}&screen=place&target=${id}&${params}`);
        });
        return urls;
    }

    createMenu();

    $('#bmc_show_menu').click(() => $('#wall_clearer_settings').toggle());
    $('#fbwc_send').click(() => {
        const urls = getUrls().slice(0, utils.getValue('max_tabs') || 10);
        urls.forEach((url, i) => setTimeout(() => window.open(url, '_blank'), i * WAIT_MS));
        utils.finishScript(urls.length);
    });
    $('#fbwc_save').click(() => {
        utils.saveValue('attack_green', $('#fbwc_attack_green').is(':checked') ? 1 : 0);
        utils.saveValue('max_wall',     $('#fbwc_max_wall').val());
        utils.saveValue('max_distance', $('#fbwc_max_distance').val());
        utils.saveValue('max_tabs',     $('#fbwc_max_tabs').val());
        utils.uiMessage('Settings saved', 3);
    });
}
