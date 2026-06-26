<?php

use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\CiController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\NaptsItemController;
use App\Http\Controllers\Admin\AdminDashboardController;
use App\Http\Controllers\Admin\CourseController;
use App\Http\Controllers\Admin\ItemsController;
use App\Http\Controllers\Admin\SemesterController;
use App\Http\Controllers\Admin\UploadController;
use App\Models\Course;
use App\Models\Semester;
use Illuminate\Support\Facades\Route;

// ─── Public Auth Routes ────────────────────────────────────────────────────
Route::middleware('guest')->group(function () {
    Route::get('/login',    [AuthController::class, 'showLogin'])->name('login');
    Route::post('/login',   [AuthController::class, 'login'])->middleware('throttle:10,1');
    Route::get('/register', [AuthController::class, 'showRegister'])->name('register');
    Route::post('/register',[AuthController::class, 'register']);
});

Route::post('/logout', [AuthController::class, 'logout'])->name('logout')->middleware('auth');

// ─── Root redirect ─────────────────────────────────────────────────────────
Route::get('/', function () {
    if (!auth()->check()) return redirect()->route('login');
    return match (auth()->user()->role) {
        'admin' => redirect()->route('admin.dashboard'),
        'ci'    => redirect()->route('ci.dashboard'),
        default => redirect()->route('dashboard'),
    };
});

// ─── Viewer Routes (all authenticated users) ───────────────────────────────
Route::middleware('auth')->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    // Semesters (read-only view)
    Route::get('/semester/{semester}', function (Semester $semester) {
        $semester->load(['courses' => fn($q) => $q->withCount('naptsItems')]);
        return view('semesters.show', compact('semester'));
    })->name('semester.show');

    // Course NAPTS view
    Route::get('/course/{course}', [NaptsItemController::class, 'courseView'])->name('course.show');

    // Single item view
    Route::get('/item/{item}', [NaptsItemController::class, 'show'])->name('item.show');

    // Download (generates signed R2 URL)
    Route::get('/item/{item}/download', [NaptsItemController::class, 'download'])->name('item.download');

    // Archives list
    Route::get('/archives', function () {
        $archived = Semester::where('status', 'archived')
            ->with('archives')
            ->orderByDesc('end_date')
            ->get();
        return view('archives.index', compact('archived'));
    })->name('archives');
});

// ─── Admin Routes ──────────────────────────────────────────────────────────
Route::middleware(['auth', 'role:admin'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/',             [AdminDashboardController::class, 'index'])->name('dashboard');

    // Semesters
    Route::get('/semesters',              [SemesterController::class, 'index'])->name('semesters');
    Route::get('/semesters/create',       [SemesterController::class, 'create'])->name('semesters.create');
    Route::post('/semesters',             [SemesterController::class, 'store'])->name('semesters.store');
    Route::post('/semesters/{semester}/archive', [SemesterController::class, 'archive'])->name('semesters.archive');

    // Courses
    Route::get('/courses',        [CourseController::class, 'index'])->name('courses');
    Route::post('/courses',       [CourseController::class, 'store'])->name('courses.store');
    Route::delete('/courses/{course}', [CourseController::class, 'destroy'])->name('courses.destroy');

    // Upload
    Route::get('/upload',   [UploadController::class, 'showForm'])->name('upload');
    Route::post('/upload',  [UploadController::class, 'store'])->name('upload.store');

    // Items management
    Route::get('/items',              [ItemsController::class, 'index'])->name('items');
    Route::delete('/items/{item}',    [UploadController::class, 'destroy'])->name('items.destroy');

    // Users management
    Route::get('/users', function () {
        $users = \App\Models\User::orderBy('name')->paginate(30);
        return view('admin.users', compact('users'));
    })->name('users');

    Route::patch('/users/{user}/toggle', function (\App\Models\User $user) {
        if ($user->role === 'admin') abort(403, 'Cannot deactivate admin.');
        $user->update(['is_active' => !$user->is_active]);
        return back()->with('success', "User status updated.");
    })->name('users.toggle');
});

// ─── CI Routes ─────────────────────────────────────────────────────────────
Route::middleware(['auth', 'role:ci'])->prefix('ci')->name('ci.')->group(function () {
    Route::get('/',       [CiController::class, 'dashboard'])->name('dashboard');
    Route::get('/logs',   [CiController::class, 'logs'])->name('logs');
    Route::get('/alerts', [CiController::class, 'alerts'])->name('alerts');
});
