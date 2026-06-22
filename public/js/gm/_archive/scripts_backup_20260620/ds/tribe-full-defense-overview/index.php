<?php
    // Script for tribalwars
    // Receive world player ally & attacks
    // Save new data in player json

    header('Access-Control-Allow-Origin: *');
    
    $world = !empty( $_POST['world'] ) ? $_POST['world'] : '';
    $player = !empty( $_POST['player'] ) ? $_POST['player'] : '';
    $ally = !empty( $_POST['ally'] ) ? $_POST['ally'] : '';
    $attacks = !empty( $_POST['attacks'] ) ? $_POST['attacks'] : '';

    if( empty( $world ) || empty( $player ) || empty( $ally ) || empty( $attacks ) ) {
        exit;
    }

    // Check if file with name already exists
    $filename = $world . '_' . $ally . '.txt';
    $file = fopen( $filename, 'a+' );
    $file_content = fread( $file, filesize( $filename ) );
    fclose( $file );

    $file_content = json_decode( $file_content, true );
    $file_content[ $player ]['commands'] = $attacks;
    $file_content[ $player ]['last_update'] = time();

    $file = fopen( $filename, 'w' );
    fwrite( $file, json_encode( $file_content ) );
    fclose( $file );

    echo json_encode( $file_content );

