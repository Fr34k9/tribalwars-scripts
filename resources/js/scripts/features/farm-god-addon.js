import { Fr34kUtils } from '../fr34k.js';

export function run() {
    const utils = new Fr34kUtils({
        script_name: 'farm_god_addon',
        farmgod_script: 'https://higamy.github.io/TW/Scripts/Approved/FarmGodCopy.js',
    });

    function createMenu() {
        const checked = utils.getValue('autorefresh') === '1' ? 'checked' : '';
        const refreshTime = utils.getValue('refresh_time') || 1000;

        const template = `
            <div class="vis">
                <h4>Auto Farm-God</h4>
                <table id="farm_god_addon_settings" style="width:100%">
                    <tbody>
                        <tr>
                            <th style="text-align:center">Autofarm</th>
                            <th style="text-align:center">Reload Page (seconds)</th>
                            <th style="text-align:center">Next Reload</th>
                        </tr>
                        <tr>
                            <td style="text-align:center"><input type="checkbox" id="farm_god_addon_autofarm" ${checked}></td>
                            <td style="text-align:center"><input id="farm_god_addon_refresh_time" type="text" value="${refreshTime}"></td>
                            <td style="text-align:center" id="farm_god_addon_next_refresh">-</td>
                        </tr>
                    </tbody>
                </table>
            </div>`;

        $('#am_widget_Farm').before(template);
    }

    const farmSequence = {
        step1: () => {
            utils.logMessage('Starting step 1', 'debug');
            if (utils.getValue('autorefresh') === '1') {
                $.getScript(utils.config.farmgod_script);
                utils.sleep(utils.random.delay(1000, 2000)).then(farmSequence.step2);
            }
        },
        step2: () => {
            utils.logMessage('Starting step 2', 'debug');
            if (utils.getValue('autorefresh') === '1') {
                $('.optionsContent .optionButton')[0].click();
                utils.sleep(utils.random.delay(6000, 12000)).then(farmSequence.step3);
            }
        },
        step3: () => {
            utils.logMessage('Starting step 3', 'debug');
            if (utils.getValue('autorefresh') === '1') {
                let totalDelay = 0;
                let totalActions = 0;
                const elements = $('.farmRow .farmGod_icon');

                elements.each((index, element) => {
                    totalDelay += utils.random.delay(250, 400);
                    utils.sleep(totalDelay).then(() => {
                        if (utils.getValue('autorefresh') === '1' && !utils.botDetected()) {
                            $(element).click();
                            totalActions++;
                            if (index === elements.length - 1) utils.finishScript(totalActions);
                        }
                    });
                });
            }
        },
    };

    function setRefreshTimeAndReloadPage() {
        const refreshTime = (utils.getValue('refresh_time') || 1000) * utils.random.number(0.7, 1.3) * 1000;
        const nextRefresh = new Date(Date.now() + refreshTime);
        $('#farm_god_addon_next_refresh').text(nextRefresh.toLocaleString());
        utils.logMessage('Refreshing page on ' + nextRefresh.toLocaleString(), 'debug');
        utils.sleep(refreshTime).then(() => { if (!utils.botDetected()) location.reload(); });
    }

    utils.sleep(2000).then(() => utils.botDetected());
    createMenu();

    $('#farm_god_addon_autofarm').on('click', function () {
        const value = $(this).is(':checked') ? '1' : '0';
        utils.saveValue('autorefresh', value);
        if (value === '1') location.reload();
    });
    $('#farm_god_addon_refresh_time').on('change', function () {
        utils.saveValue('refresh_time', $(this).val());
    });

    utils.sleep(utils.random.delay(10000, 15000)).then(farmSequence.step1);
    setRefreshTimeAndReloadPage();
}
