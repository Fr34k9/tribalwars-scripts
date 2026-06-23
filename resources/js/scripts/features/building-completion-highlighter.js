import { Fr34kUtils } from '../fr34k.js';

export function run() {
    const utils = new Fr34kUtils({
        script_name: 'building_completion_highlighter',
        highlight_minutes: 3,
        highlight_color: 'green',
    });

    const TIME_PATTERNS = {
        TODAY:    ['hüt um ', 'heute um ', 'today at '],
        TOMORROW: ['morn um ', 'morgen um ', 'tomorrow at '],
    };

    function convertGameDateToTimestamp(dateText) {
        const d = new Date();
        const [y, m, day] = [d.getFullYear(), d.getMonth() + 1, d.getDate()];
        let text = dateText;
        TIME_PATTERNS.TODAY.forEach(p => { text = text.replace(p, `${y}-${m}-${day} `); });
        TIME_PATTERNS.TOMORROW.forEach(p => { text = text.replace(p, `${y}-${m}-${day + 1} `); });
        return Date.parse(text + 'Z') - 3600000;
    }

    function highlightUpcomingCompletions() {
        const selector = '#production_table tbody tr td:nth-child(8) #order_0 .queue_icon';
        const timeRegex = /(hüt|morn|heute|morgen|today|tomorrow) (um |at )?(\d{2}:\d{2})/g;

        $(selector).each(function () {
            const match = $(this).html().match(timeRegex);
            if (match?.[0]) {
                const ts = convertGameDateToTimestamp(match[0] + ':59');
                if (ts - Date.now() < utils.config.highlight_minutes * 60 * 1000) {
                    $(this).parent().parent().parent().css('background-color', utils.config.highlight_color);
                }
            }
        });
    }

    highlightUpcomingCompletions();
    utils.finishScript(0);
}
