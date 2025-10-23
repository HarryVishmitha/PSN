# Cart Security Improvements

## Overview
Enhanced the CartController to prevent price manipulation attacks by implementing backend price validation and calculation as the single source of truth.

## Key Changes

### 1. Backend Price Calculation (Single Source of Truth)
**Method**: `computeUnitPrice()`

All prices are now calculated on the backend:
- **Standard Products**: `product.price + variant_adjustments`
- **Roll-Based Products**: `(width × height × price_per_sqft) + variant_adjustments`

**Variant Price Adjustments** are fetched from the database, never from frontend:
- Variant price adjustments from `product_variants.price_adjustment`
- Subvariant price adjustments from `product_subvariants.price_adjustment`

### 2. Price Validation
**Method**: `validatePrice()`

When frontend sends a price (for display purposes), it's validated against backend calculation:
- Tolerance: 2 cents (for floating-point precision)
- Logs suspicious activity with IP and user ID
- Throws exception if price doesn't match
- Frontend prices are ONLY used for display confirmation

### 3. Variant Price Security
**Method**: `computeVariantAdjustments()`

Variant pricing is secured by:
- Fetching variant/subvariant records from database using provided IDs
- Calculating price adjustments from database values only
- Ignoring any price adjustment values from frontend

## Security Benefits

### Before
❌ Frontend calculated prices and sent them to backend  
❌ Backend trusted frontend price values  
❌ Attackers could modify prices in browser DevTools  
❌ Variant prices could be manipulated  

### After
✅ Backend is the single source of truth for ALL pricing  
✅ Frontend prices are validated against backend calculations  
✅ All database-driven: product.price, product.price_per_sqft, variant adjustments  
✅ Price manipulation attempts are logged and blocked  
✅ Variant/subvariant pricing fetched from database only  

## Implementation Details

### computeUnitPrice Parameters
```php
protected function computeUnitPrice(
    Product $product,       // Product model with pricing data
    ?string $sizeUnit,      // 'in' or 'ft' for roll products
    ?float $w,              // Width (for roll products)
    ?float $h,              // Height (for roll products)
    ?float $override,       // Admin override (validated separately)
    ?int $variantId,        // Variant ID (fetched from DB)
    ?int $subvariantId      // Subvariant ID (fetched from DB)
): float
```

### Price Calculation Flow

1. **addItem / updateItem** receives request
2. Extract variant IDs from request (if any)
3. Call `computeUnitPrice()` with product + variant IDs
4. Method fetches variant adjustments from database
5. Calculate: base_price + variant_adjustments
6. If frontend sent a price, validate it matches
7. Save the backend-calculated price to cart_items

### Roll-Based Products
For roll-based products (pricing_method = 'roll'):
```php
// Convert to feet
$wFeet = ($sizeUnit === 'in') ? ($w / 12.0) : $w;
$hFeet = ($sizeUnit === 'in') ? ($h / 12.0) : $h;

// Calculate area
$area = $wFeet * $hFeet;

// Base price
$basePrice = $area * $product->price_per_sqft;

// Add variant adjustments (from DB)
$finalPrice = $basePrice + $this->computeVariantAdjustments(...);
```

### Standard Products
For standard products:
```php
// Base price
$basePrice = $product->price;

// Add variant adjustments (from DB)
$finalPrice = $basePrice + $this->computeVariantAdjustments(...);
```

## Frontend Integration

### What Frontend Should Do
1. **Display**: Calculate prices for user preview (same logic as backend)
2. **Send**: Send calculated price for validation (optional)
3. **Accept**: Use the price returned by backend as final

### What Frontend Should NOT Do
❌ Don't expect backend to use frontend-calculated prices  
❌ Don't send variant price adjustments to backend  
❌ Don't manipulate unit_price or total_price directly  

## Testing

### Test Price Manipulation
1. Open browser DevTools
2. Modify price in cart add request
3. Expected: Request rejected with "Invalid price" error
4. Check logs for security warning

### Test Variant Pricing
1. Select product with variants
2. Choose variant with price adjustment
3. Verify backend calculates correct price from database
4. Check cart_items.unit_price matches expected calculation

## Logging

Price validation failures are logged with:
- Provided price (from frontend)
- Expected price (from backend)
- Difference amount
- IP address
- User ID (if authenticated)

Example log entry:
```
Price validation failed in unit_price for Product Name
- provided: 150.00
- expected: 125.50
- difference: 24.50
- ip: 192.168.1.1
- user_id: 42
```

## Future Enhancements

1. **Options Pricing**: Add validation for custom options pricing
2. **Bulk Discounts**: Validate quantity-based pricing rules
3. **Rate Limiting**: Block users with repeated manipulation attempts
4. **Admin Alerts**: Notify admins of suspicious pricing activity

## Migration Notes

**Database Changes**: None required  
**Breaking Changes**: None - frontend should continue working  
**Backward Compatibility**: Maintained - frontend prices still accepted for validation  

## Code Locations

- **Controller**: `app/Http/Controllers/CartController.php`
- **Methods**:
  - `computeUnitPrice()` - Line ~680
  - `validatePrice()` - Line ~705
  - `computeVariantAdjustments()` - Line ~665
- **Usage**: 
  - `addItem()` - Line ~296
  - `updateItem()` - Line ~448

---

**Last Updated**: October 23, 2025  
**Author**: Security Enhancement  
**Status**: Implemented ✅
