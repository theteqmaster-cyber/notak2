<?php

namespace App\Http\Controllers;

use App\Models\NaptsItem;
use App\Models\Semester;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function index()
    {
        // Active semester (there can only be one at a time)
        $activeSemester = Semester::where('status', 'active')
            ->with(['courses' => function ($q) {
                $q->withCount('naptsItems');
            }])
            ->first();

        // Recent uploads across the active semester
        $recentItems = collect();
        if ($activeSemester) {
            $courseIds  = $activeSemester->courses->pluck('id');
            $recentItems = NaptsItem::whereIn('course_id', $courseIds)
                ->with(['course', 'uploader'])
                ->orderByDesc('created_at')
                ->limit(8)
                ->get();
        }

        // Quick stats
        $stats = [
            'courses'      => $activeSemester?->courses->count() ?? 0,
            'notes'        => $this->countType($activeSemester, 'N'),
            'assignments'  => $this->countType($activeSemester, 'A'),
            'presentations'=> $this->countType($activeSemester, 'P'),
            'tests'        => $this->countType($activeSemester, 'T'),
            'sources'      => $this->countType($activeSemester, 'S'),
        ];

        return view('dashboard', compact('activeSemester', 'recentItems', 'stats'));
    }

    private function countType(?Semester $semester, string $type): int
    {
        if (!$semester) return 0;
        $courseIds = $semester->courses->pluck('id');
        return NaptsItem::whereIn('course_id', $courseIds)->where('type', $type)->count();
    }
}
