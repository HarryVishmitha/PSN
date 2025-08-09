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
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Schema;
use App\Models\ProductView;


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

                    if ($product->pricing_method === 'roll') {
                        $productPrice = number_format($product->price_per_sqft ?? 0, 2) . ' ' . ' per sq.ft';
                    } elseif ($product->pricing_method === 'standard') {
                        $productPrice = number_format($product->price ?? 0, 2) . ' ' . ($product->unit_of_measure ?: 'piece');
                    } else {
                        $productPrice = 0; // Default to 0 if no price is set
                    }
                    return [
                        'name' => $product->name,
                        'desc' => Str::limit($product->meta_description, 150),
                        'image' => optional($product->images->first())->image_url ?? '/images/HS484530.jpg',
                        'badge' => $badge,
                        'price' => $productPrice,
                        'rating' => 5, // Reviews to be added later
                        'stock' => $product->inventories->sum('quantity') ?? 100,
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

    public function fetchProducts(Request $request)
    {
        try {
            /* -------------------- normalize blanks -------------------- */
            $normalized = $request->all();
            foreach (['category_id', 'category_name', 'working_group', 'working_group_id', 'sort', 'q', 'min_price', 'max_price', 'in_stock', 'tag', 'limit', 'cursor'] as $k) {
                if (array_key_exists($k, $normalized) && $normalized[$k] === '') {
                    $normalized[$k] = null;
                }
            }
            $request->replace($normalized);

            /* -------------------- validate -------------------- */
            $v = Validator::make($request->all(), [
                'category_id'      => 'nullable|integer|exists:categories,id',
                'category_name'    => 'nullable|string|max:255',
                'working_group'    => 'nullable|string|max:255',
                'working_group_id' => 'nullable|integer',
                'sort'             => 'nullable|in:default,price_low,price_high,newest,views,rating,name_az,name_za',
                'q'                => 'nullable|string|max:255',
                'min_price'        => 'nullable|numeric|min:0',
                'max_price'        => 'nullable|numeric|min:0',
                'in_stock'         => 'nullable|boolean',
                'tag'              => 'nullable|string|max:64',
                'limit'            => 'nullable|integer|min:6|max:48',
                'cursor'           => 'nullable|string',
            ])->validate();

            $limit = $v['limit'] ?? 12;

            /* -------------------- base query -------------------- */
            // Build an "effective_price" SQL CASE so we can filter/sort across both methods.
            $effectivePriceSql = "CASE WHEN pricing_method = 'roll' THEN price_per_sqft ELSE price END";

            $query = \App\Models\Product::query()
                ->withoutTrashed()
                ->where('status', 'published')
                // only products with a valid price for their method
                ->where(function ($q) {
                    $q->where(function ($qq) {
                        $qq->where('pricing_method', 'standard')->whereNotNull('price');
                    })->orWhere(function ($qq) {
                        $qq->where('pricing_method', 'roll')->whereNotNull('price_per_sqft');
                    });
                })
                ->with([
                    'category:id,name',
                    'categories:id,name',
                    'images' => fn($q) => $q->select('id', 'product_id', 'image_url')->limit(1),
                ])
                ->withCount('views')
                ->select('*') // keep original columns
                ->selectRaw("$effectivePriceSql as effective_price");

            /* -------------------- working group (default: public) -------------------- */
            if (empty($v['working_group']) && empty($v['working_group_id'])) {
                $query->whereHas(
                    'workingGroup',
                    fn($q) =>
                    $q->whereRaw('LOWER(name) = ?', ['public'])
                );
            } else {
                if (!empty($v['working_group'])) {
                    $wg = mb_strtolower($v['working_group']);
                    $query->whereHas(
                        'workingGroup',
                        fn($q) =>
                        $q->whereRaw('LOWER(name) = ?', [$wg])
                    );
                }
                if (!empty($v['working_group_id'])) {
                    $query->where('working_group_id', $v['working_group_id']);
                }
            }

            /* -------------------- category (FK or pivot) -------------------- */
            if (!empty($v['category_id'])) {
                $query->where(function ($q) use ($v) {
                    // via pivot
                    $q->whereHas('categories', function ($qq) use ($v) {
                        $qq->where('categories.id', $v['category_id']);
                    });

                    // optionally include primary FK if your schema adds it later
                    if (Schema::hasColumn('products', 'category_id')) {
                        $q->orWhere('category_id', $v['category_id']);
                    }
                });
            }

            if (!empty($v['category_name'])) {
                $name = mb_strtolower($v['category_name']);
                $query->where(function ($q) use ($name) {
                    // via pivot
                    $q->whereHas('categories', function ($qq) use ($name) {
                        $qq->whereRaw('LOWER(categories.name) = ?', [$name]);
                    });

                    // optionally include primary FK if present
                    if (Schema::hasColumn('products', 'category_id')) {
                        $q->orWhereHas('category', function ($qq) use ($name) {
                            $qq->whereRaw('LOWER(name) = ?', [$name]);
                        });
                    }
                });
            }

            /* -------------------- search / tag / stock -------------------- */
            if (!empty($v['q'])) {
                $qtxt = $v['q'];
                $query->where(function ($qq) use ($qtxt) {
                    $qq->where('name', 'like', "%{$qtxt}%")
                        ->orWhere('description', 'like', "%{$qtxt}%")
                        ->orWhere('meta_description', 'like', "%{$qtxt}%");
                });
            }

            if (!empty($v['tag'])) {
                $tag = mb_strtolower($v['tag']);
                $query->whereHas('tags', fn($q) => $q->whereRaw('LOWER(name) = ?', [$tag]));
            }

            if (isset($v['in_stock']) && $v['in_stock']) {
                // if you have inventories relation with quantity, require some quantity > 0
                $query->whereHas('inventories', fn($q) => $q->where('quantity', '>', 0));
            }

            /* -------------------- price range on effective_price -------------------- */
            if (isset($v['min_price'])) {
                $query->whereRaw("$effectivePriceSql >= ?", [$v['min_price']]);
            }
            if (isset($v['max_price'])) {
                $query->whereRaw("$effectivePriceSql <= ?", [$v['max_price']]);
            }

            /* -------------------- sorting -------------------- */
            switch ($v['sort'] ?? 'default') {
                case 'price_low':
                    $query->orderBy('effective_price', 'asc')->orderBy('id', 'desc');
                    break;
                case 'price_high':
                    $query->orderBy('effective_price', 'desc')->orderBy('id', 'desc');
                    break;
                case 'newest':
                    $query->latest('id');
                    break;
                case 'views':
                    $query->orderBy('views_count', 'desc')->orderBy('id', 'desc');
                    break;
                case 'rating':
                    $query->orderBy('rating', 'desc')->orderBy('id', 'desc');
                    break;
                case 'name_az':
                    $query->orderBy('name', 'asc')->orderBy('id', 'desc');
                    break;
                case 'name_za':
                    $query->orderBy('name', 'desc')->orderBy('id', 'desc');
                    break;
                default:
                    // sensible default: newest then name
                    $query->latest('id')->orderBy('name');
            }

            /* -------------------- cursor pagination -------------------- */
            $paginated = $query->cursorPaginate($limit, ['*'], 'cursor', $v['cursor'] ?? null);

            /* -------------------- shape response -------------------- */
            $items = $paginated->map(function ($p) {
                $isRoll       = ($p->pricing_method === 'roll');
                $price        = $p->effective_price; // from selectRaw
                $priceUnit    = $isRoll ? 'per sq.ft' : ($p->unit_of_measure ?: 'piece');
                $displayPrice = $price !== null ? 'Rs ' . number_format((float)$price, 2) . ' ' . $priceUnit : 'Contact for price';

                return [
                    'id'                 => $p->id,
                    'name'               => $p->name,
                    'image'              => optional($p->images->first())->image_url ?? '/images/default.png',
                    'short_description'  => Str::limit($p->description ?? '', 120),
                    'pricing_method'     => $p->pricing_method,
                    'effective_price'    => $price,
                    'price_unit'         => $priceUnit,
                    'display_price'      => $displayPrice,      // ready-to-render
                    'category'           => optional($p->category)->name,
                    'starting_price'     => $price,             // backwards compatibility
                    'stock'              => $p->stock ?? null,  // or compute from inventories if you prefer
                    'rating'             => $p->rating ?? null,
                    'views'              => (int)($p->views_count ?? 0),
                    'badge'              => $p->badge ?? null,
                    'discount'           => $p->discount ?? null,
                ];
            });

            return response()->json([
                'ok'          => true,
                'data'        => $items->values(),
                'next_cursor' => $paginated->nextCursor()?->encode(),
                'has_more'    => $paginated->hasMorePages(),
            ]);
        } catch (\Throwable $e) {
            Log::error('fetchProducts failed', ['error' => $e->getMessage()]);
            return response()->json([
                'ok'      => false,
                'message' => 'Failed to fetch products.',
                'error'   => app()->hasDebugModeEnabled() ? $e->getMessage() : null,
            ], 500);
        }
    }


    public function fetchCategories(Request $request)
    {
        try {
            // Optional: only categories that currently have visible public products
            $onlyWithProducts = filter_var($request->query('only_with_products', true), FILTER_VALIDATE_BOOLEAN);

            $base = Category::query()->withoutTrashed()->select('id', 'name');

            if ($onlyWithProducts) {
                $base->whereHas('products', function ($q) {
                    $q->withoutTrashed()
                        ->whereHas('workingGroup', function ($wq) {
                            $wq->whereRaw('LOWER(name) = ?', ['public']);
                        });
                });
            }

            // Optional: include product counts for public WG
            $includeCounts = filter_var($request->query('include_counts', true), FILTER_VALIDATE_BOOLEAN);
            if ($includeCounts) {
                $base->withCount(['products as products_count' => function ($q) {
                    $q->withoutTrashed()
                        ->whereHas('workingGroup', function ($wq) {
                            $wq->whereRaw('LOWER(name) = ?', ['public']);
                        });
                }]);
            }

            $cats = $base->orderBy('name')->get();

            return response()->json([
                'ok'   => true,
                'data' => $cats,
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'ok'      => false,
                'message' => 'Failed to fetch categories.',
                'error'   => app()->hasDebugModeEnabled() ? $e->getMessage() : null,
            ], 500);
        }
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

    public function productDetail(Request $request, $id, $name)
    {
        // 1) Fetch product (published) with relations
        $product = Product::query()
            ->with([
                'images:id,product_id,image_url,image_order,is_primary,alt_text',
                'categories:id,name',
                'variants:id,product_id,variant_name,variant_value,price_adjustment',
                'tags:id,name',
            ])
            ->whereKey($id)
            ->where('status', 'published')
            ->firstOrFail();

        // 2) Canonical slug redirect if slug mismatches
        $expectedSlug = Str::slug($product->name);
        if ($name !== $expectedSlug) {
            return redirect()->route('productDetail', [
                'id'   => $product->id,
                'name' => $expectedSlug,
            ], 301);
        }

        // 3) Log a product view (your ProductView allows only these fields)
        try {
            ProductView::create([
                'product_id' => $product->id,
                'ip_address' => $request->ip(),
                'viewed_at'  => now(),
            ]);
        } catch (\Throwable $e) {
            Log::warning('Failed to record product view', [
                'product_id' => $product->id,
                'error'      => $e->getMessage(),
            ]);
        }

        // 4) Build variant groups to fit the frontend (variant → options[])
        // Your table stores one row per option, so group by variant_name.
        $variantGroups = [];
        foreach ($product->variants as $v) {
            $key = (string) $v->variant_name;
            if (!isset($variantGroups[$key])) {
                $variantGroups[$key] = [
                    'id'     => md5($key),     // synthetic id for the group
                    'name'   => $key,
                    'options' => [],
                ];
            }
            $variantGroups[$key]['options'][] = [
                'id'               => $v->id,
                'label'            => $v->variant_value,
                'value'            => $v->variant_value,
                'price_adjustment' => $v->price_adjustment,
            ];
        }
        $variantGroups = array_values($variantGroups); // reindex

        // 5) Sort images: primary first, then by image_order
        $images = $product->images
            ->sortBy([
                ['is_primary', 'desc'],
                ['image_order', 'asc'],
            ])
            ->values();

        // 6) Similar products (shares any category, only published)
        $categoryIds = $product->categories->pluck('id');
        $similarProducts = collect();
        if ($categoryIds->isNotEmpty()) {
            $similarProducts = Product::query()
                ->with(['images:id,product_id,image_url,is_primary,image_order'])
                ->where('id', '!=', $product->id)
                ->where('status', 'published')
                ->whereHas('categories', function ($q) use ($categoryIds) {
                    $q->whereIn('categories.id', $categoryIds);
                })
                ->limit(8)
                ->get(['id', 'name', 'price']);
        }

        // 7) SEO fallbacks (use your meta_title/meta_description)
        $seo = [
            'title'       => $product->meta_title ?? ($product->name . ' | Printair'),
            'description' => $product->meta_description ?? Str::limit(strip_tags((string) $product->description), 160),
        ];

        // 8) Send to Inertia page with fields that match your frontend
        return Inertia::render('ProductDetails', [
            'product' => [
                'id'             => $product->id,
                'name'           => $product->name,
                'description'    => $product->description,
                'pricing_method' => $product->pricing_method,   // 'standard' | 'roll'
                'price'          => $product->price,            // you use `price`
                'price_per_sqft' => $product->price_per_sqft,   // for roll
                'images'         => $images->map(function ($img) {
                    return [
                        'id'         => $img->id,
                        'image_url'  => $img->image_url,
                        'alt'        => $img->alt_text,
                        'sort_order' => $img->image_order,
                        'is_primary' => (bool) $img->is_primary,
                    ];
                }),
                'categories'     => $product->categories->map->only(['id', 'name']),
                'variants'       => $variantGroups,             // grouped for UI
                'tags'           => $product->tags->map->only(['id', 'name']),
            ],

            'similarProducts' => $similarProducts->map(function ($p) {
                // choose primary image or first
                $img = $p->images
                    ->sortBy([['is_primary', 'desc'], ['image_order', 'asc']])
                    ->first();
                return [
                    'id'         => $p->id,
                    'name'       => $p->name,
                    'image'      => optional($img)->image_url,
                    'base_price' => $p->price, // frontend label says "From", so ok
                    'url'        => route('productDetail', [
                        'id'   => $p->id,
                        'name' => Str::slug($p->name),
                    ]),
                ];
            }),

            'seo' => $seo,
        ]);
    }
}
