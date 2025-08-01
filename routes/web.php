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
use App\Models\Estimate;
use Barryvdh\DomPDF\Facade\Pdf;


Route::get('/', [Home::class, 'index'])->name('home');
Route::get('/cart', [Home::class, 'cart'])->name('cart');
Route::get('/cart/checkout', [Home::class, 'checkout'])->name('checkout');
Route::get('/products/all', [Home::class, 'allProducts'])->name('products.all');
Route::get('/api/category/all', [Home::class, 'categories'])->name('categories.all');
Route::get('/api/nav-categories', [Home::class, 'navCategories'])->name('nav.categories');

Route::get('/temp/{estimate}/pdf', function (Estimate $estimate) {
    // eager load relations:
    $estimate->load(['customer', 'items.variant', 'items.subvariant', 'items.product']);

    // render & stream:
    $pdf = Pdf::loadView('pdfs.estimate', ['est' => $estimate])
              ->setPaper('a4', 'portrait')
              // optional: increase default PHP memory / timeouts if you have lots of pages
              ->setOptions(['dpi' => 150, 'defaultFont' => 'sans-serif']);

    return $pdf->stream("Estimate-{$estimate->estimate_number}.pdf");
})->name('estimate.pdf');

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
});

Route::get('/auth/redirection', [Authredirection::class, 'index'])->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware(['auth', 'verified', CheckRole::class . ':admin'])->prefix('admin')->as('admin.')->group(function () {
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
    Route::delete('/api/daily-customers/{customer}', [AdminController::class, 'deleteDailyCustomer'])->name('deleteDailyCustomer');
    Route::get('/estimates', [AdminController::class, 'estimateView'])->name('estimates');
    Route::get('/add-estimate', [AdminController::class, 'addEstimate'])->name('addEstimate');
    Route::get('/api/{wgId}/get-est-data', [AdminController::class, 'getdataEst'])->name('getdataEst');
    Route::post('/api/add-daily-customer/json', [AdminController::class, 'JSonaddDailyCustomer'])->name('jsonDailyCustomers');
    Route::post('/api/add/estimates', [AdminController::class, 'storeEstimate'])->name('estimates.store');
    Route::put('/api/estimates/{estimate}/edit', [AdminController::class, 'updateEstimate'])->name('estimates.update');
    Route::get('/estimate/{estimate}/preview', [AdminController::class, 'previewEstimate'])->name('estimate.preview');
    Route::get('/estimate/{estimate}/edit')->name('estimates.edit');
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


require __DIR__ . '/auth.php';
