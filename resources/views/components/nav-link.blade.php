@props(['route', 'icon' => 'circle', 'params' => []])

@php
    $isActive = request()->routeIs($route) || request()->routeIs($route . '.*');
@endphp

<a href="{{ route($route, $params) }}"
   class="nav-link {{ $isActive ? 'nav-link--active' : '' }}"
   id="nav-{{ str_replace(['.', '_'], '-', $route) }}">
    <x-icon :name="$icon" class="nav-icon" />
    <span>{{ $slot }}</span>
</a>
