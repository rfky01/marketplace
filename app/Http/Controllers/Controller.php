<?php

namespace App\Http\Controllers;

use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Foundation\Validation\ValidatesRequests;
use Illuminate\Routing\Controller as BaseController;
use Illuminate\Http\Request;

/**
 * @OA\Info(
 * version="1.0.0",
 * title="Dokumentasi API Marketplace",
 * description="Dokumentasi lengkap untuk API Marketplace Magang",
 * @OA\Contact(
 * email="admin@marketplace.com"
 * )
 * )
 *
 * @OA\SecurityScheme(
 * securityScheme="bearerAuth",
 * type="http",
 * scheme="bearer",
 * bearerFormat="JWT",
 * description="Masukkan Token Sanctum di sini"
 * )
 */
class Controller extends BaseController
{
    use AuthorizesRequests, ValidatesRequests;

    /**
     * @OA\Post(
     * path="/api/send-otp",
     * tags={"Otentikasi"},
     * summary="Kirim OTP WhatsApp",
     * description="Mengirim kode OTP ke nomor WhatsApp user sebelum registrasi",
     * operationId="sendOtp",
     * @OA\RequestBody(
     * required=true,
     * description="Data nomor HP yang akan dikirimkan OTP",
     * @OA\JsonContent(
     * required={"phone"},
     * @OA\Property(
     * property="phone",
     * type="string",
     * example="081234567890",
     * description="Nomor WhatsApp aktif (format Indonesia)"
     * ),
     * ),
     * ),
     * @OA\Response(
     * response=200,
     * description="OTP Berhasil Dikirim",
     * @OA\JsonContent(
     * @OA\Property(property="success", type="boolean", example=true),
     * @OA\Property(property="message", type="string", example="Kode OTP terkirim ke WhatsApp!")
     * )
     * ),
     * @OA\Response(
     * response=500,
     * description="Gagal Kirim OTP (Fonnte Error / Server Error)",
     * @OA\JsonContent(
     * @OA\Property(property="success", type="boolean", example=false),
     * @OA\Property(property="message", type="string", example="Gagal kirim OTP")
     * )
     * )
     * )
     */
    public function sendOtp(Request $request) 
    {
        // ... logika kodingan backend Anda di sini ...
        // Biasanya logic send OTP ditaruh di AuthController, tapi disini juga tidak apa-apa untuk dokumentasi base.
        return response()->json(['message' => 'Ini hanya contoh respon']);
    }
}