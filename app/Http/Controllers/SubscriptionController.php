<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class SubscriptionController extends Controller
{
    public function plans()
    {
        return view('subscription.plans');
    }

    public function checkout(Request $request)
    {
        $request->validate(['price' => 'required|string']);

        return $request->user()
            ->newSubscription('default', $request->price)
            ->checkout([
                'success_url' => route('subscription.success'),
                'cancel_url'  => route('subscription.cancel'),
            ]);
    }

    public function success()
    {
        return view('subscription.success');
    }

    public function cancel()
    {
        return view('subscription.cancel');
    }

    public function portal(Request $request)
    {
        return $request->user()->redirectToBillingPortal(route('dashboard'));
    }
}
