<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Inertia\Inertia;

class UserController extends Controller
{
    public function __construct()
    {
        // $this->middleware('auth');
        // $this->middleware('check.role:user');
    }

    public function index() {
        return Inertia::render('user.dashboard');
    }
}
