<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Course extends Model
{
    use HasFactory;

    protected $fillable = [
        'semester_id', 'name', 'code', 'lecturer', 'description', 'color',
    ];

    public function semester()
    {
        return $this->belongsTo(Semester::class);
    }

    public function naptsItems()
    {
        return $this->hasMany(NaptsItem::class);
    }

    // Scoped counts per NAPTS type
    public function notes()        { return $this->hasMany(NaptsItem::class)->where('type', 'N'); }
    public function assignments()  { return $this->hasMany(NaptsItem::class)->where('type', 'A'); }
    public function presentations(){ return $this->hasMany(NaptsItem::class)->where('type', 'P'); }
    public function tests()        { return $this->hasMany(NaptsItem::class)->where('type', 'T'); }
    public function sources()      { return $this->hasMany(NaptsItem::class)->where('type', 'S'); }
}
