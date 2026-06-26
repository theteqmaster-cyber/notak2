<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\Semester;
use App\Models\User;
use Illuminate\Http\Request;

class CiController extends Controller
{
    public function dashboard()
    {
        $stats = [
            'total_logins_today' => ActivityLog::where('event_type', 'login')
                ->whereDate('created_at', today())->count(),
            'failed_logins_today' => ActivityLog::where('event_type', 'login_failed')
                ->whereDate('created_at', today())->count(),
            'flagged_total' => ActivityLog::where('is_flagged', true)->count(),
            'uploads_today' => ActivityLog::where('event_type', 'upload')
                ->whereDate('created_at', today())->count(),
            'total_users' => User::count(),
        ];

        $recentLogs = ActivityLog::with('user')
            ->orderByDesc('created_at')
            ->limit(20)
            ->get();

        $flaggedLogs = ActivityLog::with('user')
            ->where('is_flagged', true)
            ->orderByDesc('created_at')
            ->limit(10)
            ->get();

        return view('ci.dashboard', compact('stats', 'recentLogs', 'flaggedLogs'));
    }

    public function logs(Request $request)
    {
        $query = ActivityLog::with('user')->orderByDesc('created_at');

        if ($request->filled('event_type')) {
            $query->where('event_type', $request->event_type);
        }
        if ($request->filled('flagged')) {
            $query->where('is_flagged', true);
        }
        if ($request->filled('date')) {
            $query->whereDate('created_at', $request->date);
        }
        if ($request->filled('ip')) {
            $query->where('ip_address', $request->ip);
        }

        $logs = $query->paginate(50)->withQueryString();

        $eventTypes = ActivityLog::distinct()->pluck('event_type');

        return view('ci.logs', compact('logs', 'eventTypes'));
    }

    public function alerts()
    {
        $flaggedLogs = ActivityLog::with('user')
            ->where('is_flagged', true)
            ->orderByDesc('created_at')
            ->paginate(30);

        return view('ci.alerts', compact('flaggedLogs'));
    }
}
