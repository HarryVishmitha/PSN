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
use App\Models\WorkingGroup;
use Illuminate\Support\Str;

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
        Log::info('Fetching most popular products');

        try {
            $products = Product::withCount('views')
                ->with('images') // Eager load images
                ->where('status', 'published')
                ->whereNull('deleted_at')
                ->whereHas('workingGroup', function ($query) {
                    $query->where('status', 'public');
                })
                ->orderByDesc('views_count')
                ->take(5)
                ->get();

            Log::info('Most popular products fetched successfully', ['count' => $products->count()]);

            return response()->json([
                'success' => true,
                'data'    => $products,
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to fetch most popular products: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch most popular products.',
                'error'   => $e->getMessage(),
            ], 500);
        }
    }

    public function trending(): JsonResponse
    {
        try {
            // Only fetch products from the 'public' working group
            $publicGroupId = WorkingGroup::whereRaw('LOWER(name) = ?', ['public'])->value('id');

            if (!$publicGroupId) {
                return response()->json(['message' => 'Public working group not found'], 404);
            }

            // 1. Popular Products by Views
            $popular = Product::with(['images', 'tags', 'inventories'])
                ->withCount('views')
                ->where('status', 'published')
                ->where('working_group_id', $publicGroupId)
                ->orderByDesc('views_count')
                ->take(3)
                ->get();

            // 2. Recently Added Products
            $recent = Product::with(['images', 'tags', 'inventories'])
                ->where('status', 'published')
                ->where('working_group_id', $publicGroupId)
                ->whereNotIn('id', $popular->pluck('id'))
                ->orderByDesc('created_at')
                ->take(2)
                ->get();

            // 3. Fallback Random Products
            $fallback = Product::with(['images', 'tags', 'inventories'])
                ->where('status', 'published')
                ->where('working_group_id', $publicGroupId)
                ->whereNotIn('id', $popular->pluck('id')->merge($recent->pluck('id')))
                ->inRandomOrder()
                ->take(1)
                ->get();

            // Combine and format response
            $trending = $popular
                ->concat($recent)
                ->concat($fallback)
                ->take(5)
                ->map(function ($product) {
                    // Determine badge type
                    $badge = null;
                    if ($product->views_count > 1000) {
                        $badge = 'Hot';
                    } elseif ($product->created_at->gt(now()->subDays(7))) {
                        $badge = 'New';
                    }

                    return [
                        'name' => $product->name,
                        'desc' => Str::limit($product->meta_description, 150),
                        'image' => optional($product->images->first())->image_url ?? '/images/HS484530.jpg',
                        'badge' => $badge,
                        'price' => number_format($product->price ?? 0, 2),
                        'rating' => 5, // Reviews to be added later
                        'stock' => $product->inventories->sum('quantity') ?? 0,
                        'tags' => $product->tags->pluck('name'),
                        'views' => $product->views_count,
                        'discount' => isset($product->metadata['discount']) ? "-{$product->metadata['discount']}%" : '',
                        'link' => route('productDetail', ['id' => $product->id, 'name' => Str::slug($product->name)]),
                    ];
                });

            return response()->json([
                'success' => true,
                'data' => $trending,
            ], 200);
        } catch (\Exception $e) {
            Log::error('Failed to load trending products', ['error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'Something went wrong. Please try again later.',
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
