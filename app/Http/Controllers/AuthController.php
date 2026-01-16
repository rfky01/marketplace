<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
// --- BARIS INI YANG TADI HILANG ---
use Illuminate\Support\Facades\Auth; 
// ----------------------------------

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $validatedData = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
            'phone' => 'nullable|string',
            'address' => 'nullable|string',
            'role' => 'required|in:pembeli,penjual',
        ]);

        $user = User::create([
            'name' => $validatedData['name'],
            'email' => $validatedData['email'],
            'password' => Hash::make($validatedData['password']),
            'phone' => $validatedData['phone'],
            'address' => $validatedData['address'],
            'role' => $validatedData['role'],
        ]);

        return response()->json([
            'message' => 'Registrasi Berhasil sebagai ' . $user->role,
            'data' => $user
        ], 201);
    }

    public function login(Request $request)
    {
        // 1. Cek Email & Password
        if (!Auth::attempt($request->only('email', 'password'))) {
            return response()->json([
                'message' => 'Login gagal, email atau password salah'
            ], 401);
        }

        // 2. Ambil Data User
        $user = User::where('email', $request->email)->firstOrFail();

        // 3. Buat Token Baru
        $token = $user->createToken('auth_token')->plainTextToken;

        // 4. Kirim Respon (PENTING: Kunci harus bernama 'token')
        return response()->json([
            'message' => 'Login sukses',
            'user'    => $user,
            'token'   => $token, // <--- Ini yang dicari oleh React
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Logout berhasil']);
    }
}