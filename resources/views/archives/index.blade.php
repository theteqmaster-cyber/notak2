@extends('layouts.app')
@section('title', 'Archives')
@section('page-title', 'Archives')

@section('content')

@if($archived->isEmpty())
    <div class="empty-state">
        <x-icon name="archive" class="icon" style="color:var(--border)" />
        <h2>No archived semesters yet</h2>
        <p>Semesters appear here once they are marked as archived by an admin.</p>
    </div>
@else
    <p style="color:var(--text-3);margin-bottom:24px;font-size:14px;">
        {{ $archived->count() }} archived semester{{ $archived->count() !== 1 ? 's' : '' }} — all materials are still available for download.
    </p>

    <div style="display:flex;flex-direction:column;gap:20px;">
        @foreach($archived as $semester)
        <div class="card">
            <div class="card-header">
                <div>
                    <span class="card-title">{{ $semester->name }}</span>
                    @if($semester->academic_year)
                        <span style="font-size:12px;color:var(--text-3);margin-left:8px;">{{ $semester->academic_year }}</span>
                    @endif
                </div>
                <div style="display:flex;gap:8px;align-items:center;">
                    <span style="padding:2px 10px;border-radius:999px;background:#F1F5F9;
                                 color:#64748B;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.5px;">
                        Archived
                    </span>
                    @if($semester->end_date)
                        <span style="font-size:12px;color:var(--text-3);">
                            Ended {{ \Carbon\Carbon::parse($semester->end_date)->format('d M Y') }}
                        </span>
                    @endif
                </div>
            </div>

            <div class="card-body">
                {{-- Course grid --}}
                @if($semester->courses->isNotEmpty())
                    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px;margin-bottom:16px;">
                        @foreach($semester->courses as $course)
                        <a href="{{ route('course.show', $course) }}"
                           style="display:flex;align-items:center;gap:10px;padding:12px 14px;
                                  border-radius:var(--radius);border:1px solid var(--border);
                                  text-decoration:none;color:var(--text-1);
                                  transition:border-color .15s,box-shadow .15s;"
                           onmouseover="this.style.borderColor='var(--primary)';this.style.boxShadow='0 0 0 3px var(--primary-light)'"
                           onmouseout="this.style.borderColor='var(--border)';this.style.boxShadow='none'">
                            <div style="width:8px;height:8px;border-radius:50%;background:{{ $course->color ?? 'var(--primary)' }};flex-shrink:0;"></div>
                            <span style="font-size:13px;font-weight:500;">{{ $course->name }}</span>
                        </a>
                        @endforeach
                    </div>
                @else
                    <p style="font-size:13px;color:var(--text-3);margin:0 0 12px;">No courses in this semester.</p>
                @endif

                {{-- Archive downloads --}}
                @if($semester->archives->isNotEmpty())
                    <div style="border-top:1px solid var(--border);padding-top:14px;margin-top:4px;">
                        <p style="font-size:12px;font-weight:600;color:var(--text-3);text-transform:uppercase;letter-spacing:.5px;margin:0 0 10px;">
                            <x-icon name="package" style="width:13px;height:13px;" /> Generated Archives
                        </p>
                        <div style="display:flex;flex-wrap:wrap;gap:8px;">
                            @foreach($semester->archives as $archive)
                                @if($archive->status === 'ready')
                                <a href="#" {{-- TODO: signed R2 URL for archive zip --}}
                                   style="display:inline-flex;align-items:center;gap:6px;
                                          padding:6px 14px;border-radius:var(--radius);
                                          background:var(--primary);color:#fff;font-size:13px;
                                          font-weight:500;text-decoration:none;">
                                    <x-icon name="download" style="width:14px;height:14px;" />
                                    {{ $archive->zip_name ?? 'Download Archive' }}
                                    @if($archive->zip_size)
                                        <span style="opacity:.75;font-size:11px;">
                                            ({{ round($archive->zip_size / 1048576, 1) }} MB)
                                        </span>
                                    @endif
                                </a>
                                @elseif($archive->status === 'generating')
                                <span style="display:inline-flex;align-items:center;gap:6px;
                                             padding:6px 14px;border-radius:var(--radius);
                                             background:#FEF3C7;color:#D97706;font-size:13px;font-weight:500;">
                                    <x-icon name="loader" style="width:14px;height:14px;" />
                                    Generating…
                                </span>
                                @endif
                            @endforeach
                        </div>
                    </div>
                @endif
            </div>
        </div>
        @endforeach
    </div>
@endif

@endsection
