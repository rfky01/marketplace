<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth; 
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Http; // TAMBAHAN PENTING
use Illuminate\Support\Facades\Validator; // TAMBAHAN

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
            'bio' => 'nullable|string',
            'jenis_kelamin' => 'nullable|in:Laki-laki,Perempuan',
            'tanggal_lahir' => 'nullable|date',
        ]);

        // Data yang akan diupdate
        $dataToUpdate = [
            'name' => $request->name,
            'phone' => $request->phone, // Pastikan mapping ke 'phone'
            'address' => $request->address,
            'npm' => $request->npm, 
            'prodi' => $request->prodi,   
            'fakultas' => $request->fakultas,
            'bio' => $request->bio,
            'jenis_kelamin' => $request->jenis_kelamin,
            'tanggal_lahir' => $request->tanggal_lahir,
        ];

        if ($request->hasFile('profile_photo')) {
            if ($user->profile_photo && Storage::disk('public')->exists($user->profile_photo)) {
                Storage::disk('public')->delete($user->profile_photo);
            }
            $path = $request->file('profile_photo')->store('profile_photos', 'public');
            $dataToUpdate['profile_photo'] = $path;
        }

        $user->update($dataToUpdate);
        $user->refresh();

        return response()->json([
            'success' => true,
            'message' => 'Profil berhasil diperbarui!',
            'data' => $user
        ]);
    }

    // --- FITUR OTP ---
    public function sendOtp(Request $request)
    {
        $request->validate([
            'no_hp' => 'required|numeric',
        ]);

        $phone = $request->no_hp;
        
        // Format nomor HP: Ubah 08xx jadi 628xx (Fonnte lebih suka 62)
        if (substr($phone, 0, 1) == '0') {
            $phone = '62' . substr($phone, 1);
        }

        $otp = rand(100000, 999999);
        \Illuminate\Support\Facades\Cache::put('otp_' . $request->no_hp, $otp, 300); // Simpan cache pakai input asli (08xx)

        try {
            // Tambahkan withoutVerifying() untuk localhost
            $response = \Illuminate\Support\Facades\Http::withoutVerifying()
                ->withHeaders([
                    'Authorization' => env('FONNTE_TOKEN'),
                ])->post('https://api.fonnte.com/send', [
                    'target' => $phone,
                    'message' => "Kode OTP Marketplace: *$otp*",
                ]);

            // Cek respon asli dari Fonnte
            $resBody = json_decode($response->body(), true);
            
            // Jika Fonnte bilang gagal (misal: device disconnected)
            if (isset($resBody['status']) && !$resBody['status']) {
                return response()->json([
                    'success' => false,
                    'message' => 'Fonnte Error: ' . ($resBody['reason'] ?? 'Unknown error')
                ], 500);
            }

            return response()->json([
                'success' => true,
                'message' => 'Kode OTP berhasil dikirim.'
            ]);

        } catch (\Exception $e) {
            // TAMPILKAN ERROR ASLI AGAR KITA TAHU PENYEBABNYA
            return response()->json([
                'success' => false,
                'message' => 'System Error: ' . $e->getMessage() 
            ], 500);
        }
    }

    // --- FITUR REGISTER ---
    public function register(Request $request)
    {
        // PERBAIKAN 1: Validasi input harus 'no_hp' (sesuai frontend), bukan 'phone'
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
            'no_hp' => 'required|string|unique:users,phone', // Cek unique ke kolom 'phone'
            'otp' => 'required|numeric',
            'address' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 400);
        }

        // PERBAIKAN 2: Ambil cache berdasarkan 'no_hp'
        $cachedOtp = \Illuminate\Support\Facades\Cache::get('otp_' . $request->no_hp);

        if (!$cachedOtp || $cachedOtp != $request->otp) {
            return response()->json([
                'message' => 'Kode OTP salah atau sudah kadaluarsa. Silakan kirim ulang.'
            ], 400);
        }

        // PERBAIKAN 3: Insert ke DB kolom 'phone' menggunakan data 'no_hp'
        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'phone' => $request->no_hp, // Masuk ke kolom 'phone'
            'address' => $request->address, // Pastikan di DB kolomnya 'address' atau 'alamat' (sesuaikan)
            'role' => 'pembeli',
        ]);

        $token = $user->createToken('auth_token')->plainTextToken;
        
        // Hapus OTP setelah sukses
        \Illuminate\Support\Facades\Cache::forget('otp_' . $request->no_hp);

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
        if (!Auth::attempt($request->only('email', 'password'))) {
            return response()->json([
                'message' => 'Login gagal, email atau password salah'
            ], 401);
        }

        $user = User::where('email', $request->email)->firstOrFail();
        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Login sukses',
            'user'    => $user,
            'token'   => $token,
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Logout berhasil']);
    }
}