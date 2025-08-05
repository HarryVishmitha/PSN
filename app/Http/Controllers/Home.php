<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Route;
use Illuminate\Http\JsonResponse;
use App\Models\Category;
use Illuminate\Support\Facades\Log;
use App\Models\Product;
use Illuminate\Support\Facades\DB;

class Home extends Controller
{
    public function index()
    {

        return Inertia::render('Home', [
            'canLogin' => Route::has('login'),
            'canRegister' => Route::has('register')
        ]);
    }

    public function navCategories(): JsonResponse
    {
        try {
            $navCategories = \App\Models\NavCategory::where('is_visible', 1)
                ->orderBy('nav_order')
                ->with(['category.products.workingGroup', 'category.products.images']) // Load working group and images for filtering
                ->get();

            $navCategories = $navCategories->map(function ($navCategory) {
                if (
                    $navCategory->category &&
                    $navCategory->category->active == 1
                ) {
                    // Filter only products from public working groups
                    $navCategory->category->setRelation(
                        'products',
                        $navCategory->category->products->filter(function ($product) {
                            return $product->status === 'published'
                                && $product->workingGroup
                                && strtolower($product->workingGroup->name) === 'public';
                        })->values()
                    );
                    return $navCategory;
                }

                // Invalidate category if not active
                $navCategory->category = null;
                return $navCategory;
            })->filter(function ($navCategory) {
                // Only keep valid ones
                return $navCategory->category !== null;
            })->values();

            return response()->json([
                'success' => true,
                'data' => $navCategories,
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to fetch categories: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve categories.',
                'error' => $e->getMessage(),
            ], 500);
        }
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

            Log::error('Failed to fetch categories: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve categories.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function mostPProducts(): JsonResponse
    {
        try {
            $products = Product::select('products.*', DB::raw('COUNT(product_views.id) as view_count'))
                ->join('working_groups', 'products.working_group_id', '=', 'working_groups.id')
                ->leftJoin('product_views', 'products.id', '=', 'product_views.product_id')
                ->where('products.status', 'published')
                ->whereNull('products.deleted_at')
                ->where('working_groups.status', 'public')
                ->groupBy('products.id')
                ->orderByDesc('view_count')
                ->with(['images']) // Optional: eager load images
                ->take(5) // Limit top 5
                ->get();

            return response()->json([
                'success' => true,
                'data' => $products,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch most popular products.',
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

    public function quotations()
    {
        return Inertia::render('Quotations');
    }

    public function cart()
    {

        return Inertia::render('Indevelopment');
        // return Inertia::render('Cart');
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
