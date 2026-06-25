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

    public static function typeFromName(string $name): string
    {
        if (stripos($name, 'big') !== false) return 'big';
        if (stripos($name, 'medium') !== false) return 'medium';
        if (stripos($name, 'small') !== false) return 'small';
        if ($name !== '') return 'regular';
        return 'unknown';
    }
}
