@extends('layouts.app')
@section('title', 'Semesters')
@section('page-title', 'Semesters')

@section('topbar-actions')
    <a href="{{ route('admin.semesters.create') }}" class="btn btn-primary btn-sm"><x-icon name="plus" /> New Semester</a>
@endsection

@section('content')

<div class="card">
    <div class="table-wrap">
        <table>
            <thead>
                <tr>
                    <th>Name</th><th>Year</th><th>Dates</th>
                    <th>Courses</th><th>Status</th><th style="width:140px;"></th>
                </tr>
            </thead>
            <tbody>
                @forelse($semesters as $s)
                <tr>
                    <td style="font-weight:600;">{{ $s->name }}</td>
                    <td>{{ $s->academic_year }}</td>
                    <td style="font-size:12.5px;color:var(--text-3);">
                        {{ $s->start_date?->format('d M Y') ?? '—' }}
                        @if($s->end_date) – {{ $s->end_date->format('d M Y') }} @endif
                    </td>
                    <td>{{ $s->courses_count }}</td>
                    <td><span class="badge badge-{{ $s->status }}">{{ ucfirst($s->status) }}</span></td>
                    <td>
                        @if($s->isActive())
                        <form method="POST" action="{{ route('admin.semesters.archive', $s) }}" style="display:inline;">
                            @csrf
                            <button class="btn btn-secondary btn-sm" data-confirm="Archive '{{ $s->name }}'? This cannot be undone.">
                                <x-icon name="archive" /> Archive
                            </button>
                        </form>
                        @else
                        <a href="{{ route('semester.show', $s) }}" class="btn btn-ghost btn-sm">
                            <x-icon name="eye" /> View
                        </a>
                        @endif
                    </td>
                </tr>
                @empty
                <tr><td colspan="6" style="text-align:center;color:var(--text-4);padding:32px;">No semesters yet.</td></tr>
                @endforelse
            </tbody>
        </table>
    </div>
</div>

@endsection
