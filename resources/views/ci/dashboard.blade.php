@extends('layouts.app')
@section('title', 'CI Dashboard')
@section('page-title', 'Cyber Inspector Dashboard')

@section('content')

{{-- Stats --}}
<div class="stats-grid" style="margin-bottom:28px;">
    @php
    $statCards = [
        ['label'=>'Logins Today',      'value'=>$stats['total_logins_today'],  'icon'=>'users',          'color'=>'#22C55E','bg'=>'#DCFCE7'],
        ['label'=>'Failed Logins',     'value'=>$stats['failed_logins_today'], 'icon'=>'triangle-alert', 'color'=>'#EF4444','bg'=>'#FEE2E2'],
        ['label'=>'Flagged Events',    'value'=>$stats['flagged_total'],        'icon'=>'flag',           'color'=>'#F59E0B','bg'=>'#FEF3C7'],
        ['label'=>'Uploads Today',     'value'=>$stats['uploads_today'],        'icon'=>'upload',         'color'=>'#4F6EF7','bg'=>'#EEF1FE'],
        ['label'=>'Total Users',       'value'=>$stats['total_users'],          'icon'=>'users',          'color'=>'#8B5CF6','bg'=>'#EDE9FE'],
    ];
    @endphp
    @foreach($statCards as $s)
    <div class="stat-card">
        <div class="stat-icon" style="background:{{ $s['bg'] }};color:{{ $s['color'] }};">
            <x-icon :name="$s['icon']" />
        </div>
        <div class="stat-value">{{ $s['value'] }}</div>
        <div class="stat-label">{{ $s['label'] }}</div>
    </div>
    @endforeach
</div>

{{-- Quick Links --}}
<div style="display:flex;gap:10px;margin-bottom:28px;">
    <a href="{{ route('ci.logs') }}"   class="btn btn-secondary"><x-icon name="scroll-text" /> All Logs</a>
    <a href="{{ route('ci.alerts') }}" class="btn btn-danger"><x-icon name="flag" /> Flagged Alerts</a>
</div>

<div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;">

{{-- Recent Activity --}}
<div class="card">
    <div class="card-header">
        <span class="card-title">Recent Activity</span>
        <a href="{{ route('ci.logs') }}" class="btn btn-ghost btn-sm">View all</a>
    </div>
    <div class="table-wrap">
        <table>
            <thead><tr><th>Event</th><th>User</th><th>Time</th></tr></thead>
            <tbody>
                @foreach($recentLogs as $log)
                <tr class="{{ $log->is_flagged ? 'log-row-flagged' : '' }}">
                    <td>
                        <span class="log-event">
                            @if($log->is_flagged)<x-icon name="flag" style="color:var(--danger);width:12px;height:12px;" />@endif
                            {{ $log->event_type }}
                        </span>
                    </td>
                    <td style="font-size:12.5px;">{{ $log->user?->email ?? 'Guest' }}</td>
                    <td style="font-size:12px;color:var(--text-3);">{{ $log->created_at->diffForHumans() }}</td>
                </tr>
                @endforeach
            </tbody>
        </table>
    </div>
</div>

{{-- Flagged --}}
<div class="card">
    <div class="card-header">
        <span class="card-title" style="color:var(--danger);">⚠ Flagged Events</span>
        <a href="{{ route('ci.alerts') }}" class="btn btn-ghost btn-sm">View all</a>
    </div>
    <div class="table-wrap">
        <table>
            <thead><tr><th>Event</th><th>IP</th><th>Time</th></tr></thead>
            <tbody>
                @forelse($flaggedLogs as $log)
                <tr class="log-row-flagged">
                    <td style="font-weight:600;font-size:13px;">{{ $log->event_type }}</td>
                    <td style="font-size:12.5px;font-family:monospace;">{{ $log->ip_address }}</td>
                    <td style="font-size:12px;color:var(--text-3);">{{ $log->created_at->diffForHumans() }}</td>
                </tr>
                @empty
                <tr><td colspan="3" style="text-align:center;color:var(--accent);padding:24px;font-weight:600;">No flagged events</td></tr>
                @endforelse
            </tbody>
        </table>
    </div>
</div>

</div>

@endsection
