<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\NaptsItem;
use App\Models\Course;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class NaptsItemController extends Controller
{
    // Show a single NAPTS item (viewer)
    public function show(NaptsItem $item)
    {
        $item->load(['course.semester', 'uploader']);

        // Generate a temporary signed URL for file access
        $downloadUrl = $item->hasFile()
            ? $item->getDownloadUrl(60) // valid 60 minutes
            : null;

        return view('items.show', compact('item', 'downloadUrl'));
    }

    // Increment download count and redirect to signed URL
    public function download(NaptsItem $item)
    {
        if (!$item->hasFile()) {
            abort(404, 'No file attached to this item.');
        }

        $item->increment('download_count');

        ActivityLog::record('download', "Downloaded: {$item->title}", null, [
            'item_id'   => $item->id,
            'file_name' => $item->file_name,
            'type'      => $item->type,
        ]);

        $url = $item->getDownloadUrl(5); // short-lived URL for download

        return redirect($url);
    }

    // Course view with NAPTS tabs
    public function courseView(Course $course, Request $request)
    {
        $course->load('semester');

        $type   = $request->get('type', 'N'); // default to Notes
        $type   = in_array($type, ['N', 'A', 'P', 'T', 'S']) ? $type : 'N';

        $items  = NaptsItem::where('course_id', $course->id)
            ->where('type', $type)
            ->with('uploader')
            ->orderByDesc('created_at')
            ->get();

        $counts = [];
        foreach (['N', 'A', 'P', 'T', 'S'] as $t) {
            $counts[$t] = NaptsItem::where('course_id', $course->id)->where('type', $t)->count();
        }

        return view('courses.show', compact('course', 'items', 'type', 'counts'));
    }
}
