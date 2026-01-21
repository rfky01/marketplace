<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
// --- BARIS INI YANG TADI HILANG ---
use Illuminate\Support\Facades\Auth; 
use Illuminate\Support\Facades\Storage;
// ----------------------------------

class AuthController extends Controller
{

    public function getUserProfile(Request $request)
    {
        return response()->json([
            'success' => true,
            'data' => $request->user()
        ]);
    }

    public function updateUserProfile(Request $request)
    {
    $user = $request->user();

    $request->validate([
        'name' => 'required|string|max:255',
        'phone' => 'nullable|string|max:20',
        'address' => 'nullable|string',
        'npm' => 'nullable|string|max:20', 
        'prodi' => 'nullable|string|max:100',  
        'fakultas' => 'nullable|string|max:100',
        'profile_photo' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048', // Validasi foto
    ]);

    // Data yang akan diupdate
    $dataToUpdate = [
        'name' => $request->name,
        'phone' => $request->phone,
        'address' => $request->address,
        'npm' => $request->npm, 
        'prodi' => $request->prodi,   
        'fakultas' => $request->fakultas,
    ];

    // Cek jika ada upload foto
    if ($request->hasFile('profile_photo')) {
        // 1. Hapus foto lama jika ada (opsional, biar hemat storage)
        if ($user->profile_photo && Storage::disk('public')->exists($user->profile_photo)) {
            Storage::disk('public')->delete($user->profile_photo);
        }

        // 2. Simpan foto baru
        $path = $request->file('profile_photo')->store('profile_photos', 'public');
        $dataToUpdate['profile_photo'] = $path;
    }

    $user->update($dataToUpdate);
    $user->refresh();
    $user->load('updater');

    return response()->json([
        'success' => true,
        'message' => 'Profil berhasil diperbarui!',
        'data' => $user
    ]);
    }

    public function register(Request $request)
    {
        $validatedData = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
            'phone' => 'nullable|string',
            'address' => 'nullable|string',
            // 'role' dihapus dari validasi karena otomatis
        ]);

        $user = User::create([
            'name' => $validatedData['name'],
            'email' => $validatedData['email'],
            'password' => Hash::make($validatedData['password']),
            'phone' => $validatedData['phone'],
            'address' => $validatedData['address'],
            'role' => 'pembeli', // <--- HARDCODE: SEMUA JADI PEMBELI DULU
        ]);

        return response()->json([
            'message' => 'Registrasi Berhasil',
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