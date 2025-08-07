<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use App\Models\WebsiteView;
use Illuminate\Support\Facades\Auth;


class LogWebsiteView
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle($request, Closure $next)
    {
        // You may ignore certain routes like admin or API
        if (!$request->is('admin/*') && !$request->is('api/*')) {
            WebsiteView::create([
                'user_id'     => Auth::id(),
                'ip_address'  => $request->ip(),
                'user_agent'  => $request->userAgent(),
                'referrer'    => $request->headers->get('referer'),
                'visited_url' => $request->fullUrl(),
                'visited_at'  => now(),
            ]);
        }

        return $next($request);
    }
}
