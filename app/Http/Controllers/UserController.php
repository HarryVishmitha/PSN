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

    public function index() {
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
            }
        }

        return Inertia::render('user/dashboard', [
            'userDetails' => Auth::user(),
            'WG' => $WG,
        ]);
    }
}
