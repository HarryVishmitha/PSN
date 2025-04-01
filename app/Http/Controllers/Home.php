<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Route;

class Home extends Controller
{
    public function index() {
        return Inertia::render('Home', [
            'canLogin' => Route::has('login'),
            'canRegister' => Route::has('register')
        ]);
    }
}
