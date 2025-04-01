<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\Notification;

class NotificationsController extends Controller
{
    public function index(Request $request)
    {
        $user = Auth::user();

        $notifications = Notification::where(function ($query) use ($user) {
                $query->where('is_global', true)
                    ->orWhere(function ($q) use ($user) {
                        $q->where('target_type', 'user')->where('target_id', $user->id);
                    })
                    ->orWhere(function ($q) use ($user) {
                        $q->where('target_type', 'group')->where('target_id', $user->working_group_id);
                    })
                    ->orWhere(function ($q) use ($user) {
                        $q->where('target_type', 'role')->where('target_id', $user->role_id);
                    })
                    ->orWhereHas('users', function ($q) use ($user) {
                        $q->where('user_id', $user->id);
                    });
            })
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json(['notifications' => $notifications]);
    }

    public function markAsRead(Request $request, $id)
    {
        $notification = Notification::find($id);

        if ($notification) {
            $notification->users()->attach(Auth::user()->id);
        }

        return response()->json(['message' => 'Notification marked as read']);
    }
}
