// ==UserScript==
// @name         Auto Farmer
// @namespace    http://Fr34k.ch
// @version      2.0
// @description  Auto Farmer. Find out by yourself or ask a Fr34k ♥
// @author       Fr34k
// @match        *.die-staemme.de/game.php?village=*&screen=am_farm
// @match        *.staemme.ch/game.php?village=*&screen=am_farm
// @downloadURL  https://fr34k.ch/public/greasemonkey/autoFarmer.user.js
// @updateURL    https://fr34k.ch/public/greasemonkey/autoFarmer.user.js
// @grant        none
// @connect      fr34k.ch
// ==/UserScript==

(function() {
    var arr = Array();
    var autoHideBoxText = false;
    // Sound which is played if bot is detected
    var snd = new Audio("data:audio/wav;base64,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qJrx4KOQjahZxWbcZgztj2c49nKmkId44S71j0c8eV9yDK6uPRzx5X18eDvjvQ6yKo9ZSS6l//8elePK/Lf//IInrOF/FvDoADYAGBMGb7FtErm5MXMlmPAJQVgWta7Zx2go+8xJ0UiCb8LHHdftWyLJE0QIAIsI+UbXu67dZMjmgDGCGl1H+vpF4NSDckSIkk7Vd+sxEhBQMRU8j/12UIRhzSaUdQ+rQU5kGeFxm+hb1oh6pWWmv3uvmReDl0UnvtapVaIzo1jZbf/pD6ElLqSX+rUmOQNpJFa/r+sa4e/pBlAABoAAAAA3CUgShLdGIxsY7AUABPRrgCABdDuQ5GC7DqPQCgbbJUAoRSUj+NIEig0YfyWUho1VBBBA//uQZB4ABZx5zfMakeAAAAmwAAAAF5F3P0w9GtAAACfAAAAAwLhMDmAYWMgVEG1U0FIGCBgXBXAtfMH10000EEEEEECUBYln03TTTdNBDZopopYvrTTdNa325mImNg3TTPV9q3pmY0xoO6bv3r00y+IDGid/9aaaZTGMuj9mpu9Mpio1dXrr5HERTZSmqU36A3CumzN/9Robv/Xx4v9ijkSRSNLQhAWumap82WRSBUqXStV/YcS+XVLnSS+WLDroqArFkMEsAS+eWmrUzrO0oEmE40RlMZ5+ODIkAyKAGUwZ3mVKmcamcJnMW26MRPgUw6j+LkhyHGVGYjSUUKNpuJUQoOIAyDvEyG8S5yfK6dhZc0Tx1KI/gviKL6qvvFs1+bWtaz58uUNnryq6kt5RzOCkPWlVqVX2a/EEBUdU1KrXLf40GoiiFXK///qpoiDXrOgqDR38JB0bw7SoL+ZB9o1RCkQjQ2CBYZKd/+VJxZRRZlqSkKiws0WFxUyCwsKiMy7hUVFhIaCrNQsKkTIsLivwKKigsj8XYlwt/WKi2N4d//uQRCSAAjURNIHpMZBGYiaQPSYyAAABLAAAAAAAACWAAAAApUF/Mg+0aohSIRobBAsMlO//Kk4soosy1JSFRYWaLC4qZBYWFRGZdwqKiwkNBVmoWFSJkWFxX4FFRQWR+LsS4W/rFRb/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////VEFHAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAU291bmRib3kuZGUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMjAwNGh0dHA6Ly93d3cuc291bmRib3kuZGUAAAAAAAAAACU=");
    var idPrefix = 'AUTOFARMER_'; //Prefix for all input boxes / storage saves
    var vorlageElem = $($($('.vis'))[0]);

    vorlageElem.after( showMenu() );

    var active = 1;
    var checkInterval = 300; //Interval in seconds in which page should be refreshed
    var intervalBetweenAttackBaba1 = 300;//Interval between attacks in ms!
    var intervalBetweenAttackBaba2 = 1500; //Interval between attacks in ms!
    var attackIntervalBaba = 3000; //Interval in which the baba should be attacked. (EG 600 will start every 10' a new attack)
    var favoritIcon = 'b';
    var maxDistance = 25; // Fields which should be considered
    var maxWall = 1; // Max wall if spyed. If no spy set to 0
    var totalCounter = 0;
    var stop = 0; // If nicht genügend Einheiten for example, stop all functions which will be called in future

    // Get data from storage if available. If not take standard from above
    if(localStorage.getItem(idPrefix + 'active')){
        active = parseInt(localStorage.getItem(idPrefix + 'active'));
    }
    if(localStorage.getItem(idPrefix + 'checkInterval')){
        checkInterval = parseInt(localStorage.getItem(idPrefix + 'checkInterval'));
    }
    if(localStorage.getItem(idPrefix + 'intervalAttack1')){
        intervalBetweenAttackBaba1 = parseInt(localStorage.getItem(idPrefix + 'intervalAttack1'));
    }
    if(localStorage.getItem(idPrefix + 'intervalAttack2')){
        intervalBetweenAttackBaba2 = parseInt(localStorage.getItem(idPrefix + 'intervalAttack2'));
    }
    if(localStorage.getItem(idPrefix + 'intervalAttackBaba')){
        attackIntervalBaba = parseInt(localStorage.getItem(idPrefix + 'intervalAttackBaba'));
    }
    if(localStorage.getItem(idPrefix + 'favoritIcon')){
        favoritIcon = localStorage.getItem(idPrefix + 'favoritIcon');
    }
    if(localStorage.getItem(idPrefix + 'maxDistance')){
        maxDistance = parseInt(localStorage.getItem(idPrefix + 'maxDistance'));
    }
    if(localStorage.getItem(idPrefix + 'maxWall')){
        maxWall = parseInt(localStorage.getItem(idPrefix + 'maxWall'));
    }
    if(localStorage.getItem(idPrefix + 'totalCounter')){
        totalCounter = parseInt(localStorage.getItem(idPrefix + 'totalCounter'));
        logMessageToUI("Total counter since start: " + totalCounter);
    } else {
        localStorage.setItem(idPrefix + 'totalCounter', 0);
    }

    const currentTime = new Date();
    const interval = checkInterval*(Math.random()*(1500 - 1000) + 1000);
    var refreshPageMS = setInterval(refreshPage, interval); // Refresh page after interval (+/- 10%)

    console.log('Script aktiv: Auto Farmer');

    // Check if detected
    if( document.body.innerText.indexOf('Farm-Assis') < 0 || $('#botprotection_quest').length > 0 ){
        logMessageToUI('Bot-Schutz detected');
        sendToTelegram('DS Script: Auto Farmer | BOT-SCHUTZ');
        snd.play();
        clearInterval(refreshPageMS);
        die;
    }

    $('.farm_icon').each(function(index){
        if(this.className.indexOf('decoration') < 0 && this.className.indexOf('farm_icon_disabled') < 0){ // Dont look on farm icons which are disabled or are just for decoration
            if(this.className.indexOf('farm_icon_' + favoritIcon) > 0){
                var fullReportObject, villageNumber, wall, distance, innerArr, villageName;
                fullReportObject = $(this).parent().parent(); //The whole line of a village

                villageName = fullReportObject.children()[3].innerText; // Find out vilalgeName
                villageNumber = this.className.replace(/^\D+|\D+$/g, ""); //Find out villagenumber
                wall = parseInt(fullReportObject.children()[6].innerText); //Find out wall
                distance = parseInt(fullReportObject.children()[7].innerText); //Find out distance

                // If no spys sent, set wall to 0
                if(isNaN(wall)){
                   wall = 0;
                }

                // If distance is smaller than maxdistance && wall smaller maxwall
                if(distance <= maxDistance && wall <= maxWall){
                    var timestampNowS, lastTimestampVillageAttacked;
                    timestampNowS = Math.floor(Date.now() / 1000); //Timestamp in miliseconds.
                    lastTimestampVillageAttacked = localStorage.getItem("lastAttackedVillage" + villageNumber); // Check in "DB" if there is a entry for lastAttackedVillage1234

                    // If no time registered or time since last attack > attackIntervalBaba
                    if(!lastTimestampVillageAttacked || (timestampNowS - lastTimestampVillageAttacked > attackIntervalBaba)){
                        logMessageToUI('Plane Angriff - ' + villageName);
                        innerArr = [villageNumber,wall,distance,this];
                        arr.push(innerArr); // Push village to array which will be attacked
                    } else {
                        logMessageToUI('Plane Angriff - ' + villageName + ' - Angriff vor kurzem (' + lastTimestampVillageAttacked + ')');
                    }
                } else {
                    logMessageToUI('Plane Angriff - ' + villageName + ' - Wall zu hoch oder zu weit weg');
                }
            }
        }
    });

    console.log(arr);

    var c = 1;
    var randomWaitTime;
    var fullWaitTime = 0;

    arr.forEach(function(el) {
        randomWaitTime = Math.floor(Math.random()*(intervalBetweenAttackBaba2-intervalBetweenAttackBaba1)+intervalBetweenAttackBaba1); //Calculate random time
        // randomWaitTime = Math.round(Math.random()*(1000 - 500) + 500);
        fullWaitTime = fullWaitTime + randomWaitTime; // Fulltime needs to be waited

        if( active == 1 ) {
            logMessageToUI('Sende Angriff ' + c + ' in ' + fullWaitTime + 'ms');
            // Time to wait to call function send
            setTimeout(function() {
                send(el[0],el[1],el[2],el[3]);
            }, fullWaitTime);
        } else {
            logMessageToUI('Not active');
        }

        c = c+1;
    });

    setTimeout(function() {
        showUiMessage();
    }, fullWaitTime+1000);


    function showUiMessage(){
        const endTime = new Date(currentTime.getTime() + interval);
        // Extract individual date and time components
        const year = endTime.getFullYear();
        const month = String(endTime.getMonth() + 1).padStart(2, '0'); // Months are zero-based
        const day = String(endTime.getDate()).padStart(2, '0');
        const hours = String(endTime.getHours()).padStart(2, '0');
        const minutes = String(endTime.getMinutes()).padStart(2, '0');
        const seconds = String(endTime.getSeconds()).padStart(2, '0');

        // Create the formatted date-time string
        const formattedDateTime = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;

        // Print the formatted date and time
        logMessageToUI('Auto-Refresh um ' + formattedDateTime);
    }



    // Function which is called to do the final click
    function send(villageNumber, wall, distance, objThis){
        var timestampNowS = Math.floor(Date.now() / 1000); //Timestamp in seconds.
        var timestampNowMS = Date.now(); //Timestamp in miliseconds.
        // Do not click on entry if before error is shown (Most likely its an error which shows not enough troops)
        if(stop == 0){
            if($('.autoHideBox').text() == ''){
                objThis.click();
                if($('.autoHideBox').text() == ''){
                    localStorage.setItem("lastAttackedVillage" + villageNumber, timestampNowS) // Set the last attacked timestamp in seconds to specific village
                    localStorage.setItem("lastAttackedTimeMS", timestampNowMS); // Set last time attacked in ms
                    localStorage.setItem(idPrefix + 'totalCounter', parseInt(parseInt(localStorage.getItem(idPrefix + 'totalCounter'))+1)); // Set total counter
                    logMessageToUI('Attack ' + villageNumber);
                } else {
                    logMessageToUI('Attack ' + villageNumber + ' - error shown. Not saved.');
                    stop = 1;
                }
            } else {
                logMessageToUI('Error still shown. Shouldnt appear');
            }
        } else {
            logMessageToUI('Stopped. Will refresh soon.');
        }
    }

    function refreshPage(){
        location.reload();
    }

    function sendToTelegram(text){
        var oReq;
        oReq = new XMLHttpRequest();
        // oReq.addEventListener("load", reqListener);
        oReq.open("GET", "https://discord.fr34k.ch/message.php?username=DS Log&content=" + text); // Send a message to fr34k that detected
        oReq.send();
    }


    // Function to show the menu
    function showMenu(){
        var string = "<div class='vis'><h4>Settings</h4><table width='100%'><tbody><tr>";
        string = string + "<td align='center'>" + createField('number', 'active', 'active', 'active') + "</td>";
        string = string + "<td style='width: 100px;'>" + createOption('favoritIcon', 'favoritIcon', 'a', 'b') + "</td>";
        string = string + "<td align='center'>" + createField('number', 'checkInterval', 'checkInterval', 'checkInterval') + "</td>";
        string = string + "<td align='center'>" + createField('number', 'intervalAttack1', 'intervalAttack1', 'intervalAttack1') + "</td>";
        string = string + "<td align='center'>" + createField('number', 'intervalAttack2', 'intervalAttack2', 'intervalAttack2') + "</td>";
        string = string + "<td align='center'>" + createField('number', 'intervalAttackBaba', 'intervalAttackBaba', 'intervalAttackBaba') + "</td>";
        string = string + "<td align='center'>" + createField('number', 'maxDistance', 'maxDistance', 'maxDistance') + "</td>";
        string = string + "<td align='center'>" + createField('number', 'maxWall', 'maxWall', 'maxWall') + "</td>";
        string = string + "<td align='center'>" + "<button id='save'>Save</button>" + "</td></tr>";
        string = string + "<tr><td colspan='9'><textarea id='autofarm-log' style='width: 98%; height: 200px;'></textarea></td></tr>";
        string = string + "</tbody></table></div>";
        return string;
    }

    // Function to create a radio option in menu
    function createOption(name, storage, option1, option2){
        storage = idPrefix + storage;
        var returnString;
        var checkedFlag = '';
        if(localStorage.getItem(storage) == option1){
            checkedFlag = 'checked';
        }
        var radioButton1 = "<input type='radio' id='" + idPrefix + option1 + "' name='" + name + "' value='" + option1 + "'" + checkedFlag + "><label for='" + option1 + "'>" + option1 + "</label>";

        checkedFlag = '';
        if(localStorage.getItem(storage) == option2){
            checkedFlag = 'checked';
        }
        var radioButton2 = "<input type='radio' id='" + idPrefix + option2 + "' name='" + name + "' value='" + option2 + "'" + checkedFlag + "><label for='" + option2 + "'>" + option2 + "</label>";

        returnString = radioButton1 + radioButton2;

        return returnString;
    }

    // Function to create a text/number field in menu
    function createField(type, name, id, storage){
        storage = idPrefix + storage;
        var returnString;
        if(type == 'text'){
            if(localStorage.getItem(storage)){
                returnString = name + "<br><input type='text' id='" + idPrefix + id + "' value='" + localStorage.getItem(storage) + "' style='width: 50px;'>";
            } else {
                returnString = name + "<br><input type='text' id='" + idPrefix + id + "' style='width: 50px;'>";
            }
        } else if(type == 'number'){
            if(localStorage.getItem(storage)){
                returnString = name + "<br><input type='number' id='" + idPrefix + id + "' value='" + localStorage.getItem(storage) + "' style='width: 50px;'>";
            } else {
                returnString = name + "<br><input type='number' id='" + idPrefix + id + "' style='width: 50px;'>";
            }
        }
        return returnString;
    }

    // Function which is called by menu if you click save
    $('#save').click(function(){
        var a = $('#' + idPrefix + 'a')[0];
        var b = $('#' + idPrefix + 'b')[0];
        // Read values from page
        var active = $('#' + idPrefix + 'active')[0].value;
        var checkInterval = $('#' + idPrefix + 'checkInterval')[0].value;
        var intervalAttack1 = $('#' + idPrefix + 'intervalAttack1')[0].value;
        var intervalAttack2 = $('#' + idPrefix + 'intervalAttack2')[0].value;
        var intervalAttackBaba = $('#' + idPrefix + 'intervalAttackBaba')[0].value;
        var maxDistance = $('#' + idPrefix + 'maxDistance')[0].value;
        var maxWall = $('#' + idPrefix + 'maxWall')[0].value;

        // Save values in storage
        if(a.checked === true){
            localStorage.setItem(idPrefix + "favoritIcon", 'a');
        } else {
            localStorage.setItem(idPrefix + "favoritIcon", 'b');
        }
        localStorage.setItem(idPrefix + "active", active);
        localStorage.setItem(idPrefix + "checkInterval", checkInterval);
        localStorage.setItem(idPrefix + "intervalAttack1", intervalAttack1);
        localStorage.setItem(idPrefix + "intervalAttack2", intervalAttack2);
        localStorage.setItem(idPrefix + "intervalAttackBaba", intervalAttackBaba);
        localStorage.setItem(idPrefix + "maxDistance", maxDistance);
        localStorage.setItem(idPrefix + "maxWall", maxWall);
        logMessageToUI("Values saved");
    });

    function logMessageToUI(message = ''){
        console.log(message);
        var existingText = $("#autofarm-log").val();
        var newText = message + "\n" + existingText;
        $("#autofarm-log").val(newText);
    }

})();