<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Semester extends Model
{
    use HasFactory;

    protected $fillable = [
        'name', 'academic_year', 'start_date', 'end_date', 'status', 'description',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date'   => 'date',
    ];

    public function courses()
    {
        return $this->hasMany(Course::class);
    }

    public function archives()
    {
        return $this->hasMany(SemesterArchive::class);
    }

    public function isActive(): bool
    {
        return $this->status === 'active';
    }

    public function isArchived(): bool
    {
        return $this->status === 'archived';
    }

    // Count of all NAPTS items across all courses in this semester
    public function naptsCount(): int
    {
        return $this->courses()->withCount('naptsItems')->get()->sum('napts_items_count');
    }
}
