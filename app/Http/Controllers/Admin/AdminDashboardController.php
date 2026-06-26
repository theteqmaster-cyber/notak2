<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\NaptsItem;
use App\Models\Semester;
use App\Models\User;
use App\Models\ActivityLog;

class AdminDashboardController extends Controller
{
    public function index()
    {
        $activeSemester = Semester::where('status', 'active')->withCount('courses')->first();

        $stats = [
            'total_users'      => User::where('role', 'viewer')->count(),
            'total_courses'    => $activeSemester?->courses_count ?? 0,
            'total_items'      => NaptsItem::count(),
            'total_semesters'  => Semester::count(),
            'archived_semesters' => Semester::where('status', 'archived')->count(),
            'recent_uploads'   => NaptsItem::with(['course', 'uploader'])->orderByDesc('created_at')->limit(5)->get(),
        ];

        // Per-type counts
        foreach (['N', 'A', 'P', 'T', 'S'] as $type) {
            $stats['type_' . $type] = NaptsItem::where('type', $type)->count();
        }

        return view('admin.dashboard', compact('activeSemester', 'stats'));
    }
}
