<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth; 
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Http; 
use Illuminate\Support\Facades\Validator; 
use Illuminate\Support\Facades\Cache;

class AuthController extends Controller
{
    // --- FITUR PROFILE ---
    public function getUserProfile(Request $request)
    {
        return response()->json([
            'success' => true,
            'data' => $request->user()
        ]);
    }

    //--- Update Profile ---
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
            'profile_photo' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            'ktm_image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            'bio' => 'nullable|string',
            'jenis_kelamin' => 'nullable|in:Laki-laki,Perempuan',
            'tanggal_lahir' => 'nullable|date',
        ]);

        $phoneInput = $request->phone ?? $request->no_hp ?? $request->telepon ?? $user->phone;
        $addressInput = $request->address ?? $request->alamat ?? $user->address;

        // Data yang akan diupdate
        $dataToUpdate = [
            'name' => $request->name,
            'phone' => $phoneInput,
            'address' => $addressInput,
            'npm' => $request->npm, 
            'prodi' => $request->prodi,   
            'fakultas' => $request->fakultas,
            'bio' => $request->bio,
            'jenis_kelamin' => $request->jenis_kelamin,
            'tanggal_lahir' => $request->tanggal_lahir,
        ];

        // Update Foto Profile
        if ($request->hasFile('profile_photo')) {
            // Check Foto Lama (Jika Ada Hapus)
            if ($user->profile_photo && Storage::disk('public')->exists($user->profile_photo)) {
                Storage::disk('public')->delete($user->profile_photo);
            }
            // Simpan Foto Baru
            $path = $request->file('profile_photo')->store('profile_photos', 'public');
            $dataToUpdate['profile_photo'] = $path;
        }

        // Update Foto KTM
        if ($request->hasFile('ktm_image')) {
            // Check Foto Lama (Jika Ada Hapus)
            if ($user->ktm_image && Storage::disk('public')->exists($user->ktm_image)) {
                Storage::disk('public')->delete($user->ktm_image);
            }
            // Simpan foto baru
            $pathKtm = $request->file('ktm_image')->store('ktm_images', 'public');
            $dataToUpdate['ktm_image'] = $pathKtm;
        }

        $user->update($dataToUpdate);
        $user->refresh();

        return response()->json([
            'success' => true,
            'message' => 'Profil berhasil diperbarui!',
            'data' => $user
        ]);
    }

    // --- FITUR OTP (verifikasi nomor WA) ---
    public function sendOtp(Request $request)
    {
        $request->validate([
            'phone' => 'required|numeric',
        ]);

        $phone = $request->phone;       
        // Format Nomor HP: Go Server butuh 628xxx
        if (substr($phone, 0, 1) == '0') {
            $phone = '62' . substr($phone, 1);
        }

        // Generate OTP
        $otp = rand(100000, 999999);        
        // Simpan cache selama 300 detik
        \Illuminate\Support\Facades\Cache::put('otp_' . $request->phone, $otp, 300); 

        try {
            // KIRIM KE SERVER GO LOKAL            
            $response = \Illuminate\Support\Facades\Http::timeout(10)
                ->withHeaders([
                    'X-Device-ID' => 'my-wa', 
                ])
                ->post('http://localhost:3000/send/message', [
                    'phone'   => $phone,
                    'message' => "Kode OTP MarketplacePlus: *" . $otp . "*",
                ]);

            // Cek apakah Server Go berhasil menerima request
            if ($response->successful()) {
                return response()->json([
                    'success' => true,
                    'message' => 'Kode OTP berhasil dikirim via Server Lokal.'
                ]);
            } else {
                // Jika Server Go merespon error
                return response()->json([
                    'success' => false,
                    'message' => 'Gagal kirim WA: ' . $response->body()
                ], 500);
            }

        } catch (\Exception $e) {
            // Jika Server Go mati atau tidak bisa dihubungi
            return response()->json([
                'success' => false,
                'message' => 'Server WA Mati/Error: ' . $e->getMessage() 
            ], 500);
        }
    }

    // --- FITUR REGISTER ---
    public function register(Request $request)
    {
        // Validasi input
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|not_regex:/\d/|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
            'phone' => 'required|string|unique:users,phone', 
            'otp' => 'required|numeric',
            'address' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 400);
        }

        // Ambil cache berdasarkan 'phone'
        $cachedOtp = \Illuminate\Support\Facades\Cache::get('otp_' . $request->phone);

        if (!$cachedOtp || $cachedOtp != $request->otp) {
            return response()->json([
                'message' => 'Kode OTP salah atau sudah kadaluarsa. Silakan kirim ulang.'
            ], 400);
        }
        $addressInput = $request->address ?? $request->alamat;

        // Simpan Anggota dan Beri Kartu Akses
        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'phone' => $request->phone, 
            'address' => $addressInput, 
            'role' => 'pembeli',
        ]);

        // buat token
        $token = $user->createToken('auth_token')->plainTextToken;
        
        // Hapus OTP setelah sukses
        \Illuminate\Support\Facades\Cache::forget('otp_' . $request->phone);

        return response()->json([
            'success' => true,
            'data' => $user,
            'access_token' => $token,
            'token_type' => 'Bearer',
            'message' => 'Registrasi Berhasil',
        ], 201);
    }

    // --- FITUR LOGIN ---
    public function login(Request $request)
    {
        // Check Email
        $user = User::where('email', $request->email)->first();
        if (!$user) {
            return response()->json([
                'message' => 'Akun tidak ditemukan atau telah dihapus. Silakan Daftar akun baru.'
            ], 404); 
        }

        // Check Password
        if (!Auth::attempt($request->only('email', 'password'))) {
            return response()->json([
                'message' => 'Login gagal, email atau password salah'
            ], 401);
        }

        $user = User::where('email', $request->email)->firstOrFail();
        $token = $user->createToken('auth_token')->plainTextToken;

        // Penentu Arah Login (REDIRECT)
        $tujuan = '/'; // Dashboard Users (Utama)
        
        if ($user->role === 'admin') {
            $tujuan = '/admin/dashboard'; // Dashboard Admin
        }

        return response()->json([
            'message' => 'Login sukses',
            'user'    => $user,
            'token'   => $token,
            'redirect_url' => $tujuan, 
        ]);
    }

    //--- Fungsi Logout---
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Logout berhasil']);
    }
}