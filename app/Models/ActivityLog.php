<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ActivityLog extends Model
{
    public $timestamps = false; // Only has created_at

    protected $fillable = [
        'user_id', 'event_type', 'description', 'ip_address',
        'user_agent', 'metadata', 'is_flagged',
    ];

    protected $casts = [
        'metadata'   => 'array',
        'is_flagged' => 'boolean',
        'created_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    // Convenience static logger
    public static function record(
        string $eventType,
        string $description,
        ?int $userId = null,
        array $metadata = [],
        bool $flagged = false
    ): self {
        return self::create([
            'user_id'     => $userId ?? auth()->id(),
            'event_type'  => $eventType,
            'description' => $description,
            'ip_address'  => request()->ip(),
            'user_agent'  => request()->userAgent(),
            'metadata'    => $metadata,
            'is_flagged'  => $flagged,
        ]);
    }
}
