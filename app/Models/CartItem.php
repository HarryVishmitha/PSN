<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * @property int                         $id
 * @property int                         $cart_id
 * @property int                         $product_id
 * @property string|null                 $product_name
 * @property string|null                 $sku
 * @property string                      $pricing_method     // standard|roll
 * @property int                         $quantity
 * @property string|null                 $size_unit          // in|ft
 * @property float|null                  $width
 * @property float|null                  $height
 * @property float|null                  $area
 * @property float                       $unit_price
 * @property float                       $total_price
 * @property array|null                  $selected_options   // (legacy, still supported)
 * @property array|null                  $options            // canonical options bag
 * @property string|null                 $options_fingerprint
 * @property int|null                    $variant_id
 * @property int|null                    $subvariant_id
 * @property string|null                 $variant_sku
 * @property int|null                    $design_id          // <- use this (NOT product_design_id)
 * @property int|null                    $user_design_upload_id
 * @property string                      $status             // active|backorder|discontinued
 * @property array|null                  $meta
 * @property \Illuminate\Support\Carbon  $created_at
 * @property \Illuminate\Support\Carbon  $updated_at
 *
 * @property-read \App\Models\Cart       $cart
 * @property-read \App\Models\Product    $product
 * @property-read \Illuminate\Database\Eloquent\Collection|\App\Models\CartItemAdjustment[] $adjustments
 */
class CartItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'cart_id',
        'product_id',
        'product_name',
        'sku',
        'pricing_method',
        'quantity',
        'size_unit',
        'width',
        'height',
        'area',
        'unit_price',
        'total_price',

        // options / variants
        'selected_options',       // legacy
        'options',
        'options_fingerprint',
        'variant_id',
        'subvariant_id',
        'variant_sku',

        // designs
        'design_id',              // <— use this column name
        'user_design_upload_id',

        'status',
        'meta',
    ];

    protected $casts = [
        'selected_options' => 'array',
        'options'          => 'array',
        'meta'             => 'array',

        'unit_price'  => 'decimal:2',
        'total_price' => 'decimal:2',
        'width'       => 'decimal:3',
        'height'      => 'decimal:3',
        'area'        => 'decimal:4',
    ];

    /* ----------------------------------------------------------------------
     |  Relationships
     * ---------------------------------------------------------------------*/
    public function cart()
    {
        return $this->belongsTo(Cart::class);
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function adjustments()
    {
        return $this->hasMany(CartItemAdjustment::class);
    }

    public function design()
    {
        // If your designs live in App\Models\Design and the FK is "design_id"
        return $this->belongsTo(Design::class, 'design_id');
    }

    public function userDesignUpload()
    {
        return $this->belongsTo(UserDesignUpload::class);
    }

    // Optional: if you have variant models, uncomment these:
    public function variant()
    {
        return $this->belongsTo(ProductVariant::class, 'variant_id');
    }
    public function subvariant()
    {
        return $this->belongsTo(ProductVariant::class, 'subvariant_id');
    }

    /* ----------------------------------------------------------------------
     |  Model events: keep fingerprint (& area) in sync automatically
     * ---------------------------------------------------------------------*/
    protected static function booted(): void
    {
        static::saving(function (CartItem $item) {
            // If "options" not set but legacy "selected_options" is, mirror it.
            if (is_null($item->options) && is_array($item->selected_options)) {
                $item->options = $item->selected_options;
            }

            // Always maintain fingerprint when options present
            if (is_array($item->options)) {
                $item->options_fingerprint = static::fingerprintOptions($item->options);
            } else {
                $item->options_fingerprint = null;
            }

            // For roll pricing, keep area in sync if width/height changed
            if ($item->pricing_method === 'roll' && $item->width && $item->height) {
                // Area is *unit-agnostic* here; your controller already converts inches->feet for price.
                $item->area = round((float)$item->width * (float)$item->height, 4);
            }
        });
    }

    /* ----------------------------------------------------------------------
     |  Query helpers
     * ---------------------------------------------------------------------*/

    /**
     * Scope to find a “stackable” line based on exact configuration.
     *
     * Example:
     * CartItem::query()->matchingConfig($cartId, [
     *   'product_id' => 9,
     *   'variant_id' => 3,
     *   'subvariant_id' => null,
     *   'options' => ['Size' => 'XL', 'Color' => 'Black'],
     *   'size_unit' => 'in', 'width' => 24, 'height' => 36,
     *   'design_id' => null, 'user_design_upload_id' => 12,
     * ])->first();
     */
    public function scopeMatchingConfig($q, int $cartId, array $cfg)
    {
        $fp = static::fingerprintOptions($cfg['options'] ?? null);

        return $q->where('cart_id', $cartId)
            ->where('product_id', $cfg['product_id'])
            ->where(function ($w) use ($cfg) {
                // variants
                $w->where(function ($v) use ($cfg) {
                    $v->whereNull('variant_id')->whereNull('subvariant_id')->whereNull('variant_sku');
                    if (
                        !is_null($cfg['variant_id'] ?? null) ||
                        !is_null($cfg['subvariant_id'] ?? null) ||
                        !is_null($cfg['variant_sku'] ?? null)
                    ) {
                        $v->orWhere(function ($vv) use ($cfg) {
                            $vv->where('variant_id', $cfg['variant_id'] ?? null)
                                ->where('subvariant_id', $cfg['subvariant_id'] ?? null)
                                ->where('variant_sku', $cfg['variant_sku'] ?? null);
                        });
                    }
                });
            })
            ->where('options_fingerprint', $fp)
            ->where('size_unit', $cfg['size_unit'] ?? null)
            ->where('width', $cfg['width'] ?? null)
            ->where('height', $cfg['height'] ?? null)
            ->where('design_id', $cfg['design_id'] ?? null)
            ->where('user_design_upload_id', $cfg['user_design_upload_id'] ?? null);
    }

    /* ----------------------------------------------------------------------
     |  Business helpers
     * ---------------------------------------------------------------------*/

    /**
     * Add an item-level adjustment and (optionally) recompute the cart.
     */
    public function addAdjustment(
        string $type,
        ?string $code,
        ?string $label,
        float $amount,
        ?array $meta = null,
        bool $recomputeCart = true
    ): CartItemAdjustment {
        $adj = $this->adjustments()->create([
            'type'   => $type,   // discount|surcharge|fee|tax
            'code'   => $code,
            'label'  => $label,
            'amount' => $amount, // negative for discount
            'meta'   => $meta,
        ]);

        if ($recomputeCart && $this->cart && method_exists($this->cart, 'recomputeTotals')) {
            $this->cart->recomputeTotals();
        }

        return $adj;
    }

    /**
     * Reprice this item based on current product (fallback).
     * Controller/service should remain the main source of truth.
     */
    public function repriceFromProduct(?float $pricePerSqft = null): void
    {
        if ($this->pricing_method === 'roll') {
            $pps = $pricePerSqft ?? (float) optional($this->product)->price_per_sqft;
            $area = (float) $this->area;
            $this->unit_price = $pps * max(0.0, $area);
        } else {
            $this->unit_price = (float) optional($this->product)->price;
        }
        $this->total_price = $this->unit_price * max(1, (int) $this->quantity);
        $this->save();
    }

    /* ----------------------------------------------------------------------
     |  Internals
     * ---------------------------------------------------------------------*/

    /**
     * Build a stable, deterministic fingerprint for an options array.
     */
    public static function fingerprintOptions($options): ?string
    {
        if (empty($options) || !is_array($options)) return null;

        $normalize = function ($value) use (&$normalize) {
            if (is_array($value)) {
                // Sort associative arrays for canonical order
                if (CartItem::isAssoc($value)) {
                    ksort($value);
                }
                // Recurse into children
                foreach ($value as $k => $v) {
                    $value[$k] = $normalize($v);
                }
                return $value;
            }
            // Normalize scalars to strings
            if (is_bool($value)) return $value ? 'true' : 'false';
            if ($value === null)  return 'null';
            return (string) $value;
        };

        $normalized = $normalize($options);
        $json = json_encode($normalized, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

        // 64-hex sha256; matches VARCHAR(64) nicely
        return hash('sha256', $json);
    }

    protected static function isAssoc(array $arr): bool
    {
        return array_keys($arr) !== range(0, count($arr) - 1);
    }
}
