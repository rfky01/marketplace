<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Chat;
use App\Models\User;
use Illuminate\Support\Facades\Auth;

class ChatController extends Controller
{
    // 1. Ambil daftar percakapan + Hitung Unread
    public function getConversations(Request $request)
    {
        $userId = $request->user()->id;

        $chats = Chat::where('sender_id', $userId)
                    ->orWhere('receiver_id', $userId)
                    ->orderBy('created_at', 'desc')
                    ->get();

        $contacts = [];
        $seenIds = [];

        foreach ($chats as $chat) {
            $otherUserId = ($chat->sender_id == $userId) ? $chat->receiver_id : $chat->sender_id;

            if (!in_array($otherUserId, $seenIds)) {
                $otherUser = User::find($otherUserId);
                
                if ($otherUser) {
                    $otherUser->last_message = $chat->message;
                    $otherUser->last_time = $chat->created_at;

                    // --- HITUNG PESAN BELUM DIBACA DARI ORANG INI ---
                    $unreadCount = Chat::where('sender_id', $otherUserId) // Pengirimnya dia
                                     ->where('receiver_id', $userId)      // Penerimanya saya
                                     ->where('is_read', false)            // Belum dibaca
                                     ->count();
                    
                    $otherUser->unread_count = $unreadCount;
                    // ----------------------------------------------
                    
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

    // 2. Ambil detail chat
    public function getMessages($userId)
    {
        $myId = Auth::id();

        $messages = Chat::where(function($q) use ($myId, $userId) {
            $q->where('sender_id', $myId)->where('receiver_id', $userId);
        })->orWhere(function($q) use ($myId, $userId) {
            $q->where('sender_id', $userId)->where('receiver_id', $myId);
        })
        ->orderBy('created_at', 'asc')
        ->get();

        return response()->json([
            'success' => true,
            'data' => $messages
        ]);
    }

    // 3. Kirim Pesan
    public function sendMessage(Request $request)
    {
        $request->validate([
            'receiver_id' => 'required|exists:users,id',
            'message' => 'required|string'
        ]);

        $chat = Chat::create([
            'sender_id' => Auth::id(),
            'receiver_id' => $request->receiver_id,
            'message' => $request->message
        ]);

        return response()->json(['success' => true, 'data' => $chat]);
    }

    // 4. TANDAI PESAN SUDAH DIBACA (Baru)
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

    public function showChat($id)
    {
        $myId = Auth::id();
        
        // Ambil chat antara Saya dan Dia
        $chats = Chat::where(function($q) use ($myId, $id) {
            $q->where('sender_id', $myId)->where('receiver_id', $id);
        })->orWhere(function($q) use ($myId, $id) {
            $q->where('sender_id', $id)->where('receiver_id', $myId);
        })->orderBy('created_at', 'asc')->get();

        return response()->json($chats);
    }
}