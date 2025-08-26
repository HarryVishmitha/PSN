<?php

namespace App\Providers;

use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;
use App\Models\Estimate;
use App\Policies\EstimatePolicy;
use Illuminate\Support\Facades\Gate;

class AuthServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        //
    }

    protected $policies = [
        Estimate::class => EstimatePolicy::class,
        // ... any other model → policy mappings ...
    ];

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        $this->registerPolicies();
        //
        Gate::define('manage-payment-methods', function ($user) {
            // Adjust role check to your app
            return $user && in_array($user->role->name ?? '', ['admin', 'superadmin']);
        });
    }
}
