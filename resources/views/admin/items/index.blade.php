@extends('layouts.app')
@section('title', 'All Items')
@section('page-title', 'All Items')

@section('topbar-actions')
    <a href="{{ route('admin.upload') }}" class="btn btn-primary btn-sm">
        <x-icon name="upload" /> Upload New
    </a>
@endsection

@section('content')

{{-- Filters --}}
<form method="GET" action="{{ route('admin.items') }}" style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:20px;align-items:flex-end;">
    <div class="form-group" style="margin:0;min-width:160px;">
        <label class="form-label">Type</label>
        <select name="type" class="form-control form-control-sm">
            <option value="">All Types</option>
            @foreach(['N'=>'Notes','A'=>'Assignments','P'=>'Presentations','T'=>'Tests','S'=>'Sources'] as $k=>$v)
                <option value="{{ $k }}" {{ request('type') === $k ? 'selected' : '' }}>{{ $v }}</option>
            @endforeach
        </select>
    </div>

    <div class="form-group" style="margin:0;min-width:200px;">
        <label class="form-label">Search</label>
        <input type="text" name="search" class="form-control form-control-sm"
               placeholder="Search by title…" value="{{ request('search') }}">
    </div>

    <div style="display:flex;gap:8px;">
        <button type="submit" class="btn btn-primary btn-sm">
            <x-icon name="search" /> Filter
        </button>
        @if(request()->hasAny(['type','search','course']))
            <a href="{{ route('admin.items') }}" class="btn btn-ghost btn-sm">Clear</a>
        @endif
    </div>
</form>

{{-- Active filter badges --}}
@if(request()->hasAny(['type','search']))
<div style="display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap;">
    @if(request('type'))
        <span class="type-badge type-{{ request('type') }}">{{ ['N'=>'Notes','A'=>'Assignments','P'=>'Presentations','T'=>'Tests','S'=>'Sources'][request('type')] }}</span>
    @endif
    @if(request('search'))
        <span class="badge">Search: "{{ request('search') }}"</span>
    @endif
</div>
@endif

{{-- Items Table --}}
<div class="card">
    <div class="card-header">
        <span class="card-title">
            {{ $items->total() }} item{{ $items->total() !== 1 ? 's' : '' }}
        </span>
    </div>

    @if($items->isEmpty())
        <div class="empty-state">
            <x-icon name="files" class="icon" style="color:var(--border)" />
            <p>No items found. <a href="{{ route('admin.upload') }}">Upload something</a>.</p>
        </div>
    @else
        <div class="table-wrap">
            <table>
                <thead>
                    <tr>
                        <th>Type</th>
                        <th>Title</th>
                        <th>Course</th>
                        <th>Semester</th>
                        <th>Size</th>
                        <th>Downloads</th>
                        <th>Uploaded</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($items as $item)
                    <tr>
                        <td>
                            <span class="type-badge type-{{ $item->type }}">{{ $item->type_label }}</span>
                        </td>
                        <td>
                            <a href="{{ route('item.show', $item) }}" style="font-weight:500;color:var(--text-1);text-decoration:none;">
                                {{ $item->title }}
                            </a>
                            @if($item->description)
                                <div style="font-size:12px;color:var(--text-3);margin-top:2px;">{{ Str::limit($item->description, 60) }}</div>
                            @endif
                        </td>
                        <td style="font-size:13px;">
                            @if($item->course)
                                <a href="{{ route('course.show', $item->course) }}" style="color:var(--primary);text-decoration:none;">
                                    {{ $item->course->name }}
                                </a>
                            @else
                                <span style="color:var(--text-3)">—</span>
                            @endif
                        </td>
                        <td style="font-size:12px;color:var(--text-3);">
                            {{ $item->course?->semester?->name ?? '—' }}
                        </td>
                        <td style="font-size:12px;color:var(--text-3);">
                            {{ $item->file_size_human }}
                        </td>
                        <td style="font-size:13px;text-align:center;">
                            {{ $item->download_count }}
                        </td>
                        <td style="font-size:12px;color:var(--text-3);white-space:nowrap;">
                            {{ $item->created_at->format('d M Y') }}
                        </td>
                        <td>
                            <div style="display:flex;gap:6px;align-items:center;">
                                <a href="{{ route('item.show', $item) }}"
                                   class="btn btn-ghost btn-sm" title="View">
                                    <x-icon name="eye" />
                                </a>
                                <form method="POST" action="{{ route('admin.items.destroy', $item) }}" style="display:inline;">
                                    @csrf @method('DELETE')
                                    <button type="submit" class="btn btn-ghost btn-sm"
                                            data-confirm="Delete '{{ $item->title }}'? This cannot be undone."
                                            style="color:var(--danger);" title="Delete">
                                        <x-icon name="trash-2" />
                                    </button>
                                </form>
                            </div>
                        </td>
                    </tr>
                    @endforeach
                </tbody>
            </table>
        </div>

        {{-- Pagination --}}
        @if($items->hasPages())
        <div style="padding:16px 20px;border-top:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;">
            <span style="font-size:13px;color:var(--text-3);">
                Showing {{ $items->firstItem() }}–{{ $items->lastItem() }} of {{ $items->total() }}
            </span>
            {{ $items->links() }}
        </div>
        @endif
    @endif
</div>

@endsection
