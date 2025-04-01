<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class Authredirection extends Controller
{
    public function index()
    {
        $user = Auth::user();
        if ($user->role->name == 'admin') {
            return redirect()->route('admin.dashboard');
        } else {
            return redirect()->route('user.dashboard');
        }
    }
}
