<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Course;
use App\Models\NaptsItem;
use App\Models\Semester;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class UploadController extends Controller
{
    public function showForm()
    {
        $semesters = Semester::where('status', 'active')->with('courses')->get();
        $courses   = Course::whereHas('semester', fn($q) => $q->where('status', 'active'))
            ->orderBy('name')
            ->get();

        return view('admin.upload', compact('courses'));
    }

    public function store(Request $request)
    {
        $request->validate([
            'course_id'    => 'required|exists:courses,id',
            'type'         => 'required|in:N,A,P,T,S',
            'title'        => 'required|string|max:255',
            'description'  => 'nullable|string|max:1000',
            'tags'         => 'nullable|string|max:255',
            'file'         => 'required_without:external_url|nullable|file|max:512000|mimes:pdf,doc,docx,ppt,pptx,jpg,jpeg,png,webp,md,txt',
            'external_url' => 'required_without:file|nullable|url|max:2048',
        ]);

        $fileKey  = null;
        $fileName = null;
        $fileType = null;
        $fileSize = null;

        if ($request->hasFile('file')) {
            $file     = $request->file('file');
            $fileName = $file->getClientOriginalName();
            $fileType = $file->getMimeType();
            $fileSize = $file->getSize();

            // Organize in R2: napts/{course_id}/{type}/{uuid}.{ext}
            $ext     = $file->getClientOriginalExtension();
            $fileKey = 'napts/' . $request->course_id . '/' . $request->type . '/' . Str::uuid() . '.' . $ext;

            Storage::disk('r2')->put($fileKey, file_get_contents($file->getRealPath()));
        }

        $item = NaptsItem::create([
            'course_id'    => $request->course_id,
            'uploaded_by'  => auth()->id(),
            'type'         => $request->type,
            'title'        => $request->title,
            'description'  => $request->description,
            'tags'         => $request->tags,
            'file_key'     => $fileKey,
            'file_name'    => $fileName,
            'file_type'    => $fileType,
            'file_size'    => $fileSize,
            'external_url' => $request->external_url,
        ]);

        ActivityLog::record('upload', "Uploaded: {$item->title} [{$item->type}]", null, [
            'item_id'   => $item->id,
            'course_id' => $item->course_id,
            'type'      => $item->type,
            'file_name' => $fileName,
            'file_size' => $fileSize,
        ]);

        return redirect()->route('admin.items')
            ->with('success', "'{$item->title}' uploaded successfully.");
    }

    public function destroy(NaptsItem $item)
    {
        // Delete from R2
        if ($item->hasFile()) {
            Storage::disk('r2')->delete($item->file_key);
        }

        $title = $item->title;
        $item->delete();

        ActivityLog::record('delete', "Deleted item: {$title}", null, [
            'item_id' => $item->id,
        ]);

        return back()->with('success', "'{$title}' deleted.");
    }
}
