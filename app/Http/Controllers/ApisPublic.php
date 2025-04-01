<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class ApisPublic extends Controller
{
    public function randomImage()
    {
        $unsplashAccessKey = env('UNSPLASH_ACCESS_KEY');
        $response = Http::get("https://api.unsplash.com/photos/random?client_id={$unsplashAccessKey}");
        // Get the image URL from the response
        $imageUrl = $response->json()['urls']['regular'];

        return response()->json(['imageUrl' => $imageUrl]);
    }
}
