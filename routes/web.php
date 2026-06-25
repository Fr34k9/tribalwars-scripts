<?php

use App\Http\Controllers\DashboardController;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ScriptController;
use App\Http\Controllers\SubscriptionController;
use App\Http\Middleware\EnsureSubscribed;
use Illuminate\Support\Facades\Route;

Route::get('/', [HomeController::class, 'index'])->name('home');

// Subscription routes (auth required, not necessarily subscribed)
Route::middleware('auth')->group(function () {
    Route::get('/subscribe', [SubscriptionController::class, 'plans'])->name('subscription.plans');
    Route::post('/subscribe/checkout', [SubscriptionController::class, 'checkout'])->name('subscription.checkout');
    Route::get('/subscribe/success', [SubscriptionController::class, 'success'])->name('subscription.success');
    Route::get('/subscribe/cancel', [SubscriptionController::class, 'cancel'])->name('subscription.cancel');
});

// Subscriber-only routes
Route::middleware(['auth', 'verified', EnsureSubscribed::class])->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
    Route::get('/billing/portal', [SubscriptionController::class, 'portal'])->name('billing.portal');
    Route::get('/scripts/{script}/download', [ScriptController::class, 'download'])->name('script.download');
});

// Profile (auth only)
Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

// Stripe webhook (must be CSRF-exempt — handled by Cashier internally)
Route::post('/stripe/webhook', '\Laravel\Cashier\Http\Controllers\WebhookController@handleWebhook')
    ->name('cashier.webhook');

require __DIR__.'/auth.php';
