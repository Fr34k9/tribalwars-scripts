<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ds_attacks', function (Blueprint $table) {
            $table->id();
            $table->string('world');
            $table->unsignedBigInteger('command_id');
            $table->string('name');
            $table->string('type')->default('unknown');
            $table->unsignedBigInteger('target_village_id');
            $table->string('target_village_name');
            $table->unsignedBigInteger('sender_village_id');
            $table->string('sender_village_name');
            $table->unsignedBigInteger('attacker_player_id');
            $table->string('attacker_player_name');
            $table->string('defender_player_name');
            $table->string('ally');
            $table->timestamp('arrival_at');
            $table->timestamp('last_synced_at');
            $table->timestamps();

            $table->unique(['world', 'command_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ds_attacks');
    }
};
