<?php

namespace App\Http\Controllers;

use App\Models\DsAttack;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class DsAttackController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'world'   => 'required|string',
            'player'  => 'required|string',
            'ally'    => 'required|string',
            'attacks' => 'required',
        ]);

        $attacks = is_string($data['attacks'])
            ? json_decode($data['attacks'], true)
            : $data['attacks'];

        $now = Carbon::now();

        foreach ($attacks as $cmd) {
            [$commandId, $name, $targetVillageName, $targetVillageId,
             $senderVillageName, $senderVillageId, $attackerPlayerName,
             $attackerPlayerId, $arrivalMs] = $cmd;

            DsAttack::upsert(
                [
                    'world'               => $data['world'],
                    'command_id'          => $commandId,
                    'name'                => $name,
                    'type'                => DsAttack::typeFromName($name),
                    'target_village_id'   => $targetVillageId,
                    'target_village_name' => $targetVillageName,
                    'sender_village_id'   => $senderVillageId,
                    'sender_village_name' => $senderVillageName,
                    'attacker_player_id'  => $attackerPlayerId,
                    'attacker_player_name' => $attackerPlayerName,
                    'defender_player_name' => $data['player'],
                    'ally'                => $data['ally'],
                    'arrival_at'          => Carbon::createFromTimestampMs($arrivalMs),
                    'last_synced_at'      => $now,
                ],
                ['world', 'command_id'],
                ['name', 'type', 'target_village_name', 'sender_village_name',
                 'attacker_player_name', 'defender_player_name', 'ally',
                 'arrival_at', 'last_synced_at', 'updated_at']
            );
        }

        // Return tribal attack data grouped by player, matching the old PHP contract
        $allAttacks = DsAttack::where('world', $data['world'])
            ->where('ally', $data['ally'])
            ->orderBy('arrival_at')
            ->get()
            ->groupBy('defender_player_name')
            ->map(function ($playerAttacks) use ($now) {
                return [
                    'commands'    => $playerAttacks->map(fn($a) => [
                        $a->command_id,
                        $a->name,
                        $a->target_village_name,
                        $a->target_village_id,
                        $a->sender_village_name,
                        $a->sender_village_id,
                        $a->attacker_player_name,
                        $a->attacker_player_id,
                        $a->arrival_at->getTimestampMs(),
                    ])->values()->toJson(),
                    'last_update' => $playerAttacks->max('last_synced_at')->timestamp,
                ];
            });

        return response()->json($allAttacks);
    }
}
