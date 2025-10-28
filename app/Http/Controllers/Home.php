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
use App\Models\Cart;
use Illuminate\Support\Facades\DB;
use App\Models\WorkingGroup;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Schema;
use App\Models\ProductView;
use App\Models\Design;
use App\Models\ShippingMethod;

class Home extends Controller
{
    public function index()
    {
        // Get active offers - show all offers with no working groups OR offers assigned to public working group
        $offers = \App\Models\Offer::where('status', 'active')
            ->where('start_date', '<=', now())
            ->where('end_date', '>=', now())
            ->where(function ($query) {
                // No working groups assigned (available to all) OR has public working group
                $query->whereDoesntHave('workingGroups')
                    ->orWhereHas('workingGroups', function ($q) {
                        $q->whereRaw('LOWER(name) = ?', ['public']);
                    });
            })
            ->with(['products:id,name', 'workingGroups:id,name'])
            ->latest()
            ->take(10)
            ->get();

        return Inertia::render('Home', [
            'canLogin' => Route::has('login'),
            'canRegister' => Route::has('register'),
            'offers' => $offers
        ]);
    }

    public function aboutUs()
    {
        return Inertia::render('AboutUs', [
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
                    $query->whereRaw('LOWER(name) = ?', ['public']);
                    $query->where('status', 'active');
                })
                ->orderByDesc('views_count')
                ->orderByDesc('created_at') // Recently added as secondary sort
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
                ->withCount(['views'])
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
                    $query->orderBy('views', 'desc')->orderBy('id', 'desc');
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
                    'short_description'  => Str::limit($p->meta_description ?? '', 120),
                    'pricing_method'     => $p->pricing_method,
                    'effective_price'    => $price,
                    'price_unit'         => $priceUnit,
                    'display_price'      => $displayPrice,      // ready-to-render
                    'category'           => optional($p->category)->name,
                    'starting_price'     => $price,             // backwards compatibility
                    'stock'              => $p->stock ?? null,  // or compute from inventories if you prefer
                    'rating'             => $p->rating ?? null,
                    'views'              => ($p->views ?? 0),
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

        return Inertia::render('Cart');
        // return Inertia::render('Cart');
    }

    public function checkout(Request $request)
    {
        try {
            $user = $request->user();

            // Ensure every visitor has a stable cart session identifier.
            $sessionKey = '_cart_sess';
            if (!$request->session()->has($sessionKey)) {
                $request->session()->put($sessionKey, Str::random(32));
            }
            $sessionId = $request->session()->get($sessionKey);

            $cartQuery = Cart::query()
                ->where('status', 'open')
                ->with([
                    'items.product' => function ($q) {
                        $q->select('id', 'name', 'pricing_method', 'price', 'price_per_sqft', 'unit_of_measure')
                            ->with(['images' => fn($qq) => $qq->select('id', 'product_id', 'image_url', 'is_primary', 'image_order')]);
                    },
                    'items.userDesignUpload',
                    'items.adjustments',
                    'adjustments',
                    'billingAddress',
                    'shippingAddress',
                ]);

            // Fetch previously used addresses for authenticated users
            $previousAddresses = [];
            $suggestedBillingAddress = null;
            $suggestedShippingAddress = null;
            $previousPhones = [];
            $suggestedPhone = null;
            $previousWhatsApp = [];
            $suggestedWhatsApp = null;

            if ($user) {
                // Get user's previous orders with addresses
                $previousOrders = \App\Models\Order::where('user_id', $user->id)
                    ->whereNotNull('billing_address_id')
                    ->with(['billingAddress', 'shippingAddress'])
                    ->orderBy('created_at', 'desc')
                    ->limit(5)
                    ->get();

                // Collect unique addresses
                $billingAddresses = [];
                $shippingAddresses = [];
                $billingFrequency = [];
                $shippingFrequency = [];
                $phoneNumbers = [];
                $phoneFrequency = [];
                $whatsappNumbers = [];
                $whatsappFrequency = [];

                foreach ($previousOrders as $order) {
                    if ($order->billingAddress) {
                        $key = md5(json_encode([
                            $order->billingAddress->line1,
                            $order->billingAddress->line2,
                            $order->billingAddress->city,
                            $order->billingAddress->region,
                            $order->billingAddress->postal_code,
                        ]));
                        
                        if (!isset($billingAddresses[$key])) {
                            $billingAddresses[$key] = [
                                'line1' => $order->billingAddress->line1,
                                'line2' => $order->billingAddress->line2,
                                'city' => $order->billingAddress->city,
                                'region' => $order->billingAddress->region,
                                'postal_code' => $order->billingAddress->postal_code,
                                'country' => $order->billingAddress->country,
                            ];
                            $billingFrequency[$key] = 0;
                        }
                        $billingFrequency[$key]++;
                    }

                    if ($order->shippingAddress) {
                        $key = md5(json_encode([
                            $order->shippingAddress->line1,
                            $order->shippingAddress->line2,
                            $order->shippingAddress->city,
                            $order->shippingAddress->region,
                            $order->shippingAddress->postal_code,
                        ]));
                        
                        if (!isset($shippingAddresses[$key])) {
                            $shippingAddresses[$key] = [
                                'line1' => $order->shippingAddress->line1,
                                'line2' => $order->shippingAddress->line2,
                                'city' => $order->shippingAddress->city,
                                'region' => $order->shippingAddress->region,
                                'postal_code' => $order->shippingAddress->postal_code,
                                'country' => $order->shippingAddress->country,
                            ];
                            $shippingFrequency[$key] = 0;
                        }
                        $shippingFrequency[$key]++;
                    }

                    // Collect phone numbers
                    if (!empty($order->contact_phone)) {
                        $phone = $order->contact_phone;
                        if (!isset($phoneNumbers[$phone])) {
                            $phoneNumbers[$phone] = $phone;
                            $phoneFrequency[$phone] = 0;
                        }
                        $phoneFrequency[$phone]++;
                    }

                    // Collect WhatsApp numbers
                    if (!empty($order->contact_whatsapp)) {
                        $whatsapp = $order->contact_whatsapp;
                        if (!isset($whatsappNumbers[$whatsapp])) {
                            $whatsappNumbers[$whatsapp] = $whatsapp;
                            $whatsappFrequency[$whatsapp] = 0;
                        }
                        $whatsappFrequency[$whatsapp]++;
                    }
                }

                // Sort by frequency and get most used
                if (!empty($billingFrequency)) {
                    arsort($billingFrequency);
                    $mostUsedBillingKey = array_key_first($billingFrequency);
                    $suggestedBillingAddress = $billingAddresses[$mostUsedBillingKey];
                }

                if (!empty($shippingFrequency)) {
                    arsort($shippingFrequency);
                    $mostUsedShippingKey = array_key_first($shippingFrequency);
                    $suggestedShippingAddress = $shippingAddresses[$mostUsedShippingKey];
                }

                if (!empty($phoneFrequency)) {
                    arsort($phoneFrequency);
                    $mostUsedPhone = array_key_first($phoneFrequency);
                    $suggestedPhone = $mostUsedPhone;
                }

                if (!empty($whatsappFrequency)) {
                    arsort($whatsappFrequency);
                    $mostUsedWhatsApp = array_key_first($whatsappFrequency);
                    $suggestedWhatsApp = $mostUsedWhatsApp;
                }

                $previousAddresses = [
                    'billing' => array_values($billingAddresses),
                    'shipping' => array_values($shippingAddresses),
                ];

                $previousPhones = array_values($phoneNumbers);
                $previousWhatsApp = array_values($whatsappNumbers);
            }

            if ($user) {
                $cartQuery->where(function ($query) use ($user, $sessionId) {
                    $query->where('user_id', $user->id);
                    if ($sessionId) {
                        $query->orWhere(function ($guest) use ($sessionId) {
                            $guest->whereNull('user_id')->where('session_id', $sessionId);
                        });
                    }
                });
            } else {
                $cartQuery->where('session_id', $sessionId);
            }

            $cart = $cartQuery->first();

            if (!$cart) {
                return redirect()
                    ->route('cart')
                    ->withErrors(['cart' => 'We could not locate an active cart for this session.']);
            }

            $cart->loadMissing(['items.product.images']); // Guarantee relationships for mapping.

            if ($cart->items->isEmpty()) {
                return redirect()
                    ->route('cart')
                    ->withErrors(['cart' => 'Your cart is empty.']);
            }

            $cartItems = $cart->items->map(function ($item) {
                $product = $item->product;
                $primaryImage = optional(
                    $product?->images
                        ->sortBy([
                            ['is_primary', 'desc'],
                            ['image_order', 'asc'],
                            ['id', 'asc'],
                        ])
                        ->first()
                )->image_url;

                $pricingMethod = $product?->pricing_method;
                $unitLabel = $pricingMethod === 'roll'
                    ? 'per sq.ft'
                    : ($product?->unit_of_measure ?: 'piece');

                $unitPrice = (float) $item->unit_price;

                return [
                    'id' => $item->id,
                    'product_id' => $item->product_id,
                    'name' => $product?->name,
                    'quantity' => (int) $item->quantity,
                    'pricing_method' => $pricingMethod,
                    'unit_price' => $unitPrice,
                    'total_price' => (float) $item->total_price,
                    'display_price' => 'Rs ' . number_format($unitPrice, 2) . ' ' . $unitLabel,
                    'size_unit' => $item->size_unit,
                    'width' => $item->width,
                    'height' => $item->height,
                    'area' => $item->area,
                    'options' => $item->options ?? $item->selected_options,
                    'design_id' => $item->design_id,
                    'user_design_upload_id' => $item->user_design_upload_id,
                    'thumbnail_url' => $primaryImage,
                    'meta' => $item->meta,
                    'adjustments' => $item->adjustments->map(fn($adj) => [
                        'type' => $adj->type,
                        'code' => $adj->code,
                        'label' => $adj->label,
                        'amount' => (float) $adj->amount,
                        'meta' => $adj->meta,
                    ])->values(),
                ];
            })->values();

            $totals = [
                'subtotal' => (float) ($cart->subtotal ?? $cart->subtotal_amount ?? 0),
                'discount' => (float) abs($cart->discount_total ?? $cart->discount_amount ?? 0),
                'shipping' => (float) ($cart->shipping_total ?? $cart->shipping_amount ?? 0),
                'tax' => (float) ($cart->tax_total ?? $cart->tax_amount ?? 0),
                'grand' => (float) ($cart->grand_total ?? $cart->total_amount ?? 0),
            ];

            $addresses = [
                'billing' => $cart->billingAddress ? [
                    'line1' => $cart->billingAddress->line1,
                    'line2' => $cart->billingAddress->line2,
                    'city' => $cart->billingAddress->city,
                    'region' => $cart->billingAddress->region,
                    'postal_code' => $cart->billingAddress->postal_code,
                    'country' => $cart->billingAddress->country,
                ] : null,
                'shipping' => $cart->shippingAddress ? [
                    'line1' => $cart->shippingAddress->line1,
                    'line2' => $cart->shippingAddress->line2,
                    'city' => $cart->shippingAddress->city,
                    'region' => $cart->shippingAddress->region,
                    'postal_code' => $cart->shippingAddress->postal_code,
                    'country' => $cart->shippingAddress->country,
                ] : null,
            ];

            $shippingMethods = ShippingMethod::query()
                ->orderBy('name')
                ->get(['id', 'name', 'description', 'cost'])
                ->map(fn($method) => [
                    'id' => $method->id,
                    'name' => $method->name,
                    'description' => $method->description,
                    'cost' => (float) $method->cost,
                ]);

            $userData = $user ? [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone ?? null,
            ] : null;

            return Inertia::render('Checkout', [
                'isAuthenticated' => (bool) $user,
                'user' => $userData,
                'cart' => [
                    'id' => $cart->id,
                    'items' => $cartItems,
                    'totals' => $totals,
                    'adjustments' => $cart->adjustments->map(fn($adj) => [
                        'type' => $adj->type,
                        'code' => $adj->code,
                        'label' => $adj->label,
                        'amount' => (float) $adj->amount,
                        'meta' => $adj->meta,
                    ])->values(),
                    'addresses' => $addresses,
                    'currency' => $cart->currency_code,
                ],
                'shippingMethods' => $shippingMethods,
                'requiresGuestDetails' => !$user,
                'guestRequiredFields' => $user ? [] : ['name', 'email', 'phone', 'billing_address'],
                'previousAddresses' => $previousAddresses,
                'suggestedBillingAddress' => $suggestedBillingAddress,
                'suggestedShippingAddress' => $suggestedShippingAddress,
                'previousPhones' => $previousPhones,
                'suggestedPhone' => $suggestedPhone,
                'previousWhatsApp' => $previousWhatsApp,
                'suggestedWhatsApp' => $suggestedWhatsApp,
            ]);
        } catch (\Throwable $e) {
            Log::error('Failed to load checkout data: ' . $e->getMessage(), [
                'exception' => $e,
            ]);

            return redirect()
                ->back()
                ->withErrors(['error' => 'Failed to load checkout data.']);
        }
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
        // 1) Fetch product (published) with relations, including subvariants
        $product = Product::query()
            ->with([
                'images:id,product_id,image_url,image_order,is_primary,alt_text',
                'categories:id,name',
                // primary variants
                'variants:id,product_id,variant_name,variant_value,price_adjustment,deleted_at',
                // nested subvariants
                'variants.subvariants:id,product_variant_id,subvariant_name,subvariant_value,price_adjustment,deleted_at',
                'tags:id,name',
            ])
            ->whereKey($id)
            ->where('status', 'published')
            ->firstOrFail();

        // 2) Canonical slug redirect
        $expectedSlug = Str::slug($product->name);
        if ($name !== $expectedSlug) {
            return redirect()->route('productDetail', ['id' => $product->id, 'name' => $expectedSlug], 301);
        }

        // 3) Log a product view (non-blocking)
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

        // 4) Build variant groups
        // Input rows: ProductVariant (variant_name, variant_value)
        // Children:   ProductSubvariant (subvariant_name, subvariant_value)
        // Output shape expected by UI:
        // [
        //   { name: "Size", options: [
        //       {
        //         id, label, value, price_adjustment,
        //         subgroups: [
        //           { name: "Finish", options: [{id,label,value,price_adjustment}, ...] },
        //           { name: "Color",  options: [...] }
        //         ]
        //       },
        //       ...
        //   ]},
        //   ...
        // ]
        $variantGroups = [];
        foreach ($product->variants as $v) {
            $groupKey = (string) $v->variant_name;

            if (!isset($variantGroups[$groupKey])) {
                $variantGroups[$groupKey] = [
                    'id'      => md5($groupKey),  // synthetic id for the group
                    'name'    => $groupKey,
                    'options' => [],
                ];
            }

            // Base option
            $option = [
                'id'               => $v->id,
                'label'            => $v->variant_value,
                'value'            => $v->variant_value,
                'price_adjustment' => (float) ($v->price_adjustment ?? 0),
            ];

            // Attach subgroups if present
            if ($v->relationLoaded('subvariants') && $v->subvariants->isNotEmpty()) {
                // Group children by their subvariant_name
                $byName = [];
                foreach ($v->subvariants as $sv) {
                    $byName[$sv->subvariant_name][] = [
                        'id'               => $sv->id,
                        'label'            => $sv->subvariant_value,
                        'value'            => $sv->subvariant_value,
                        'price_adjustment' => (float) ($sv->price_adjustment ?? 0),
                    ];
                }

                // Normalize to array of { name, options: [...] }
                $option['subgroups'] = array_map(
                    fn($name, $opts) => ['name' => $name, 'options' => array_values($opts)],
                    array_keys($byName),
                    array_values($byName)
                );
            }

            $variantGroups[$groupKey]['options'][] = $option;
        }
        $variantGroups = array_values($variantGroups); // reindex for the UI

        // 5) Sort images: primary first, then by order
        $images = $product->images
            ->sortBy([['is_primary', 'desc'], ['image_order', 'asc']])
            ->values();

        // 6) Similar products (shares any category)
        $categoryIds = $product->categories->pluck('id');
        $similarProducts = collect();
        if ($categoryIds->isNotEmpty()) {
            $similarProducts = Product::query()
                ->with(['images:id,product_id,image_url,is_primary,image_order'])
                ->where('id', '!=', $product->id)
                ->where('status', 'published')
                ->whereHas('categories', fn($q) => $q->whereIn('categories.id', $categoryIds))
                ->limit(4)
                ->get();
        }

        // 7) SEO fallbacks
        $seo = [
            'title'       => $product->meta_title ?? ($product->name . ' | Printair'),
            'description' => $product->meta_description
                ?? Str::limit(strip_tags((string) $product->description), 160),
        ];

        // 8) Return page payload
        return Inertia::render('ProductDetails', [
            'product' => [
                'id'               => $product->id,
                'name'             => $product->name,
                'meta_description' => $product->meta_description,
                'description'      => $product->meta_description,
                'pricing_method'   => $product->pricing_method,  // 'standard' | 'roll'
                'price'            => $product->price,
                'price_per_sqft'   => $product->price_per_sqft,
                'images'           => $images->map(fn($img) => [
                    'id'         => $img->id,
                    'image_url'  => $img->image_url,
                    'alt'        => $img->alt_text,
                    'sort_order' => $img->image_order,
                    'is_primary' => (bool) $img->is_primary,
                ]),
                'categories'       => $product->categories->map->only(['id', 'name']),
                'variants'         => $variantGroups,             // <-- grouped + nested
                'tags'             => $product->tags->map->only(['id', 'name']),
            ],

            'similarProducts' => $similarProducts->map(function ($p) {
                $img = $p->images
                    ->sortBy([['is_primary', 'desc'], ['image_order', 'asc']])
                    ->first();
                $imageUrl = optional($img)->image_url
                    ?? optional($p->images->first())->image_url
                    ?? '/images/default.png';

                $isRoll    = ($p->pricing_method === 'roll');
                $price     = $isRoll ? $p->price_per_sqft : $p->price;
                $priceUnit = $isRoll ? 'per sq.ft' : ($p->unit_of_measure ?: 'piece');
                $displayPrice = $price !== null
                    ? ('Rs ' . number_format((float) $price, 2) . ' ' . $priceUnit)
                    : 'Contact for price';

                return [
                    'id'                => $p->id,
                    'name'              => $p->name,
                    'image'             => $imageUrl,
                    'short_description' => Str::limit($p->description ?? '', 120),
                    'pricing_method'    => $p->pricing_method,
                    'effective_price'   => $price,
                    'price_unit'        => $priceUnit,
                    'display_price'     => $displayPrice,
                    'starting_price'    => $price,
                    'stock'             => $p->stock ?? null,
                    'rating'            => $p->rating ?? null,
                    'views'             => method_exists($p, 'views') ? $p->views : null,
                    'badge'             => $p->badge ?? null,
                    'discount'          => $p->discount ?? null,
                    'url'               => route('productDetail', [
                        'id'   => $p->id,
                        'name' => Str::slug($p->name),
                    ]),
                ];
            }),

            'seo' => $seo,
        ]);
    }


    public function DesignlistForProduct(Request $request, Product $product)
    {
        $designs = Design::query()
            ->select(['id', 'name', 'description', 'width', 'height', 'image_url', 'product_id'])
            ->where('product_id', $product->id)
            ->where('status', 'active')
            ->where('access_type', 'working_group')
            ->whereHas('workingGroup', function ($q) {
                $q->whereRaw('LOWER(name) = ?', ['public']);
            })
            ->orderByDesc('id')
            ->get();

        return response()->json($designs);
    }

    // ==================== OFFERS ====================

    public function activeOffers()
    {
        $offers = \App\Models\Offer::where('status', 'active')
            ->where('start_date', '<=', now())
            ->where('end_date', '>=', now())
            ->with(['products' => function ($q) {
                $q->select('products.id', 'products.name', 'products.slug')
                    ->where('status', 'published')
                    ->whereHas('workingGroup', function ($wg) {
                        $wg->whereRaw('LOWER(name) = ?', ['public']);
                    });
            }])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($offers);
    }

    public function offerDetail($id, $name = null)
    {
        $offer = \App\Models\Offer::where('id', $id)
            ->with(['products.images', 'products.categories'])
            ->firstOrFail();

        // Filter products to only show published and public
        $offer->setRelation('products', $offer->products->filter(function ($product) {
            return $product->status === 'published'
                && $product->workingGroup
                && strtolower($product->workingGroup->name) === 'public';
        }));

        return Inertia::render('OfferView', [
            'offer' => $offer,
            'canLogin' => Route::has('login'),
            'canRegister' => Route::has('register'),
        ]);
    }

    public function shippingMethods(): JsonResponse
    {
        try {
            $methods = ShippingMethod::query()
                ->orderBy('name')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $methods,
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to fetch shipping methods: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve shipping methods.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
