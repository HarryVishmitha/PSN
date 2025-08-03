<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Route;
use Illuminate\Http\JsonResponse;
use App\Models\Category;
use Illuminate\Support\Facades\Log;

class Home extends Controller
{
    public function index()
    {

        return Inertia::render('Home', [
            'canLogin' => Route::has('login'),
            'canRegister' => Route::has('register')
        ]);
    }

    public function categories(): JsonResponse
    {
        try {
            $categories = Category::where('active', 1)
                ->withCount('products')
                ->withCount('views')
                ->get();

            $hasZeroView = $categories->contains(fn($cat) => $cat->views_count === 0);

            if ($hasZeroView) {
                $latestCategory = Category::where('active', 1)
                    ->latest('created_at')
                    ->first();

                if ($latestCategory && !$categories->contains('id', $latestCategory->id)) {
                    $latestCategory->loadCount(['products', 'views']);
                    $categories->push($latestCategory);
                }
            }

            return response()->json([
                'success' => true,
                'data' => $categories,
            ]);
        } catch (\Exception $e) {
            // Log the error if you want

            Log::error('Failed to fetch categories: '.$e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve categories.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function allProducts()
    {
        return Inertia::render('Aproducts', [
            'canLogin' => Route::has('login'),
            'canRegister' => Route::has('register')
        ]);
    }

    public function cart()
    {
        return Inertia::render('Cart');
    }

    public function checkout()
    {
        return Inertia::render('Checkout');
    }

    public function designs()
    {
        return Inertia::render('Designs', [
            'canLogin' => Route::has('login'),
            'canRegister' => Route::has('register')
        ]);
    }
}
