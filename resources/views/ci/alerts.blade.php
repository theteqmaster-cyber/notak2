@extends('layouts.app')
@section('title', 'Security Alerts')
@section('page-title', 'Security Alerts')

@section('content')

@if($flaggedLogs->isEmpty())
<div class="empty-state">
    <x-icon name="shield" class="icon" style="color:var(--accent);" />
    <h3>All clear</h3>
    <p>No flagged security events at this time.</p>
</div>
@else
<div class="card">
    <div class="table-wrap">
        <table>
            <thead>
                <tr><th>Time</th><th>Event</th><th>User</th><th>IP</th><th>Description</th><th>Details</th></tr>
            </thead>
            <tbody>
                @foreach($flaggedLogs as $log)
                <tr class="log-row-flagged">
                    <td style="font-size:12px;white-space:nowrap;">{{ $log->created_at->format('d M Y H:i:s') }}</td>
                    <td><span class="badge badge-flagged">{{ $log->event_type }}</span></td>
                    <td style="font-size:12.5px;">{{ $log->user?->email ?? 'Guest' }}</td>
                    <td style="font-family:monospace;font-size:12px;">{{ $log->ip_address }}</td>
                    <td style="font-size:12.5px;">{{ $log->description }}</td>
                    <td style="font-size:11.5px;color:var(--text-3);max-width:160px;">
                        @if($log->metadata)
                            @foreach($log->metadata as $k => $v)
                            <div><strong>{{ $k }}:</strong> {{ $v }}</div>
                            @endforeach
                        @endif
                    </td>
                </tr>
                @endforeach
            </tbody>
        </table>
    </div>
    <div style="padding:8px 16px;">{{ $flaggedLogs->links() }}</div>
</div>
@endif

@endsection
