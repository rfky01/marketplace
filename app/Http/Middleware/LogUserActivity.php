<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Carbon\Carbon;

class LogUserActivity
{
    public function handle(Request $request, Closure $next)
    {
        if (Auth::check()) {
            $userId = Auth::user()->id;
            
            // 1. Set status "Online" dengan masa berlaku 3 menit
            Cache::put('user-is-online-' . $userId, true, Carbon::now()->addMinutes(3));
            
            // 2. Catat WAKTU TERAKHIR DILIHAT (Disimpan tahan lama)
            Cache::put('user-last-seen-' . $userId, Carbon::now()->toDateTimeString(), Carbon::now()->addYear());
        }

        return $next($request);
    }
}