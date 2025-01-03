<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Script extends Model
{
    protected $fillable = [
        'title',
        'short_description',
        'long_description',
        'image',
        'download_counter',
        'run_counter',
        'tags',
        'file',
        'version',
        'is_active',
    ];

    protected $casts = [
        'tags' => 'array',
        'is_active' => 'boolean',
    ];
}
