<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;

class OtpResetController extends Controller
{
    // --- HELPER: PENCARIAN PENUH (08, 62, +62) ---
    private function findUserAnyFormat($inputPhone)
    {
        // 1. Bersihkan input: Hapus semua karakter KECUALI angka
        // Contoh input: "+62 812-345" -> Jadi: "62812345"
        $cleanNumber = preg_replace('/[^0-9]/', '', $inputPhone);

        // 2. Standarisasi ke format '62...' (Internasional tanpa +)
        if (substr($cleanNumber, 0, 1) == '0') {
            $cleanNumber = '62' . substr($cleanNumber, 1);
        }

        // 3. Buat 3 Variasi untuk dicari di Database
        $format62   = $cleanNumber;                     // "628..."
        $format08   = '0' . substr($cleanNumber, 2);    // "08..."
        $formatPlus = '+' . $cleanNumber;               // "+62..."  <-- INI SOLUSI UNTUK DATA ANDA

        // 4. Cari User yang punya salah satu dari nomor tersebut
        // Kita gunakan whereIn agar bisa mengecek 3 kemungkinan sekaligus
        $user = User::whereIn('phone', [$format62, $format08, $formatPlus])->first();

        return $user;
    }

    // 1. KIRIM OTP
    public function sendOtp(Request $request)
    {
        $request->validate(['phone' => 'required']);
        
        // Cari user dengan segala format
        $user = $this->findUserAnyFormat($request->phone);

        if (!$user) {
            return response()->json(['message' => 'Nomor WhatsApp tidak terdaftar.'], 404);
        }

        // Simpan key cache menggunakan input asli user agar mudah diambil saat verifikasi
        // Atau agar lebih aman, kita simpan berdasarkan 'clean number' tapi user input juga harus di clean
        // Agar simpel, kita pakai input request saja, tapi pastikan konsisten.
        $otp = rand(100000, 999999);
        Cache::put('otp_reset_' . $request->phone, $otp, 300);

        // --- PERSIAPAN KIRIM KE GOWA ---
        // Gowa biasanya butuh format 62... (tanpa +) atau 08...
        // Kita ambil nomor dari database ($user->phone) lalu bersihkan
        
        $targetPhone = preg_replace('/[^0-9]/', '', $user->phone); // Hapus + jika ada
        if (substr($targetPhone, 0, 1) == '0') {
            $targetPhone = '62' . substr($targetPhone, 1); // Ubah 08 ke 62
        }
        
        $status = $this->sendWhatsappWithGowa($targetPhone, $otp, $user->name);

        if ($status) {
            return response()->json([
                'success' => true, 
                'message' => 'Kode OTP terkirim!',
                'username' => $user->name
            ]);
        } else {
            return response()->json([
                'success' => false, 
                'message' => 'Gagal mengirim WA. Cek server.'
                ], 500);
        }
    }

    // 2. VERIFIKASI & GANTI PASSWORD
    public function verifyAndReset(Request $request)
    {
        $request->validate([
            'phone' => 'required',
            'otp' => 'required',
            'password' => 'required|min:8|confirmed',
        ]);

        // Cek OTP
        $cachedOtp = Cache::get('otp_reset_' . $request->phone);

        if (!$cachedOtp || (string)$cachedOtp !== (string)$request->otp) {
            return response()->json(['message' => 'Kode OTP salah atau sudah kadaluarsa.'], 400);
        }

        // Cari User Lagi (Konsisten)
        $user = $this->findUserAnyFormat($request->phone);

        if ($user) {
            // Update Password Langsung ke DB
            User::where('id', $user->id)->update([
                'password' => Hash::make($request->password)
            ]);
            
            Cache::forget('otp_reset_' . $request->phone); 
            
            return response()->json([
                'success' => true, 
                'message' => 'Password berhasil diubah! Silakan login.'
            ]);
        } else {
            return response()->json(['message' => 'User tidak ditemukan.'], 404);
        }
    }

    // --- FUNGSI GOWA ---
    private function sendWhatsappWithGowa($targetPhone, $otp, $userName)
    {
        try {
            $message = "Halo {$userName},\n\nKode OTP Reset Password: *{$otp}*\n\nJangan berikan ke siapapun.";
            
            $response = Http::timeout(10)
                ->withHeaders(['X-Device-ID' => 'my-wa'])
                ->post('http://localhost:3000/send/message', [
                    'phone'   => $targetPhone, 
                    'message' => $message
                ]);
                
            return $response->successful();
        } catch (\Exception $e) {
            \Log::error("Gowa Error: " . $e->getMessage());
            return false;
        }
    }
}