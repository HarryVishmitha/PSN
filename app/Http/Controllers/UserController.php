<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use App\Http\Middleware\CheckRole;
use App\Models\User;
use App\Models\Role;
use App\Models\WorkingGroup;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use App\Models\DailyCustomer;
use App\Models\ActivityLog;
use Illuminate\Support\Facades\DB;
use FFI\Exception;
use App\Models\Provider;
use App\Models\ProductInventory;
use App\Models\Roll;
use App\Models\Category;
use App\Models\Product;
use App\Models\ProductImage;
use App\Models\Design;
use Google\Service\Drive\Permission as Google_Service_Drive_Permission;
use Google\Service\Drive as GoogleServiceDrive;
use Google\Client as GoogleClient;
use Google\Service\Drive as GoogleDrive;
use Google\Service\Drive\DriveFile;
use Google\Service\Drive\Permission;
use Google\Http\MediaFileUpload;
use Tes\LaravelGoogleDriveStorage\GoogleDriveService;
use Intervention\Image\ImageManager;
use function Illuminate\Log\log;
use function Termwind\render;
// use Intervention\Image\ImageManagerStatic as Image;
use Intervention\Image\Laravel\Facades\Image;
// Chunk-upload classes
use Pion\Laravel\ChunkUpload\Receiver\FileReceiver;
use Pion\Laravel\ChunkUpload\Handler\HandlerFactory;
// Import the interface so we can doc‐block against it
use Pion\Laravel\ChunkUpload\Handler\HandlerInterface;
use Intervention\Image\Drivers\Gd\Driver as GdDriver;
use Intervention\Image\Encoders\WebpEncoder;
use Intervention\Image\Encoders\AutoEncoder;

class UserController extends Controller
{
    protected $userDetails;
    protected $WG;
    public function __construct()
    {
        $this->middleware('auth');
        $this->userDetails = Auth::user();
        // $wgId = $this->userDetails->working_group_id;
        // if ($wgId != null) {
        //     $wksr = WorkingGroup::findorfail($wgId);
        //     $this->WG = $wksr->name;
        // } else {
        //     $this->WG = 'public';
        // }
        Log::info('User Details: ', ['user' => $this->userDetails]);
    }

    public function index()
    {
        // Check if the user is authenticated
        if (!Auth::check()) {
            return redirect()->route('login');
        }
        // Check if the user has a working group assigned
        if (Auth::user()->working_group_id == null) {
            $WG = 'public';
        } else {
            $WGs = WorkingGroup::find(Auth::user()->working_group_id);

            if ($WGs == null) {
                $WG = 'public';
            } else {
                $WG = $WGs;
                if ($WG->status == 'inactive') {
                    $wgInactive = true;
                    return Inertia::render('user/errors/workingGroups1', [
                        'userDetails' => Auth::user(),
                        'WG' => $WG,
                        'msg' => 'Your working group is currently being deactivated. You can\'t use the system. Please contact your administrator for more information.',
                    ]);
                } else if ($WG->status == 'inactivating') {
                    $wginactivating = true;
                    // return Inertia::render('user/errors/workingGroups1',[
                    //     'userDetails' => Auth::user(),
                    //     'WG' => $WG,
                    //     'msg' => 'Your working group is currently being deactivating. Your some functions are blocked. Please contact your administrator for more information.',
                    // ]);
                }
            }
        }

        return Inertia::render('user/dashboard', [
            'userDetails' => Auth::user(),
            'WG' => $WG,
            'wgInactive' => $wgInactive ?? false,
            'wginactivating' => $wginactivating ?? false,
        ]);
    }

    public function products()
    {
        // Check if the user is authenticated
        if (!Auth::check()) {
            return redirect()->route('login');
        }
        // Check if the user has a working group assigned
        if (Auth::user()->working_group_id == null) {
            $WG = 'public';
        } else {
            $WGs = WorkingGroup::find(Auth::user()->working_group_id);
            if ($WGs == null) {
                $WG = 'public';
            } else {
                $WG = $WGs;
                if ($WG->status == 'inactive') {
                    return redirect()->route('user.dashboard');
                }
                if ($WG->status == 'inactivating') {
                    $wginactivating = true;
                }
            }
        }

        return Inertia::render('user/products', [
            'userDetails' => Auth::user(),
            'WG' => $WG,
            'wginactivating' => $wginactivating ?? false,
        ]);
    }

    public function jsonProducts(Request $request)
    {
        try {
            // 1️⃣ Auth guard
            if (! Auth::check()) {
                return response()->json(['message' => 'Unauthenticated.'], 401);
            }
            $user = Auth::user();

            // 2️⃣ Determine working-group (null ⇒ 1)
            $groupId = $user->working_group_id ?? 1;
            $wg = WorkingGroup::find($groupId);
            if (! $wg || $wg->status === 'inactive') {
                return response()->json([
                    'message' => 'Your working group is inactive or does not exist.'
                ], 403);
            }

            // 3️⃣ Base query: only this WG, only published
            $query = Product::query()
                ->where('working_group_id', $groupId)
                ->where('status', 'published');

            // 4️⃣ Eager-load relationships via include=images,categories,variants,provider,design
            if ($includes = $request->query('include')) {
                $allowed = ['images', 'categories', 'variants', 'provider', 'design'];
                $want = array_intersect(explode(',', $includes), $allowed);
                if ($want) {
                    $query->with($want);
                }
            } else {
                // default eager-load
                $query->with(['images', 'categories', 'variants']);
            }

            // 5️⃣ Text search on name/description
            if ($search = $request->query('search')) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('description', 'like', "%{$search}%");
                });
            }

            // 6️⃣ Filter: category_ids=1,2,3
            if ($catIds = $request->query('category_ids')) {
                $ids = array_filter(array_map('intval', explode(',', $catIds)));
                if ($ids) {
                    $query->whereHas('categories', function ($q) use ($ids) {
                        $q->whereIn('categories.id', $ids);
                    });
                }
            }

            // 7️⃣ Filter: pricing_method
            if ($pm = $request->query('pricing_method')) {
                if (in_array($pm, ['standard', 'roll'])) {
                    $query->where('pricing_method', $pm);
                }
            }

            // 8️⃣ Filter: price range
            if (is_numeric($request->query('price_min'))) {
                $query->where('price', '>=', (float)$request->query('price_min'));
            }
            if (is_numeric($request->query('price_max'))) {
                $query->where('price', '<=', (float)$request->query('price_max'));
            }

            // 9️⃣ Sorting
            $allowedSorts = ['name', 'price', 'created_at'];
            $sortBy = $request->query('sort_by', 'name');
            $sortOrder = strtolower($request->query('sort_order', 'asc'));
            if (! in_array($sortBy, $allowedSorts)) {
                $sortBy = 'name';
            }
            if (! in_array($sortOrder, ['asc', 'desc'])) {
                $sortOrder = 'asc';
            }
            $query->orderBy($sortBy, $sortOrder);

            // 🔟 Pagination
            $perPage = max(1, (int)$request->query('per_page', 15));
            $products = $query
                ->paginate($perPage)
                ->appends($request->query());

            // 1️⃣1️⃣ Return paginated JSON (includes data, meta, links)
            return response()->json($products, 200);
        } catch (\Exception $e) {
            Log::error('jsonProducts error: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);
            return response()->json([
                'message' => 'Failed to retrieve products due to a server error.'
            ], 500);
        }
    }
}
