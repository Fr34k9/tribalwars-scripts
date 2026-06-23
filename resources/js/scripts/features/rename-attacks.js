import { Fr34kUtils } from '../fr34k.js';

export function run() {
    const utils = new Fr34kUtils({ script_name: 'rename_attacks' });

    const refreshDelay = utils.random.number(300000, 900000);
    const refreshTime = new Date(Date.now() + refreshDelay).toLocaleTimeString();
    utils.uiMessage('Auto-Refresh at ' + refreshTime, refreshDelay, true);

    utils.sleep(refreshDelay).then(() => {
        const countElements = $('#incomings_table tr .quickedit-label');
        let countActions = 0;
        countElements.each(function () {
            if ($(this).text().replace(/\s/g, '') === 'Angriff') countActions++;
        });
        utils.finishScript(countActions);
        utils.sleep(1000).then(() => {
            $('#select_all').click();
            $('#incomings_table tr:last() input[data-title]')?.click();
        });
    });
}
