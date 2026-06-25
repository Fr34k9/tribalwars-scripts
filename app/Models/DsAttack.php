<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DsAttack extends Model
{
    protected $fillable = [
        'world',
        'command_id',
        'name',
        'type',
        'target_village_id',
        'target_village_name',
        'sender_village_id',
        'sender_village_name',
        'attacker_player_id',
        'attacker_player_name',
        'defender_player_name',
        'ally',
        'arrival_at',
        'last_synced_at',
    ];

    protected $casts = [
        'arrival_at' => 'datetime',
        'last_synced_at' => 'datetime',
    ];

}
