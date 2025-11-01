<?php

use App\Http\Controllers\AdminController;
use App\Http\Controllers\ApisPublic;
use App\Http\Controllers\Authredirection;
use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\Home;
use App\Http\Middleware\CheckRole;
use App\Models\Notification;
use App\Http\Controllers\NotificationsController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\User\OrderController as UserOrderController;
use App\Http\Controllers\DesignShareLinkController;
use App\Models\Estimate;
use Barryvdh\DomPDF\Facade\Pdf;
use App\Http\Controllers\UserDesignUploadController;
use App\Http\Controllers\CartController;
use App\Http\Controllers\Admin\AdminWidgetApiController;
use App\Http\Controllers\Admin\OrderController as AdminOrderController;
use App\Http\Controllers\Admin\SupportRequestController as AdminSupportRequestController;
use Illuminate\Support\Facades\DB;
use App\Models\Product;
use App\Http\Controllers\SupportRequestController;
use App\Models\SupportRequest;
use App\Mail\SupportRequestSubmitted;
use App\Mail\SupportRequestUpdated;
use App\Models\SupportRequestMessage;
use Illuminate\Support\Facades\Mail;

Route::get('/', [Home::class, 'index'])->name('home');
Route::get('/about-us', [Home::class, 'aboutUs'])->name('aboutUs');
Route::get('/cart', [Home::class, 'cart'])->name('cart');
Route::get('/cart/checkout', [Home::class, 'checkout'])->name('checkout');
Route::get('/products/all', [Home::class, 'allProducts'])->name('links.continue_shopping');
Route::get('/products/all', [Home::class, 'allProducts'])->name('products.all');
Route::get('/api/products', [Home::class, 'fetchProducts']);
Route::get('/api/categories', [Home::class, 'fetchCategories']);
Route::get('/api/category/all', [Home::class, 'categories'])->name('categories.all');
Route::get('/gallery/designs', [Home::class, 'designs'])->name('designs.all');
Route::get('/api/nav-categories', [Home::class, 'navCategories'])->name('nav.categories');
Route::get('/requests/new', [SupportRequestController::class, 'create'])->name('requests.create');
Route::post('/requests', [SupportRequestController::class, 'store'])->name('requests.store');
Route::get('/requests/thank-you/{token}', [SupportRequestController::class, 'thankYou'])->name('requests.thankyou');
Route::get('/request/track/{token}', [SupportRequestController::class, 'track'])->name('requests.track');
Route::get('/request/track/{token}/files/{file}', [SupportRequestController::class, 'downloadFile'])
    ->whereNumber('file')
    ->name('requests.files.download');
Route::get('/api/most-popular-products', [Home::class, 'mostPProducts'])->name('mostPopularProducts');
Route::get('/product/{id}/{name}', [Home::class, 'productDetail'])->name('productDetail');
Route::get('/share/{token}', fn($token) => Inertia::render('SharedDesigns', ['token' => $token]))->name('share.page');
Route::get('/api/share/{token}', [DesignShareLinkController::class, 'publicLinkInfo']);
Route::post('/api/share/{token}/verify', [DesignShareLinkController::class, 'verifyPassword']);
Route::get('/api/trending-products', [Home::class, 'trending'])->name('trending.products');
Route::get('/sitemap.xml', [\App\Http\Controllers\SitemapController::class, 'index'])->name('sitemap')->withoutMiddleware([\App\Http\Middleware\HandleInertiaRequests::class]);
Route::get('/api/products/{product}/designs', [Home::class, 'DesignlistForProduct']);
Route::get('/api/active-offers', [Home::class, 'activeOffers'])->name('active.offers');
Route::get('/offers/{id}/{name?}', [Home::class, 'offerDetail'])->name('offer.view');
Route::post('/api/design-uploads', [UserDesignUploadController::class, 'storeFile'])->name('userUploadDesign');
Route::post('/api/design-links', [UserDesignUploadController::class, 'storeLink'])->name('userLinkDesign');
Route::post('/api/design-hire',    [UserDesignUploadController::class, 'storeHire']);
Route::get('/api/shipping-methods', [Home::class, 'shippingMethods'])->name('shipping.methods');
Route::get('/checkout', [Home::class, 'checkout'])->name('checkout');
Route::post('/api/checkout/review', [\App\Http\Controllers\CheckoutController::class, 'checkoutReview'])->name('checkout.review');
Route::get('/thank-you/{order}', [\App\Http\Controllers\CheckoutController::class, 'thankyou'])->name('orders.thankyou');

Route::get('/api/product-summaries', function (\Illuminate\Http\Request $req) {
    $ids = collect(explode(',', (string)$req->query('ids')))
        ->map(fn($x) => (int)$x)
        ->filter()
        ->unique()
        ->values();

    if ($ids->isEmpty()) {
        return response()->json(['ok' => true, 'items' => new \stdClass()]);
    }

    $products = Product::whereIn('id', $ids)->get(['id', 'name', 'meta_description', 'pricing_method'])->keyBy('id');
    $primaries = DB::table('product_images')
        ->select('product_id', 'image_url')
        ->whereIn('product_id', $ids)
        ->where('is_primary', 1)
        ->get()
        ->keyBy('product_id');

    $map = [];
    foreach ($ids as $id) {
        $p = $products->get($id);
        $map[$id] = $p ? [
            'id' => $p->id,
            'name' => $p->name,
            'meta_description' => $p->meta_description,
            'pricing_method' => $p->pricing_method,
            'primary_image_url' => optional($primaries->get($id))->image_url,
        ] : null;
    }

    return response()->json(['ok' => true, 'items' => $map]);
});

Route::get('/api/cart', [CartController::class, 'show']);
Route::post('/api/cart/merge', [CartController::class, 'mergeGuestCartOnLogin'])->middleware('auth');

Route::post('/api/cart/items', [CartController::class, 'addItem']);
Route::put('/api/cart/items/{item}', [CartController::class, 'updateItem']);
Route::delete('/api/cart/items/{item}', [CartController::class, 'removeItem']);
Route::delete('/api/cart', [CartController::class, 'clear']);

Route::post('/api/cart/shipping', [CartController::class, 'setShippingMethod']);
Route::post('/api/cart/offer', [CartController::class, 'applyOffer']);
Route::delete('/api/cart/offer', [CartController::class, 'removeOffer']);

Route::post('/api/cart/addresses', [CartController::class, 'setAddresses']);
Route::post('/api/cart/items/{item}/attach-upload', [CartController::class, 'attachUpload']);

Route::middleware(['auth', CheckRole::class . ':user'])->prefix('user')->as('user.')->group(function () {
    Route::get('/dashboard', [UserController::class, 'index'])->name('dashboard');
    Route::get('/api/notifications', [NotificationsController::class, 'index'])->name('notifications');
    Route::post('/api/notifications/{id}/read', [NotificationsController::class, 'markAsRead'])->name('markAsRead');
    Route::get('/profile', [UserController::class, 'profile'])->name('profile');
    Route::post('/api/update-profile', [UserController::class, 'updateProfile'])->name('updateProfile');
    Route::get('/products', [UserController::class, 'products'])->name('products');
    Route::get('/api/products', [UserController::class, 'jsonProducts'])->name('getProducts');
    Route::get('/{product}/product/{name}', [userController::class, 'productView'])->name('productView');
    Route::get('/api/{product}/designs', [UserController::class, 'jsonDesigns'])->name('getDesigns');
    Route::get('/designs', [UserController::class, 'designs'])->name('designs');
    Route::get('/api/design/{design}', [UserController::class, 'designView'])->name('designView');
    Route::post('/api/product/{product}/share', [UserController::class, 'sharedesigns'])->name('shareDesign');
    Route::get('/api/product/{product}/shared-links', [UserController::class, 'sharedLinks'])->name('getSharedLinks');
    Route::get('/api/product/{product}/shared-links', [UserController::class, 'sharedLinks'])->name('getSharedLinks');

    Route::get('/orders', [UserOrderController::class, 'index'])->name('orders.index');
    Route::get('/orders/{order}', [UserOrderController::class, 'show'])
        ->whereNumber('order')
        ->name('orders.show');
    Route::post('/orders/{order}/approve', [UserOrderController::class, 'approve'])
        ->whereNumber('order')
        ->name('orders.approve');
    Route::get('/orders/{order}/attachments/{attachment}', [UserOrderController::class, 'downloadAttachment'])
        ->whereNumber(['order', 'attachment'])
        ->name('orders.attachments.download');
});

Route::get('/auth/redirection', [Authredirection::class, 'index'])->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware(['auth', 'verified', CheckRole::class . ':admin', 'can:manage-payment-methods'])->prefix('admin')->as('admin.')->group(function () {
    Route::get('/dashboard', [AdminController::class, 'index'])->name('dashboard');
    Route::get('/api/notifications', [NotificationsController::class, 'index'])->name('notifications');
    Route::post('/api/notifications/{id}/read', [NotificationsController::class, 'markAsRead'])->name('markAsRead');
    Route::get('/profile', [AdminController::class, 'profile'])->name('profile');
    Route::post('/api/update-profile', [AdminController::class, 'updateProfile'])->name('updateProfile');
    Route::get('/users', [AdminController::class, 'users'])->name('users');
    Route::get('/edit-user/{userId}', [AdminController::class, 'editUser'])->name('editUser');
    Route::post('/api/edit-profile/{userID}', [AdminController::class, 'updateUser'])->name('updateUser');
    Route::patch('/api/users/{id}/assign-working-group', [AdminController::class, 'assignWorkingGroup'])->name('assignWorkingGroup');
    Route::patch('/api/users/{id}/update-status', [AdminController::class, 'updateStatus'])->name('updateStatus');
    Route::delete('/api/users/{id}', [AdminController::class, 'deleteUser'])->name('deleteUser');

    Route::get('/requests', [AdminSupportRequestController::class, 'index'])->name('requests.index');
    Route::get('/requests/{supportRequest}', [AdminSupportRequestController::class, 'show'])->name('requests.show');
    Route::post('/requests/{supportRequest}/reply', [AdminSupportRequestController::class, 'reply'])->name('requests.reply');

    Route::get('/roles', [AdminController::class, 'roles'])->name('roles');
    Route::post('/api/roles', [AdminController::class, 'storeRole'])->name('storeRole');
    Route::patch('/api/roles/{id}', [AdminController::class, 'updateRole'])->name('updateRole');
    Route::delete('/api/roles/{id}', [AdminController::class, 'deleteRole'])->name('deleteRole');
    Route::get('/assign-role', [AdminController::class, 'assignRole'])->name('assignRole');
    Route::patch('/api/assign-role', [AdminController::class, 'updateUserRole'])->name('storeAssignRole');
    Route::get('/working-groups', [AdminController::class, 'workingGroups'])->name('workingGroups');
    Route::post('/api/working-groups', [AdminController::class, 'addWs'])->name('addWS');
    Route::patch('/api/working-groups/{id}/edit', [AdminController::class, 'editWs'])->name('editWS');
    Route::get('/manage/{id}/working-group', [AdminController::class, 'manageWs'])->name('manageWS');
    Route::get('/products', [AdminController::class, 'products'])->name('products');
    Route::get('/add-new-product', [AdminController::class, 'addProduct'])->name('addProduct');
    Route::post('/api/add-new-product', [AdminController::class, 'storeProduct'])->name('storeProduct');
    Route::get('/inventory', [AdminController::class, 'inventory'])->name('inventory');
    Route::get('/manage/inventory/providers', [AdminController::class, 'inventoryProviders'])->name('inventoryProviders');
    Route::post('/api/inventory/providers', [AdminController::class, 'addInventoryProvider'])->name('addInventoryProvider');
    Route::patch('/api/inventory/providers/{id}', [AdminController::class, 'editInventoryProvider'])->name('editInventoryProvider');
    Route::post('/api/inventory/add-new-roll', [AdminController::class, 'addInventoryItem'])->name('addInventoryItem');
    Route::patch('/api/inventory/{id}/edit', [AdminController::class, 'editInventoryItem'])->name('editInventoryItem');
    Route::delete('/api/inventory/{id}', [AdminController::class, 'deleteInventoryItem'])->name('deleteInventoryItem');
    Route::post('/api/add-new-category', [AdminController::class, 'addCategory'])->name('addCategory');
    Route::get('/api/json-categories', [AdminController::class, 'jsonCats'])->name('getCategories');
    Route::get('/api/products', [AdminController::class, 'jsonProducts'])->name('getProducts');
    Route::match(['get', 'patch'], '/api/{product}/product-quick', [AdminController::class, 'quickProduct'])->name('productQuick');
    Route::delete('/api/product/{product}/delete', [AdminController::class, 'deleteProduct'])->name('deleteproduct');
    Route::get('/product/{product}/edit', [AdminController::class, 'editProductview'])->name('producteditView');
    Route::post('/api/product/{product}/edit', [AdminController::class, 'editProduct'])->name('editproduct');
    Route::get('/designs', [AdminController::class, 'designs'])->name('designs');
    Route::get('/add-design', [AdminController::class, 'addDesign'])->name('addDesign');
    Route::post('/api/add-design', [AdminController::class, 'storeDesign'])->name('storeDesign');
    Route::delete('/api/design/{design}/delete', [AdminController::class, 'deleteDesign'])->name('deleteDesign');
    Route::put('/api/design/{design}/edit', [AdminController::class, 'editDesign'])->name('editDesign');
    Route::get('/daily-customers', [AdminController::class, 'dailyCustomersView'])->name('dailyCustomers');
    Route::post('/api/add-daily-customer', [AdminController::class, 'addDailyCustomer'])->name('addDailyCustomer');
    Route::patch('/api/daily-customers/{customer}/edit', [AdminController::class, 'editDailyCustomer'])->name('editDailyCustomer');
    Route::patch('/api/daily-customers/{customer}/edit/json', [AdminController::class, 'editDailyCustomerJson'])->name('editDailyCustomerJson');
    Route::delete('/api/daily-customers/{customer}', [AdminController::class, 'deleteDailyCustomer'])->name('deleteDailyCustomer');
    Route::get('/estimates', [AdminController::class, 'estimateView'])->name('estimates');
    Route::get('/add-estimate', [AdminController::class, 'addEstimate'])->name('addEstimate');
    Route::get('/api/{wgId}/get-est-data', [AdminController::class, 'getdataEst'])->name('getdataEst');
    Route::post('/api/add-daily-customer/json', [AdminController::class, 'JSonaddDailyCustomer'])->name('jsonDailyCustomers');
    Route::post('/api/add/estimates', [AdminController::class, 'storeEstimate'])->name('estimates.store');
    Route::get('/api/wg/{wgId}/roll/{roll}/products', [AdminController::class, 'productsByRoll'])
        ->name('products.byRoll');
    Route::put('/api/estimates/{estimate}/edit', [AdminController::class, 'updateEstimate'])->name('estimates.update');
    Route::delete('/api/estimates/{estimate}', [AdminController::class, 'destroyEstimate'])->name('estimates.destroy');
    Route::get('/estimate/{estimate}/preview', [AdminController::class, 'previewEstimate'])->name('estimate.preview');
    Route::post('/api/estimate/{estimate}/send-email', [AdminController::class, 'sendEstimateEmail'])->name('estimates.sendEmail');
    Route::get('/estimate/{estimate}/edit')->name('estimates.edit');
    Route::patch('/api/estimate/{estimate}/status/update', [AdminController::class, 'updateEstimateStatus'])->name('estimates.updateStatus');
    Route::get('/categories', [AdminController::class, 'CategoryView'])->name('category.view');
    // Route::get('/categories/create', [AdminController::class, 'CategoryCreate'])->name('category.create');
    Route::post('/api/category/add', [AdminController::class, 'CategoryStore'])->name('category.store');
    Route::get('/categories/{id}/edit', [AdminController::class, 'CategoryEdit'])->name('category.edit');
    Route::put('/categories/{id}', [AdminController::class, 'CategoryUpdate'])->name('category.update');
    Route::delete('/categories/{category}/delete', [AdminController::class, 'CategoryDelete'])->name('category.delete');
    Route::post('/categories/{id}/restore', [AdminController::class, 'CategoryRestore'])->name('category.restore');
    Route::post('/categories/bulk-action', [AdminController::class, 'CategoryBulkAction'])->name('category.bulk');
    Route::get('/site-settings', [AdminController::class, 'siteSettings'])->name('siteSettings');
    Route::get('/site-settings/topnav-categories/manage', [AdminController::class, 'topnavCategories'])->name('topnavCategories');
    Route::post('/api/top-nav-category/reorder', [AdminController::class, 'reorderTopNavCategories'])->name('topnavCategories.reorder');
    Route::get('/api/json-tags', [AdminController::class, 'jsonTags'])->name('getTags');
    Route::get('/api/dashboard/metrics', [AdminController::class, 'fetchTopMetricsV1'])->name('admin.api.dashboard.metrics');
    Route::prefix('api/widgets')->as('api.widgets.')->group(function () {
        Route::get('/sales',            [AdminWidgetApiController::class, 'salesWidgetV1'])->name('sales');
        Route::get('/recent-activity',  [AdminWidgetApiController::class, 'recentActivityWidgetV1'])->name('activity');
        Route::get('/customers',        [AdminWidgetApiController::class, 'customersWidgetV1'])->name('customers');

        // New data-rich endpoints
        Route::get('/top-products',     [AdminWidgetApiController::class, 'topProductsWidgetV1'])->name('top_products');
        Route::get('/category-breakdown', [AdminWidgetApiController::class, 'categoryBreakdownWidgetV1'])->name('cat_breakdown');
        Route::get('/low-stock',        [AdminWidgetApiController::class, 'lowStockWidgetV1'])->name('low_stock');
        Route::get('/payments-by-method', [AdminWidgetApiController::class, 'paymentsByMethodWidgetV1'])->name('pay_methods');
        Route::get('/refunds',          [AdminWidgetApiController::class, 'refundsWidgetV1'])->name('refunds');
        Route::get('/shipments-status', [AdminWidgetApiController::class, 'shipmentsStatusWidgetV1'])->name('shipments');

        // New tables we created
        Route::get('/tasks',            [AdminWidgetApiController::class, 'tasksWidgetV1'])->name('tasks');
        Route::get('/calendar',         [AdminWidgetApiController::class, 'calendarWidgetV1'])->name('calendar');
    });

    //Payments Brick
    Route::get('/payment-methods', [AdminController::class, 'paymentMethodsIndex'])
        ->name('payment_methods.index');

    // API
    Route::prefix('api/payment-methods')->group(function () {
        Route::post('/', [AdminController::class, 'paymentMethodsStore']);
        Route::post('/upload', [AdminController::class, 'paymentMethodsUpload']); // logo/qr uploader
        Route::patch('/reorder', [AdminController::class, 'paymentMethodsReorder'])->name('payment_methods.reorder'); // [{id,sort_order}]
        Route::patch('/{method}', [AdminController::class, 'paymentMethodsUpdate']);
        Route::patch('/{method}/toggle', [AdminController::class, 'paymentMethodsToggle']);
        Route::delete('/{method}', [AdminController::class, 'paymentMethodsDestroy']);
    });
    Route::get('/api/product/{product}/rolls', [AdminController::class, 'getProductRolls'])->name('product.rolls.get');
    Route::patch('/api/product/{product}/rolls', [AdminController::class, 'syncProductRolls'])->name('product.rolls.sync');
    Route::post('/api/product/{product}/rolls/{roll}/default', [AdminController::class, 'setDefaultProductRoll'])->name('product.rolls.default');
    Route::delete('/api/product/{product}/rolls/{roll}', [AdminController::class, 'detachProductRoll'])->name('product.rolls.detach');

    // Order Management
    Route::get('/orders', [AdminOrderController::class, 'index'])->name('orders.index');
    Route::get('/orders/{order}', [AdminOrderController::class, 'show'])
        ->whereNumber('order')
        ->name('orders.show');

    Route::prefix('api/orders')->name('orders.')->group(function () {
        Route::get('/products', [AdminOrderController::class, 'searchProducts'])->name('products');
        Route::post('/preview-pricing', [AdminOrderController::class, 'previewPricing'])->name('preview');
        Route::put('/{order}', [AdminOrderController::class, 'update'])->whereNumber('order')->name('update');
        Route::post('/{order}/unlock', [AdminOrderController::class, 'unlock'])->whereNumber('order')->name('unlock');
        Route::get('/{order}/available-statuses', [AdminOrderController::class, 'getAvailableStatuses'])->whereNumber('order')->name('available-statuses');
        Route::post('/{order}/events', [AdminOrderController::class, 'storeEvent'])->whereNumber('order')->name('events.store');
        
        // Payment Request Management
        Route::get('/{order}/payment-requests', [\App\Http\Controllers\Admin\PaymentRequestController::class, 'index'])->whereNumber('order')->name('payment-requests.index');
        Route::post('/{order}/payment-requests', [\App\Http\Controllers\Admin\PaymentRequestController::class, 'store'])->whereNumber('order')->name('payment-requests.store');
        Route::put('/{order}/payment-requests/{paymentRequest}', [\App\Http\Controllers\Admin\PaymentRequestController::class, 'update'])->whereNumber(['order', 'paymentRequest'])->name('payment-requests.update');
        Route::post('/{order}/payment-requests/{paymentRequest}/mark-paid', [\App\Http\Controllers\Admin\PaymentRequestController::class, 'markAsPaid'])->whereNumber(['order', 'paymentRequest'])->name('payment-requests.mark-paid');
        Route::post('/{order}/payment-requests/{paymentRequest}/cancel', [\App\Http\Controllers\Admin\PaymentRequestController::class, 'cancel'])->whereNumber(['order', 'paymentRequest'])->name('payment-requests.cancel');
        Route::delete('/{order}/payment-requests/{paymentRequest}', [\App\Http\Controllers\Admin\PaymentRequestController::class, 'destroy'])->whereNumber(['order', 'paymentRequest'])->name('payment-requests.destroy');
    });

    // Offers Management
    Route::get('/offers', [AdminController::class, 'offersIndex'])->name('offers.index');
    Route::get('/offers/create', [AdminController::class, 'offersCreate'])->name('offers.create');
    Route::post('/api/offers', [AdminController::class, 'offersStore'])->name('offers.store');
    Route::get('/offers/{offer}/edit', [AdminController::class, 'offersEdit'])->name('offers.edit');
    Route::put('/api/offers/{offer}', [AdminController::class, 'offersUpdate'])->name('offers.update');
    Route::delete('/api/offers/{offer}', [AdminController::class, 'offersDestroy'])->name('offers.destroy');
    Route::patch('/api/offers/{offer}/toggle', [AdminController::class, 'offersToggleStatus'])->name('offers.toggle');

    // Message Template Management
    Route::get('/templates', [\App\Http\Controllers\Admin\MessageTemplateController::class, 'index'])->name('templates.index');
    
    Route::prefix('api/templates')->name('templates.')->group(function () {
        Route::get('/variables', [\App\Http\Controllers\Admin\MessageTemplateController::class, 'variables'])->name('variables');
        Route::get('/{template}', [\App\Http\Controllers\Admin\MessageTemplateController::class, 'show'])->whereNumber('template')->name('show');
        Route::post('/', [\App\Http\Controllers\Admin\MessageTemplateController::class, 'store'])->name('store');
        Route::put('/{template}', [\App\Http\Controllers\Admin\MessageTemplateController::class, 'update'])->whereNumber('template')->name('update');
        Route::delete('/{template}', [\App\Http\Controllers\Admin\MessageTemplateController::class, 'destroy'])->whereNumber('template')->name('destroy');
        Route::post('/{template}/duplicate', [\App\Http\Controllers\Admin\MessageTemplateController::class, 'duplicate'])->whereNumber('template')->name('duplicate');
        Route::post('/{template}/preview', [\App\Http\Controllers\Admin\MessageTemplateController::class, 'preview'])->whereNumber('template')->name('preview');
        Route::patch('/{template}/toggle', [\App\Http\Controllers\Admin\MessageTemplateController::class, 'toggleActive'])->whereNumber('template')->name('toggle');
    });

    // Add more admin routes here
});

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
})->middleware('verified');

Route::group(['prefix' => 'api', 'as' => 'api.'], function () {
    Route::get('/random-image', [ApisPublic::class, 'randomImage'])->name('random-image');
});

Route::get('/test/quotation-email', function () {
    $quotation = \App\Models\Estimate::first(); // Replace with actual model and data retrieval logic
    $emailContent = view('emails.quotation_published', ['estimate' => $quotation])->render();
    return response($emailContent);
})->name('test.quotation.email');

Route::get('/test/support-request-email', function () {
    $supportRequest = SupportRequest::first(); // Replace with a valid SupportRequest instance

    if (!$supportRequest) {
        return 'No support request found to test.';
    }

    Mail::to('vishmithathejan154@gmail.com')->send(new SupportRequestSubmitted($supportRequest));

    return 'Test email sent to vishmithathejan154@gmail.com';
});

Route::get('/test/support-request-updated-email', function () {
    $supportRequest = SupportRequest::first();

    if (!$supportRequest) {
        return 'No support request found to test.';
    }

    // Get the first message or create a dummy one
    $message = $supportRequest->messages()->first();

    if (!$message) {
        // Create a dummy message for testing
        $message = new SupportRequestMessage([
            'support_request_id' => $supportRequest->id,
            'sender_id' => $supportRequest->user_id ?? 1,
            'sender_type' => 'customer',
            'body' => 'This is a test update message. We have reviewed your request and will be processing it shortly. Our team is working diligently to ensure your requirements are met.',
        ]);
    }

    Mail::to('vishmithathejan154@gmail.com')->send(new SupportRequestUpdated($supportRequest, $message));

    return 'Test updated email sent to vishmithathejan154@gmail.com';
});

require __DIR__ . '/auth.php';
