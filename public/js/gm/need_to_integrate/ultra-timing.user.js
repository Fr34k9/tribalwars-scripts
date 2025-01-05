// ==UserScript==
// @name         Ultra Timing
// @namespace    http://fr34k.ch
// @version      1.2
// @description  Ultra Timing. Find out by yourself or ask a Fr34k ♥
// @author       Fr34k
// @match        *die-staemme.de/game.php?*village=*&screen=info_village&id=*
// @match        *die-staemme.de/game.php?*village=*&screen=place*
// @match        *.staemme.ch/game.php?*village=*&screen=info_village&id=*
// @match        *.staemme.ch/game.php?*village=*&screen=place*
// @match        *.staemme.ch/game.php?*screen=place&village=*
// @match        *ds-ultimate.de/tools/attackPlanner/*show*
// @grant        none
// @icon         https://www.google.com/s2/favicons?sz=64&domain=staemme.ch
// ==/UserScript==

(function() {
    'use strict';
    console.log('Script aktiv: Ultra Timing');
    var dauer = 0;
    var goalTime = 0;
    var absendeTime = 0;
    var beforeAfter = 0; //0 = before, 1 = after
    var interval = 0;
    var intervalIdDsUltimate = 0;

    var auto_send_dsultimate = true;

    let param_arrival_time = getParameterByName('at');

    if(window.location.href.indexOf('&screen=place&') > 0 ) {
        if(window.location.href.indexOf('&target=') > 0 && param_arrival_time != null ) {
            let old_action = $('#command-data-form').attr("action");
            $('#command-data-form').attr("action", old_action + '&at=' + param_arrival_time);

            game_data.units.forEach(unit => {
                let param_value = getParameterByName(unit) || "";
                let unit_max = parseInt( $('#unit_input_' + unit).attr('data-all-count') );
                param_value = param_value.replace('alle', unit_max);
                param_value = eval(param_value);
                if( param_value <= 0 ) param_value = "";
                if( param_value > unit_max ) param_value = unit_max;
                $('#unit_input_' + unit).val(param_value);
            });

            let random_delay = Math.floor(Math.random() * (2000 - 500 + 1)) + 500;
            if( $('#target_attack').length < 1 || $('.error_box').length > 0 ) {
                console.log('ERROR happened. Probably no troops. Close tab.');
                setTimeout(function(){
                    window.close();
                }, random_delay);
            } else {
                setTimeout(function(){
                    $('#target_attack').click();
                }, random_delay);
            }
        }

        if(window.location.href.indexOf('&try=confirm') > 0){
            var textfield_value = "";
            if( localStorage.getItem("remindTime") != "" ) {
                textfield_value = localStorage.getItem("remindTime");
            }

            if( param_arrival_time ) {
                textfield_value = staemme_ms_to_date( parseInt( atob(param_arrival_time) ) );
            }

            var string = `<table id="ultra_timing" class="vis" width="360" style="margin-top: 10px;">
   <tbody>
      <tr>
         <th colspan="2">Ultra-Timing <img class="removeRemindTime" src="/graphic/delete.png" style="cursor:pointer;" height=10px></th>
      </tr>
      <tr>
      <td>Davor / Danach</td>
      <td><img class="ultra_timing_start before" src="/graphic/group_left.png" style="cursor:pointer; margin-right: 30px;"><img id="ultra_timing_after" class="ultra_timing_start after" src="/graphic/group_right.png" style="cursor:pointer;"></td>
      </tr>
      <tr>
         <td>Zielzeit:</td>
         <td><input type="text" id="ultra_timing_final_time" value="` + textfield_value + `"></td>
      </tr>
      <tr>
         <td>Zeit übrig</td>
         <td class="ultraTimingTimeLeft"></td>
      </tr>
   </tbody>
</table>`;
            $('#troop_confirm_train').before(string);

            if( param_arrival_time != null ) {
                let now = new Date().getTime();
                console.log('Set Auto-Sent to ' + now);
                localStorage.setItem("ut_last_auto_sent", now );
                let random_delay = Math.floor(Math.random() * (3000 - 1000 + 1)) + 1000;
                setTimeout(function() {
                    $('#ultra_timing_after').click();
                }, random_delay);
            }
        }
    }

    // check if last auto ut sent is shorter than 60 seconds if yes, close tab
    if(window.location.href.indexOf('screen=place&village=') > 0 ) {
        console.log('Screen: Place. Last auto-sent: ' + localStorage.getItem("ut_last_auto_sent") );
        let ut_last_auto_sent = localStorage.getItem("ut_last_auto_sent") || 0;
        let current_time = new Date().getTime();
        if(current_time - parseInt(ut_last_auto_sent) < (30*1000)){
            console.log('Close Tab.');
            let random_delay = Math.floor(Math.random() * (5000 - 1000 + 1)) + 2000;
            setTimeout(function() {
                window.close();
            }, random_delay);
        }
    }

    if(window.location.href.indexOf('ds-ultimate.de') > 0 && window.location.href.indexOf('attackPlanner') > 0){
        var checkbox_html = `<input type="checkbox" id="autoSend" class="mr-1">
            <label for="autoSend">Auto-Send</label>`;
        $('#datatablesHeader2').append(checkbox_html);
        setTimeout(dsUltimeTableReady, 1000);
        intervalIdDsUltimate = setInterval(autoSendAttack, 5000);
    }

    //
    // DS-ULTIMATE FUNCTIONS
    //

    // Function to periodically check if the table has multiple rows
    function dsUltimeTableReady() {
        const table = document.getElementById('data1');
        if (table && table.rows.length > 1) {
            $('#data1 tbody tr').each(function() {
                let arrival_time = $(this).find('td:nth-child(8)').text();
                arrival_time = convertDateFormat( arrival_time );
                arrival_time = staemme_date_to_ms( arrival_time );

                let old_href = $(this).find('a.text-success').attr("href");
                $(this).find('a.text-success').attr("href", old_href + "&at=" + btoa(arrival_time));
            });
        }
    }

    function autoSendAttack() {
        if( auto_send_dsultimate ) {
            $('#data1 tbody tr').each(function() {
                if( $(this).html().indexOf('fa-play-circle') > 0 ) {
                    let current_time = Math.floor(Date.now() / 1000);
                    let goal_time = parseInt( $(this).find('countdown').attr("date") );
                    if( goal_time - current_time < 30 ) {
                        $(this).find('a.text-success i').click();
                        setTimeout(dsUltimeTableReady, 1000);
                    }
                }
            });
        }
    }

    //
    // STAEMME TIMING
    //


    // Function called every second to keep the page running
    function prepareSend(){
        //console.log('Prepare called..');
        var timeNow = Timing.initial_server_time + Timing.getReturnTimeFromServer() + Timing.getElapsedTimeSinceLoad();
        $('.ultraTimingTimeLeft').text((Math.round((parseInt(absendeTime)-1000)-timeNow)/1000) + 's');
        if(timeNow > (parseInt(absendeTime)-1000)) {
            clearInterval(interval);
            finalSend();
        }
    }

    //Function which is called 1 second before sending
    function finalSend(){
        var x = Math.floor(Math.random() * (50 - 10 + 1)) + 10;
        while( true ) {
            var timeNow = Timing.initial_server_time + Timing.getElapsedTimeSinceLoad() + Timing.getReturnTimeFromServer();
			if(beforeAfter == 0){
                //Send before
                if(timeNow  > (parseInt(absendeTime)-10-x)){
                    $('#troop_confirm_go,#troop_confirm_submit').click();
                    break;
                }
			} else {
                //sendAfter
                if(timeNow  > (parseInt(absendeTime)+30+x)){
                    $('#troop_confirm_go,#troop_confirm_submit').click();
                    break;
                }
			}
        }
    }

    $('.removeRemindTime').click(function(){
        localStorage.setItem("remindTime", "");
        localStorage.setItem("ankunftZeitInMS", "");
        $('#ultra_timing').remove();
    });

    $('.command-row').each(function( index ) {
        $(this).append('<td><img class="ultratiming_remind_time" style="cursor:pointer;" src="/graphic/group_jump.png" title="Zeit merken"></td>'); //Fügt das "R" für "Remind" auf der Dorfübersichtseite hinzu
    });

    $('.ultratiming_remind_time').click(function(){
        var time = $(this).parent().parent().children('td').eq(1).text();
        var time_ms = staemme_date_to_ms(time);
        localStorage.setItem("remindTime", time);
        localStorage.setItem("ankunftZeitInMS", time_ms);
    });

    $('.ultra_timing_start').click(function() {
        //if(getParameterByName('at')
        let old_action = $('#command-data-form').attr("action");
        $('#command-data-form').attr("action", old_action + "&utsent=1");
        beforeAfter = $(this).hasClass('before') ? 0 : 1;
        dauer = parseInt( $('.relative_time').attr('data-duration') ) * 1000; // Calculate dauer in ms
        goalTime = staemme_date_to_ms( $('#ultra_timing_final_time').val() );
        absendeTime = goalTime-dauer;

        clearInterval(interval);
        if(localStorage.getItem("ankunftZeitInMS") != ''){
            console.log('Start timing by interval..');
            interval = setInterval(prepareSend, 500);
        }
    });

    //
    // HELPER FUNCTIONS
    //
    function getParameterByName(name) {
        const currentUrl = window.location.href;
        const url = new URL(currentUrl);
        return url.searchParams.get(name);
    }


    function staemme_date_to_ms( text ) {
        var current_date = new Date();
        var time = text;
        time = time.replace("hüt um ", current_date.getFullYear()+'-'+(parseInt(current_date.getMonth())+1)+'-'+current_date.getDate()+' '); //Replace heute um durch Datum
        time = time.replace("heute um ", current_date.getFullYear()+'-'+(parseInt(current_date.getMonth())+1)+'-'+current_date.getDate()+' '); //Replace heute um durch Datum
        time = time.replace("morn um ", current_date.getFullYear()+'-'+(parseInt(current_date.getMonth())+1)+'-'+(parseInt(current_date.getDate())+1)+' '); //Replace morgen um durch Datum von morgen
        time = time.replace("morgen um ", current_date.getFullYear()+'-'+(parseInt(current_date.getMonth())+1)+'-'+(parseInt(current_date.getDate())+1)+' '); //Replace morgen um durch Datum von morgen

      	// Check if the string contains milliseconds (ends with :xxx)
        if (/\:\d{3}$/.test(time)) {
          // Replace the last colon with an empty string
  				time = time.replace(/:([^:]+)$/, '.$1');
        }

        let time_ms = Date.parse(time+"Z");
        //time_ms = parseInt(time_ms) - 7200000; // Sommerzeit
        time_ms = parseInt(time_ms) - 3600000; // Winterzeit
        return time_ms;
    }

    function staemme_ms_to_date( ms ) {
        var current_date = new Date();
        var input_date = new Date(ms);

        var start = "";
        if(
            input_date.getDate() == current_date.getDate() &&
            input_date.getMonth() == current_date.getMonth() &&
            input_date.getFullYear() == current_date.getFullYear()
        ) {
            start = "hüt um";
        }

        if(
            input_date.getDate() == current_date.getDate()+1 &&
            input_date.getMonth() == current_date.getMonth() &&
            input_date.getFullYear() == current_date.getFullYear()
        ) {
            start = "morn um";
        }

        if( start == "" ) {
            start = input_date.getFullYear()+'-'+(parseInt(input_date.getMonth())+1)+'-'+input_date.getDate();
        }
        const hours = String(input_date.getHours()).padStart(2, '0');
        const minutes = String(input_date.getMinutes()).padStart(2, '0');
        const seconds = String(input_date.getSeconds()).padStart(2, '0');
        const miliseconds = String(input_date.getMilliseconds()).padStart(3, '0');

        return start + ' ' + hours + ':' + minutes + ':' + seconds + ':' + miliseconds;
    }


    function convertDateFormat(inputDate) {
        // Check if the input date has the expected format (day.month.year)
        const dateRegex = /^\d{2}\.\d{2}\.\d{4}/;
        if (!dateRegex.test(inputDate)) {
            // Return the input unchanged if the format is not as expected
            return inputDate;
        }

        const [datePart, timePart] = inputDate.split(' ');
        const [day, month, year] = datePart.split('.');
        const formattedDate = `${year}-${month}-${day}`;
        const outputDate = `${formattedDate} ${timePart}`;

        return outputDate;
    }

})();