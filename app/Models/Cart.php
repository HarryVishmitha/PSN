<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;

/**
 * Cart with polymorphic addresses (billing/shipping) stored in addresses table.
 *
 * @property int                         $id
 * @property int|null                    $user_id
 * @property string|null                 $session_id
 * @property string                      $currency_code
 * @property string                      $status            // open|converted|abandoned|merged
 * @property bool                        $is_quote
 * @property string                      $subtotal
 * @property string                      $discount_total
 * @property string                      $tax_total
 * @property string                      $shipping_total
 * @property string                      $grand_total
 * @property array|null                  $meta
 * @property \Illuminate\Support\Carbon  $created_at
 * @property \Illuminate\Support\Carbon  $updated_at
 *
 * @property-read \Illuminate\Database\Eloquent\Collection|\App\Models\CartItem[]          $items
 * @property-read \Illuminate\Database\Eloquent\Collection|\App\Models\CartAdjustment[]    $adjustments
 * @property-read \Illuminate\Database\Eloquent\Collection|\App\Models\Address[]           $addresses
 * @property-read \App\Models\Address|null                                                 $billingAddress
 * @property-read \App\Models\Address|null                                                 $shippingAddress
 */
class Cart extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'session_id',
        'currency_code',
        'status',
        'is_quote',
        'subtotal',
        'discount_total',
        'tax_total',
        'shipping_total',
        'grand_total',
        'meta',
    ];

    protected $casts = [
        'meta'            => 'array',
        'is_quote'        => 'boolean',
        'subtotal'        => 'decimal:2',
        'discount_total'  => 'decimal:2',
        'tax_total'       => 'decimal:2',
        'shipping_total'  => 'decimal:2',
        'grand_total'     => 'decimal:2',
    ];

    /** Relationships */
    public function user()
    {
        return $this->belongsTo(User::class);
    }
    public function items()
    {
        return $this->hasMany(CartItem::class);
    }
    public function adjustments()
    {
        return $this->hasMany(CartAdjustment::class);
    }

    /** Polymorphic addresses */
    public function addresses()
    {
        return $this->morphMany(Address::class, 'addressable');
    }

    public function billingAddress()
    {
        return $this->morphOne(Address::class, 'addressable')->where('type', 'billing');
    }

    public function shippingAddress()
    {
        return $this->morphOne(Address::class, 'addressable')->where('type', 'shipping');
    }

    /** Scopes */
    public function scopeOpen($q)
    {
        return $q->where('status', 'open');
    }

    /**
     * Ensure one open cart per user/guest (merges guest cart on login).
     */
    public static function forRequest(Request $req, bool $isQuote = false): self
    {
        if (!$req->session()->has('_cart_sid')) {
            $req->session()->put('_cart_sid', bin2hex(random_bytes(16)));
        }
        $sid   = $req->session()->get('_cart_sid');
        $query = static::query()->open()->where('is_quote', $isQuote);

        if ($req->user()) {
            $userCart = $query->where('user_id', $req->user()->id)->first();
            if ($userCart) {
                $guestCart = $query->whereNull('user_id')->where('session_id', $sid)->first();
                if ($guestCart && $guestCart->id !== $userCart->id) {
                    $userCart->merge($guestCart);
                }
                return $userCart;
            }

            $guestCart = $query->whereNull('user_id')->where('session_id', $sid)->first();
            if ($guestCart) {
                $guestCart->update(['user_id' => $req->user()->id]);
                return $guestCart;
            }

            return static::create([
                'user_id'       => $req->user()->id,
                'session_id'    => $sid,
                'is_quote'      => $isQuote,
                'currency_code' => config('app.currency', 'LKR'),
                'status'        => 'open',
            ]);
        }

        return $query->where('session_id', $sid)->first()
            ?? static::create([
                'session_id'    => $sid,
                'is_quote'      => $isQuote,
                'currency_code' => config('app.currency', 'LKR'),
                'status'        => 'open',
            ]);
    }

    /** Merge another cart (moves items/adjustments/addresses) */
    public function merge(Cart $other): void
    {
        if ($other->id === $this->id) return;

        CartItem::where('cart_id', $other->id)->update(['cart_id' => $this->id]);
        CartAdjustment::where('cart_id', $other->id)->update(['cart_id' => $this->id]);

        // move addresses (re-attach to this cart)
        Address::where('addressable_type', Cart::class)
            ->where('addressable_id', $other->id)
            ->update(['addressable_id' => $this->id]);

        $other->update(['status' => 'merged']);
        $this->recomputeTotals();
    }

    /** Totals recompute (kept from earlier version) */
    public function recomputeTotals(): void
    {
        $this->loadMissing(['items.adjustments', 'adjustments']);

        $subtotal = (float) $this->items->sum('total_price');

        $itemDiscount = 0.0;
        $itemTax      = 0.0;
        $itemFees     = 0.0;

        foreach ($this->items as $item) {
            $itemDiscount += $item->adjustmentSumByType(['discount']);
            $itemTax      += $item->adjustmentSumByType(['tax']);
            $itemFees     += $item->adjustmentSumByType(['fee', 'surcharge']);
        }

        $cartDiscount = (float) $this->adjustments->where('type', 'discount')->sum('amount');
        $cartTax      = (float) $this->adjustments->where('type', 'tax')->sum('amount');
        $cartShip     = (float) $this->adjustments->where('type', 'shipping')->sum('amount');
        $cartFees     = (float) $this->adjustments->where('type', 'fee')->sum('amount');

        $discount_total = $cartDiscount + $itemDiscount;
        $tax_total      = $cartTax + $itemTax;
        $shipping_total = $cartShip + $cartFees + $itemFees;

        $grand_total = $subtotal + $discount_total + $tax_total + $shipping_total;

        $this->forceFill([
            'subtotal'       => round($subtotal, 2),
            'discount_total' => round($discount_total, 2),
            'tax_total'      => round($tax_total, 2),
            'shipping_total' => round($shipping_total, 2),
            'grand_total'    => round($grand_total, 2),
        ])->save();
    }

    /** Item helpers */
    public function addItem(array $attributes): CartItem
    {
        $item = $this->items()->create($attributes);
        $this->recomputeTotals();
        return $item->fresh();
    }

    public function applyAdjustment(string $type, ?string $code, ?string $label, float $amount, ?array $meta = null): CartAdjustment
    {
        $adj = $this->adjustments()->create([
            'type'   => $type,   // discount|shipping|fee|tax
            'code'   => $code,
            'label'  => $label,
            'amount' => $amount,
            'meta'   => $meta,
        ]);
        $this->recomputeTotals();
        return $adj;
    }

    public function clear(): void
    {
        $this->items()->delete();
        $this->adjustments()->delete();
        $this->addresses()->delete();
        $this->recomputeTotals();
    }

    /** ---------- Address helpers ---------- */

    /**
     * Create or replace the billing address on this cart.
     * @param array{line1:string,line2?:string,city:string,region:string,postal_code:string,country:string} $data
     */
    public function setBillingAddress(array $data): Address
    {
        return tap($this->billingAddress()->firstOrNew([]), function (Address $addr) use ($data) {
            $addr->fill(array_merge($data, [
                'type'            => 'billing',
                'addressable_type' => static::class,
                'addressable_id'  => $this->id,
            ]));
            $addr->save();
        });
    }

    /**
     * Create or replace the shipping address on this cart.
     * @param array{line1:string,line2?:string,city:string,region:string,postal_code:string,country:string} $data
     */
    public function setShippingAddress(array $data): Address
    {
        return tap($this->shippingAddress()->firstOrNew([]), function (Address $addr) use ($data) {
            $addr->fill(array_merge($data, [
                'type'            => 'shipping',
                'addressable_type' => static::class,
                'addressable_id'  => $this->id,
            ]));
            $addr->save();
        });
    }

    /**
     * Convenience to set both at once (shipping fallback to billing if not provided).
     *
     * @param array $billing required
     * @param array|null $shipping optional
     */
    public function setAddresses(array $billing, ?array $shipping = null): void
    {
        $this->setBillingAddress($billing);
        $this->setShippingAddress($shipping ?? $billing);
    }
}
