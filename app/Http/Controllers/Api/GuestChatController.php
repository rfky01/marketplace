<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\GuestChat;

class GuestChatController extends Controller
{
    // 1. Ambil Pesan (Untuk Frontend Tamu & Admin)
    public function getMessages($sessionId)
    {
        // Update status 'read' jika yang akses adalah Admin (opsional logic)
        // ...

        $messages = GuestChat::where('session_id', $sessionId)
            ->orderBy('created_at', 'asc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $messages
        ]);
    }

    // 2. Kirim Pesan (Tamu -> Admin)
    public function sendMessage(Request $request)
    {
        $request->validate([
            'session_id' => 'required|string',
            'message' => 'required|string',
        ]);

        $chat = GuestChat::create([
            'session_id' => $request->session_id,
            'admin_id' => 3, 
            'sender_type' => 'guest', // <--- PENTING: Pengirim Tamu
            'message' => $request->message
        ]);

        return response()->json(['success' => true, 'data' => $chat]);
    }

    // --- [BARU] 3. Balas Pesan (Admin -> Tamu) ---
    public function replyMessage(Request $request, $sessionId)
    {
        $request->validate(['message' => 'required|string']);

        $chat = GuestChat::create([
            'session_id' => $sessionId,
            'admin_id' => 3, // ID Admin (Auth::id())
            'sender_type' => 'admin', // <--- PENTING: Pengirim Admin
            'message' => $request->message,
            'is_read' => false 
        ]);

        return response()->json(['success' => true, 'data' => $chat]);
    }
}