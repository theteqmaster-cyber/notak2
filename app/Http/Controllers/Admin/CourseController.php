<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\Semester;
use Illuminate\Http\Request;

class CourseController extends Controller
{
    public function index()
    {
        $activeSemester = Semester::where('status', 'active')->first();
        $courses = Course::with('semester')
            ->withCount('naptsItems')
            ->when($activeSemester, fn($q) => $q->where('semester_id', $activeSemester->id))
            ->orderBy('name')
            ->get();

        return view('admin.courses.index', compact('courses', 'activeSemester'));
    }

    public function store(Request $request)
    {
        $request->validate([
            'semester_id' => 'required|exists:semesters,id',
            'name'        => 'required|string|max:255',
            'code'        => 'nullable|string|max:20',
            'lecturer'    => 'nullable|string|max:255',
            'description' => 'nullable|string|max:1000',
            'color'       => 'nullable|string|regex:/^#[0-9A-Fa-f]{6}$/',
        ]);

        $semester = Semester::findOrFail($request->semester_id);
        if ($semester->isArchived()) {
            return back()->withErrors(['name' => 'Cannot add courses to an archived semester.']);
        }

        $course = Course::create($request->only([
            'semester_id', 'name', 'code', 'lecturer', 'description', 'color',
        ]));

        return redirect()->route('admin.courses')
            ->with('success', "Course '{$course->name}' created.");
    }

    public function destroy(Course $course)
    {
        $name = $course->name;
        $course->delete(); // cascades to napts_items via migration
        return back()->with('success', "Course '{$name}' deleted.");
    }
}
