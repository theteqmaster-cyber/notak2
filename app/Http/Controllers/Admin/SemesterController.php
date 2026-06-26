<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Semester;
use Illuminate\Http\Request;

class SemesterController extends Controller
{
    public function index()
    {
        $semesters = Semester::withCount('courses')->orderByDesc('created_at')->get();
        return view('admin.semesters.index', compact('semesters'));
    }

    public function create()
    {
        return view('admin.semesters.create');
    }

    public function store(Request $request)
    {
        $request->validate([
            'name'          => 'required|string|max:255',
            'academic_year' => 'required|string|max:20',
            'start_date'    => 'nullable|date',
            'end_date'      => 'nullable|date|after_or_equal:start_date',
            'description'   => 'nullable|string|max:1000',
        ]);

        // Only one active semester allowed at a time
        if (Semester::where('status', 'active')->exists()) {
            return back()->withErrors(['name' => 'There is already an active semester. Archive it first before creating a new one.']);
        }

        $semester = Semester::create([
            'name'          => $request->name,
            'academic_year' => $request->academic_year,
            'start_date'    => $request->start_date,
            'end_date'      => $request->end_date,
            'description'   => $request->description,
            'status'        => 'active',
        ]);

        ActivityLog::record('semester_created', "Created semester: {$semester->name}", null, [
            'semester_id' => $semester->id,
        ]);

        return redirect()->route('admin.semesters')
            ->with('success', "Semester '{$semester->name}' created.");
    }

    public function archive(Semester $semester)
    {
        if ($semester->isArchived()) {
            return back()->withErrors(['error' => 'Semester is already archived.']);
        }

        $semester->update(['status' => 'archived']);

        ActivityLog::record('semester_archived', "Archived semester: {$semester->name}", null, [
            'semester_id' => $semester->id,
        ]);

        return redirect()->route('admin.semesters')
            ->with('success', "Semester '{$semester->name}' has been archived.");
    }
}
