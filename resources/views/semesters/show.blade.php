@extends('layouts.app')
@section('title', $semester->name)
@section('page-title', $semester->name)

@section('content')

<div class="page-header">
    <div class="page-header-left">
        <h1>{{ $semester->name }}</h1>
        <p>{{ $semester->academic_year }} &nbsp;·&nbsp;
            <span class="badge badge-{{ $semester->status }}">{{ ucfirst($semester->status) }}</span>
        </p>
    </div>
    @if($semester->isArchived())
    <a href="{{ route('archives') }}" class="btn btn-secondary btn-sm">
        <x-icon name="archive" /> View Archives
    </a>
    @endif
</div>

@if($semester->courses->isEmpty())
<div class="empty-state">
    <x-icon name="book" class="icon" />
    <h3>No courses yet</h3>
    <p>Courses will appear here once added by the admin.</p>
</div>
@else
<div class="courses-grid">
    @foreach($semester->courses as $course)
    <a href="{{ route('course.show', $course) }}" class="course-card">
        <div class="course-card-accent" style="background:{{ $course->color }};"></div>
        <div class="course-card-body">
            @if($course->code)<div class="course-code">{{ $course->code }}</div>@endif
            <div class="course-name">{{ $course->name }}</div>
            @if($course->lecturer)<div class="course-lecturer">{{ $course->lecturer }}</div>@endif
        </div>
        <div class="course-card-footer">
            <span>{{ $course->napts_items_count }} items</span>
            <x-icon name="chevron-right" />
        </div>
    </a>
    @endforeach
</div>
@endif

@endsection
