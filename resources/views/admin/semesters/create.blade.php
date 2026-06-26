@extends('layouts.app')
@section('title', 'New Semester')
@section('page-title', 'Create Semester')

@section('content')
<div style="max-width:560px;">
<div class="card">
    <div class="card-header"><span class="card-title">Semester Details</span></div>
    <div class="card-body">
        <form method="POST" action="{{ route('admin.semesters.store') }}">
            @csrf
            <div class="form-group">
                <label class="form-label" for="name">Semester Name</label>
                <input type="text" name="name" id="name" class="form-input @error('name') error @enderror"
                       value="{{ old('name') }}" placeholder="e.g. Semester 3 — 2026" required>
                @error('name')<span class="form-error">{{ $message }}</span>@enderror
            </div>
            <div class="form-group">
                <label class="form-label" for="academic_year">Academic Year</label>
                <input type="text" name="academic_year" id="academic_year" class="form-input"
                       value="{{ old('academic_year', date('Y')) }}" placeholder="e.g. 2026" required>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
                <div class="form-group">
                    <label class="form-label" for="start_date">Start Date</label>
                    <input type="date" name="start_date" id="start_date" class="form-input" value="{{ old('start_date') }}">
                </div>
                <div class="form-group">
                    <label class="form-label" for="end_date">End Date</label>
                    <input type="date" name="end_date" id="end_date" class="form-input" value="{{ old('end_date') }}">
                </div>
            </div>
            <div class="form-group">
                <label class="form-label" for="description">Description <span style="color:var(--text-4);font-weight:400;">(optional)</span></label>
                <textarea name="description" id="description" class="form-textarea">{{ old('description') }}</textarea>
            </div>
            <div style="display:flex;gap:10px;margin-top:8px;">
                <button type="submit" class="btn btn-primary"><x-icon name="plus" /> Create Semester</button>
                <a href="{{ route('admin.semesters') }}" class="btn btn-secondary">Cancel</a>
            </div>
        </form>
    </div>
</div>
</div>
@endsection
