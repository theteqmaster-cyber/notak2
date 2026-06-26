<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>@yield('title', 'Notak2') — Semester Manager</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="{{ asset('css/app.css') }}">
</head>
<body class="auth-body">
    <div class="auth-page">
        <div class="auth-brand">
            <div class="brand-icon-lg">N2</div>
            <h1 class="auth-brand-name">Notak<span class="brand-accent">2</span></h1>
            <p class="auth-tagline">Your semester, organized.</p>
        </div>
        <div class="auth-card">
            @yield('content')
        </div>
    </div>
</body>
</html>
