@extends('layouts.auth')
@section('title', 'Create Account')
@section('content')

<h2>Create account</h2>
<p>Join Notak2 to access your semester materials</p>

<form method="POST" action="{{ route('register') }}">
    @csrf

    <div class="form-group">
        <label class="form-label" for="name">Full name</label>
        <input id="name" name="name" type="text" class="form-input @error('name') error @enderror"
               value="{{ old('name') }}" autofocus required>
        @error('name')<span class="form-error">{{ $message }}</span>@enderror
    </div>

    <div class="form-group">
        <label class="form-label" for="email">Email address</label>
        <input id="email" name="email" type="email" class="form-input @error('email') error @enderror"
               value="{{ old('email') }}" required>
        @error('email')<span class="form-error">{{ $message }}</span>@enderror
    </div>

    <div class="form-group">
        <label class="form-label" for="password">Password <span style="color:var(--text-4);font-weight:400;">(min 8 chars)</span></label>
        <input id="password" name="password" type="password" class="form-input @error('password') error @enderror" required>
        @error('password')<span class="form-error">{{ $message }}</span>@enderror
    </div>

    <div class="form-group" style="margin-bottom:24px;">
        <label class="form-label" for="password_confirmation">Confirm password</label>
        <input id="password_confirmation" name="password_confirmation" type="password" class="form-input" required>
    </div>

    <button type="submit" class="btn btn-primary btn-full">Create account</button>
</form>

<div class="divider">or</div>

<p style="text-align:center;font-size:13px;color:var(--text-3);">
    Already have an account?
    <a href="{{ route('login') }}" style="color:var(--primary);font-weight:600;">Sign in</a>
</p>

@endsection
