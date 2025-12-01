<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\PasswordResetRequestController;
use App\Http\Controllers\DashboardController; 
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
*/

Route::get('/', function () {
    return redirect()->route('login');
});

// --- GROUP DASHBOARD (Sales & Admin) ---
Route::middleware(['auth', 'verified'])->group(function () {
    
    // 1. Halaman Utama Dashboard (Statistik)
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    // 2. Halaman Daftar Prospek (Tabel Data) - [BARU DITAMBAHKAN]
    Route::get('/dashboard/prospects', [DashboardController::class, 'prospects'])->name('dashboard.prospects');
    
    // 3. Action Buttons (Import & Prediksi - Admin)
    Route::post('/dashboard/import', [DashboardController::class, 'import'])->name('dashboard.import');
    Route::post('/dashboard/predict', [DashboardController::class, 'runPredictions'])->name('dashboard.predict');

    // 4. CRUD Data Prospek
    Route::put('/dashboard/{id}', [DashboardController::class, 'update'])->name('dashboard.update');
    Route::post('/dashboard/store', [DashboardController::class, 'store'])->name('dashboard.store');

    // 5. Log Aktivitas Telepon (Sales) - [BARU DITAMBAHKAN]
    Route::post('/dashboard/log-activity', [DashboardController::class, 'logActivity'])->name('dashboard.logActivity');

});

// --- GROUP AUTH LAINNYA ---
Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    Route::resource('users', UserController::class);
    Route::put('/users/{id}/restore', [UserController::class, 'restore'])->name('users.restore');

    // Password Reset (Admin Side)
    Route::get('/admin/reset-password', [PasswordResetRequestController::class, 'index'])->name('admin.reset.index');
    Route::post('/admin/reset-password/{id}', [PasswordResetRequestController::class, 'reset'])->name('admin.reset.action');
    Route::delete('/admin/reset-password/{id}', [PasswordResetRequestController::class, 'destroy'])->name('admin.reset.destroy');
});

require __DIR__.'/auth.php';