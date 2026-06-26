@extends('layouts.app')
@section('title', 'Upload Material')
@section('page-title', 'Upload Material')

@section('content')

<div style="max-width:680px;">
<form method="POST" action="{{ route('admin.upload.store') }}" enctype="multipart/form-data">
    @csrf

    {{-- NAPTS Type Selector --}}
    <div class="card" style="margin-bottom:20px;">
        <div class="card-header"><span class="card-title">Content Type</span></div>
        <div class="card-body">
            <input type="hidden" name="type" id="type-input" value="{{ old('type', 'N') }}">
            @php
            $types = [
                'N' => ['label'=>'Notes',         'icon'=>'notebook-pen',  'color'=>'#4F6EF7','bg'=>'#EEF1FE'],
                'A' => ['label'=>'Assignments',   'icon'=>'clipboard-list','color'=>'#F59E0B','bg'=>'#FEF3C7'],
                'P' => ['label'=>'Presentations', 'icon'=>'presentation',  'color'=>'#8B5CF6','bg'=>'#EDE9FE'],
                'T' => ['label'=>'Tests',         'icon'=>'file-check',    'color'=>'#EF4444','bg'=>'#FEE2E2'],
                'S' => ['label'=>'Sources',       'icon'=>'library',       'color'=>'#22C55E','bg'=>'#DCFCE7'],
            ];
            $selectedType = old('type', 'N');
            @endphp
            <div style="display:flex;gap:8px;flex-wrap:wrap;">
                @foreach($types as $key => $t)
                <button type="button" class="type-selector-btn {{ $selectedType === $key ? 'selected' : '' }}"
                        data-type="{{ $key }}"
                        id="type-btn-{{ $key }}"
                        style="display:flex;align-items:center;gap:8px;padding:10px 16px;border-radius:var(--radius);border:2px solid var(--border);background:var(--surface);cursor:pointer;font-weight:600;font-size:13px;transition:all .15s;color:var(--text-2);">
                    <x-icon :name="$t['icon']" />
                    {{ $t['label'] }}
                </button>
                @endforeach
            </div>
            @error('type')<span class="form-error">{{ $message }}</span>@enderror
        </div>
    </div>

    {{-- Course --}}
    <div class="card" style="margin-bottom:20px;">
        <div class="card-header"><span class="card-title">Course & Details</span></div>
        <div class="card-body">
            <div class="form-group">
                <label class="form-label" for="course_id">Course</label>
                <select name="course_id" id="course_id" class="form-select @error('course_id') error @enderror" required>
                    <option value="">Select a course...</option>
                    @foreach($courses as $course)
                    <option value="{{ $course->id }}" {{ old('course_id') == $course->id ? 'selected' : '' }}>
                        {{ $course->code ? "[$course->code] " : '' }}{{ $course->name }}
                    </option>
                    @endforeach
                </select>
                @error('course_id')<span class="form-error">{{ $message }}</span>@enderror
            </div>

            <div class="form-group">
                <label class="form-label" for="title">Title</label>
                <input type="text" name="title" id="title" class="form-input @error('title') error @enderror"
                       value="{{ old('title') }}" placeholder="e.g. Week 3 — Entity Relationship Diagrams" required>
                @error('title')<span class="form-error">{{ $message }}</span>@enderror
            </div>

            <div class="form-group">
                <label class="form-label" for="description">Description <span style="color:var(--text-4);font-weight:400;">(optional)</span></label>
                <textarea name="description" id="description" class="form-textarea">{{ old('description') }}</textarea>
            </div>

            <div class="form-group">
                <label class="form-label" for="tags">Tags <span style="color:var(--text-4);font-weight:400;">(optional, comma-separated)</span></label>
                <input type="text" name="tags" id="tags" class="form-input" value="{{ old('tags') }}" placeholder="e.g. week3, erd, databases">
            </div>
        </div>
    </div>

    {{-- File / URL --}}
    <div class="card" style="margin-bottom:24px;">
        <div class="card-header"><span class="card-title">File or URL</span></div>
        <div class="card-body">
            <div class="file-drop-wrap" style="margin-bottom:16px;">
                <div class="file-drop" id="file-drop-zone">
                    <x-icon name="upload" class="file-drop-icon" />
                    <div class="file-drop-label">Drop file here or click to browse</div>
                    <div class="file-drop-hint">PDF, DOCX, PPTX, JPG, PNG, MD — max 500 MB</div>
                    <input type="file" name="file" id="file-input" accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png,.webp,.md,.txt">
                </div>
            </div>
            @error('file')<span class="form-error" style="display:block;margin-top:-8px;margin-bottom:12px;">{{ $message }}</span>@enderror

            <div class="divider">or external URL (for Sources)</div>

            <div class="form-group" style="margin-bottom:0;">
                <label class="form-label" for="external_url">External URL</label>
                <input type="url" name="external_url" id="external_url" class="form-input @error('external_url') error @enderror"
                       value="{{ old('external_url') }}" placeholder="https://...">
                @error('external_url')<span class="form-error">{{ $message }}</span>@enderror
            </div>
        </div>
    </div>

    <div style="display:flex;gap:10px;">
        <button type="submit" class="btn btn-primary" id="submit-upload">
            <x-icon name="upload" /> Upload Material
        </button>
        <a href="{{ route('admin.items') }}" class="btn btn-secondary">Cancel</a>
    </div>
</form>
</div>

@push('scripts')
<style>
.type-selector-btn.selected {
    border-color: var(--primary);
    background: var(--primary-light);
    color: var(--primary);
}
</style>
@endpush

@endsection
