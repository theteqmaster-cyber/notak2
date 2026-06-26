<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    // Show login form
    public function showLogin()
    {
        return view('auth.login');
    }

    // Handle login
    public function login(Request $request)
    {
        $request->validate([
            'email'    => 'required|email',
            'password' => 'required',
        ]);

        // Rate limiting: 5 attempts per minute per IP+email
        $key = 'login.' . Str::lower($request->email) . '|' . $request->ip();
        if (RateLimiter::tooManyAttempts($key, 5)) {
            $seconds = RateLimiter::availableIn($key);

            // Log rate-limited attempt as flagged
            ActivityLog::record('login_failed', "Rate-limited login for {$request->email}", null, [
                'email' => $request->email,
            ], true);

            throw ValidationException::withMessages([
                'email' => "Too many login attempts. Try again in {$seconds} seconds.",
            ]);
        }

        $credentials = $request->only('email', 'password');
        $remember    = $request->boolean('remember');

        if (!Auth::attempt($credentials, $remember)) {
            RateLimiter::hit($key, 60);

            // Log failed attempt
            ActivityLog::record('login_failed', "Failed login attempt for {$request->email}", null, [
                'email' => $request->email,
            ], RateLimiter::attempts($key) >= 3);

            throw ValidationException::withMessages([
                'email' => 'These credentials do not match our records.',
            ]);
        }

        RateLimiter::clear($key);
        $request->session()->regenerate();

        $user = auth()->user();

        // Block inactive accounts
        if (!$user->is_active) {
            Auth::logout();
            throw ValidationException::withMessages([
                'email' => 'Your account has been deactivated.',
            ]);
        }

        ActivityLog::record('login', "User logged in: {$user->email}", $user->id);

        return match ($user->role) {
            'admin'  => redirect()->route('admin.dashboard'),
            'ci'     => redirect()->route('ci.dashboard'),
            default  => redirect()->route('dashboard'),
        };
    }

    // Show registration form
    public function showRegister()
    {
        return view('auth.register');
    }

    // Handle registration (students only — always assigned viewer role)
    public function register(Request $request)
    {
        $request->validate([
            'name'                  => 'required|string|max:100',
            'email'                 => 'required|email|unique:users,email',
            'password'              => 'required|min:8|confirmed',
            'password_confirmation' => 'required',
        ]);

        $user = User::create([
            'name'     => $request->name,
            'email'    => $request->email,
            'password' => $request->password, // cast auto-hashes
            'role'     => 'viewer',
        ]);

        Auth::login($user);
        $request->session()->regenerate();

        ActivityLog::record('register', "New viewer registered: {$user->email}", $user->id);

        return redirect()->route('dashboard');
    }

    // Logout
    public function logout(Request $request)
    {
        $userId = auth()->id();
        $email  = auth()->user()?->email;

        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        ActivityLog::record('logout', "User logged out: {$email}", $userId);

        return redirect()->route('login');
    }
}
