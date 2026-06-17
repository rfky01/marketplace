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
    //--- Update Profile (VERSI FINAL - STRATEGI INTI NOMOR) ---
    public function updateUserProfile(Request $request)
    {
        $user = $request->user();

        // 1. Validasi Input Dasar
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

        // 2. VALIDASI NO TELEPON (SANGAT KETAT)
        if ($request->filled('phone')) {
            $inputPhone = $request->phone;

            // --- FUNGSI PENGAMBIL INTI NOMOR ---
            // Fungsi ini membuang 62, 0, +, spasi, strip
            // Contoh: "0812" -> "812"
            // Contoh: "62812" -> "812"
            // Contoh: "+62 812" -> "812"
            $getCoreNumber = function ($number) {
                // 1. Ambil angka saja
                $n = preg_replace('/[^0-9]/', '', $number); 
                
                // 2. Jika depannya 62, buang 62-nya
                if (substr($n, 0, 2) == '62') {
                    $n = substr($n, 2);
                }
                
                // 3. Jika depannya 0, buang 0-nya
                if (substr($n, 0, 1) == '0') {
                    $n = substr($n, 1);
                }
                
                return $n;
            };

            // Inti nomor dari input user
            $targetCore = $getCoreNumber($inputPhone);

            // Ambil semua nomor user lain
            $otherUsersPhones = \App\Models\User::where('id', '!=', $user->id)
                                                ->whereNotNull('phone')
                                                ->pluck('phone');

            // Cek satu per satu
            foreach ($otherUsersPhones as $dbPhone) {
                // Jika inti nomornya sama persis, tolak!
                if ($getCoreNumber($dbPhone) === $targetCore) {
                    return response()->json([
                        'message' => 'Gagal! Nomor WhatsApp ini sudah terdaftar di akun lain.'
                    ], 422);
                }
            }

            // Jika lolos, simpan input asli user
            $user->phone = $inputPhone;
        }

        // 3. Simpan data lainnya
        if ($request->has('name')) $user->name = $request->name;
        if ($request->has('address')) $user->address = $request->address;
        if ($request->has('npm')) $user->npm = $request->npm;
        if ($request->has('prodi')) $user->prodi = $request->prodi;
        if ($request->has('fakultas')) $user->fakultas = $request->fakultas;
        if ($request->has('bio')) $user->bio = $request->bio;
        if ($request->has('jenis_kelamin')) $user->jenis_kelamin = $request->jenis_kelamin;
        if ($request->has('tanggal_lahir')) $user->tanggal_lahir = $request->tanggal_lahir;

        // 4. Handle Foto Profil
        if ($request->hasFile('profile_photo')) {
            if ($user->profile_photo) {
                \Illuminate\Support\Facades\Storage::delete('public/' . $user->profile_photo);
            }
            $path = $request->file('profile_photo')->store('profile-photos', 'public');
            $user->profile_photo = $path;
        }

        // 5. Handle Foto KTM
        if ($request->hasFile('ktm_image')) {
            if ($user->ktm_image) {
                \Illuminate\Support\Facades\Storage::delete('public/' . $user->ktm_image);
            }
            $path = $request->file('ktm_image')->store('ktm-images', 'public');
            $user->ktm_image = $path;
        }

        $user->save();

        return response()->json([
            'success' => true,
            'message' => 'Profile updated successfully',
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
                    'message' => "Kode OTP PangkalMart: *" . $otp . "*",
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

    /**
     * @OA\Post(
     * path="/api/register",
     * tags={"Auth"},
     * summary="Register User Baru",
     * @OA\RequestBody(
     * required=true,
     * @OA\JsonContent(
     * required={"name","email","password", "role"},
     * @OA\Property(property="name", type="string", example="Budi Pembeli"),
     * @OA\Property(property="email", type="string", format="email", example="budi@gmail.com"),
     * @OA\Property(property="password", type="string", format="password", example="password123"),
     * @OA\Property(property="role", type="string", example="buyer", description="Pilih: buyer atau seller")
     * )
     * ),
     * @OA\Response(response=201, description="Berhasil Register")
     * )
     */

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

        \Illuminate\Support\Facades\DB::beginTransaction();
        
        try {
        // Simpan Anggota dan Beri Kartu Akses
        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'phone' => $request->phone, 
            'address' => $addressInput, 
            'role' => 'pembeli',
        ]);
        try {

        $user->assignRole('pembeli');

        } catch (\Exception $e) {
                // Jika role belum ada, buatkan otomatis (Self-Healing)
                \Spatie\Permission\Models\Role::create(['name' => 'pembeli']);
                $user->assignRole('pembeli');
            }

        // buat token
        $token = $user->createToken('auth_token')->plainTextToken;
        
        // Hapus OTP setelah sukses
        \Illuminate\Support\Facades\Cache::forget('otp_' . $request->phone);
        \Illuminate\Support\Facades\DB::commit();

        return response()->json([
            'success' => true,
            'data' => $user,
            'access_token' => $token,
            'token_type' => 'Bearer',
            'message' => 'Registrasi Berhasil',
        ], 201);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\DB::rollback();
            
            return response()->json([
                'message' => 'Gagal Register: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * @OA\Post(
     * path="/api/login",
     * tags={"Auth"},
     * summary="Login User (Seller/Buyer/Admin)",
     * description="Masukkan email dan password untuk mendapatkan Token",
     * @OA\RequestBody(
     * required=true,
     * @OA\JsonContent(
     * required={"email","password"},
     * @OA\Property(property="email", type="string", format="email", example="seller@example.com"),
     * @OA\Property(property="password", type="string", format="password", example="password")
     * )
     * ),
     * @OA\Response(
     * response=200,
     * description="Berhasil Login",
     * @OA\JsonContent(
     * @OA\Property(property="access_token", type="string", example="eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."),
     * @OA\Property(property="token_type", type="string", example="Bearer")
     * )
     * ),
     * @OA\Response(response=401, description="Email atau Password Salah")
     * )
     */
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
            'roles' => $user->getRoleNames(), // <--- KIRIM INI KE REACT
            'permissions' => $user->getAllPermissions()->pluck('name'),
        ]);
    }

    //--- Fungsi Logout---
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Logout berhasil']);
    }
}
