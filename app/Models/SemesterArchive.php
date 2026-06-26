<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SemesterArchive extends Model
{
    protected $fillable = [
        'semester_id', 'generated_by', 'zip_key', 'zip_name',
        'zip_size', 'manifest', 'status', 'generated_at',
    ];

    protected $casts = [
        'manifest'     => 'array',
        'generated_at' => 'datetime',
        'zip_size'     => 'integer',
    ];

    public function semester()
    {
        return $this->belongsTo(Semester::class);
    }

    public function generator()
    {
        return $this->belongsTo(User::class, 'generated_by');
    }

    public function isReady(): bool
    {
        return $this->status === 'ready';
    }
}
