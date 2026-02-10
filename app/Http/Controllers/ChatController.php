<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Chat;
use App\Models\User;
use Illuminate\Support\Facades\Auth;

class ChatController extends Controller
{
    //--- Ambil daftar percakapan + Hitung Jumlah yang Belum Di Baca ---
    public function getConversations(Request $request)
    {
        $userId = $request->user()->id;

        $chats = Chat::where('sender_id', $userId)
                    ->orWhere('receiver_id', $userId)
                    ->orderBy('created_at', 'desc')
                    ->get();

        // Menyaring Daftar Contact Supaya Tidak Double
        $contacts = [];
        $seenIds = [];

        foreach ($chats as $chat) {
            $otherUserId = ($chat->sender_id == $userId) ? $chat->receiver_id : $chat->sender_id;

            if (!in_array($otherUserId, $seenIds)) {
                $otherUser = User::find($otherUserId);
                
                if ($otherUser) {
                    $otherUser->last_message = $chat->message;
                    $otherUser->last_time = $chat->created_at;

                    //  Hitung Pesan yang Belum di Baca
                    $unreadCount = Chat::where('sender_id', $otherUserId) // Pengirimnya dia
                                     ->where('receiver_id', $userId)      // Penerimanya saya
                                     ->where('is_read', false)            // Belum dibaca
                                     ->count();
                    
                    $otherUser->unread_count = $unreadCount;                    
                    $contacts[] = $otherUser;
                    $seenIds[] = $otherUserId;
                }
            }
        }

        return response()->json([
            'success' => true,
            'data' => $contacts
        ]);
    }

    //--- Membuka Ruang Chat ---
    public function getMessages($userId)
    {
        $myId = Auth::id();

        $messages = Chat::where(function($q) use ($myId, $userId) {
            // Saya Kirim Ke Dia
            $q->where('sender_id', $myId)->where('receiver_id', $userId);
        })->orWhere(function($q) use ($myId, $userId) {
            // Dia Kirim Ke Saya
            $q->where('sender_id', $userId)->where('receiver_id', $myId);
        })
        ->orderBy('created_at', 'asc')
        ->get();

        return response()->json([
            'success' => true,
            'data' => $messages
        ]);
    }

    //--- Kirim Pesan ---
    public function sendMessage(Request $request)
    {
        // Validasi Tujuan
        $request->validate([
            'receiver_id' => 'required|exists:users,id',
            'message' => 'required|string'
        ]);

        // Simpan ke Database
        $chat = Chat::create([
            'sender_id' => Auth::id(),
            'receiver_id' => $request->receiver_id,
            'message' => $request->message
        ]);

        return response()->json(['success' => true, 'data' => $chat]);
    }

    //--- Tandai Pesan Sudah di Baca (Centang Biru) ---
    public function markAsRead($senderId)
    {
        $myId = Auth::id();

        // Update semua pesan dari pengirim tersebut menjadi 'sudah dibaca'
        Chat::where('sender_id', $senderId)
            ->where('receiver_id', $myId)
            ->where('is_read', false)
            ->update(['is_read' => true]);

        return response()->json(['success' => true]);
    }

    //--- Membuka Ruang Chat ---
    public function showChat($id)
    {
        $myId = Auth::id();
        
        $chats = Chat::where(function($q) use ($myId, $id) {
            // Saya Kirim ke Dia
            $q->where('sender_id', $myId)->where('receiver_id', $id);
        })->orWhere(function($q) use ($myId, $id) {
            // Dia Kirim ke Saya
            $q->where('sender_id', $id)->where('receiver_id', $myId);
        })->orderBy('created_at', 'asc')->get();

        return response()->json($chats);
    }
}