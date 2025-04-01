<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\User;
use Illuminate\Support\Facades\Log;


class CheckRole
{
    public function handle(Request $request, Closure $next, $role)
    {
        // Debugging line
        Log::info('Role:', [$role]);
        // Check if the user is authenticated and has the required role
        if (Auth::check() && Auth::user()->role->name !== $role) {
            // Redirect if the user doesn't have the correct role
            return redirect('/auth/redirection');
        }

        return $next($request);  // Continue to the next middleware or request
    }
}
