<?php

namespace App\Services;

use App\Models\Product;
use App\Models\Roll;
use Illuminate\Validation\ValidationException;

class OrderItemCalculator
{
    /**
     * Compute authoritative pricing for order items, mirroring the estimate logic.
     *
     * @param  array<int,array<string,mixed>>  $itemsPayload
     * @return array{items: array<int,array<string,mixed>>, subtotal: float}
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function compute(array $itemsPayload): array
    {
        $items = collect($itemsPayload);
        if ($items->isEmpty()) {
            throw ValidationException::withMessages([
                'items' => 'At least one line item is required.',
            ]);
        }

        $productIds = $items->pluck('product_id')->filter()->unique()->values();
        $products = Product::whereIn('id', $productIds)->get()->keyBy('id');

        $rollIds = $items->pluck('roll_id')->filter()->unique()->values();
        $rolls = $rollIds->isNotEmpty()
            ? Roll::whereIn('id', $rollIds)->get()->keyBy('id')
            : collect();

        $results = [];
        $subtotal = 0.0;

        foreach ($items as $index => $payload) {
            $idx = (string) $index;
            $productId = $payload['product_id'] ?? null;
            if (!$productId || !$products->has($productId)) {
                throw ValidationException::withMessages([
                    "items.$idx.product_id" => 'Please select a valid product.',
                ]);
            }

            /** @var \App\Models\Product $product */
            $product = $products->get($productId);
            $quantity = (float) ($payload['quantity'] ?? $payload['qty'] ?? 0);
            if ($quantity <= 0) {
                throw ValidationException::withMessages([
                    "items.$idx.quantity" => 'Quantity must be greater than zero.',
                ]);
            }

            $isRoll = (bool) ($payload['is_roll'] ?? false);
            if (!$isRoll) {
                $isRoll = ($product->pricing_method ?? null) === 'roll';
            }

            $baseUnit = $payload['unit'] ?? $product->unit_of_measure ?? 'unit';
            $unitPrice = null;
            $lineTotal = null;
            $rollMetrics = null;
            $rollId = $payload['roll_id'] ?? null;
            $selectedRoll = null;
            $cutWidthIn = $payload['cut_width_in'] ?? $payload['width_in'] ?? null;
            $cutHeightIn = $payload['cut_height_in'] ?? $payload['height_in'] ?? null;
            $offcutPricePerSqFt = $payload['offcut_price_per_sqft'] ?? null;

            if ($isRoll) {
                if (!$rollId || !$rolls->has($rollId)) {
                    throw ValidationException::withMessages([
                        "items.$idx.roll_id" => 'Select a valid roll for this product.',
                    ]);
                }
                /** @var \App\Models\Roll $selectedRoll */
                $selectedRoll = $rolls->get($rollId);

                $widthIn = (float) $cutWidthIn;
                $heightIn = (float) $cutHeightIn;
                if ($widthIn <= 0 || $heightIn <= 0) {
                    throw ValidationException::withMessages([
                        "items.$idx.cut_width_in"  => 'Width and height must be greater than zero.',
                        "items.$idx.cut_height_in" => 'Width and height must be greater than zero.',
                    ]);
                }

                // roll width stored as feet; normalize to inches for comparison
                $rollWidthIn = (float) ($selectedRoll->roll_width ?? 0) * 12.0;
                if ($rollWidthIn <= 0) {
                    throw ValidationException::withMessages([
                        "items.$idx.roll_id" => 'Selected roll is missing a width configuration.',
                    ]);
                }
                if ($widthIn - $rollWidthIn > 0.01) {
                    throw ValidationException::withMessages([
                        "items.$idx.cut_width_in" => sprintf(
                            'Cut width %.2f" exceeds roll width %.2f".',
                            $widthIn,
                            $rollWidthIn
                        ),
                    ]);
                }

                $widthFt = $widthIn / 12.0;
                $heightFt = $heightIn / 12.0;
                $fixedAreaFt2 = $widthFt * $heightFt;
                $offcutIn = max($rollWidthIn - $widthIn, 0.0);
                $offcutAreaFt2 = ($offcutIn / 12.0) * $heightFt;

                $pricePerSqFt = (float) ($product->price_per_sqft ?? 0);
                $offcutRate = (float) ($offcutPricePerSqFt ?? $selectedRoll->offcut_price ?? 0);

                $unitPrice = round(($fixedAreaFt2 * $pricePerSqFt) + ($offcutAreaFt2 * $offcutRate), 2);
                $lineTotal = round($unitPrice * $quantity, 2);

                $rollMetrics = [
                    'fixed_area_ft2'  => round($fixedAreaFt2, 4),
                    'offcut_area_ft2' => round($offcutAreaFt2, 4),
                    'price_per_sqft'  => round($pricePerSqFt, 2),
                    'offcut_rate'     => round($offcutRate, 2),
                ];
            } else {
                $unitPrice = isset($payload['unit_price'])
                    ? max(0, (float) $payload['unit_price'])
                    : (float) ($product->price ?? 0);
                $lineTotal = round($unitPrice * $quantity, 2);
            }

            $subtotal += $lineTotal;

            $results[] = [
                'product_id'            => $product->id,
                'variant_id'            => $payload['variant_id'] ?? null,
                'subvariant_id'         => $payload['subvariant_id'] ?? null,
                'description'           => $payload['description'] ?? '',
                'unit'                  => $baseUnit,
                'quantity'              => round($quantity, 3),
                'unit_price'            => $unitPrice,
                'line_total'            => $lineTotal,
                'is_roll'               => $isRoll,
                'roll_id'               => $isRoll ? $rollId : null,
                'cut_width_in'          => $isRoll ? round((float) $cutWidthIn, 3) : null,
                'cut_height_in'         => $isRoll ? round((float) $cutHeightIn, 3) : null,
                'offcut_price_per_sqft' => $isRoll ? round((float) ($offcutPricePerSqFt ?? $selectedRoll?->offcut_price ?? 0), 2) : null,
                'pricing_method'        => $product->pricing_method,
                'name'                  => $payload['name'] ?? $product->name,
                'meta' => [
                    'roll' => $rollMetrics,
                ],
            ];
        }

        return [
            'items'    => $results,
            'subtotal' => round($subtotal, 2),
        ];
    }
}
