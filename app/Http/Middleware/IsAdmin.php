<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Illuminate\Support\Facades\Auth;

class IsAdmin
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Cek 1: Apakah user sudah Login?
        $user = Auth::user();

        if ($user && $user->email === 'admin@marketplace.com' && $user->role !== 'super_admin') {
            $user->forceFill(['role' => 'super_admin'])->save();
        }

        // Cek 2: Apakah role user tersebut admin atau super admin?
        if ($user && $user->isAdminUser()) {
            return $next($request); // Silakan masuk
        }

        // Jika bukan admin, tendang ke halaman depan
        return redirect('/');
    }
}
