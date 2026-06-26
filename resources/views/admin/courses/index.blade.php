@extends('layouts.app')
@section('title', 'Courses')
@section('page-title', 'Courses')

@section('content')

{{-- Add Course --}}
@if($activeSemester)
<div class="card" style="margin-bottom:24px;">
    <div class="card-header"><span class="card-title">Add Course to {{ $activeSemester->name }}</span></div>
    <div class="card-body">
        <form method="POST" action="{{ route('admin.courses.store') }}">
            @csrf
            <input type="hidden" name="semester_id" value="{{ $activeSemester->id }}">
            <div style="display:grid;grid-template-columns:1fr 120px;gap:12px;">
                <div class="form-group" style="margin:0;">
                    <label class="form-label" for="name">Course Name</label>
                    <input type="text" name="name" id="name" class="form-input @error('name') error @enderror"
                           value="{{ old('name') }}" placeholder="e.g. Database Systems" required>
                    @error('name')<span class="form-error">{{ $message }}</span>@enderror
                </div>
                <div class="form-group" style="margin:0;">
                    <label class="form-label" for="code">Code</label>
                    <input type="text" name="code" id="code" class="form-input" value="{{ old('code') }}" placeholder="CS301">
                </div>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr 100px;gap:12px;margin-top:12px;align-items:end;">
                <div class="form-group" style="margin:0;">
                    <label class="form-label" for="lecturer">Lecturer</label>
                    <input type="text" name="lecturer" id="lecturer" class="form-input" value="{{ old('lecturer') }}" placeholder="e.g. Dr. Smith">
                </div>
                <div class="form-group" style="margin:0;">
                    <label class="form-label" for="description">Description</label>
                    <input type="text" name="description" id="description" class="form-input" value="{{ old('description') }}">
                </div>
                <div class="form-group" style="margin:0;">
                    <label class="form-label" for="color">Color</label>
                    <input type="color" name="color" id="color" class="form-input" value="{{ old('color', '#4F6EF7') }}" style="padding:4px;height:38px;">
                </div>
            </div>
            <div style="margin-top:14px;">
                <button type="submit" class="btn btn-primary"><x-icon name="plus" /> Add Course</button>
            </div>
        </form>
    </div>
</div>
@else
<div style="background:var(--warning-light);border:1px solid #FDE68A;border-radius:var(--radius-lg);padding:16px 20px;margin-bottom:24px;font-size:13.5px;color:#92400E;">
    No active semester. Create one first before adding courses.
</div>
@endif

{{-- Courses Table --}}
<div class="card">
    <div class="table-wrap">
        <table>
            <thead>
                <tr><th>Course</th><th>Code</th><th>Lecturer</th><th>Items</th><th style="width:80px;"></th></tr>
            </thead>
            <tbody>
                @forelse($courses as $course)
                <tr>
                    <td>
                        <div style="display:flex;align-items:center;gap:8px;">
                            <div style="width:10px;height:10px;border-radius:50%;background:{{ $course->color }};flex-shrink:0;"></div>
                            <a href="{{ route('course.show', $course) }}" style="font-weight:600;color:var(--primary);">{{ $course->name }}</a>
                        </div>
                    </td>
                    <td style="font-size:12.5px;color:var(--text-3);">{{ $course->code ?? '—' }}</td>
                    <td style="font-size:13px;">{{ $course->lecturer ?? '—' }}</td>
                    <td>{{ $course->napts_items_count }}</td>
                    <td>
                        <form method="POST" action="{{ route('admin.courses.destroy', $course) }}">
                            @csrf @method('DELETE')
                            <button class="btn btn-ghost btn-sm" data-confirm="Delete '{{ $course->name }}' and all its materials?" style="color:var(--danger);">
                                <x-icon name="trash-2" />
                            </button>
                        </form>
                    </td>
                </tr>
                @empty
                <tr><td colspan="5" style="text-align:center;color:var(--text-4);padding:32px;">No courses yet.</td></tr>
                @endforelse
            </tbody>
        </table>
    </div>
</div>

@endsection
