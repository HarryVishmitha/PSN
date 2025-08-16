<?php

namespace App\Http\Controllers;

use App\Models\Cart;
use App\Models\CartItem;
use App\Models\CartAdjustment;
use App\Models\Product;
use App\Models\UserDesignUpload;
use App\Models\ShippingMethod;
use App\Models\TaxRate;
use App\Models\Offer;
use App\Models\OfferProduct;
use App\Models\OfferUsage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Schema;

class CartController extends Controller
{
    /* ============================================================
     |  Helpers: schema-aware column names & null-safe filtering
     |============================================================ */

    /** cart_items design column name */
    protected function designCol(): string
    {
        if (Schema::hasColumn('cart_items', 'design_id')) return 'design_id';
        if (Schema::hasColumn('cart_items', 'product_design_id')) return 'product_design_id';
        return 'design_id';
    }

    /** cart_items total column name */
    protected function itemTotalCol(): string
    {
        if (Schema::hasColumn('cart_items', 'total_price')) return 'total_price';
        if (Schema::hasColumn('cart_items', 'subtotal')) return 'subtotal';
        return 'total_price';
    }

    /** carts totals mapping: [apiKey => dbColumn] */
    protected function cartTotalCols(): array
    {
        $pref = [
            'subtotal' => 'subtotal',
            'discount' => 'discount_total',
            'shipping' => 'shipping_total',
            'tax'      => 'tax_total',
            'grand'    => 'grand_total',
        ];
        $fallback = [
            'subtotal' => 'subtotal_amount',
            'discount' => 'discount_amount',
            'shipping' => 'shipping_amount',
            'tax'      => 'tax_amount',
            'grand'    => 'total_amount',
        ];
        return Schema::hasColumn('carts', $pref['grand']) ? $pref : $fallback;
    }

    /** variant columns present? */
    protected function hasVariantCols(): bool
    {
        return Schema::hasColumn('cart_items', 'variant_id')
            || Schema::hasColumn('cart_items', 'subvariant_id')
            || Schema::hasColumn('cart_items', 'variant_sku');
    }

    /** options columns present? */
    protected function hasOptionsCols(): bool
    {
        return Schema::hasColumn('cart_items', 'options') &&
            Schema::hasColumn('cart_items', 'options_fingerprint');
    }

    /** add a where or whereNull depending on value */
    protected function whereNullSafe($q, string $col, $val)
    {
        return is_null($val) ? $q->whereNull($col) : $q->where($col, $val);
    }

    /* ============================================================
     |  Cart retrieval / creation / merge
     |============================================================ */

    protected function getOrCreateCart(Request $req): Cart
    {
        if (!$req->session()->has('_cart_sess')) {
            $req->session()->put('_cart_sess', bin2hex(random_bytes(16)));
        }
        $sessionId = $req->session()->get('_cart_sess');

        $query = Cart::query()->where('status', 'open');
        if ($req->user()) {
            $query->where(function ($q) use ($req, $sessionId) {
                $q->where('user_id', $req->user()->id)
                    ->orWhere('session_id', $sessionId);
            });
        } else {
            $query->where('session_id', $sessionId);
        }

        $cart = $query->with(['items', 'adjustments'])->first();

        if (!$cart) {
            $cart = new Cart();
            $cart->user_id       = optional($req->user())->id;
            $cart->session_id    = $sessionId;
            $cart->currency_code = 'LKR';
            $cart->status        = 'open';
            $cart->save();
        }

        if ($req->user() && !$cart->user_id) {
            $cart->user_id = $req->user()->id;
            $cart->save();
        }

        return $cart->fresh(['items', 'adjustments']);
    }

    public function mergeGuestCartOnLogin(Request $req)
    {
        $user = $req->user();
        if (!$user) return response()->json(['ok' => false, 'message' => 'Not authenticated'], 401);

        $sessionId = $req->session()->get('_cart_sess');
        if (!$sessionId) return response()->json(['ok' => true, 'message' => 'No guest cart to merge']);

        $guestCart = Cart::where('session_id', $sessionId)->where('status', 'open')->with('items')->first();
        if (!$guestCart) return response()->json(['ok' => true, 'message' => 'No guest cart to merge']);

        $userCart = Cart::where('user_id', $user->id)->where('status', 'open')->with(['items', 'adjustments'])->first();
        if (!$userCart) {
            $guestCart->user_id = $user->id;
            $guestCart->save();
            return response()->json(['ok' => true, 'message' => 'Cart attached to user']);
        }

        $designCol = $this->designCol();
        $hasVar    = $this->hasVariantCols();
        $hasOpt    = $this->hasOptionsCols();
        $totalCol  = $this->itemTotalCol();

        DB::transaction(function () use ($guestCart, $userCart, $designCol, $hasVar, $hasOpt, $totalCol) {
            foreach ($guestCart->items as $gi) {
                $q = $userCart->items()
                    ->where('product_id', $gi->product_id)
                    ->tap(fn($q) => $this->whereNullSafe($q, $designCol, $gi->{$designCol}))
                    ->tap(fn($q) => $this->whereNullSafe($q, 'user_design_upload_id', $gi->user_design_upload_id))
                    ->tap(fn($q) => $this->whereNullSafe($q, 'size_unit', $gi->size_unit))
                    ->tap(fn($q) => $this->whereNullSafe($q, 'width', $gi->width))
                    ->tap(fn($q) => $this->whereNullSafe($q, 'height', $gi->height));

                if ($hasVar) {
                    $q->tap(fn($w) => $this->whereNullSafe($w, 'variant_id', $gi->variant_id))
                        ->tap(fn($w) => $this->whereNullSafe($w, 'subvariant_id', $gi->subvariant_id))
                        ->tap(fn($w) => $this->whereNullSafe($w, 'variant_sku', $gi->variant_sku));
                }
                if ($hasOpt) {
                    $q->tap(fn($w) => $this->whereNullSafe($w, 'options_fingerprint', $gi->options_fingerprint));
                }

                $existing = $q->first();

                if ($existing) {
                    $existing->quantity   += $gi->quantity;
                    $existing->unit_price  = $gi->unit_price;
                    $existing->{$totalCol} = $existing->quantity * $existing->unit_price;
                    $existing->save();
                    $gi->delete();
                } else {
                    $gi->cart_id = $userCart->id;
                    $gi->save();
                }
            }

            foreach ($guestCart->adjustments as $adj) {
                if ($adj->type === 'discount' && $adj->code) {
                    $dup = $userCart->adjustments()->where('type', 'discount')->where('code', $adj->code)->exists();
                    if ($dup) continue;
                }
                $adj->cart_id = $userCart->id;
                $adj->save();
            }

            $guestCart->status = 'abandoned';
            $guestCart->save();
        });

        $this->recalculate($userCart->fresh(['items', 'adjustments']));

        return response()->json(['ok' => true, 'message' => 'Guest cart merged']);
    }

    /* ============================================================
     |  Basic read
     |============================================================ */

    public function show(Request $req)
    {
        $cart = $this->getOrCreateCart($req);
        return response()->json(['ok' => true, 'cart' => $this->buildSummary($cart)]);
    }

    /* ============================================================
     |  Add / Update / Remove items
     |============================================================ */

    public function addItem(Request $req)
    {
        $data = $req->validate([
            'product_id'            => ['required', 'exists:products,id'],
            'quantity'              => ['nullable', 'integer', 'min:1'],

            // roll-based (optional)
            'size_unit'             => ['nullable', Rule::in(['in', 'ft'])],
            'width'                 => ['nullable', 'numeric', 'min:0.01'],
            'height'                => ['nullable', 'numeric', 'min:0.01'],

            // design references (optional - accept either)
            'design_id'             => ['nullable', 'integer'],
            'product_design_id'     => ['nullable', 'integer'],
            'user_design_upload_id' => ['nullable', 'exists:user_design_uploads,id'],
            'hire_designer'         => ['nullable', 'boolean'],

            // variants + subvariants + options
            'variant_id'            => ['nullable', 'integer'],
            'subvariant_id'         => ['nullable', 'integer'],
            'variant_sku'           => ['nullable', 'string', 'max:255'],
            'options'               => ['nullable', 'array'],
            'selected_options'      => ['nullable', 'array'], // legacy alias

            // custom override (admins)
            'unit_price_override'   => ['nullable', 'numeric', 'min:0'],

            'meta'                  => ['nullable', 'array'],
        ]);

        $cart      = $this->getOrCreateCart($req);
        $product   = Product::findOrFail($data['product_id']);
        $designCol = $this->designCol();
        $totalCol  = $this->itemTotalCol();
        $hasVar    = $this->hasVariantCols();
        $hasOpt    = $this->hasOptionsCols();

        // Normalize design id
        $designId = $data['design_id'] ?? $data['product_design_id'] ?? null;

        // Variants
        $variantId    = $data['variant_id']    ?? null;
        $subvariantId = $data['subvariant_id'] ?? null;
        $variantSku   = $data['variant_sku']   ?? null;

        // Options + fingerprint (use either 'options' or 'selected_options')
        $options = $data['options'] ?? $data['selected_options'] ?? null;
        $optionsFp = $options ? CartItem::fingerprintOptions($options) : null;

        // Hire a designer lazy-row
        $userDesignId = $data['user_design_upload_id'] ?? null;
        if (!$userDesignId && !empty($data['hire_designer'])) {
            $userDesignId = UserDesignUpload::create([
                'product_id' => $product->id,
                'user_id'    => optional($req->user())->id,
                'session_id' => $cart->session_id,
                'type'       => 'hire',
                'status'     => 'pending',
            ])->id;
        }

        $quantity = max(1, (int)($data['quantity'] ?? 1));
        $sizeUnit = $data['size_unit'] ?? null;
        $width    = array_key_exists('width', $data)  ? (float)$data['width']  : null;
        $height   = array_key_exists('height', $data) ? (float)$data['height'] : null;

        $unitPrice = $this->computeUnitPrice($product, $sizeUnit, $width, $height, $data['unit_price_override'] ?? null);

        DB::transaction(function () use (
            $cart,
            $product,
            $designCol,
            $totalCol,
            $hasVar,
            $hasOpt,
            $quantity,
            $unitPrice,
            $sizeUnit,
            $width,
            $height,
            $designId,
            $userDesignId,
            $options,
            $optionsFp,
            $variantId,
            $subvariantId,
            $variantSku,
            $data
        ) {
            // Try to stack identical line
            $q = $cart->items()
                ->where('product_id', $product->id)
                ->tap(fn($w) => $this->whereNullSafe($w, $designCol, $designId))
                ->tap(fn($w) => $this->whereNullSafe($w, 'user_design_upload_id', $userDesignId))
                ->tap(fn($w) => $this->whereNullSafe($w, 'size_unit', $sizeUnit))
                ->tap(fn($w) => $this->whereNullSafe($w, 'width', $width))
                ->tap(fn($w) => $this->whereNullSafe($w, 'height', $height));

            if ($hasVar) {
                $q->tap(fn($w) => $this->whereNullSafe($w, 'variant_id', $variantId))
                    ->tap(fn($w) => $this->whereNullSafe($w, 'subvariant_id', $subvariantId))
                    ->tap(fn($w) => $this->whereNullSafe($w, 'variant_sku', $variantSku));
            }
            if ($hasOpt) {
                $q->tap(fn($w) => $this->whereNullSafe($w, 'options_fingerprint', $optionsFp));
            }

            $existing = $q->first();

            // Area (feet^2) for roll-based
            $area = null;
            if (($product->pricing_method ?? 'standard') === 'roll' && $width && $height) {
                $wFeet = ($sizeUnit === 'in') ? ($width / 12.0) : $width;
                $hFeet = ($sizeUnit === 'in') ? ($height / 12.0) : $height;
                $area  = round($wFeet * $hFeet, 4);
            }

            if ($existing) {
                $existing->quantity   += $quantity;
                $existing->unit_price  = $unitPrice;
                $existing->{$totalCol} = $existing->quantity * $existing->unit_price;
                $existing->save();
            } else {
                $item = new CartItem();
                $item->cart_id     = $cart->id;
                $item->product_id  = $product->id;

                if (Schema::hasColumn('cart_items', 'product_name'))   $item->product_name   = $product->name ?? null;
                if (Schema::hasColumn('cart_items', 'sku'))            $item->sku            = $product->sku ?? null;
                if (Schema::hasColumn('cart_items', 'pricing_method')) $item->pricing_method = $product->pricing_method ?? 'standard';

                // variants
                if ($hasVar) {
                    $item->variant_id    = $variantId;
                    $item->subvariant_id = $subvariantId;
                    $item->variant_sku   = $variantSku;
                }

                // options
                if ($hasOpt) {
                    $item->options             = $options ?: null;
                    $item->options_fingerprint = $optionsFp;
                } else {
                    // stash in meta for visibility if columns aren’t present
                    $meta = $data['meta'] ?? [];
                    if ($options) $meta['options'] = $options;
                    $item->meta = $meta ?: null;
                }

                $item->{$designCol}             = $designId;
                $item->user_design_upload_id    = $userDesignId;
                $item->quantity                 = $quantity;
                $item->unit_price               = $unitPrice;
                $item->{$totalCol}              = $quantity * $unitPrice;
                $item->size_unit                = $sizeUnit;
                $item->width                    = $width;
                $item->height                   = $height;
                if (Schema::hasColumn('cart_items', 'area')) $item->area = $area;
                if (!$hasOpt && empty($item->meta)) $item->meta = $data['meta'] ?? null;

                $item->save();
            }

            if ($userDesignId) {
                UserDesignUpload::where('id', $userDesignId)->update(['status' => 'pending']);
            }
        });

        $cart->refresh()->load(['items', 'adjustments']);
        $this->recalculate($cart);

        return response()->json(['ok' => true, 'cart' => $this->buildSummary($cart->fresh(['items', 'adjustments']))]);
    }

    public function updateItem(Request $req, CartItem $item)
    {
        $cart = $this->getOrCreateCart($req);
        if ($item->cart_id !== $cart->id) {
            return response()->json(['ok' => false, 'message' => 'Item not in your cart'], 403);
        }

        $data = $req->validate([
            'quantity'              => ['nullable', 'integer', 'min:1'],
            'size_unit'             => ['nullable', Rule::in(['in', 'ft'])],
            'width'                 => ['nullable', 'numeric', 'min:0.01'],
            'height'                => ['nullable', 'numeric', 'min:0.01'],

            'design_id'             => ['nullable', 'integer'],
            'product_design_id'     => ['nullable', 'integer'],
            'user_design_upload_id' => ['nullable', 'exists:user_design_uploads,id'],
            'hire_designer'         => ['nullable', 'boolean'],

            'variant_id'            => ['nullable', 'integer'],
            'subvariant_id'         => ['nullable', 'integer'],
            'variant_sku'           => ['nullable', 'string', 'max:255'],
            'options'               => ['nullable', 'array'],
            'selected_options'      => ['nullable', 'array'],

            'unit_price_override'   => ['nullable', 'numeric', 'min:0'],
            'meta'                  => ['nullable', 'array'],
        ]);

        $product   = Product::findOrFail($item->product_id);
        $designCol = $this->designCol();
        $totalCol  = $this->itemTotalCol();
        $hasVar    = $this->hasVariantCols();
        $hasOpt    = $this->hasOptionsCols();

        $userDesignId = $data['user_design_upload_id'] ?? $item->user_design_upload_id;
        if (!empty($data['hire_designer']) && !$userDesignId) {
            $userDesignId = UserDesignUpload::create([
                'product_id' => $product->id,
                'user_id'    => optional($req->user())->id,
                'session_id' => $cart->session_id,
                'type'       => 'hire',
                'status'     => 'pending',
            ])->id;
        }

        $qty      = isset($data['quantity']) ? max(1, (int)$data['quantity']) : $item->quantity;
        $sizeUnit = $data['size_unit'] ?? $item->size_unit;
        $width    = array_key_exists('width', $data)  ? (float)$data['width']  : $item->width;
        $height   = array_key_exists('height', $data) ? (float)$data['height'] : $item->height;

        $unitPrice = $this->computeUnitPrice($product, $sizeUnit, $width, $height, $data['unit_price_override'] ?? null);

        $designId = $data['design_id'] ?? $data['product_design_id'] ?? $item->{$designCol};

        // variants
        $variantId    = $data['variant_id']    ?? ($hasVar ? $item->variant_id    : null);
        $subvariantId = $data['subvariant_id'] ?? ($hasVar ? $item->subvariant_id : null);
        $variantSku   = $data['variant_sku']   ?? ($hasVar ? $item->variant_sku   : null);

        // options
        $options   = $data['options'] ?? $data['selected_options'] ?? ($hasOpt ? $item->options : null);
        $optionsFp = $options ? CartItem::fingerprintOptions($options) : null;

        // Area if roll-based
        $area = null;
        if (($product->pricing_method ?? 'standard') === 'roll' && $width && $height) {
            $wFeet = ($sizeUnit === 'in') ? ($width / 12.0) : $width;
            $hFeet = ($sizeUnit === 'in') ? ($height / 12.0) : $height;
            $area  = round($wFeet * $hFeet, 4);
        }

        // persist
        $item->quantity              = $qty;
        $item->unit_price            = $unitPrice;
        $item->{$totalCol}           = $qty * $unitPrice;
        $item->size_unit             = $sizeUnit;
        $item->width                 = $width;
        $item->height                = $height;
        if (Schema::hasColumn('cart_items', 'area')) $item->area = $area;

        $item->{$designCol}          = $designId;
        $item->user_design_upload_id = $userDesignId;

        if ($hasVar) {
            $item->variant_id    = $variantId;
            $item->subvariant_id = $subvariantId;
            $item->variant_sku   = $variantSku;
        }
        if ($hasOpt) {
            $item->options             = $options ?: null;
            $item->options_fingerprint = $optionsFp;
        } else {
            $meta = $item->meta ?? [];
            if ($options) $meta['options'] = $options;
            $item->meta = $data['meta'] ?? $meta;
        }

        $item->save();

        $cart->refresh()->load(['items', 'adjustments']);
        $this->recalculate($cart);

        return response()->json(['ok' => true, 'cart' => $this->buildSummary($cart->fresh(['items', 'adjustments']))]);
    }

    public function removeItem(Request $req, CartItem $item)
    {
        $cart = $this->getOrCreateCart($req);
        if ($item->cart_id !== $cart->id) {
            return response()->json(['ok' => false, 'message' => 'Item not in your cart'], 403);
        }

        $item->delete();
        $cart->refresh()->load(['items', 'adjustments']);
        $this->recalculate($cart);

        return response()->json(['ok' => true, 'cart' => $this->buildSummary($cart->fresh(['items', 'adjustments']))]);
    }

    public function clear(Request $req)
    {
        $cart = $this->getOrCreateCart($req);
        DB::transaction(function () use ($cart) {
            $cart->items()->delete();
            $cart->adjustments()->delete();
        });
        $cart->refresh();
        $this->recalculate($cart);

        return response()->json(['ok' => true, 'cart' => $this->buildSummary($cart)]);
    }

    /* ============================================================
     |  Shipping / Offers
     |============================================================ */

    public function setShippingMethod(Request $req)
    {
        $data = $req->validate([
            'shipping_method_id' => ['required', 'exists:shipping_methods,id'],
        ]);

        $cart   = $this->getOrCreateCart($req);
        $method = ShippingMethod::findOrFail($data['shipping_method_id']);

        DB::transaction(function () use ($cart, $method) {
            $cart->adjustments()->where('type', 'shipping')->delete();

            $adj = new CartAdjustment();
            $adj->cart_id = $cart->id;
            $adj->type    = 'shipping';
            $adj->label   = $method->name;
            $adj->amount  = $method->cost;
            $adj->code    = null;
            $adj->meta    = ['shipping_method_id' => $method->id];
            $adj->save();
        });

        $cart->refresh()->load(['items', 'adjustments']);
        $this->recalculate($cart);

        return response()->json(['ok' => true, 'cart' => $this->buildSummary($cart)]);
    }

    public function applyOffer(Request $req)
    {
        $data = $req->validate(['code' => ['required', 'string', 'max:255']]);

        $cart = $this->getOrCreateCart($req);
        $code = trim(Str::upper($data['code']));

        $offer = Offer::where('code', $code)
            ->where('status', 'active')
            ->where('start_date', '<=', now())
            ->where('end_date', '>=', now())
            ->first();

        if (!$offer) {
            return response()->json(['ok' => false, 'message' => 'Offer not found or inactive'], 404);
        }

        $cart->load('items.product');

        $eligibleSubtotal = $this->eligibleSubtotalForOffer($cart, $offer);
        if ($eligibleSubtotal < (float)($offer->min_purchase_amt ?? 0)) {
            return response()->json(['ok' => false, 'message' => 'Cart does not meet minimum purchase for this offer']);
        }

        $customerType = $cart->user_id ? 'users' : 'guests';
        $customerId   = $cart->user_id ?? crc32($cart->session_id);
        $usage = OfferUsage::firstOrCreate([
            'offer_id'      => $offer->id,
            'customer_type' => $customerType,
            'customer_id'   => $customerId,
        ], ['times_used' => 0]);

        if (!is_null($offer->per_customer_limit) && $usage->times_used >= $offer->per_customer_limit) {
            return response()->json(['ok' => false, 'message' => 'Offer usage limit reached for this customer']);
        }

        $discount = $this->computeOfferDiscount($offer, $cart, $eligibleSubtotal);

        DB::transaction(function () use ($cart, $code, $offer, $discount) {
            $cart->adjustments()->where('type', 'discount')->where('code', $code)->delete();

            $adj = new CartAdjustment();
            $adj->cart_id = $cart->id;
            $adj->type    = 'discount';
            $adj->label   = $offer->name;
            $adj->amount  = -abs($discount);
            $adj->code    = $code;
            $adj->meta    = ['offer_id' => $offer->id];
            $adj->save();
        });

        $cart->refresh()->load(['items', 'adjustments']);
        $this->recalculate($cart);

        return response()->json(['ok' => true, 'cart' => $this->buildSummary($cart)]);
    }

    public function removeOffer(Request $req)
    {
        $data = $req->validate(['code' => ['required', 'string', 'max:255']]);

        $cart = $this->getOrCreateCart($req);
        $cart->adjustments()->where('type', 'discount')->where('code', trim(Str::upper($data['code'])))->delete();

        $cart->refresh()->load(['items', 'adjustments']);
        $this->recalculate($cart);

        return response()->json(['ok' => true, 'cart' => $this->buildSummary($cart)]);
    }

    /* ============================================================
     |  Addresses
     |============================================================ */

    public function setAddresses(Request $req)
    {
        $data = $req->validate([
            'billing_address_id'  => ['nullable', 'integer'],
            'shipping_address_id' => ['nullable', 'integer'],
        ]);

        $cart = $this->getOrCreateCart($req);

        $updates = [];
        if (!empty($data['billing_address_id'])  && Schema::hasColumn('carts', 'billing_address_id'))  $updates['billing_address_id']  = $data['billing_address_id'];
        if (!empty($data['shipping_address_id']) && Schema::hasColumn('carts', 'shipping_address_id')) $updates['shipping_address_id'] = $data['shipping_address_id'];

        if ($updates) {
            $cart->fill($updates)->save();
        } else {
            $meta = $cart->meta ?? [];
            $meta['billing_address_id']  = $data['billing_address_id']  ?? null;
            $meta['shipping_address_id'] = $data['shipping_address_id'] ?? null;
            $cart->meta = $meta;
            $cart->save();
        }

        $cart->refresh()->load(['items', 'adjustments']);
        $this->recalculate($cart);

        return response()->json(['ok' => true, 'cart' => $this->buildSummary($cart)]);
    }

    /* ============================================================
     |  Attach a user upload to an item
     |============================================================ */

    public function attachUpload(Request $req, CartItem $item)
    {
        $data = $req->validate([
            'user_design_upload_id' => ['required', 'exists:user_design_uploads,id'],
        ]);

        $cart = $this->getOrCreateCart($req);
        if ($item->cart_id !== $cart->id) {
            return response()->json(['ok' => false, 'message' => 'Item not in your cart'], 403);
        }

        $item->user_design_upload_id = $data['user_design_upload_id'];
        $item->save();

        return response()->json(['ok' => true, 'item' => $item->fresh()]);
    }

    /* ============================================================
     |  Calculations
     |============================================================ */

    protected function computeUnitPrice(Product $product, ?string $sizeUnit, ?float $w, ?float $h, ?float $override): float
    {
        if ($override !== null) return max(0, (float)$override);

        if (($product->pricing_method ?? null) === 'roll' && $w && $h) {
            $wFeet = ($sizeUnit === 'in') ? ($w / 12.0) : $w;
            $hFeet = ($sizeUnit === 'in') ? ($h / 12.0) : $h;
            $area  = max(0.0, $wFeet * $hFeet);
            $rate  = (float)($product->price_per_sqft ?? 0);
            return round($area * $rate, 2);
        }

        return round((float)($product->price ?? 0), 2);
    }

    protected function eligibleSubtotalForOffer(Cart $cart, Offer $offer): float
    {
        $scopedIds = OfferProduct::where('offer_id', $offer->id)->pluck('product_id')->all();
        $totalCol  = $this->itemTotalCol();

        $sum = 0.0;
        foreach ($cart->items as $it) {
            if (empty($scopedIds) || in_array($it->product_id, $scopedIds)) {
                $sum += (float)$it->{$totalCol};
            }
        }
        return round($sum, 2);
    }

    protected function computeOfferDiscount(Offer $offer, Cart $cart, float $eligibleSubtotal): float
    {
        switch ($offer->offer_type) {
            case 'percent':
                return round($eligibleSubtotal * (float)$offer->discount_value / 100.0, 2);
            case 'fixed':
                return min(round((float)$offer->discount_value, 2), $eligibleSubtotal);
            case 'free_shipping':
                $shipping = $cart->adjustments->firstWhere('type', 'shipping');
                return $shipping ? round((float)$shipping->amount, 2) : 0.0;
            case 'bogo':
            case 'bundle':
            default:
                return 0.0;
        }
    }

    protected function computeTaxAmount(Cart $cart): float
    {
        $rates    = TaxRate::all();
        $totalCol = $this->itemTotalCol();

        $itemsTotal = (float)$cart->items->sum($totalCol);
        $discount   = (float)$cart->adjustments->where('type', 'discount')->sum('amount'); // negative
        $shipping   = (float)$cart->adjustments->where('type', 'shipping')->sum('amount');

        $taxable = max(0.0, $itemsTotal + $discount + $shipping);
        $tax = 0.0;
        foreach ($rates as $r) {
            $tax += $taxable * (float)$r->rate;
        }
        return round($tax, 2);
    }

    protected function recalculate(Cart $cart): void
    {
        $cart->loadMissing(['items', 'adjustments']);

        $cols     = $this->cartTotalCols();
        $totalCol = $this->itemTotalCol();

        $itemsTotal  = (float)$cart->items->sum($totalCol);
        $discountSum = (float)$cart->adjustments->where('type', 'discount')->sum('amount'); // negative
        $discountAbs = abs(min(0, $discountSum));
        $shipping    = (float)$cart->adjustments->where('type', 'shipping')->sum('amount');
        $tax         = $this->computeTaxAmount($cart);
        $grand       = round($itemsTotal - $discountAbs + $shipping + $tax, 2);

        $cart->{$cols['subtotal']} = round($itemsTotal, 2);
        $cart->{$cols['discount']} = round($discountAbs, 2);
        $cart->{$cols['shipping']} = round($shipping, 2);
        $cart->{$cols['tax']}      = round($tax, 2);
        $cart->{$cols['grand']}    = $grand;
        $cart->save();
    }

    protected function buildSummary(Cart $cart): array
    {
        $cols      = $this->cartTotalCols();
        $designCol = $this->designCol();
        $totalCol  = $this->itemTotalCol();
        $hasVar    = $this->hasVariantCols();
        $hasOpt    = $this->hasOptionsCols();

        return [
            'id'       => $cart->id,
            'status'   => $cart->status,
            'currency' => $cart->currency_code,
            'items'    => $cart->items->map(function (CartItem $i) use ($designCol, $totalCol, $hasVar, $hasOpt) {
                return array_filter([
                    'id'                    => $i->id,
                    'product_id'            => $i->product_id,
                    'design_id'             => $i->{$designCol},
                    'user_design_upload_id' => $i->user_design_upload_id,
                    'quantity'              => $i->quantity,
                    'unit_price'            => (float)$i->unit_price,
                    'subtotal'              => (float)$i->{$totalCol},
                    'size_unit'             => $i->size_unit,
                    'width'                 => $i->width,
                    'height'                => $i->height,
                    'area'                  => $i->area ?? null,
                    // variants
                    'variant_id'            => $hasVar ? $i->variant_id    : null,
                    'subvariant_id'         => $hasVar ? $i->subvariant_id : null,
                    'variant_sku'           => $hasVar ? $i->variant_sku   : null,
                    // options
                    'options'               => $hasOpt ? $i->options : (($i->meta['options'] ?? null) ?: null),
                ], fn($v) => $v !== null);
            })->values(),
            'adjustments' => $cart->adjustments->map(fn($a) => [
                'id'     => $a->id,
                'type'   => $a->type,
                'label'  => $a->label,
                'amount' => (float)$a->amount,
                'code'   => $a->code,
                'meta'   => $a->meta,
            ])->values(),
            'totals' => [
                'subtotal' => (float)$cart->{$cols['subtotal']},
                'discount' => (float)$cart->{$cols['discount']},
                'shipping' => (float)$cart->{$cols['shipping']},
                'tax'      => (float)$cart->{$cols['tax']},
                'total'    => (float)$cart->{$cols['grand']},
            ],
        ];
    }
}
