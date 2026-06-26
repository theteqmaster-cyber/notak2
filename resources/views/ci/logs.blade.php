@extends('layouts.app')
@section('title', 'Activity Logs')
@section('page-title', 'Activity Logs')

@section('content')

{{-- Filters --}}
<form method="GET" action="{{ route('ci.logs') }}" style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:20px;">
    <select name="event_type" class="form-select" style="width:auto;">
        <option value="">All events</option>
        @foreach($eventTypes as $e)
        <option value="{{ $e }}" {{ request('event_type') === $e ? 'selected' : '' }}>{{ $e }}</option>
        @endforeach
    </select>
    <input type="date" name="date" class="form-input" style="width:auto;" value="{{ request('date') }}">
    <input type="text" name="ip" class="form-input" style="width:auto;" placeholder="IP address" value="{{ request('ip') }}">
    <label style="display:flex;align-items:center;gap:6px;font-size:13px;cursor:pointer;">
        <input type="checkbox" name="flagged" value="1" {{ request('flagged') ? 'checked' : '' }}> Flagged only
    </label>
    <button class="btn btn-secondary btn-sm" type="submit"><x-icon name="filter" /> Filter</button>
    <a href="{{ route('ci.logs') }}" class="btn btn-ghost btn-sm"><x-icon name="x" /> Clear</a>
</form>

<div class="card">
    <div class="table-wrap">
        <table>
            <thead>
                <tr><th>Time</th><th>Event</th><th>User</th><th>IP</th><th>Description</th></tr>
            </thead>
            <tbody>
                @forelse($logs as $log)
                <tr class="{{ $log->is_flagged ? 'log-row-flagged' : '' }}">
                    <td style="font-size:12px;color:var(--text-3);white-space:nowrap;">{{ $log->created_at->format('d M H:i:s') }}</td>
                    <td>
                        <span class="badge {{ $log->is_flagged ? 'badge-flagged' : 'badge-viewer' }}">
                            {{ $log->event_type }}
                        </span>
                    </td>
                    <td style="font-size:12.5px;">{{ $log->user?->email ?? 'Guest' }}</td>
                    <td style="font-size:12px;font-family:monospace;color:var(--text-3);">{{ $log->ip_address }}</td>
                    <td style="font-size:12.5px;max-width:300px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">{{ $log->description }}</td>
                </tr>
                @empty
                <tr><td colspan="5" style="text-align:center;color:var(--text-4);padding:32px;">No logs found.</td></tr>
                @endforelse
            </tbody>
        </table>
    </div>
    <div style="padding:8px 16px;">{{ $logs->links() }}</div>
</div>

@endsection
