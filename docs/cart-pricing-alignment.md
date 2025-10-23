# Cart Pricing Alignment with AdminController

## Overview
This document explains how cart pricing has been aligned with the estimate pricing logic in `AdminController::storeEstimate()`.

## Key Changes

### 1. Roll-Based Products - No Variant Adjustments
**Change**: Roll-based products now calculate pricing as `area × price_per_sqft` WITHOUT variant adjustments.

**Rationale**: 
- Matches the logic in `AdminController::storeEstimate()` where roll-based products don't include variant price adjustments
- Simplifies pricing calculation for custom roll orders
- Variant adjustments only apply to standard (piece-based) products

**Code Location**: `CartController::computeUnitPrice()` (lines ~738-770)

```php
// Roll-based pricing (price per square foot)
// Matches AdminController::storeEstimate() logic - NO variant adjustments for rolls
if (($product->pricing_method ?? null) === 'roll' && $w && $h) {
    $wFeet = ($sizeUnit === 'in') ? ($w / 12.0) : $w;
    $hFeet = ($sizeUnit === 'in') ? ($h / 12.0) : $h;
    $area  = max(0.0, $wFeet * $hFeet);
    $rate  = (float)($product->price_per_sqft ?? 0);
    $basePrice = $area * $rate;
    
    // Roll-based products don't use variant adjustments
    // Return base price only (matching estimate calculation)
    return round($basePrice, 2);
}
```

### 2. Standard Products - Include Variant Adjustments
**Change**: Standard (piece-based) products calculate as `product.price + variant_adjustments`.

**Code**:
```php
// Standard pricing (fixed price per item)
$basePrice = (float)($product->price ?? 0);

// Add variant adjustments ONLY for standard products
$variantAdjustment = $this->computeVariantAdjustments($product, $variantId, $subvariantId);

return round($basePrice + $variantAdjustment, 2);
```

## Pricing Comparison: Cart vs Estimate

### Roll-Based Products
| Component | Cart Pricing | Estimate Pricing |
|-----------|-------------|------------------|
| Base Calculation | area × price_per_sqft | fixedArea × pricePerSqFt |
| Offcut Pricing | ❌ Not included | ✅ Included (offcutArea × offcutPricePerSqFt) |
| Variant Adjustments | ❌ Not included | ❌ Not included |
| **Purpose** | **Estimate for customer** | **Final quote after review** |

**Why the difference?**
- Cart pricing provides a baseline estimate to help customers understand approximate costs
- Estimate pricing includes offcut calculations and final measurements verified by Printair team
- Both systems recognize that roll products require custom cutting and precise calculation

### Standard Products
| Component | Cart Pricing | Estimate Pricing |
|-----------|-------------|------------------|
| Base Price | product.price | product.price or item.unit_price |
| Variant Adjustments | ✅ Included | ✅ Included |
| **Consistency** | **✅ Matches estimate logic** | **✅ Matches cart logic** |

## Customer Communication

### New Cart Summary Notices

The cart response now includes a `notices` object to communicate important information:

```json
{
  "notices": {
    "all_products": "All products are custom orders. Prices shown are estimates only. The Printair team will review your order and confirm final pricing.",
    "roll_based_products": "Roll-based products in your cart are for ORDER REQUESTS ONLY and cannot be purchased directly. Our team will verify dimensions and provide final pricing."
  }
}
```

**Display Logic**:
- `all_products`: Always shown for all carts
- `roll_based_products`: Only shown when cart contains roll-based products (detected via `hasRollBasedProducts()` method)

### Implementation
```php
protected function hasRollBasedProducts(Cart $cart): bool
{
    $productIds = $cart->items->pluck('product_id')->unique()->all();
    return \App\Models\Product::whereIn('id', $productIds)
        ->where('pricing_method', 'roll')
        ->exists();
}
```

## Frontend Integration Recommendations

### 1. Display Notices Prominently
```javascript
// Example: Display notices in cart UI
if (cartData.notices.all_products) {
    showNotice(cartData.notices.all_products, 'info');
}

if (cartData.notices.roll_based_products) {
    showNotice(cartData.notices.roll_based_products, 'warning');
}
```

### 2. Disable Direct Checkout for Roll Products
```javascript
// Example: Conditional checkout button
const hasRollProducts = cartData.notices.roll_based_products !== null;
const checkoutLabel = hasRollProducts 
    ? 'Submit Order Request' 
    : 'Proceed to Checkout';
```

### 3. Show Price as Estimate
```html
<!-- Example: Display pricing with estimate label -->
<div class="price-display">
    <span class="amount">Rs {{ price }}</span>
    <span class="estimate-label">(Estimated)</span>
</div>
```

## Order Workflow

### For All Products (Standard & Roll):
1. **Customer**: Adds items to cart, sees estimated prices
2. **Customer**: Submits order request
3. **Printair Team**: Reviews order details
4. **Printair Team**: Verifies measurements (especially for roll products)
5. **Printair Team**: Calculates final pricing (including offcuts for rolls)
6. **Printair Team**: Creates estimate with confirmed pricing
7. **Printair Team**: Sends estimate to customer
8. **Customer**: Reviews and confirms final pricing
9. **Order**: Proceeds to production

### Key Points:
- Cart prices are **ESTIMATES** to help customers plan
- All products require admin review and price confirmation
- Roll products need precise dimension verification
- Final pricing may differ from cart estimates (especially for rolls with offcut considerations)

## Security Note

All pricing calculations remain server-side:
- Frontend prices are validated against backend calculations
- `computeUnitPrice()` is the single source of truth
- Price manipulation attempts are logged
- Tolerance of 2 cents for floating-point rounding

## Testing Recommendations

### Test Case 1: Standard Product with Variants
```
Product: Standard Banner
Base Price: Rs 1000
Variant: Premium Finish (+Rs 200)
Expected Cart Price: Rs 1200 ✅
Expected Estimate Price: Rs 1200 ✅
```

### Test Case 2: Roll Product without Variants
```
Product: Vinyl Roll
Pricing: Rs 50/sqft
Size: 10ft × 5ft = 50 sqft
Expected Cart Price: Rs 2500 (50 × 50) ✅
Expected Estimate Price: Rs 2500 + offcut pricing ✅
```

### Test Case 3: Roll Product with Variants
```
Product: Vinyl Roll
Pricing: Rs 50/sqft
Size: 10ft × 5ft = 50 sqft
Variant: Premium Material (+Rs 15/sqft)
Expected Cart Price: Rs 2500 (variants NOT applied) ✅
Expected Estimate Price: Rs 2500 + offcut (variants NOT applied) ✅
```

## Conclusion

The cart pricing system now:
✅ Aligns with estimate pricing logic for both product types
✅ Excludes variant adjustments for roll-based products
✅ Includes variant adjustments for standard products
✅ Clearly communicates to customers that prices are estimates
✅ Maintains backend security for price calculations
✅ Provides appropriate notices for custom order workflow
