import { Fr34kUtils } from '../fr34k.js';

export function run() {
    const utils = new Fr34kUtils({ script_name: 'farmgod_addon_enter' });

    let clicked = 0;
    let timeoutIds = [];

    $('h3:contains("Farm-Assi")').append('<img id="fga_auto_enter" style="margin-left:10px;cursor:pointer;" src="/graphic/unit/speed.png">');

    $('#fga_auto_enter').click(function () {
        if (clicked === 1) {
            timeoutIds.forEach(id => clearTimeout(id));
            timeoutIds = [];
            clicked = 0;
            return;
        }

        const elements = $('.farmRow .farmGod_icon');
        if (elements.length < 1) {
            UI.ErrorMessage('Run FarmGod first', 1000);
            return;
        }

        clicked = 1;
        elements.each(function (index) {
            const element = $(this);
            timeoutIds.push(setTimeout(() => element.click(), index * 250));
        });

        utils.finishScript(elements.length);
    });
}
