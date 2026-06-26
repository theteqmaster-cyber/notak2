@extends('layouts.app')
@section('title', 'Dashboard')
@section('page-title', 'Dashboard')

@section('content')

{{-- Active Semester Banner --}}
@if($activeSemester)
<div style="background:var(--primary);color:#fff;border-radius:var(--radius-lg);padding:20px 24px;margin-bottom:28px;display:flex;align-items:center;justify-content:space-between;gap:16px;">
    <div>
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;opacity:.75;margin-bottom:4px;">Active Semester</div>
        <div style="font-size:20px;font-weight:800;">{{ $activeSemester->name }}</div>
        @if($activeSemester->start_date)
        <div style="font-size:12.5px;opacity:.8;margin-top:4px;">
            {{ $activeSemester->start_date->format('d M Y') }}
            @if($activeSemester->end_date) — {{ $activeSemester->end_date->format('d M Y') }} @endif
        </div>
        @endif
    </div>
    <a href="{{ route('semester.show', $activeSemester) }}" class="btn btn-secondary btn-sm">
        <x-icon name="book-open" /> View Semester
    </a>
</div>
@else
<div style="background:var(--warning-light);border:1px solid #FDE68A;border-radius:var(--radius-lg);padding:18px 22px;margin-bottom:28px;color:#92400E;font-weight:500;font-size:13.5px;display:flex;gap:10px;align-items:center;">
    <x-icon name="triangle-alert" /> No active semester. Ask your admin to create one.
</div>
@endif

{{-- NAPTS Stats --}}
<div class="stats-grid">
    @php
    $typeData = [
        ['label'=>'Courses',       'value'=>$stats['courses'],       'icon'=>'book',          'color'=>'#4F6EF7','bg'=>'#EEF1FE'],
        ['label'=>'Notes',         'value'=>$stats['notes'],         'icon'=>'notebook-pen',  'color'=>'#4F6EF7','bg'=>'#EEF1FE'],
        ['label'=>'Assignments',   'value'=>$stats['assignments'],   'icon'=>'clipboard-list','color'=>'#F59E0B','bg'=>'#FEF3C7'],
        ['label'=>'Presentations', 'value'=>$stats['presentations'], 'icon'=>'presentation',  'color'=>'#8B5CF6','bg'=>'#EDE9FE'],
        ['label'=>'Tests',         'value'=>$stats['tests'],         'icon'=>'file-check',    'color'=>'#EF4444','bg'=>'#FEE2E2'],
        ['label'=>'Sources',       'value'=>$stats['sources'],       'icon'=>'library',       'color'=>'#22C55E','bg'=>'#DCFCE7'],
    ];
    @endphp
    @foreach($typeData as $d)
    <div class="stat-card">
        <div class="stat-icon" style="background:{{ $d['bg'] }};color:{{ $d['color'] }}">
            <x-icon :name="$d['icon']" />
        </div>
        <div class="stat-value">{{ $d['value'] }}</div>
        <div class="stat-label">{{ $d['label'] }}</div>
    </div>
    @endforeach
</div>

{{-- Recent Uploads --}}
@if($recentItems->isNotEmpty())
<div class="card">
    <div class="card-header">
        <span class="card-title">Recent Uploads</span>
    </div>
    <div class="card-body" style="padding:12px;">
        <div class="item-list">
            @foreach($recentItems as $item)
            <a href="{{ route('item.show', $item) }}" class="item-row type-{{ $item->type }}" style="text-decoration:none;">
                <div class="item-icon">
                    <x-icon :name="\App\Models\NaptsItem::\$typeIcons[$item->type]" />
                </div>
                <div class="item-info">
                    <div class="item-title">{{ $item->title }}</div>
                    <div class="item-meta">
                        <span>{{ $item->course->name }}</span>
                        <span>{{ $item->created_at->diffForHumans() }}</span>
                        @if($item->file_size)<span>{{ $item->file_size_human }}</span>@endif
                    </div>
                </div>
                <span class="type-badge type-{{ $item->type }}">{{ $item->type_label }}</span>
            </a>
            @endforeach
        </div>
    </div>
</div>
@endif

@endsection
