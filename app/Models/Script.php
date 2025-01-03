<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Script extends Model
{
    protected $fillable = [
        'title',
        'short_description',
        'description',
        'image',
        'download_counter',
        'run_counter',
        'file',
        'version',
        'is_active',
    ];
}
