import { Fr34kUtils } from '../fr34k.js';

export function run() {
    const utils = new Fr34kUtils({ script_name: 'looter_of_the_day' });

    let attack_counter = 0;
    let intervalId = null;

    $('h3:contains("Farm-Assi")').append('<img id="lotd_send" height="18px" style="margin-left:10px;cursor:pointer;" src="/graphic/awards/award9.png">');

    $('#lotd_send').click(function () {
        if (intervalId) {
            clearInterval(intervalId);
            intervalId = null;
            utils.finishScript(attack_counter);
            attack_counter = 0;
        } else {
            attack_counter = 0;
            startRandomInterval();
        }
    });

    function startRandomInterval() {
        function sendAttack() {
            if (utils.botDetected()) {
                clearInterval(intervalId);
                intervalId = null;
                utils.finishScript(attack_counter);
                return;
            }
            if ($('.autoHideBox').length > 0) {
                clearInterval(intervalId);
                intervalId = null;
                utils.finishScript(attack_counter);
                return;
            }
            const el = $('#plunder_list').find('a[class^="farm_village_"].farm_icon_b').first();
            el.removeClass('farm_icon_disabled').click();
            attack_counter++;
            intervalId = setTimeout(startRandomInterval, 800 + Math.random() * 400);
        }
        sendAttack();
    }
}
