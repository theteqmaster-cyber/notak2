<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Support\Facades\Storage;

class NaptsItem extends Model
{
    use HasFactory;

    protected $table = 'napts_items';

    protected $fillable = [
        'course_id', 'uploaded_by', 'type', 'title', 'description', 'tags',
        'file_key', 'file_name', 'file_type', 'file_size',
        'external_url', 'download_count',
    ];

    protected $casts = [
        'file_size' => 'integer',
        'download_count' => 'integer',
    ];

    // NAPTS type labels
    public static array $typeLabels = [
        'N' => 'Notes',
        'A' => 'Assignments',
        'P' => 'Presentations',
        'T' => 'Tests',
        'S' => 'Sources',
    ];

    // NAPTS type icons (Lucide icon names)
    public static array $typeIcons = [
        'N' => 'notebook-pen',
        'A' => 'clipboard-list',
        'P' => 'presentation',
        'T' => 'file-check',
        'S' => 'library',
    ];

    // NAPTS type colors
    public static array $typeColors = [
        'N' => '#4F6EF7',   // blue-indigo
        'A' => '#F59E0B',   // amber
        'P' => '#8B5CF6',   // violet
        'T' => '#EF4444',   // red
        'S' => '#22C55E',   // green
    ];

    public function course()
    {
        return $this->belongsTo(Course::class);
    }

    public function uploader()
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    // Whether this item has a file (not just an external URL)
    public function hasFile(): bool
    {
        return !empty($this->file_key);
    }

    // Whether this item is an external URL (Sources)
    public function hasExternalUrl(): bool
    {
        return !empty($this->external_url);
    }

    // Whether the file is a PDF (viewable in-browser)
    public function isPdf(): bool
    {
        return $this->file_type === 'application/pdf';
    }

    // Whether the file is an image (viewable inline)
    public function isImage(): bool
    {
        return str_starts_with((string)$this->file_type, 'image/');
    }

    // Whether the file is Markdown
    public function isMarkdown(): bool
    {
        return in_array($this->file_type, ['text/markdown', 'text/plain'])
            && str_ends_with((string)$this->file_name, '.md');
    }

    // Generate a temporary signed download URL from R2
    public function getDownloadUrl(int $expiresInMinutes = 60): string
    {
        if (!$this->hasFile()) return '';
        return Storage::disk('r2')->temporaryUrl($this->file_key, now()->addMinutes($expiresInMinutes));
    }

    public function getTypeLabelAttribute(): string
    {
        return self::$typeLabels[$this->type] ?? $this->type;
    }

    public function getTypeColorAttribute(): string
    {
        return self::$typeColors[$this->type] ?? '#64748B';
    }

    public function getFileSizeHumanAttribute(): string
    {
        if (!$this->file_size) return '—';
        $units = ['B', 'KB', 'MB', 'GB'];
        $size = $this->file_size;
        $i = 0;
        while ($size >= 1024 && $i < count($units) - 1) {
            $size /= 1024;
            $i++;
        }
        return round($size, 1) . ' ' . $units[$i];
    }
}
