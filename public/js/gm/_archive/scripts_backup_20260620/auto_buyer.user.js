// ==UserScript==
// @name         TribalWars Premium Depot Auto Buyer
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Automates buying resources in Premium-Depot
// @author       Fr34k
// @match        *://*.die-staemme.ch/game.php?*screen=market*mode=exchange*
// @match        *://*.die-staemme.de/game.php?*screen=market*mode=exchange*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    // UI HTML matching the game's style
    var html = `
    <div id="auto-buyer-box" class="vis" style="margin-bottom: 15px; padding: 10px; border: 1px solid #7D510F; background-color: #F4E4BC;">
        <h4 style="margin-top: 0; margin-bottom: 5px;">Auto Buyer</h4>
        <table class="vis" style="width: 100%;">
            <tr>
                <th><img src="https://dsch.innogamescdn.com/asset/0d09b5c3/graphic/resources/wood_21x18.webp" title="Holz"> Holz</th>
                <th><img src="https://dsch.innogamescdn.com/asset/0d09b5c3/graphic/resources/stone_21x18.webp" title="Lehm"> Lehm</th>
                <th><img src="https://dsch.innogamescdn.com/asset/0d09b5c3/graphic/resources/iron_21x18.webp" title="Eisen"> Eisen</th>
                <th>Auto Buy</th>
            </tr>
            <tr>
                <td style="text-align: center;">Min: <input type="number" id="ab_wood_low" style="width: 60px;" value="0" min="0"><br>Max: <input type="number" id="ab_wood_high" style="width: 60px;" value="0" min="0"><br>Prio: <input type="number" id="ab_wood_prio" style="width: 40px;" value="1" min="1" max="3"></td>
                <td style="text-align: center;">Min: <input type="number" id="ab_stone_low" style="width: 60px;" value="0" min="0"><br>Max: <input type="number" id="ab_stone_high" style="width: 60px;" value="0" min="0"><br>Prio: <input type="number" id="ab_stone_prio" style="width: 40px;" value="2" min="1" max="3"></td>
                <td style="text-align: center;">Min: <input type="number" id="ab_iron_low" style="width: 60px;" value="0" min="0"><br>Max: <input type="number" id="ab_iron_high" style="width: 60px;" value="0" min="0"><br>Prio: <input type="number" id="ab_iron_prio" style="width: 40px;" value="3" min="1" max="3"></td>
                <td style="text-align: center;"><input type="checkbox" id="ab_active"> Aktiv</td>
            </tr>
        </table>
    </div>
    `;

    // Insert just above Premium-Depot section title
    $('h3:contains("Premium-Depot")').before(html);

    // Initialize from localStorage
    if (localStorage.getItem('ab_wood_low')) $('#ab_wood_low').val(localStorage.getItem('ab_wood_low'));
    if (localStorage.getItem('ab_wood_high')) $('#ab_wood_high').val(localStorage.getItem('ab_wood_high'));
    if (localStorage.getItem('ab_stone_low')) $('#ab_stone_low').val(localStorage.getItem('ab_stone_low'));
    if (localStorage.getItem('ab_stone_high')) $('#ab_stone_high').val(localStorage.getItem('ab_stone_high'));
    if (localStorage.getItem('ab_iron_low')) $('#ab_iron_low').val(localStorage.getItem('ab_iron_low'));
    if (localStorage.getItem('ab_iron_high')) $('#ab_iron_high').val(localStorage.getItem('ab_iron_high'));
    if (localStorage.getItem('ab_wood_prio')) $('#ab_wood_prio').val(localStorage.getItem('ab_wood_prio'));
    if (localStorage.getItem('ab_stone_prio')) $('#ab_stone_prio').val(localStorage.getItem('ab_stone_prio'));
    if (localStorage.getItem('ab_iron_prio')) $('#ab_iron_prio').val(localStorage.getItem('ab_iron_prio'));
    if (localStorage.getItem('ab_active') === 'true') {
        $('#ab_active').prop('checked', true);
    }

    // Save to localStorage on change
    $('#ab_wood_low, #ab_wood_high, #ab_stone_low, #ab_stone_high, #ab_iron_low, #ab_iron_high, #ab_wood_prio, #ab_stone_prio, #ab_iron_prio').on('input change', function () {
        localStorage.setItem($(this).attr('id'), $(this).val());
    });
    $('#ab_active').on('change', function () {
        localStorage.setItem('ab_active', $(this).is(':checked'));
    });

    setInterval(function () {
        if (!$('#ab_active').is(':checked')) return;

        // Are we in confirmation modal?
        var confirmBtn = $('.btn-confirm-yes, .evt-confirm-btn');
        if (confirmBtn.length > 0 && confirmBtn.is(':visible')) {
            var modalText = $('.confirmation-box').text() || '';
            if (modalText.indexOf('nicht über eine ausreichende Menge dieses Rohstoffs') !== -1) {
                var cancelBtn = $('.btn-confirm-no, .evt-cancel-btn');
                if (cancelBtn.length > 0) {
                    cancelBtn.click();
                    // Clear inputs so we don't end up in a loop trying to buy the same amount
                    $('input[name="buy_wood"]').val('').trigger('change');
                    $('input[name="buy_stone"]').val('').trigger('change');
                    $('input[name="buy_iron"]').val('').trigger('change');
                }
                return;
            }

            // Verify it is not disabled
            if (!confirmBtn.prop('disabled')) {
                confirmBtn.click();
                // After clicking confirm, clear inputs to prepare for next cycle
                $('input[name="buy_wood"]').val('').trigger('change');
                $('input[name="buy_stone"]').val('').trigger('change');
                $('input[name="buy_iron"]').val('').trigger('change');
            }
            return; // Skip doing other things when modal is open
        }

        // If any buy input has a value > 0, we already inserted values, wait for button to be clickable
        var isFilled = (parseInt($('input[name="buy_wood"]').val()) > 0) ||
            (parseInt($('input[name="buy_stone"]').val()) > 0) ||
            (parseInt($('input[name="buy_iron"]').val()) > 0);

        if (isFilled) {
            // Then try to click the calculate button
            var calcBtn = $('.btn-premium-exchange-buy');
            if (calcBtn.length > 0 && calcBtn.is(':visible') && !calcBtn.prop('disabled')) {
                calcBtn.click();
            }
            return;
        }

        // Check stocks
        var lowWood = parseInt($('#ab_wood_low').val()) || 0;
        var highWood = parseInt($('#ab_wood_high').val()) || 0;
        var lowStone = parseInt($('#ab_stone_low').val()) || 0;
        var highStone = parseInt($('#ab_stone_high').val()) || 0;
        var lowIron = parseInt($('#ab_iron_low').val()) || 0;
        var highIron = parseInt($('#ab_iron_high').val()) || 0;

        var stockWood = parseInt($('#premium_exchange_stock_wood').text()) || 0;
        var stockStone = parseInt($('#premium_exchange_stock_stone').text()) || 0;
        var stockIron = parseInt($('#premium_exchange_stock_iron').text()) || 0;

        var buyAmountWood = 0;
        if (highWood > 0 && stockWood >= highWood) buyAmountWood = stockWood;
        else if (lowWood > 0 && stockWood >= lowWood) buyAmountWood = 1;

        var buyAmountStone = 0;
        if (highStone > 0 && stockStone >= highStone) buyAmountStone = stockStone;
        else if (lowStone > 0 && stockStone >= lowStone) buyAmountStone = 1;

        var buyAmountIron = 0;
        if (highIron > 0 && stockIron >= highIron) buyAmountIron = stockIron;
        else if (lowIron > 0 && stockIron >= lowIron) buyAmountIron = 1;

        var options = [];
        if (buyAmountWood > 0) options.push({ res: 'wood', amount: buyAmountWood, prio: parseInt($('#ab_wood_prio').val()) || 99 });
        if (buyAmountStone > 0) options.push({ res: 'stone', amount: buyAmountStone, prio: parseInt($('#ab_stone_prio').val()) || 99 });
        if (buyAmountIron > 0) options.push({ res: 'iron', amount: buyAmountIron, prio: parseInt($('#ab_iron_prio').val()) || 99 });

        if (options.length > 0) {
            // Sort by priority (lowest number first)
            options.sort(function (a, b) { return a.prio - b.prio; });
            var bestOption = options[0];

            $('input[name="buy_' + bestOption.res + '"]').val(bestOption.amount).trigger('input').trigger('change').trigger('keyup');

            setTimeout(function () {
                var calcBtn = $('.btn-premium-exchange-buy');
                if (!calcBtn.prop('disabled')) {
                    calcBtn.click();
                }
            }, 300);
        }
    }, 2000);

})();
