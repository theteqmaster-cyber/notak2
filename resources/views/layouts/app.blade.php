<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="Notak2 — Semester Management System for university students">
    <title>@yield('title', 'Notak2') — Semester Manager</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="{{ asset('css/app.css') }}">
    @stack('head')
</head>
<body>

<div id="app-layout">
    {{-- Sidebar Navigation --}}
    <aside id="sidebar" class="sidebar">
        <div class="sidebar-header">
            <a href="{{ route('dashboard') }}" class="sidebar-brand">
                <div class="brand-icon">N2</div>
                <span class="brand-name">Notak<span class="brand-accent">2</span></span>
            </a>
        </div>

        <nav class="sidebar-nav">
            @auth
                @if(auth()->user()->isViewer())
                    <x-nav-link route="dashboard" icon="layout-dashboard">Dashboard</x-nav-link>
                    @php $activeSemester = \App\Models\Semester::where('status','active')->first(); @endphp
                    @if($activeSemester)
                        <x-nav-link route="semester.show" :params="[$activeSemester]" icon="book-open">Active Semester</x-nav-link>
                    @endif
                    <x-nav-link route="archives" icon="archive">Archives</x-nav-link>
                @endif

                @if(auth()->user()->isAdmin())
                    <div class="nav-section-label">Content</div>
                    <x-nav-link route="admin.dashboard" icon="layout-dashboard">Dashboard</x-nav-link>
                    <x-nav-link route="admin.upload" icon="upload">Upload</x-nav-link>
                    <x-nav-link route="admin.items" icon="files">All Items</x-nav-link>

                    <div class="nav-section-label">Management</div>
                    <x-nav-link route="admin.semesters" icon="calendar">Semesters</x-nav-link>
                    <x-nav-link route="admin.courses" icon="book">Courses</x-nav-link>
                    <x-nav-link route="admin.users" icon="users">Users</x-nav-link>
                @endif

                @if(auth()->user()->isCi())
                    <div class="nav-section-label">Monitoring</div>
                    <x-nav-link route="ci.dashboard" icon="shield">CI Dashboard</x-nav-link>
                    <x-nav-link route="ci.logs" icon="scroll-text">Activity Logs</x-nav-link>
                    <x-nav-link route="ci.alerts" icon="triangle-alert">Alerts</x-nav-link>
                @endif
            @endauth
        </nav>

        <div class="sidebar-footer">
            @auth
            <div class="user-chip">
                <div class="user-avatar">{{ strtoupper(substr(auth()->user()->name, 0, 1)) }}</div>
                <div class="user-info">
                    <div class="user-name">{{ auth()->user()->name }}</div>
                    <div class="user-role">{{ ucfirst(auth()->user()->role) }}</div>
                </div>
            </div>
            <form method="POST" action="{{ route('logout') }}">
                @csrf
                <button type="submit" class="btn-logout" title="Sign out">
                    <x-icon name="log-out" />
                </button>
            </form>
            @endauth
        </div>
    </aside>

    {{-- Main Content --}}
    <main id="main-content" class="main-content">
        <header class="topbar">
            <button class="sidebar-toggle" id="sidebarToggle" aria-label="Toggle sidebar">
                <x-icon name="menu" />
            </button>
            <div class="topbar-title">@yield('page-title', 'Dashboard')</div>
            <div class="topbar-actions">@yield('topbar-actions')</div>
        </header>

        {{-- Flash messages --}}
        @if(session('success'))
            <div class="flash flash-success">
                <x-icon name="circle-check" /> {{ session('success') }}
            </div>
        @endif
        @if($errors->any())
            <div class="flash flash-error">
                <x-icon name="circle-x" />
                <ul>@foreach($errors->all() as $e)<li>{{ $e }}</li>@endforeach</ul>
            </div>
        @endif

        <div class="page-body">
            @yield('content')
        </div>
    </main>
</div>

<script src="{{ asset('js/app.js') }}"></script>
@stack('scripts')
</body>
</html>
