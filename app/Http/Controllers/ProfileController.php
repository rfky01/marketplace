<?php

namespace App\Http\Controllers;

use App\Http\Requests\ProfileUpdateRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Support\Facades\Storage;
use Illuminate\View\View;

class ProfileController extends Controller
{
    /**
     * Display the user's profile form.
     */
    public function edit(Request $request): View
    {
        return view('profile.edit', [
            'user' => $request->user(),
        ]);
    }

    /**
     * Update the user's profile information.
     */
    public function update(Request $request)
    {
        $user = $request->user();

        // 1. VALIDASI DATA UMUM
        $request->validate([
            'name' => 'required|string|max:255',
            'nomor_kk' => 'nullable|string',
            'dusun_rt_rw' => 'nullable|string',
            'nik' => 'nullable|string',
            'address' => 'nullable|string',
            'bio' => 'nullable|string',
            'jenis_kelamin' => 'nullable|string',
            'tanggal_lahir' => 'nullable|date',
        ]);

        // 2. VALIDASI NO TELEPON (METODE PHP LOOPING - PASTI AKURAT)
        // Kita cek jika user mengirim data 'phone'
        if ($request->filled('phone')) {
            
            $inputPhone = $request->phone;

            // --- FUNGSI PEMBERSIH NOMOR (Sama seperti di Register) ---
            $normalize = function ($number) {
                // 1. Ambil angkanya saja (Hapus + - spasi)
                $n = preg_replace('/[^0-9]/', '', $number); 
                
                // 2. Normalisasi awalan (08 -> 8..., 628 -> 8...)
                if (substr($n, 0, 2) == '62') {
                    return substr($n, 2);
                } elseif (substr($n, 0, 1) == '0') {
                    return substr($n, 1);
                }
                return $n;
            };

            // Inti nomor yang diinput user (misal: "812345678")
            $targetNumber = $normalize($inputPhone);

            // Ambil semua nomor HP user LAIN dari database
            $otherUsers = \App\Models\User::where('id', '!=', $user->id) // Jangan cek diri sendiri
                                          ->whereNotNull('phone')
                                          ->pluck('phone');

            // Cek satu per satu secara manual
            foreach ($otherUsers as $dbPhone) {
                // Jika inti nomornya sama, tolak!
                if ($normalize($dbPhone) === $targetNumber) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Gagal! Nomor WhatsApp ini sudah terdaftar di akun lain.'
                    ], 422);
                }
            }

            // Jika lolos pengecekan, baru simpan
            $user->phone = $inputPhone;
        }

        // 3. FILL DATA LAIN
        $user->fill($request->except(['phone', 'profile_photo', 'ktp_image']));

        // 4. HANDLE UPLOAD FOTO
        if ($request->hasFile('profile_photo')) {
            if ($user->profile_photo) {
                Storage::delete('public/' . $user->profile_photo);
            }
            $user->profile_photo = $request->file('profile_photo')->store('profile-photos', 'public');
        }

        if ($request->hasFile('ktp_image')) {
            if ($user->ktp_image) {
                Storage::delete('public/' . $user->ktp_image);
            }
            $user->ktp_image = $request->file('ktp_image')->store('ktm-images', 'public');
        }

        if ($user->isDirty('email')) {
            $user->email_verified_at = null;
        }

        $user->save();

        return response()->json([
            'success' => true,
            'message' => 'Profil berhasil diperbarui!',
            'data' => $user
        ]);
    }

    /**
     * Delete the user's account.
     */
    public function destroy(Request $request): RedirectResponse
    {
        $request->validateWithBag('userDeletion', [
            'password' => ['required', 'current_password'],
        ]);

        $user = $request->user();

        Auth::logout();

        $user->delete();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return Redirect::to('/');
    }

    public function showPublicProfile($id)
    {
        $user = \App\Models\User::find($id);

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'User tidak ditemukan'
            ], 404);
        }

        // Hanya kembalikan data yang AMAN untuk publik
        // Jangan kirim password, token, atau data sensitif lainnya
        return response()->json([
            'success' => true,
            'data' => [
                'id' => $user->id,
                'name' => $user->name,
                'nomor_kk' => $user->nomor_kk,
                'email' => $user->email, // Opsional
                'profile_photo' => $user->profile_photo,
                'role' => $user->role,
                'bio' => $user->bio,
                'jenis_kelamin' => $user->jenis_kelamin,
                'created_at' => $user->created_at,
                'ktp_image' => $user->ktp_image,
                'address' => $user->address,
            ]
        ]);
    }
}
