<?php

namespace Database\Seeders;

use App\Models\Script;
use Illuminate\Database\Seeder;

class ScriptSeeder extends Seeder
{
    public function run(): void
    {
        $scripts = [
            'attack_planner',
            'baba_wall_clearer',
            'farmgod_addon_enter',
            'farm_god_addon',
            'looter_of_the_day',
            'new_baba_finder',
            'nice_overview',
            'rename_attacks',
            'tribe_full_defense_overview',
            'tribe_member_overview',
            'tribe_member_troops_in_village',
            'tribe_status_checker',
            'ultra_timing',
            'prepare_defense_ds_ultimate',
        ];

        foreach ($scripts as $slug) {
            Script::firstOrCreate(
                ['slug' => $slug],
                [
                    'title'             => $slug,
                    'short_description' => '',
                    'long_description'  => '',
                    'tags'              => [],
                    'image'             => '',
                    'file'              => '',
                    'version'           => '',
                    'is_active'         => true,
                ]
            );
        }
    }
}
