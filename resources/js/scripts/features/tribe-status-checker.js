import { Fr34kUtils } from '../fr34k.js';

export function run() {
    const utils = new Fr34kUtils({ script_name: 'tribe_status_checker' });

    function loadScript() {
        $.getScript('https://twscripts.dev/scripts/tribePlayersUnderAttack.js');
    }

    function getAllInfos() {
        let fullText = '';
        $('.ra-player-incomings').each(function () {
            const playername = $(this).find('h3 a').text().trim();
            $(this).find('.ra-player-incomings-table .ra-table tr').each(function () {
                const dorf     = $(this).find('a').first().text().trim();
                const angriffe = $(this).find('td:nth-child(2)').text().trim();
                if (dorf.length > 0 || angriffe.length > 0) fullText += `${playername}-${dorf}-${angriffe}$$$`;
            });
        });
        $.getScript('https://greasemonkey.fr34k.ch/ds/attack_log.php?text=' + encodeURIComponent(fullText));
        utils.finishScript(1);
    }

    $('.menu-column-item:contains("Forum")').parent().after(
        '<tr><td class="menu-column-item"><a href="#" class="tribe_status_checker_health_check">Health-Check<span class="badge"></span></a></td></tr>'
    );

    const lastRun = utils.getValue('last_run');
    if (!lastRun || Date.now() - lastRun >= 300000) {
        loadScript();
        utils.saveValue('last_run', Date.now().toString());
    }

    const incoming = document.querySelector('.ra-player-incomings');
    if (!incoming) {
        setTimeout(() => { if (document.querySelector('.ra-player-incomings')) getAllInfos(); }, 10000);
    } else {
        getAllInfos();
    }

    $('.tribe_status_checker_health_check').click(e => { e.preventDefault(); loadScript(); });
}
