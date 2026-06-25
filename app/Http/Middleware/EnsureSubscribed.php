<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureSubscribed
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user?->canAccessPanel(\Filament\Facades\Filament::getPanel('admin'))) {
            return $next($request);
        }

        if (! $user?->subscribed()) {
            if ($request->is('api/*') || $request->expectsJson()) {
                return response()->json(['message' => 'Subscription required.'], 403);
            }

            return redirect()->route('subscription.plans')
                ->with('warning', 'You need an active subscription to access this.');
        }

        return $next($request);
    }
}
