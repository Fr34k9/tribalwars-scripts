<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureSubscribed
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! $request->user()?->subscribed()) {
            if ($request->expectsJson()) {
                return response()->json(['message' => 'Subscription required.'], 403);
            }

            return redirect()->route('subscription.plans')
                ->with('warning', 'You need an active subscription to access this.');
        }

        return $next($request);
    }
}
