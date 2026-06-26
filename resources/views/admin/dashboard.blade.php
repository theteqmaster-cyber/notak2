@extends('layouts.app')
@section('title', 'Admin Dashboard')
@section('page-title', 'Admin Dashboard')

@section('content')

<div class="stats-grid">
    @php
    $statCards = [
        ['label'=>'Total Items',     'value'=>$stats['total_items'],     'icon'=>'files',      'color'=>'#4F6EF7','bg'=>'#EEF1FE'],
        ['label'=>'Courses',         'value'=>$stats['total_courses'],    'icon'=>'book',       'color'=>'#22C55E','bg'=>'#DCFCE7'],
        ['label'=>'Students',        'value'=>$stats['total_users'],      'icon'=>'users',      'color'=>'#8B5CF6','bg'=>'#EDE9FE'],
        ['label'=>'Semesters',       'value'=>$stats['total_semesters'],  'icon'=>'calendar',   'color'=>'#F59E0B','bg'=>'#FEF3C7'],
        ['label'=>'Notes',           'value'=>$stats['type_N'],           'icon'=>'notebook-pen','color'=>'#4F6EF7','bg'=>'#EEF1FE'],
        ['label'=>'Assignments',     'value'=>$stats['type_A'],           'icon'=>'clipboard-list','color'=>'#F59E0B','bg'=>'#FEF3C7'],
        ['label'=>'Presentations',   'value'=>$stats['type_P'],           'icon'=>'presentation','color'=>'#8B5CF6','bg'=>'#EDE9FE'],
        ['label'=>'Tests',           'value'=>$stats['type_T'],           'icon'=>'file-check', 'color'=>'#EF4444','bg'=>'#FEE2E2'],
    ];
    @endphp
    @foreach($statCards as $s)
    <div class="stat-card">
        <div class="stat-icon" style="background:{{ $s['bg'] }};color:{{ $s['color'] }};">
            <x-icon :name="$s['icon']" />
        </div>
        <div class="stat-value">{{ $s['value'] }}</div>
        <div class="stat-label">{{ $s['label'] }}</div>
    </div>
    @endforeach
</div>

{{-- Quick Actions --}}
<div style="display:flex;gap:10px;margin-bottom:28px;flex-wrap:wrap;">
    <a href="{{ route('admin.upload') }}"    class="btn btn-primary"><x-icon name="upload" /> Upload Material</a>
    <a href="{{ route('admin.semesters') }}" class="btn btn-secondary"><x-icon name="calendar" /> Semesters</a>
    <a href="{{ route('admin.courses') }}"   class="btn btn-secondary"><x-icon name="book" /> Courses</a>
    <a href="{{ route('admin.users') }}"     class="btn btn-secondary"><x-icon name="users" /> Users</a>
</div>

{{-- Recent Uploads --}}
@if($stats['recent_uploads']->isNotEmpty())
<div class="card">
    <div class="card-header">
        <span class="card-title">Recent Uploads</span>
        <a href="{{ route('admin.items') }}" class="btn btn-ghost btn-sm">View all</a>
    </div>
    <div class="card-body" style="padding:12px;">
        <div class="item-list">
            @foreach($stats['recent_uploads'] as $item)
            <div class="item-row type-{{ $item->type }}">
                <div class="item-icon"><x-icon :name="\App\Models\NaptsItem::\$typeIcons[$item->type]" /></div>
                <div class="item-info">
                    <div class="item-title">{{ $item->title }}</div>
                    <div class="item-meta">
                        <span>{{ $item->course->name }}</span>
                        <span>{{ $item->created_at->diffForHumans() }}</span>
                        @if($item->file_size)<span>{{ $item->file_size_human }}</span>@endif
                    </div>
                </div>
                <div class="item-actions">
                    <span class="type-badge type-{{ $item->type }}">{{ $item->type_label }}</span>
                    <form method="POST" action="{{ route('admin.items.destroy', $item) }}" style="display:inline;">
                        @csrf @method('DELETE')
                        <button class="btn btn-ghost btn-sm" data-confirm="Delete '{{ $item->title }}'?" style="color:var(--danger);">
                            <x-icon name="trash-2" />
                        </button>
                    </form>
                </div>
            </div>
            @endforeach
        </div>
    </div>
</div>
@endif

@endsection
