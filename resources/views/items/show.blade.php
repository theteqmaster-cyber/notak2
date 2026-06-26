@extends('layouts.app')
@section('title', $item->title)
@section('page-title', $item->title)

@section('topbar-actions')
    @if($item->hasFile())
    <a href="{{ route('item.download', $item) }}" class="btn btn-primary btn-sm">
        <x-icon name="download" /> Download
    </a>
    @endif
@endsection

@section('content')

{{-- Breadcrumb --}}
<div style="display:flex;align-items:center;gap:6px;font-size:13px;color:var(--text-3);margin-bottom:20px;">
    <a href="{{ route('dashboard') }}" style="color:var(--text-3);">Dashboard</a>
    <x-icon name="chevron-right" />
    <a href="{{ route('semester.show', $item->course->semester) }}" style="color:var(--text-3);">{{ $item->course->semester->name }}</a>
    <x-icon name="chevron-right" />
    <a href="{{ route('course.show', $item->course) }}" style="color:var(--text-3);">{{ $item->course->name }}</a>
    <x-icon name="chevron-right" />
    <span style="color:var(--text-1);font-weight:600;">{{ $item->title }}</span>
</div>

<div style="display:grid;grid-template-columns:1fr 280px;gap:24px;align-items:start;">
    {{-- Main Preview --}}
    <div>
        @if($item->hasExternalUrl())
        {{-- External URL --}}
        <div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-lg);padding:48px;text-align:center;">
            <x-icon name="globe" style="width:40px;height:40px;margin:0 auto 16px;color:var(--text-4);" />
            <div style="font-size:15px;font-weight:600;margin-bottom:8px;">External Source</div>
            <div style="font-size:13px;color:var(--text-3);margin-bottom:20px;word-break:break-all;">{{ $item->external_url }}</div>
            <a href="{{ $item->external_url }}" target="_blank" class="btn btn-primary">
                <x-icon name="external-link" /> Open Link
            </a>
        </div>

        @elseif($item->isPdf() && $downloadUrl)
        {{-- PDF Viewer --}}
        <div class="pdf-viewer-wrap" style="min-height:600px;">
            <iframe src="{{ $downloadUrl }}#toolbar=1" title="{{ $item->title }}"></iframe>
        </div>

        @elseif($item->isImage() && $downloadUrl)
        {{-- Image Viewer --}}
        <div style="background:var(--surface-2);border:1px solid var(--border);border-radius:var(--radius-lg);overflow:hidden;text-align:center;padding:16px;">
            <img src="{{ $downloadUrl }}" alt="{{ $item->title }}" style="max-width:100%;border-radius:var(--radius);">
        </div>

        @else
        {{-- Download-only --}}
        <div style="background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-lg);padding:48px;text-align:center;">
            <x-icon name="file" style="width:40px;height:40px;margin:0 auto 16px;color:var(--text-4);" />
            <div style="font-size:15px;font-weight:600;margin-bottom:4px;">{{ $item->file_name }}</div>
            <div style="font-size:13px;color:var(--text-3);margin-bottom:20px;">
                This file type cannot be previewed in-browser.
            </div>
            <a href="{{ route('item.download', $item) }}" class="btn btn-primary">
                <x-icon name="download" /> Download File
            </a>
        </div>
        @endif
    </div>

    {{-- Sidebar Info --}}
    <div class="card" style="position:sticky;top:calc(var(--topbar-h) + 20px);">
        <div class="card-header">
            <span class="card-title">Details</span>
            <span class="type-badge type-{{ $item->type }}">{{ $item->type_label }}</span>
        </div>
        <div class="card-body">
            <div style="display:flex;flex-direction:column;gap:14px;">

                @if($item->description)
                <div>
                    <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--text-4);margin-bottom:4px;">Description</div>
                    <p style="font-size:13.5px;color:var(--text-2);line-height:1.6;">{{ $item->description }}</p>
                </div>
                @endif

                <div>
                    <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--text-4);margin-bottom:4px;">Course</div>
                    <a href="{{ route('course.show', $item->course) }}" style="font-size:13.5px;color:var(--primary);font-weight:600;">{{ $item->course->name }}</a>
                </div>

                @if($item->file_name)
                <div>
                    <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--text-4);margin-bottom:4px;">File</div>
                    <div style="font-size:13px;color:var(--text-2);word-break:break-all;">{{ $item->file_name }}</div>
                    <div style="font-size:12px;color:var(--text-4);margin-top:2px;">{{ $item->file_size_human }}</div>
                </div>
                @endif

                <div>
                    <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--text-4);margin-bottom:4px;">Uploaded</div>
                    <div style="font-size:13px;color:var(--text-2);">{{ $item->created_at->format('d M Y, H:i') }}</div>
                    <div style="font-size:12px;color:var(--text-4);">{{ $item->uploader->name }}</div>
                </div>

                <div>
                    <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--text-4);margin-bottom:4px;">Downloads</div>
                    <div style="font-size:13px;color:var(--text-2);">{{ number_format($item->download_count) }}</div>
                </div>

                @if($item->tags)
                <div>
                    <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--text-4);margin-bottom:6px;">Tags</div>
                    <div style="display:flex;flex-wrap:wrap;gap:5px;">
                        @foreach(explode(',', $item->tags) as $tag)
                        <span style="background:var(--surface-2);border-radius:100px;padding:2px 9px;font-size:11.5px;color:var(--text-3);">{{ trim($tag) }}</span>
                        @endforeach
                    </div>
                </div>
                @endif

                @if($item->hasFile())
                <a href="{{ route('item.download', $item) }}" class="btn btn-primary btn-full">
                    <x-icon name="download" /> Download
                </a>
                @endif
            </div>
        </div>
    </div>
</div>

@endsection
