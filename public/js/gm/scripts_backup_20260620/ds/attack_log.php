<?php
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST');
    header("Access-Control-Allow-Headers: X-Requested-With");

    $text = !empty( $_POST['text'] ) ? $_POST['text'] : '';

    if ( !empty( $text ) ) {
        // Read the existing content of the file
        $existingContent = file_get_contents('attack_log.txt');

        $text = str_replace('$$$', "\n", $text);
        $text = date( 'Y-m-d H:i:s' ) . "\n" . $text;

        // Combine the new text with the existing content
        $combinedText = $text . "\n\n" . $existingContent;

        // Write the combined text to the file
        file_put_contents('attack_log.txt', $combinedText);
    }
