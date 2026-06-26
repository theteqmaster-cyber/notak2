@extends('layouts.app')
@section('title', $course->name)
@section('page-title', $course->name)

@section('content')

<div class="page-header">
    <div class="page-header-left">
        <h1>{{ $course->name }}</h1>
        <p>
            @if($course->code)<strong>{{ $course->code }}</strong> &nbsp;·&nbsp; @endif
            <a href="{{ route('semester.show', $course->semester) }}" style="color:var(--primary);">{{ $course->semester->name }}</a>
        </p>
    </div>
</div>

{{-- NAPTS Tabs --}}
@php
$tabs = [
    'N' => ['label'=>'Notes',         'icon'=>'notebook-pen'],
    'A' => ['label'=>'Assignments',   'icon'=>'clipboard-list'],
    'P' => ['label'=>'Presentations', 'icon'=>'presentation'],
    'T' => ['label'=>'Tests',         'icon'=>'file-check'],
    'S' => ['label'=>'Sources',       'icon'=>'library'],
];
@endphp

<div class="napts-tabs">
    @foreach($tabs as $key => $tab)
    <a href="{{ route('course.show', [$course, 'type' => $key]) }}"
       class="napts-tab type-{{ $key }} {{ $type === $key ? 'napts-tab--active' : '' }}"
       id="tab-{{ strtolower($key) }}">
        <x-icon :name="$tab['icon']" />
        {{ $tab['label'] }}
        <span class="napts-count">{{ $counts[$key] }}</span>
    </a>
    @endforeach
</div>

{{-- Items --}}
@if($items->isEmpty())
<div class="empty-state">
    <x-icon :name="$tabs[$type]['icon']" class="icon" />
    <h3>No {{ strtolower($tabs[$type]['label']) }} yet</h3>
    <p>Nothing uploaded under this category for {{ $course->name }}.</p>
</div>
@else
<div class="item-list">
    @foreach($items as $item)
    <div class="item-row type-{{ $item->type }}">
        <div class="item-icon">
            <x-icon :name="\App\Models\NaptsItem::\$typeIcons[$item->type]" />
        </div>
        <div class="item-info">
            <div class="item-title">{{ $item->title }}</div>
            <div class="item-meta">
                <span>{{ $item->created_at->format('d M Y') }}</span>
                @if($item->file_size)<span>{{ $item->file_size_human }}</span>@endif
                @if($item->tags)<span>{{ $item->tags }}</span>@endif
            </div>
        </div>
        <div class="item-actions">
            @if($item->hasExternalUrl())
            <a href="{{ $item->external_url }}" target="_blank" class="btn btn-secondary btn-sm">
                <x-icon name="external-link" /> Open
            </a>
            @else
            <a href="{{ route('item.show', $item) }}" class="btn btn-secondary btn-sm">
                <x-icon name="eye" /> View
            </a>
            <a href="{{ route('item.download', $item) }}" class="btn btn-primary btn-sm">
                <x-icon name="download" /> Download
            </a>
            @endif
        </div>
    </div>
    @endforeach
</div>
@endif

@endsection
