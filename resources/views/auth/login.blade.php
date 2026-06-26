@extends('layouts.auth')
@section('title', 'Sign In')
@section('content')

<h2>Welcome back</h2>
<p>Sign in to your Notak2 account</p>

<form method="POST" action="{{ route('login') }}" id="login-form">
    @csrf

    <div class="form-group">
        <label class="form-label" for="email">Email address</label>
        <input id="email" name="email" type="email" class="form-input @error('email') error @enderror"
               value="{{ old('email') }}" autocomplete="email" autofocus required>
        @error('email')<span class="form-error">{{ $message }}</span>@enderror
    </div>

    <div class="form-group">
        <label class="form-label" for="password">Password</label>
        <input id="password" name="password" type="password" class="form-input @error('password') error @enderror"
               autocomplete="current-password" required>
        @error('password')<span class="form-error">{{ $message }}</span>@enderror
    </div>

    <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:20px;">
        <label style="display:flex;gap:7px;align-items:center;font-size:13px;cursor:pointer;">
            <input type="checkbox" name="remember"> Remember me
        </label>
    </div>

    <button type="submit" class="btn btn-primary btn-full">Sign in</button>
</form>

<div class="divider">or</div>

<p style="text-align:center;font-size:13px;color:var(--text-3);">
    Don't have an account?
    <a href="{{ route('register') }}" style="color:var(--primary);font-weight:600;">Create one</a>
</p>

@endsection
