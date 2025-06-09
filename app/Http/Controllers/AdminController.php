<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Inertia\Inertia;
use App\Models\User;
use App\Models\Role;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use App\Models\WorkingGroup;
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
use App\Models\Estimate;
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


class AdminController extends Controller
{


    public function __construct()
    {
        $this->middleware('auth');
        $user = Auth::id();
        $role_id = User::where('id', $user)->value('role_id');
        $actype = Role::where('id', $role_id)->value('name');
        if ($actype != 'admin') {
            return redirect()->route('home')->with('error', 'You are not authorized to access to that page.');
        }
    }

    public function index()
    {
        // Get total number of users
        $totalUsers = User::count();
        $adminUsers = User::where('role_id', Role::where('name', 'admin')->first()->id)->count();
        $userUsers = User::where('role_id', Role::where('name', 'user')->first()->id)->count();
        $workingGroups = WorkingGroup::count();
        $dailyCustomers = DailyCustomer::count();

        // Log dashboard access activity
        ActivityLog::create([
            'user_id'    => Auth::id(),
            'action_type' => 'dashboard_access',
            'description' => 'Admin accessed dashboard.',
            'ip_address' => request()->ip(),
        ]);

        return Inertia::render('admin/dashboard', [
            'totalUsers'     => $totalUsers,
            'adminUsers'     => $adminUsers,
            'userUsers'      => $userUsers,
            'workingGroups'  => $workingGroups,
            'userDetails'    => Auth::user(),
            'dailyCustomers' => $dailyCustomers
        ]);
    }


    public function profile()
    {
        $user = Auth::user();
        $userDetails = User::with(['role', 'workingGroup'])->find($user->id);

        // Log profile view activity
        ActivityLog::create([
            'user_id'    => $user->id,
            'action_type' => 'profile_view',
            'description' => 'Admin viewed profile.',
            'ip_address' => request()->ip(),
        ]);

        return Inertia::render('admin/profile', [
            'userDetails' => $userDetails,
        ]);
    }

    public function users(Request $request)
    {
        $perPage = $request->input('perPage', 10); // Default to 10 per page
        $status = $request->input('status'); // Optional status filter

        $query = User::with(['role', 'workingGroup']);

        if ($status) {
            $query->where('status', $status);
        }

        $users = $query->paginate($perPage);
        $workingGroups = WorkingGroup::all();

        // Log user list view activity
        ActivityLog::create([
            'user_id'    => Auth::id(),
            'action_type' => 'users_list_view',
            'description' => 'Admin viewed user list with filter status: ' . ($status ?? 'none'),
            'ip_address' => request()->ip(),
        ]);

        return Inertia::render('admin/users', [
            'users'        => $users,
            'userDetails'  => Auth::user(),
            'workingGroups' => $workingGroups,
            'status'       => $status
        ]);
    }

    public function updateProfile(Request $request)
    {
        $validated = $request->validate([
            'name'            => 'required|string|max:255',
            'email'           => 'required|email|max:255|unique:users,email,' . Auth::id(),
            'phone_number'    => 'required|string|max:20',
            'description'     => 'nullable|string|max:1000',
            'newPassword'     => 'nullable|min:6|confirmed',
            'profile_picture' => 'nullable|image|mimes:jpg,jpeg,png|max:2048',
        ]);

        Log::info($request->all());

        $user = User::find(Auth::id());
        if (!$user) {
            return response()->json(['error' => 'User not authenticated'], 401);
        }

        // Update profile details
        $user->name         = $validated['name'];
        $user->email        = $validated['email'];
        $user->phone_number = $validated['phone_number'] ?? $user->phone_number;

        if (!empty($validated['newPassword'])) {
            $user->password = Hash::make($validated['newPassword']);
        }

        // Handle profile picture upload if provided
        if ($request->hasFile('profile_picture')) {
            if ($user->profile_picture && file_exists(public_path('images/users/' . basename($user->profile_picture)))) {
                unlink(public_path('images/users/' . basename($user->profile_picture)));
            }
            $image = $request->file('profile_picture');
            $imageName = Str::uuid() . '.' . $image->getClientOriginalExtension();
            $image->move(public_path('images/users'), $imageName);
            $user->profile_picture = '/images/users/' . $imageName;
        }

        if ($user->save()) {
            // Log profile update activity
            ActivityLog::create([
                'user_id'    => $user->id,
                'action_type' => 'profile_update',
                'description' => 'User updated profile successfully.',
                'ip_address' => request()->ip(),
            ]);
            return response()->json(['success' => 'Profile updated successfully!'], 200);
        } else {
            return response()->json(['error' => 'Failed to update profile'], 500);
        }
    }

    public function editUser($userId)
    {
        $user = Auth::user();
        $userDetails = User::with(['role', 'workingGroup'])->find($user->id);
        $selectedUser = User::with(['role', 'workingGroup'])->find($userId);

        // Log edit user view activity
        ActivityLog::create([
            'user_id'    => $user->id,
            'action_type' => 'edit_user_view',
            'description' => 'Admin is viewing edit form for user ID: ' . $userId,
            'ip_address' => request()->ip(),
        ]);

        return Inertia::render('admin/useredit', [
            'userDetails'  => $userDetails,
            'selectedUser' => $selectedUser,
            'selectedID'   => $userId,
        ]);
    }

    public function updateUser(Request $request, $userID)
    {
        $validated = $request->validate([
            'name'            => 'required|string|max:255',
            'email'           => 'required|email|max:255|unique:users,email,' . $userID . ',id',
            'phone_number'    => 'required|string|max:20',
            'description'     => 'nullable|string|max:1000',
            'newPassword'     => 'nullable|string|min:6|confirmed',
            'profile_picture' => 'nullable|image|mimes:jpg,jpeg,png|max:2048',
        ]);

        $user = User::find($userID);
        if (!$user) {
            return response()->json(['error' => 'User not found'], 404);
        }

        // Update user details
        $user->name         = $validated['name'];
        $user->email        = $validated['email'];
        $user->phone_number = $validated['phone_number'] ?? $user->phone_number;
        $user->description  = $validated['description'] ?? $user->description;

        if (!empty($validated['newPassword'])) {
            $user->password = Hash::make($validated['newPassword']);
        }

        if ($request->hasFile('profile_picture')) {
            if ($user->profile_picture && file_exists(public_path('images/users/' . basename($user->profile_picture)))) {
                unlink(public_path('images/users/' . basename($user->profile_picture)));
            }
            $image = $request->file('profile_picture');
            $imageName = Str::uuid() . '.' . $image->getClientOriginalExtension();
            $image->move(public_path('images/users'), $imageName);
            $user->profile_picture = '/images/users/' . $imageName;
        }

        if ($user->save()) {
            // Log user update activity
            ActivityLog::create([
                'user_id'    => Auth::id(),
                'action_type' => 'user_update',
                'description' => 'Admin updated user ID: ' . $userID,
                'ip_address' => request()->ip(),
            ]);
            return response()->json(['success' => 'User updated successfully!'], 200);
        } else {
            return response()->json(['error' => 'Failed to update user'], 500);
        }
    }

    public function assignWorkingGroup(Request $request, $id)
    {
        $validatedData = $request->validate([
            'working_group_id' => 'nullable|exists:working_groups,id',
        ]);

        $user = User::findOrFail($id);

        if ($user->working_group_id == $validatedData['working_group_id']) {
            if ($request->wantsJson()) {
                return response()->json([
                    'status'  => 'info',
                    'message' => 'No changes detected in working group assignment.',
                ], 200);
            }
            return back()->with('info', 'No changes detected in working group assignment.');
        }

        try {
            $oldGroupId = $user->working_group_id;
            $user->update([
                'working_group_id' => $validatedData['working_group_id']
            ]);

            // Log working group update activity
            ActivityLog::create([
                'user_id'    => Auth::id(),
                'action_type' => 'working_group_update',
                'description' => 'Updated working group for user ID: ' . $id . ' from group ' . ($oldGroupId ?? 'none') . ' to group ' . ($validatedData['working_group_id'] ?? 'none'),
                'ip_address' => request()->ip(),
            ]);

            if ($request->wantsJson()) {
                return response()->json([
                    'status'  => 'success',
                    'message' => 'Working group updated successfully.',
                    'user'    => $user,
                ], 200);
            }

            return back()->with('success', 'Working group updated successfully.');
        } catch (\Exception $e) {
            Log::error('Error updating working group for user ID ' . $user->id . ': ' . $e->getMessage());
            if ($request->wantsJson()) {
                return response()->json([
                    'status'  => 'error',
                    'message' => 'Failed to update working group. Please try again later.',
                ], 500);
            }
            return back()->withErrors('Failed to update working group. Please try again later.');
        }
    }

    public function updateStatus(Request $request, $id)
    {
        $validatedData = $request->validate([
            'status' => 'required|in:active,inactive,suspended',
        ]);

        $user = User::findOrFail($id);

        if ($user->status == $validatedData['status']) {
            if ($request->wantsJson()) {
                return response()->json([
                    'status'  => 'info',
                    'message' => 'No changes detected in status assignment.',
                ], 200);
            }
            return back()->with('info', 'No changes detected in status assignment.');
        }

        try {
            $oldStatus = $user->status;
            $user->update([
                'status' => $validatedData['status']
            ]);

            // Log status update activity
            ActivityLog::create([
                'user_id'    => Auth::id(),
                'action_type' => 'status_update',
                'description' => 'Updated status for user ID: ' . $id . ' from ' . $oldStatus . ' to ' . $validatedData['status'],
                'ip_address' => request()->ip(),
            ]);

            if ($request->wantsJson()) {
                return response()->json([
                    'status'  => 'success',
                    'message' => 'User status updated successfully.',
                    'user'    => $user,
                ], 200);
            }
            return back()->with('success', 'User status updated successfully.');
        } catch (\Exception $e) {
            Log::error('Error updating status for user ID ' . $user->id . ': ' . $e->getMessage());
            if ($request->wantsJson()) {
                return response()->json([
                    'status'  => 'error',
                    'message' => 'Failed to update user status. Please try again later.',
                ], 500);
            }
            return back()->withErrors('Failed to update user status. Please try again later.');
        }
    }

    public function deleteUser(Request $request, $id)
    {
        try {
            $user = User::findOrFail($id);
            $user->delete();

            // Log deletion activity
            ActivityLog::create([
                'user_id'    => Auth::id(),
                'action_type' => 'user_deletion',
                'description' => 'Admin deleted user ID: ' . $id,
                'ip_address' => request()->ip(),
            ]);

            if ($request->wantsJson()) {
                return response()->json([
                    'status'  => 'success',
                    'message' => 'User deleted successfully.',
                ], 200);
            }

            return back()->with('success', 'User deleted successfully.');
        } catch (\Exception $e) {
            Log::error("Error deleting user ID $id: " . $e->getMessage());
            if ($request->wantsJson()) {
                return response()->json([
                    'status'  => 'error',
                    'message' => 'Failed to delete user. Please try again later.',
                ], 500);
            }
            return back()->withErrors('Failed to delete user. Please try again later.');
        }
    }

    public function roles(Request $request)
    {
        $perPage = $request->input('perPage', 10); // Default to 10 per page
        $roles = Role::paginate($perPage);

        // Log roles view activity
        ActivityLog::create([
            'user_id'    => Auth::id(),
            'action_type' => 'roles_view',
            'description' => 'Admin viewed roles list with pagination.',
            'ip_address' => request()->ip(),
        ]);

        return Inertia::render('admin/roles', [
            'roles'       => $roles,
            'userDetails' => Auth::user(),
        ]);
    }

    public function storeRole(Request $request)
    {
        // Validate the request with custom messages
        $validated = $request->validate([
            'name'        => 'required|string|max:255|unique:roles,name',
            'description' => 'nullable|string|max:1000',
        ], [
            'name.required' => 'The role name is required.',
            'name.unique'   => 'This role already exists. Please choose a different name.',
        ]);

        try {
            // Create the role record
            $role = Role::create([
                'name'        => $validated['name'],
                'description' => $validated['description'] ?? null,
            ]);

            if (!$role) {
                throw new \Exception('Failed to create role.');
            }

            // Generate and save a slug for the role
            $role->save();

            // Ensure a valid user ID; if not authenticated, you might set to 0 or handle appropriately.
            $adminId = Auth::id() ?: 0;

            // Log the creation activity
            ActivityLog::create([
                'user_id'     => $adminId,
                'action_type' => 'role_created',
                'description' => 'Admin created a new role: ' . $role->name,
                'ip_address'  => $request->ip(),
            ]);

            if ($request->wantsJson()) {
                return response()->json([
                    'status'  => 'success',
                    'message' => 'Role created successfully.',
                ], 200);
            }
            return back()->with('success', 'Role created successfully.');
        } catch (\Exception $e) {
            Log::error("Error creating role: " . $e->getMessage());
            return back()->withErrors('Failed to create role. Please try again later.');
        }
    }


    public function updateRole(Request $request, $id)
    {
        // Validate the incoming data; ignore the current role when checking for uniqueness.
        $validated = $request->validate([
            'name'        => 'required|string|max:255|unique:roles,name,' . $id,
            'description' => 'nullable|string|max:1000',
        ], [
            'name.required' => 'The role name is required.',
            'name.unique'   => 'This role already exists. Please choose a different name.',
        ]);

        try {
            // Retrieve the role or fail with a 404.
            $role = Role::findOrFail($id);

            // Update the role's fields.
            $role->name = $validated['name'];
            $role->description = $validated['description'] ?? null;

            // Save the changes.
            $role->save();

            // Optionally log this activity.
            $adminId = Auth::id() ?: 0;
            ActivityLog::create([
                'user_id'     => $adminId,
                'action_type' => 'role_updated',
                'description' => 'Admin updated role: ' . $role->name,
                'ip_address'  => $request->ip(),
            ]);

            // Return a JSON response if requested.
            if ($request->wantsJson()) {
                return response()->json([
                    'status'  => 'success',
                    'message' => 'Role updated successfully.',
                ], 200);
            }

            return back()->with('success', 'Role updated successfully.');
        } catch (\Exception $e) {
            Log::error("Error updating role: " . $e->getMessage());

            if ($request->wantsJson()) {
                return response()->json([
                    'status'  => 'error',
                    'message' => 'Failed to update role. Please try again later.',
                ], 500);
            }

            return back()->withErrors('Failed to update role. Please try again later.');
        }
    }


    public function deleteRole(Request $request, $id)
    {
        try {
            // Retrieve the role or throw a ModelNotFoundException if it doesn't exist.
            $role = Role::findOrFail($id);
            $roleName = $role->name;

            // Delete the role from the database.
            $role->delete();

            // Log the deletion activity (if using an activity log).
            $adminId = Auth::id() ?: 0;
            ActivityLog::create([
                'user_id'     => $adminId,
                'action_type' => 'role_deleted',
                'description' => 'Admin deleted role: ' . $roleName,
                'ip_address'  => $request->ip(),
            ]);

            // Return a JSON response if requested.
            if ($request->wantsJson()) {
                return response()->json([
                    'status'  => 'success',
                    'message' => 'Role deleted successfully.'
                ], 200);
            }

            // Otherwise, redirect back with a success message.
            return back()->with('success', 'Role deleted successfully.');
        } catch (\Exception $e) {
            // Log the error for debugging.
            Log::error("Error deleting role: " . $e->getMessage());

            // Return a JSON error response if requested.
            if ($request->wantsJson()) {
                return response()->json([
                    'status'  => 'error',
                    'message' => 'Failed to delete role. Please try again later.'
                ], 500);
            }

            // Otherwise, redirect back with an error message.
            return back()->withErrors('Failed to delete role. Please try again later.');
        }
    }

    public function assignRole(Request $request)
    {
        // Get query parameters
        $perPage = $request->input('perPage', 10);
        $search = $request->input('search', '');
        $status = $request->input('status', '');

        // Build the base query with the necessary relationships
        $query = User::with(['role', 'workingGroup']);

        // Apply search filtering if a search term is provided
        if (!empty($search)) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'LIKE', "%{$search}%")
                    ->orWhere('email', 'LIKE', "%{$search}%");
            });
        }

        // Apply status filtering if a status is provided
        if (!empty($status)) {
            $query->where('status', $status);
        }

        // Retrieve paginated users and append query parameters for pagination links
        $users = $query->paginate($perPage)
            ->appends($request->query());

        // Retrieve all roles
        $roles = Role::all();

        // Log the activity for viewing the assign roles list
        ActivityLog::create([
            'user_id'     => Auth::id(),
            'action_type' => 'Assign_roles_view',
            'description' => 'Admin viewed assign roles list.',
            'ip_address'  => $request->ip(),
        ]);

        // Render the Inertia view, passing roles, paginated users, and user details.
        return Inertia::render('admin/assignrole', [
            'roles'       => $roles,
            'users'       => $users,
            'userDetails' => Auth::user(),
        ]);
    }

    public function updateUserRole(Request $request)
    {
        // // Optional: Ensure the authenticated user is authorized to update roles.
        // $this->authorize('updateRole', User::class);

        // Validate the incoming request parameters.
        $validated = $request->validate([
            'userId' => 'required|exists:users,id',
            'roleId' => 'required|exists:roles,id',
        ]);

        DB::beginTransaction();

        try {
            // Retrieve the user record.
            $user = User::findOrFail($validated['userId']);
            $oldRoleId = $user->role_id;

            // Check if the new role is different from the current role.
            if ($oldRoleId == $validated['roleId']) {
                return redirect()->back()->with('info', 'User already has the selected role.');
            }

            // Update the user's role.
            $user->role_id = $validated['roleId'];
            $user->save();

            // Log the role update activity with detailed information.
            ActivityLog::create([
                'user_id'     => Auth::id(),
                'action_type' => 'Assign_role_update',
                'description' => "Admin updated role for user: {$user->name} from role id {$oldRoleId} to {$validated['roleId']}",
                'ip_address'  => $request->ip(),
            ]);

            // // Optionally fire an event to handle additional actions (e.g., notifying the user).
            // event(new RoleUpdated($user, $oldRoleId, $validated['roleId']));

            DB::commit();

            return redirect()->back()->with('success', 'User role updated successfully.');
        } catch (\Exception $e) {
            DB::rollBack();

            // Log the error details for debugging.
            Log::error('Failed to update user role: ' . $e->getMessage());

            return redirect()->back()->with('error', 'Failed to update user role.');
        }
    }

    public function workingGroups(Request $request)
    {
        // Get the per-page value from the query string, defaulting to 10 if not provided.
        $perPage = $request->query('perPage', 10);
        // Optionally filter by status if provided.
        $status = $request->query('status');

        // Build the query with the count of related users.
        $query = WorkingGroup::withCount('users');

        $query->withCount('products');

        if ($status) {
            $query->where('status', $status);
        }

        // Optionally order by created_at descending.
        $query->orderBy('created_at', 'desc');

        // Retrieve paginated results and append existing query parameters to pagination links.
        $workingGroups = $query->paginate($perPage)->withQueryString();

        // Log the activity.
        ActivityLog::create([
            'user_id'     => Auth::id(),
            'action_type' => 'working_groups_view',
            'description' => 'Admin viewed working groups list.',
            'ip_address'  => $request->ip(),
        ]);

        // Render the Inertia view, passing paginated working groups and user details.
        return Inertia::render('admin/workingGroups', [
            'userDetails'   => Auth::user(),
            'workingGroups' => $workingGroups,
        ]);
    }

    public function addWs(Request $request)
    {
        // Validate incoming data.
        $validated = $request->validate([
            'name'        => 'required|string|max:255|unique:working_groups,name',
            'description' => 'nullable|string',
            'wg_image'    => 'nullable|image|mimes:jpg,jpeg,png|max:2048',
            'status'      => 'required|in:active,inactive,inactivating',
        ], [
            'name.required' => 'The working group name is required.',
            'name.unique'   => 'This working group already exists. Please choose a different name.',
            'image.max'   => 'The image must be less than 2MB.',
            'image.image' => 'The file must be an image.',
            'image.mimes' => 'The image must be a file of type: jpg, jpeg, png.',
            'status.required' => 'The status is required.'
        ]);
        try {

            // Process image upload if a file is provided.
            if ($request->hasFile('wg_image')) {
                try {
                    $image = $request->file('wg_image');
                    $imageName = Str::uuid() . '.' . $image->getClientOriginalExtension();
                    // Store the file in public/images/working-groups.
                    $image->move(public_path('images/working-groups'), $imageName);
                    // Save the public URL of the image.
                    $validated['wg_image'] = '/images/working-groups/' . $imageName;
                } catch (\Exception $e) {
                    // If image upload fails, throw an exception to break the function.
                    throw new \Exception('Image uploading failed: ' . $e->getMessage());
                    log::error('Image uploading failed: ' . $e->getMessage());
                    return redirect()->back()->with('error', 'Image uploading failed: ' . $e->getMessage());
                }
            }

            // Create the working group.
            $workingGroup = WorkingGroup::create($validated);

            // Log the creation activity.
            ActivityLog::create([
                'user_id'     => Auth::id(),
                'action_type' => 'working_group_created',
                'description' => 'Admin created working group: ' . $workingGroup->name,
                'ip_address'  => $request->ip(),
            ]);

            return redirect()->route('admin.workingGroups')
                ->with('success', 'Working Group created successfully.');
        } catch (\Exception $e) {
            Log::error('Error in addWs: ' . $e->getMessage());
            return redirect()->back()->with('error', 'Failed to create working group. Please try again later.');
        }
    }


    public function editWs(Request $request, $id)
    {
        // STEP 1: Log the incoming request data
        Log::info('Edit Working Group request received', [
            'id' => $id,
            'data' => $request->all()
        ]);

        try {
            // STEP 2: Validate incoming request
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'description' => 'nullable|string',
                'status' => 'required|in:active,inactive,inactivating',
                'wg_image' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:2048',
            ]);
            Log::info('Validation passed', $validated);

            // STEP 3: Find the Working Group
            $workingGroup = WorkingGroup::findOrFail($id);
            Log::info('Working Group found', ['working_group' => $workingGroup]);

            // STEP 4: Update fields
            $workingGroup->name = $validated['name'];
            $workingGroup->description = $validated['description'];
            $workingGroup->status = $validated['status'];

            // STEP 5: Handle image upload
            if ($request->hasFile('wg_image')) {
                Log::info('Image file detected');

                // Delete old image
                if ($workingGroup->wg_image && file_exists(public_path($workingGroup->wg_image))) {
                    unlink(public_path($workingGroup->wg_image));
                    Log::info('Old image deleted', ['old_image' => $workingGroup->wg_image]);
                }

                $image = $request->file('wg_image');
                $imageName = time() . '_' . uniqid() . '.' . $image->getClientOriginalExtension();
                $imagePath = public_path('/images/working-groups');

                // Check folder existence
                if (!file_exists($imagePath)) {
                    mkdir($imagePath, 0775, true);
                    Log::info('Uploads directory created');
                }

                $image->move($imagePath, $imageName);
                Log::info('New image uploaded', ['image_name' => $imageName]);

                $workingGroup->wg_image = '/images/working-groups/' . $imageName;
            }

            // STEP 6: Save to DB
            $workingGroup->save();
            Log::info('Working Group updated successfully', ['working_group' => $workingGroup]);

            return back()->with('success', 'Working Group updated successfully.');
        } catch (\Illuminate\Validation\ValidationException $ve) {
            Log::error('Validation failed', ['errors' => $ve->errors()]);
            return back()->withErrors($ve->errors());
        } catch (\Exception $e) {
            Log::error('Update Working Group failed', ['error' => $e->getMessage()]);
            return back()->withErrors(['error' => 'Failed to update Working Group. ' . $e->getMessage()]);
        }
    }

    public function manageWs(Request $request, $id)
    {
        // Retrieve the working group along with its assigned users.
        $workingGroup = WorkingGroup::with('users')->findOrFail($id);

        // Log the activity for viewing the working group details.
        ActivityLog::create([
            'user_id'     => Auth::id(),
            'action_type' => 'working_group_detail_view',
            'description' => 'Admin viewed working group details for group ID: ' . $id,
            'ip_address'  => $request->ip(),
        ]);

        // Render the Inertia view, passing paginated working groups and user details.
        return Inertia::render('admin/ws/details', [
            'userDetails'   => Auth::user(),
            'workingGroup' => $workingGroup,

        ]);
    }

    public function products(Request $request)
    {
        // Build the base product query and eager load possible relationships.
        $query = Product::query()->with(['category', 'workingGroup', 'provider'])->whereNull('deleted_at');

        // Apply search filter on product name and SEO description.
        if ($request->filled('search')) {
            $searchTerm = $request->input('search');
            $query->where(function ($q) use ($searchTerm) {
                $q->where('name', 'like', '%' . $searchTerm . '%')
                    ->orWhere('meta_title', 'like', '%' . $searchTerm . '%');
            });
        }

        // Apply status filter, if provided.
        if ($request->filled('status') && $request->input('status') !== 'Select Status') {
            $query->where('status', $request->input('status'));
        }

        // Apply working group filter, if provided.
        if ($request->filled('working_group') && $request->input('working_group') !== 'Select Working Group') {
            $query->where('working_group_id', $request->input('working_group'));
        }

        // Apply category filter using whereHas on the many-to-many relationship.
        if ($request->filled('category') && $request->input('category') !== 'Select Category') {
            $query->whereHas('categories', function ($q) use ($request) {
                // Here we assume that the Category table's primary key is 'id'
                $q->where('id', $request->input('category'));
            });
        }

        // Apply sorting based on request parameters; defaults to sorting by created_at descending.
        $sortBy = $request->input('sort_by', 'created_at');
        $order  = $request->input('order', 'desc');
        $query->orderBy($sortBy, $order);

        // Paginate the products with the per_page count (default to 10) and persist query strings.
        $perPage = $request->input('per_page', 10);
        $products = $query->paginate($perPage)->appends(request()->query());


        // Fetch active working groups and categories for filters.
        $workingGroups = WorkingGroup::where('status', 'active')->orderBy('name')->get();
        $categories = Category::orderBy('name', 'asc')->get();

        // Log the activity with additional context if needed.
        ActivityLog::create([
            'user_id'     => Auth::id(),
            'action_type' => 'products_view',
            'description' => 'Admin viewed products list.' . ($request->filled('search') ? ' Searched for: ' . $request->input('search') : ''),
            'ip_address'  => $request->ip(),
        ]);

        // Render the Inertia view for products.
        return Inertia::render('admin/productsView', [
            'userDetails'   => Auth::user(),
            'workingGroups' => $workingGroups,
            'categories'    => $categories,
            'products'      => $products,
            'perPage'       => $perPage,
            'sortBy'        => $sortBy,
            'order'         => $order,
            'filters'       => $request->only(['search', 'status', 'working_group', 'category']),
        ]);
    }

    public function addProduct()
    {
        // Log the activity for viewing the add product page.
        ActivityLog::create([
            'user_id'     => Auth::id(),
            'action_type' => 'add_product_view',
            'description' => 'Admin viewed add product page.',
            'ip_address'  => request()->ip(),
        ]);
        $workingGroups = WorkingGroup::where('status', 'active')->get();
        $Categories = Category::orderby('name', 'asc')->get();
        $Providers = Provider::orderby('name', 'asc')->get();

        // Render the Inertia view for adding a new product.
        return Inertia::render('admin/addProduct', [
            'userDetails' => Auth::user(),
            'workingGroups' => $workingGroups,
            'categories'   => $Categories,
            'providers'    => $Providers,
        ]);
    }

    public function jsonCats()
    {
        // Retrieve all categories from the database.
        $categories = Category::all();

        // Return the list of categories as JSON.
        return response()->json([
            'categories' => $categories
        ], 200);
    }

    public function storeProduct(Request $request)
    {
        Log::info('Store Product request received', [
            'data' => $request->all()
        ]);

        // Validate the incoming request data.
        $validatedData = $request->validate([
            'workingGroup'           => 'required|exists:working_groups,id',
            'productName'            => 'required|string|max:255|unique:products,name',
            'productDescription'     => 'required|string',
            'seoTitle'               => 'required|string|max:255',
            'seoDescription'         => 'required|string|max:1000',
            'pricingMethod'          => 'required|in:standard,roll',
            'basePrice'              => 'nullable|numeric|min:0',
            'globalQuantity'         => 'nullable|integer|min:1',
            'globalReorderThreshold' => 'nullable|integer|min:0',
            'globalProvider'         => 'nullable|exists:providers,id',
            'globalUnitDetails'      => 'nullable|string',
            'pricePerSqft'           => 'nullable|numeric|min:0',
            'hasVariants'            => 'required|in:true,false',
            'variants'               => 'nullable|string', // Expecting JSON string
            'categories'             => 'required|string', // Expecting JSON string
            'images'                 => 'required|array|min:1|max:2048',
        ]);

        DB::beginTransaction();

        try {
            // Create the product record.
            $product = Product::create([
                'working_group_id'  => $validatedData['workingGroup'],
                'name'              => $validatedData['productName'],
                'description'       => $validatedData['productDescription'],
                'pricing_method'    => $validatedData['pricingMethod'],
                'price'             => $validatedData['pricingMethod'] === 'standard' ? $validatedData['basePrice'] : null,
                'price_per_sqft'    => $validatedData['pricingMethod'] === 'roll' ? $validatedData['pricePerSqft'] : null,
                'unit_of_measure'   => $validatedData['pricingMethod'] === 'roll' ? 'roll' : 'piece',
                'metadata'          => $validatedData['seoTitle'] . '|' . $validatedData['seoDescription'],
                'meta_title'        => $validatedData['seoTitle'],
                'meta_description'  => $validatedData['seoDescription'],
                'created_at'        => now(),
                'updated_at'        => now(),
                'created_by'        => Auth::id(),
                'updated_by'        => Auth::id(),
                'status'           => 'published',
            ]);

            // Attach categories to the product.
            $categories = json_decode($validatedData['categories'], true);
            $product->categories()->attach($categories);

            // Handle inventory based on pricing method and variants.
            if ($validatedData['pricingMethod'] === 'standard' && $validatedData['hasVariants'] === 'false') {
                // No variants – create a single inventory record.
                ProductInventory::create([
                    'product_id'        => $product->id,
                    'quantity'          => $validatedData['globalQuantity'] ?? 0,
                    'reorder_threshold' => $validatedData['globalReorderThreshold'] ?? 0,
                    'provider_id'       => $validatedData['globalProvider'] ?? null,
                    'unit_details'      => $validatedData['globalUnitDetails'] ?? null,
                    'created_at'        => now(),
                    'updated_at'        => now(),
                    'created_by'        => Auth::id(),
                    'updated_by'        => Auth::id(),
                ]);
                Log::info('Product created successfully');
            } elseif ($validatedData['pricingMethod'] === 'standard' && $validatedData['hasVariants'] === 'true') {
                if (!empty($validatedData['variants'])) {
                    $variants = json_decode($validatedData['variants'], true);
                    foreach ($variants as $variant) {
                        // Create the variant and capture its instance.
                        $createdVariant = $product->variants()->create([
                            'variant_name'    => $variant['name'],
                            'variant_value'   => $variant['value'],
                            'price_adjustment' => $variant['priceAdjustment'],
                            'created_at'      => now(),
                            'updated_at'      => now(),
                            'created_by'      => Auth::id(),
                            'updated_by'      => Auth::id(),
                        ]);

                        if ($variant['hasSubvariants'] === 'false' || $variant['hasSubvariants'] === null || !$variant['hasSubvariants']) {

                            // Create inventory for the variant.
                            $variantInventory = $variant['inventory'];
                            $productIN = ProductInventory::create([
                                'product_id'           => $product->id,
                                'product_variant_id'   => $createdVariant->id,
                                'quantity'             => $variantInventory['quantity'] ?? 0,
                                'reorder_threshold'    => $variantInventory['reorderThreshold'] ?? 0,
                                'provider_id'          => $variantInventory['provider'] ?? null,
                                'unit_details'         => $variantInventory['unitDetails'] ?? null,
                                'created_at'           => now(),
                                'updated_at'           => now(),
                                'created_by'           => Auth::id(),
                                'updated_by'           => Auth::id(),
                            ]);
                            if (!$productIN) {
                                Log::error('Failed to create inventory for variant', [
                                    'variant_id' => $createdVariant->id,
                                    'product_id' => $product->id,
                                ]);
                            }
                        } else {
                            // Handle subvariants.
                            foreach ($variant['subvariants'] as $subvariant) {
                                $createdSubvariant = $createdVariant->subvariants()->create([
                                    'subvariant_name'   => $subvariant['name'],
                                    'subvariant_value'  => $subvariant['value'],
                                    'price_adjustment'  => $subvariant['priceAdjustment'],
                                    'created_at'        => now(),
                                    'updated_at'        => now(),
                                    'created_by'        => Auth::id(),
                                    'updated_by'        => Auth::id(),
                                ]);

                                $subvariantInventory = $subvariant['inventory'];
                                ProductInventory::create([
                                    'product_id'             => $product->id,
                                    'product_variant_id'     => $createdVariant->id,
                                    'product_subvariant_id'  => $createdSubvariant->id,
                                    'quantity'               => $subvariantInventory['quantity'] ?? 0,
                                    'reorder_threshold'      => $subvariantInventory['reorderThreshold'] ?? 0,
                                    'provider_id'            => $subvariantInventory['provider'] ?? null,
                                    'unit_details'           => $subvariantInventory['unitDetails'] ?? null,
                                    'created_at'             => now(),
                                    'updated_at'             => now(),
                                    'created_by'             => Auth::id(),
                                    'updated_by'             => Auth::id(),
                                ]);
                            }
                        }
                    }
                } else {
                    return back()->withErrors("Dev Error: Variants array isn't passed to backend. Check Log!");
                }
            }
            Log::info('Uploaded files:', $request->allFiles());

            // Process images.
            if ($request->hasFile('images.0.file')) {
                Log::info('Images detected for upload');
                // Loop through the images input array.
                $images = $request->input('images');

                foreach ($images as $index => $imageData) {
                    if ($request->hasFile("images.$index.file")) {
                        $file = $request->file("images.$index.file");
                        $extension = $file->getClientOriginalExtension();
                        // Generate a unique file name.
                        $uniqueFileName = uniqid() . '_' . time() . '.' . $extension;
                        // Move the file to the public/images/products folder.
                        $destinationPath = public_path('images/products');
                        $file->move($destinationPath, $uniqueFileName);

                        $order = $request->input("images.$index.order");
                        $isPrimary = $request->input("images.$index.is_primary");
                        $path = '/images/products/' . $uniqueFileName;

                        ProductImage::create([
                            'product_id'  => $product->id,
                            'image_url'   => $path,
                            'image_order' => $order,
                            'is_primary'  => $isPrimary,
                            'created_by'  => Auth::id(),
                            'updated_by'  => Auth::id(),
                        ]);
                    } else {
                        Log::warning("No file found for images.$index.file");
                    }
                }
            } else {
                Log::warning('No images detected in the nested structure (images.0.file)');
            }

            // Log the product creation activity.
            ActivityLog::create([
                'user_id'     => Auth::id(),
                'action_type' => 'product_created',
                'description' => 'Admin created a new product: ' . $product->name,
                'ip_address'  => $request->ip(),
            ]);

            DB::commit();
            Log::info('Product created successfully', ['product_id' => $product->id]);
            return back()->with('success', 'Product added successfully.');
        } catch (Exception $e) {
            DB::rollBack();
            Log::error('Error in storeProduct: ' . $e->getMessage());
            return back()->with('error', 'Failed to add product. Please try again later.');
        }
    }

    public function inventoryProviders(Request $request)
    {
        // Retrieve query parameters with defaults.
        $perPage = $request->query('perPage', 10);
        $search  = $request->query('search', '');

        // Build the query for providers.
        $query = Provider::query();

        // If there's a search term, filter by name or contact_info.
        if (!empty($search)) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', '%' . $search . '%')
                    ->orWhere('contact_info', 'like', '%' . $search . '%');
            });
        }

        // Order by creation date (newest first) and paginate the results.
        $providers = $query->orderBy('created_at', 'desc')->paginate($perPage)->withQueryString();

        ActivityLog::create([
            'user_id'     => Auth::id(),
            'action_type' => 'provider_view',
            'description' => 'Admin viewed inventory providers list.',
            'ip_address'  => request()->ip(),
        ]);

        // Render the Inertia page with the providers and user details.
        return Inertia::render('admin/inventoryProviders', [
            'userDetails' => Auth::user(),
            'inProviders' => $providers,
        ]);
    }

    public function addInventoryProvider(Request $request)
    {
        // Validate the incoming request data.
        $validatedData = $request->validate([
            'name'         => 'required|string|max:255|unique:providers,name',
            'contact_info' => 'required|string',
        ]);

        try {

            // Create a new provider record.
            $provider = Provider::create($validatedData);

            // Log the activity in the activity log table.
            ActivityLog::create([
                'user_id'     => Auth::id(),
                'action_type' => 'provider_added',
                'description' => 'Admin added a new inventory provider: ' . $provider->name,
                'ip_address'  => $request->ip(),
            ]);

            // Redirect back with a success message.
            return redirect()->back()->with('success', 'Provider added successfully.');
        } catch (\Exception $e) {
            // Log the exception for debugging purposes.
            Log::error('Error in addInventoryProvider: ' . $e->getMessage());

            // Redirect back with an error message.
            return redirect()->back()->with('error', 'Failed to add provider. Please try again.');
        }
    }

    public function editInventoryProvider(Request $request, $id)
    {
        // Validate incoming request data.
        $validatedData = $request->validate([
            'name'         => 'required|string|max:255|unique:providers,name,' . $id,
            'contact_info' => 'required|string',
        ]);
        try {

            // Find the provider record or fail.
            $provider = Provider::findOrFail($id);

            // Update the provider record.
            $provider->update($validatedData);

            // Log the update activity.
            ActivityLog::create([
                'user_id'     => Auth::id(),
                'action_type' => 'provider_updated',
                'description' => 'Admin updated inventory provider: ' . $provider->name,
                'ip_address'  => $request->ip(),
            ]);

            // Redirect back with a success message.
            return redirect()->back()->with('success', 'Provider updated successfully.');
        } catch (\Exception $e) {
            // Log the error for debugging purposes.
            Log::error('Error in editInventoryProvider: ' . $e->getMessage());

            // Redirect back with an error message.
            return redirect()->back()->with('error', 'Failed to update provider. Please try again.');
        }
    }

    public function inventory(Request $request)
    {
        // Log the activity for viewing the inventory page.
        ActivityLog::create([
            'user_id'     => Auth::id(),
            'action_type' => 'inventory_view',
            'description' => 'Admin viewed inventory page.',
            'ip_address'  => $request->ip(),
        ]);

        // Build queries for inventory and rolls with eager loading and ordering.
        $inventoryQuery = ProductInventory::with('provider')
            ->orderBy('id', 'asc');

        $rollsQuery = Roll::with('provider')
            ->orderBy('id', 'asc');

        // If a search term is provided, apply filtering to both queries.
        if ($request->filled('search')) {
            $search = $request->search;
            $inventoryQuery->where('id', 'like', "%{$search}%");
            $rollsQuery->where('id', 'like', "%{$search}%");
        }

        // Use the "show" query parameter for pagination count, defaulting to 10.
        $perPage = $request->input('show', 10);

        // Paginate the results and append all request parameters so pagination links include them.
        $inventory = $inventoryQuery->paginate($perPage)->appends($request->all());
        $rolls = $rollsQuery->paginate($perPage)->appends($request->all());
        $providers = Provider::orderby('name', 'asc')->get();

        // Render the Inertia view for inventory.
        return Inertia::render('admin/inventory', [
            'userDetails' => Auth::user(),
            'inventory'   => $inventory,
            'rolls'       => $rolls,
            'providers'   => $providers,
        ]);
    }

    public function addInventoryItem(Request $request)
    {
        // Validate incoming request data.
        $validatedData = $request->validate([
            'provider'    => 'required|exists:providers,id',
            'rollType'    => 'required|string|max:100',
            'rollSize'    => 'nullable|string|max:50',
            'rollWidth'   => 'required|numeric',
            'rollHeight'  => 'required|numeric',
            'priceRate'   => 'required|numeric',
            'offcutPrice' => 'nullable|numeric',
        ]);

        try {
            // Create new Roll instance and assign validated data.
            $roll = new Roll();
            $roll->provider_id = $validatedData['provider'];
            $roll->roll_type = $validatedData['rollType'];
            $roll->roll_size = $validatedData['rollSize'] ?? null;
            $roll->roll_width = $validatedData['rollWidth'];
            $roll->roll_height = $validatedData['rollHeight'];
            $roll->price_rate_per_sqft = $validatedData['priceRate'];
            $roll->offcut_price = $validatedData['offcutPrice'] ?? 0;

            // Save the new roll in the database.
            $roll->save();

            // Log the activity in the activity log table.
            ActivityLog::create([
                'user_id'     => Auth::id(),
                'action_type' => 'roll_added',
                'description' => 'Admin added a new roll: ' . $roll->id,
                'ip_address'  => $request->ip(),
            ]);

            return redirect()->back()->with('success', 'Roll added successfully.');
        } catch (\Exception $e) {
            Log::error("Failed to add roll: " . $e->getMessage());
            return redirect()->back()->with('error', 'Failed to add roll. Please try again later.');
        }
    }

    public function editInventoryItem(Request $request, $id)
    {
        // Validate the incoming data.
        $validatedData = $request->validate([
            'provider'    => 'required|exists:providers,id',
            'rollType'    => 'required|string|max:100',
            'rollSize'    => 'nullable|string|max:50',
            'rollWidth'   => 'required|numeric',
            'rollHeight'  => 'required|numeric',
            'priceRate'   => 'required|numeric',
            'offcutPrice' => 'nullable|numeric',
        ]);

        try {
            // Find the roll record by ID; throws ModelNotFoundException if not found.
            $roll = Roll::findOrFail($id);

            // Update roll properties using validated data.
            $roll->provider_id = $validatedData['provider'];
            $roll->roll_type = $validatedData['rollType'];
            $roll->roll_size = $validatedData['rollSize'] ?? null;
            $roll->roll_width = $validatedData['rollWidth'];
            $roll->roll_height = $validatedData['rollHeight'];
            $roll->price_rate_per_sqft = $validatedData['priceRate'];
            $roll->offcut_price = $validatedData['offcutPrice'] ?? 0;

            // Save changes to the database.
            $roll->save();

            return redirect()->back()->with('success', 'Roll updated successfully.');
        } catch (\Exception $e) {
            Log::error("Failed to update roll: " . $e->getMessage());
            return redirect()->back()->with('error', 'Failed to update roll. Please try again.');
        }
    }

    public function deleteInventoryItem(Request $request, $id)
    {
        try {
            // Find the roll record by ID; throws ModelNotFoundException if not found.
            $roll = Roll::findOrFail($id);

            // Delete the roll from the database.
            $roll->delete();

            // Log the deletion activity.
            ActivityLog::create([
                'user_id'     => Auth::id(),
                'action_type' => 'roll_deleted',
                'description' => 'Admin deleted roll: ' . $roll->id,
                'ip_address'  => $request->ip(),
            ]);

            return redirect()->back()->with('success', 'Roll deleted successfully.');
        } catch (\Exception $e) {
            Log::error("Failed to delete roll: " . $e->getMessage());
            return redirect()->back()->with('error', 'Failed to delete roll. Please try again.');
        }
    }

    public function addCategory(Request $request)
    {
        try {
            $validatedData = $request->validate([
                'newCategoryName' => 'required|string|max:255|unique:categories,name',
                'description' => 'nullable|string|max:1000',
            ]);
        } catch (ValidationException $e) {
            if ($request->wantsJson()) {
                return response()->json([
                    'status' => 'error',
                    'errors' => $e->errors(),
                ], 422);
            }
            throw $e;
        }

        try {
            // Create a new category instance and assign validated data.
            // $category = new Category();
            // $category->name = $validatedData['newCategoryName'];
            // $category->description = $validatedData['description'] ?? null;
            // $category->active = true; // Default status
            // $category->created_by = Auth::id(); // Set the creator ID
            // $category->updated_by = Auth::id(); // Set the updater ID
            // $category->created_at = now(); // Set the creation timestamp
            // $category->updated_at = now(); // Set the update timestamp
            // $category->deleted_at = null; // Set deleted_at to null for new categories

            // Save the new category in the database.
            Category::create([
                'name'        => $validatedData['newCategoryName'],
                'description' => $validatedData['description'] ?? null,
                'active'      => true,
                'created_by'  => Auth::id(),
                'updated_by'  => Auth::id(),
                'created_at'  => now(),
                'updated_at'  => now(),
                'deleted_at'  => null,
            ]);

            // Log the activity in the activity log table.
            ActivityLog::create([
                'user_id'     => Auth::id(),
                'action_type' => 'category_added',
                'description' => 'Admin added a new category: ' . $validatedData['newCategoryName'],
                'ip_address'  => $request->ip(),
            ]);

            if ($request->wantsJson()) {
                return response()->json([
                    'status'  => 'success',
                    'message' => 'Category added successfully.',
                ], 200);
            }

            return redirect()->back()->with('success', 'Category added successfully.');
        } catch (\Exception $e) {
            Log::error("Failed to add category: " . $e->getMessage());

            if ($request->wantsJson()) {
                return response()->json([
                    'status'  => 'error',
                    'message' => 'Failed to add category. Please try again later.',
                ], 500);
            }

            return redirect()->back()->with('error', 'Failed to add category. Please try again later.');
        }
    }

    public function jsonProducts(Request $request)
    {
        // Build the product query.
        $query = Product::query();

        // Apply search filter on product name and SEO description.
        if ($request->filled('search')) {
            $searchTerm = $request->search;
            $query->where(function ($q) use ($searchTerm) {
                $q->where('name', 'like', '%' . $searchTerm . '%')
                    ->orWhere('seo_description', 'like', '%' . $searchTerm . '%');
            });
        }

        // Apply status filter, if set.
        if ($request->filled('status') && $request->status !== 'Select Status') {
            $query->where('status', $request->status);
        }

        // Apply working group filter, if set.
        if ($request->filled('working_group') && $request->working_group !== 'Select Working Group') {
            $query->where('working_group', $request->working_group);
        }

        // Apply category filter, if set.
        if ($request->filled('category') && $request->category !== 'Select Category') {
            $query->where('category', $request->category);
        }

        // Get the per page count from the request; if not provided, default to 10.
        $perPage = $request->input('per_page', 10);
        $products = $query->paginate($perPage);

        // Fetch the filter data: working groups and categories.
        $workingGroups = WorkingGroup::all();
        $categories = Category::all();

        // Return JSON response with products, pagination info, and filter lists.
        return response()->json([
            'products'   => $products->items(), // May be empty array if no products are found.
            'pagination' => [
                'current_page' => $products->currentPage(),
                'last_page'    => $products->lastPage(),
                'per_page'     => $perPage,
                'total'        => $products->total(),
            ],
            'filters' => [
                'working_groups' => $workingGroups,
                'categories'     => $categories,
            ],
        ]);
    }

    public function quickProduct(Request $request, Product $product)
    {
        try {
            // Handle GET requests: return product details as JSON.
            if ($request->isMethod('get')) {
                return response()->json($product, 200);
            }

            // Handle PATCH requests: update product details.
            if ($request->isMethod('patch')) {
                // Validate the input for quick update.
                $data = $request->validate([
                    'name'             => 'required|string|max:255',
                    'meta_description' => 'nullable|string',
                    'price'            => 'nullable|numeric',
                    'price_per_sqft'   => 'nullable|numeric',
                    'status'           => 'required|in:published,unpublished',
                ]);
                ActivityLog::create([
                    'user_id'     => Auth::id(),
                    'action_type' => 'product_quick_edit',
                    'description' => 'Product ID ' . $product->id . ' has been edited. Quickly.',
                    'ip_address'  => request()->ip(),
                ]);
                // Update the product with the validated data.
                $product->update($data);

                // Return a success response with the updated product.
                return response()->json([
                    'success' => true,
                    'message' => 'Product updated successfully.',
                    'product' => $product,
                ], 200);
            }

            // For any other HTTP method, return a "Method Not Allowed" response.
            return response()->json(['error' => 'Method Not Allowed'], 405);
        } catch (\Illuminate\Validation\ValidationException $e) {
            // If validation fails, return the error messages.
            return response()->json([
                'success' => false,
                'message' => 'Validation failed.',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            // Log the exception for debugging.
            Log::error('Error in quickProduct: ' . $e->getMessage(), [
                'exception' => $e,
                'product_id' => $product->id,
            ]);

            // Return a generic error response.
            return response()->json([
                'success' => false,
                'message' => 'Something went wrong. Please try again later.',
            ], 500);
        }
    }

    public function deleteProduct(Product $product)
    {
        try {
            // Soft-delete the product by updating the deleted_at column.
            $product->delete();

            // Optionally log the deletion.
            ActivityLog::create([
                'user_id'     => Auth::id(),
                'action_type' => 'product_deleted',
                'description' => 'Product ID ' . $product->id . ' has been deleted.',
                'ip_address'  => request()->ip(),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Product soft-deleted successfully.',
            ], 200);
        } catch (\Exception $e) {
            Log::error("Error deleting product: " . $e->getMessage(), [
                'exception' => $e,
                'product_id' => $product->id,
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error deleting product. Please try again.',
            ], 500);
        }
    }

    public function editProductview(Product $product)
    {
        ActivityLog::create([
            'user_id'     => Auth::id(),
            'action_type' => 'product_editing_view',
            'description' => 'Product ID ' . $product->id . ' has been viewed for editing.',
            'ip_address'  => request()->ip(),
        ]);

        // Eager load all necessary relationships on the product model.
        $product->load(['categories', 'images', 'variants.subvariants', 'workingGroup', 'provider', 'inventories']);
        Log::info($product);
        // Retrieve additional data for the form.
        $workingGroups = WorkingGroup::where('status', 'active')->orderBy('name')->get();
        $Categories = Category::orderBy('name', 'asc')->get();
        $Providers = Provider::orderBy('name', 'asc')->get();

        return Inertia::render('admin/productEdit', [
            'userDetails'    => Auth::user(),
            'productDetails' => $product,
            'workingGroups'  => $workingGroups,
            'categories'     => $Categories,
            'providers'      => $Providers,
        ]);
    }


    public function editProduct(Request $request, Product $product)
    {
        Log::info('Edit Product request received', [
            'product_id' => $product->id,
            'data'       => $request->all()
        ]);

        // Validate the incoming request data.
        // Note: For the product name, use the unique rule excluding the current product.
        $validatedData = $request->validate([
            'workingGroup'           => 'required|exists:working_groups,id',
            'productName'            => 'required|string|max:255|unique:products,name,' . $product->id,
            'productDescription'     => 'required|string',
            'seoTitle'               => 'required|string|max:255',
            'seoDescription'         => 'required|string|max:1000',
            'pricingMethod'          => 'required|in:standard,roll',
            'basePrice'              => 'nullable|numeric|min:0',
            'globalQuantity'         => 'nullable|integer|min:1',
            'globalReorderThreshold' => 'nullable|integer|min:0',
            'globalProvider'         => 'nullable|exists:providers,id',
            'globalUnitDetails'      => 'nullable|string',
            'pricePerSqft'           => 'nullable|numeric|min:0',
            'hasVariants'            => 'required|in:true,false',
            'variants'               => 'nullable|string', // Expecting JSON string
            'categories'             => 'required|string',   // Expecting JSON string
            'images'                 => 'required|array|min:1|max:2048',
        ]);

        DB::beginTransaction();

        try {
            // --------- Update Product Main Data Only If Changed ---------
            $updateData = [];

            // Compare each field
            if ($product->working_group_id != $validatedData['workingGroup']) {
                $updateData['working_group_id'] = $validatedData['workingGroup'];
            }
            if ($product->name !== $validatedData['productName']) {
                $updateData['name'] = $validatedData['productName'];
            }
            if ($product->description !== $validatedData['productDescription']) {
                $updateData['description'] = $validatedData['productDescription'];
            }
            if ($product->pricing_method !== $validatedData['pricingMethod']) {
                $updateData['pricing_method'] = $validatedData['pricingMethod'];
            }
            if ($validatedData['pricingMethod'] === 'standard') {
                if ($product->pricing_method === 'standard' && $product->price != $validatedData['basePrice']) {
                    $updateData['price'] = $validatedData['basePrice'];
                }
            } elseif ($validatedData['pricingMethod'] === 'roll') {
                if ($product->price_per_sqft != $validatedData['pricePerSqft']) {
                    $updateData['price_per_sqft'] = $validatedData['pricePerSqft'];
                }
            }

            $newMetadata = $validatedData['seoTitle'] . '|' . $validatedData['seoDescription'];
            if ($product->metadata !== $newMetadata) {
                $updateData['metadata'] = $newMetadata;
                $updateData['meta_title'] = $validatedData['seoTitle'];
                $updateData['meta_description'] = $validatedData['seoDescription'];
            }

            if (!empty($updateData)) {
                $updateData['updated_at'] = now();
                $updateData['updated_by'] = Auth::id();
                $product->update($updateData);
            } else {
                Log::info('Product main fields unchanged.');
            }

            // --------- Categories: Sync if Changed ---------
            $incomingCategories = json_decode($validatedData['categories'], true);
            $currentCategoryIds = $product->categories()->pluck('id')->toArray();
            sort($incomingCategories);
            sort($currentCategoryIds);
            if ($incomingCategories !== $currentCategoryIds) {
                $product->categories()->sync($incomingCategories);
            } else {
                Log::info('Product categories unchanged.');
            }

            // --------- Handle Inventory and Variants ---------
            // For simplicity here, we delete and re-create inventories/variants only if the incoming data differs.
            if ($validatedData['pricingMethod'] === 'standard') {
                if ($validatedData['hasVariants'] === 'false') {
                    // Check global inventory.
                    $globalData = [
                        'quantity'          => $validatedData['globalQuantity'] ?? 0,
                        'reorder_threshold' => $validatedData['globalReorderThreshold'] ?? 0,
                        'provider_id'       => $validatedData['globalProvider'] ?? null,
                        'unit_details'      => $validatedData['globalUnitDetails'] ?? null,
                    ];
                    $globalInventory = ProductInventory::where('product_id', $product->id)
                        ->whereNull('product_variant_id')
                        ->first();
                    $needsGlobalUpdate = !$globalInventory ||
                        $globalInventory->quantity != $globalData['quantity'] ||
                        $globalInventory->reorder_threshold != $globalData['reorder_threshold'] ||
                        $globalInventory->provider_id != $globalData['provider_id'] ||
                        $globalInventory->unit_details != $globalData['unit_details'];
                    if ($needsGlobalUpdate) {
                        ProductInventory::where('product_id', $product->id)
                            ->whereNull('product_variant_id')
                            ->forceDelete();
                        ProductInventory::create(array_merge([
                            'product_id' => $product->id,
                            'created_at' => now(),
                            'updated_at' => now(),
                            'created_by' => Auth::id(),
                            'updated_by' => Auth::id(),
                        ], $globalData));
                    } else {
                        Log::info('Global inventory data unchanged.');
                    }
                } else {
                    // Variants are present
                    if (!empty($validatedData['variants'])) {
                        $incomingVariants = json_decode($validatedData['variants'], true);

                        // Basic diff: compare count and a couple fields from each variant.
                        $oldVariants = $product->variants()->get();
                        $variantsChanged = ($oldVariants->count() !== count($incomingVariants));
                        if (!$variantsChanged) {
                            foreach ($oldVariants as $index => $oldVariant) {
                                // If one field differs, trigger a full update.
                                if (
                                    $oldVariant->variant_name != $incomingVariants[$index]['name'] ||
                                    $oldVariant->variant_value != $incomingVariants[$index]['value'] ||
                                    $oldVariant->price_adjustment != $incomingVariants[$index]['priceAdjustment']
                                ) {
                                    $variantsChanged = true;
                                    break;
                                }
                            }
                        }
                        if ($variantsChanged) {
                            // Delete existing variants and inventories.
                            ProductInventory::where('product_id', $product->id)->forceDelete();
                            $product->variants()->forceDelete();

                            // Re-create variants and inventories.
                            foreach ($incomingVariants as $variant) {
                                $createdVariant = $product->variants()->create([
                                    'variant_name'     => $variant['name'],
                                    'variant_value'    => $variant['value'],
                                    'price_adjustment' => $variant['priceAdjustment'],
                                    'created_at'       => now(),
                                    'updated_at'       => now(),
                                    'created_by'       => Auth::id(),
                                    'updated_by'       => Auth::id(),
                                ]);

                                if (!$variant['hasSubvariants'] || $variant['hasSubvariants'] === 'false') {
                                    $variantInventory = $variant['inventory'];
                                    ProductInventory::create([
                                        'product_id'         => $product->id,
                                        'product_variant_id' => $createdVariant->id,
                                        'quantity'           => $variantInventory['quantity'] ?? 0,
                                        'reorder_threshold'  => $variantInventory['reorderThreshold'] ?? 0,
                                        'provider_id'        => $variantInventory['provider'] ?? null,
                                        'unit_details'       => $variantInventory['unitDetails'] ?? null,
                                        'created_at'         => now(),
                                        'updated_at'         => now(),
                                        'created_by'         => Auth::id(),
                                        'updated_by'         => Auth::id(),
                                    ]);
                                } else {
                                    foreach ($variant['subvariants'] as $subvariant) {
                                        $createdSubvariant = $createdVariant->subvariants()->create([
                                            'subvariant_name'  => $subvariant['name'],
                                            'subvariant_value' => $subvariant['value'],
                                            'price_adjustment' => $subvariant['priceAdjustment'],
                                            'created_at'       => now(),
                                            'updated_at'       => now(),
                                            'created_by'       => Auth::id(),
                                            'updated_by'       => Auth::id(),
                                        ]);
                                        $subInv = $subvariant['inventory'];
                                        ProductInventory::create([
                                            'product_id'            => $product->id,
                                            'product_variant_id'    => $createdVariant->id,
                                            'product_subvariant_id' => $createdSubvariant->id,
                                            'quantity'              => $subInv['quantity'] ?? 0,
                                            'reorder_threshold'     => $subInv['reorderThreshold'] ?? 0,
                                            'provider_id'           => $subInv['provider'] ?? null,
                                            'unit_details'          => $subInv['unitDetails'] ?? null,
                                            'created_at'            => now(),
                                            'updated_at'            => now(),
                                            'created_by'            => Auth::id(),
                                            'updated_by'            => Auth::id(),
                                        ]);
                                    }
                                }
                            }
                        } else {
                            Log::info('Variants data unchanged.');
                        }
                    } else {
                        return back()->withErrors("Dev Error: Variants array isn't passed to backend. Check Log!");
                    }
                }
            }
            // For products with roll pricing, assume inventory is managed elsewhere.

            // --------- Handle Images ---------
            // If new image files are provided in the request, then update images.
            if ($request->hasFile('images.0.file')) {
                // Delete old images.
                ProductImage::where('product_id', $product->id)->delete();
                Log::info('New images detected; processing uploads.');

                $images = $request->input('images');
                foreach ($images as $index => $imageData) {
                    if ($request->hasFile("images.$index.file")) {
                        $file = $request->file("images.$index.file");
                        $extension = $file->getClientOriginalExtension();
                        $uniqueFileName = uniqid() . '_' . time() . '.' . $extension;
                        $destinationPath = public_path('images/products');
                        $file->move($destinationPath, $uniqueFileName);
                        $order = $request->input("images.$index.order");
                        $isPrimary = $request->input("images.$index.is_primary");
                        $path = '/images/products/' . $uniqueFileName;
                        ProductImage::create([
                            'product_id'  => $product->id,
                            'image_url'   => $path,
                            'image_order' => $order,
                            'is_primary'  => $isPrimary,
                            'created_by'  => Auth::id(),
                            'updated_by'  => Auth::id(),
                        ]);
                    } else {
                        Log::warning("No file found for images.$index.file");
                    }
                }
            } else {
                Log::info('No new images provided; existing images remain unchanged.');
            }

            // --------- Log Activity ---------
            ActivityLog::create([
                'user_id'     => Auth::id(),
                'action_type' => 'product_updated',
                'description' => 'Admin updated product: ' . $product->name,
                'ip_address'  => $request->ip(),
            ]);

            DB::commit();
            Log::info('Product updated successfully', ['product_id' => $product->id]);
            return back()->with('success', 'Product updated successfully.');
        } catch (Exception $e) {
            DB::rollBack();
            Log::error('Error in editProduct: ' . $e->getMessage());
            return back()->with('error', 'Failed to update product. Please try again later.');
        }
    }

    public function addDesign()
    {
        ActivityLog::create([
            'user_id'     => Auth::id(),
            'action_type' => 'product_updated',
            'description' => 'Admin view add design form',
            'ip_address'  => request()->ip(),
        ]);

        $workingGroups = WorkingGroup::where('status', 'active')->with('products')->get();

        return Inertia::render('admin/addDesign', [
            'userDetails'    => Auth::user(),
            'workingGroups'  => $workingGroups,
        ]);
    }
    //images will upload to google drive
    // public function token()
    // {
    //     $client_id = \Config('services.google.client_id');
    //     $client_secret = \Config('services.google.client_secret');
    //     $refresh_token = \Config('services.google.refresh_token');
    //     $response = Http::post('https://oauth2.googleapis.com/token', [
    //         'client_id'     => $client_id,
    //         'client_secret' => $client_secret,
    //         'refresh_token' => $refresh_token,
    //         'grant_type'    => 'refresh_token',
    //     ]);

    //     $accessToken = json_decode((string)$response->getBody(), true)['access_token'];
    //     return $accessToken;
    // }
    // public function storeDesign(Request $request)
    // {
    //     // 1) Validate input…
    //     $data = $request->validate([
    //         'working_group_id' => 'required|exists:working_groups,id',
    //         'product_id'       => 'required|exists:products,id',
    //         'width'            => 'required|numeric',
    //         'height'           => 'required|numeric',
    //         'file'             => 'required|file|mimes:jpg,jpeg,png|max:102400',
    //     ]);

    //     // 2) Generate a unique 8-char ID (2 letters + 6 digits)
    //     do {
    //         $letters  = strtoupper(\Illuminate\Support\Str::random(2));         // e.g. "AZ"
    //         $numbers  = random_int(100000, 999999);                              // e.g. 345678
    //         $uniqueId = $letters . $numbers;                                     // "AZ345678"
    //     } while (\App\Models\Design::where('name', $uniqueId)->exists());

    //     // 3) Prep file info using that ID as the basename
    //     $file       = $request->file('file');
    //     $extension  = $file->getClientOriginalExtension();                      // "jpg"
    //     $filename   = "{$uniqueId}.{$extension}";                               // "AZ345678.jpg"
    //     $mimeType   = $file->getClientMimeType();
    //     $fileSize   = $file->getSize();
    //     $rootFolder = config('services.google.root_folder');
    //     $accessToken = $this->token();

    //     DB::beginTransaction();
    //     try {
    //         // ... resumable upload initiation & bytes upload as before ...
    //         // (use $filename whenever you set the 'name' in the init call)
    //         $init = Http::withToken($accessToken)
    //             ->withHeaders([
    //                 'Content-Type'            => 'application/json; charset=UTF-8',
    //                 'X-Upload-Content-Type'   => $mimeType,
    //                 'X-Upload-Content-Length' => $fileSize,
    //             ])->post(
    //                 'https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable',
    //                 [
    //                     'name'     => $filename,      // <-- our ID-based name
    //                     'mimeType' => $mimeType,
    //                     'parents'  => [$rootFolder],
    //                 ]
    //             );
    //         throw_if(! $init->successful(), \Exception::class, 'Init session failed: ' . $init->body());
    //         $sessionUrl = $init->header('Location');
    //         throw_if(! $sessionUrl, \Exception::class, 'No resumable session URL returned.');

    //         // upload all bytes in one go (or chunk if you prefer)
    //         $upload = Http::withToken($accessToken)
    //             ->withHeaders([
    //                 'Content-Type'   => $mimeType,
    //                 'Content-Length' => $fileSize,
    //             ])
    //             ->withBody(file_get_contents($file->getRealPath()), $mimeType)
    //             ->put($sessionUrl);
    //         throw_if(! in_array($upload->status(), [200, 201]), \Exception::class, 'Upload bytes failed: ' . $upload->body());

    //         $driveFile = $upload->json();
    //         $fileId    = data_get($driveFile, 'id');
    //         throw_if(! $fileId, \Exception::class, 'No file ID in upload response.');

    //         // set permissions…
    //         $perm = Http::withToken($accessToken)
    //             ->withHeaders(['Content-Type' => 'application/json'])
    //             ->post("https://www.googleapis.com/drive/v3/files/{$fileId}/permissions", [
    //                 'role' => 'reader',
    //                 'type' => 'anyone',
    //             ]);
    //         throw_if(! $perm->successful(), \Exception::class, 'Permission set failed: ' . $perm->body());

    //         // build the public URL
    //         $viewLink = data_get($driveFile, 'webViewLink')
    //             ?? "https://drive.google.com/uc?export=view&id={$fileId}";

    //         // 4) Persist into your DB, using the same $uniqueId
    //         $design = \App\Models\Design::create([
    //             'name'             => $uniqueId,      // store the ID, not the original name
    //             'description'      => '',
    //             'width'            => $data['width'],
    //             'height'           => $data['height'],
    //             'product_id'       => $data['product_id'],
    //             'image_url'        => $viewLink,
    //             'access_type'      => 'working_group',
    //             'working_group_id' => $data['working_group_id'],
    //             'status'           => 'active',
    //             'created_by'       => Auth::id(),
    //             'updated_by'       => Auth::id(),
    //         ]);

    //         \App\Models\ActivityLog::create([
    //             'user_id'     => Auth::id(),
    //             'action_type' => 'design_upload',
    //             'description' => "Uploaded design {$design->id} (Drive ID: {$fileId})",
    //             'ip_address'  => $request->ip(),
    //         ]);

    //         DB::commit();

    //         return response()->json([
    //             'message'   => 'Design uploaded successfully',
    //             'design_id' => $design->id,
    //             'view_url'  => $viewLink,
    //         ], 201);
    //     } catch (\Throwable $e) {
    //         DB::rollBack();
    //         Log::error('Drive upload error: ' . $e->getMessage(), [
    //             'trace' => $e->getTraceAsString(),
    //         ]);
    //         return response()->json([
    //             'message' => 'Upload failed, please try again.',
    //             'error'   => substr($e->getMessage(), 0, 200),
    //         ], 500);
    //     }
    // }

    public function storeDesign(Request $request)
    {
        Log::debug('storeDesign called', ['all_input' => $request->all()]);

        // A) Initialize Pion chunk receiver
        $receiver = new FileReceiver('file', $request, HandlerFactory::classFromRequest($request));
        Log::debug('Receiver initialized', [
            'isUploaded' => $receiver->isUploaded(),
            // 'handler'    => get_class($receiver->getHandler()),
        ]);

        if (! $receiver->isUploaded()) {
            Log::warning('No chunk uploaded');
            return response()->json(['message' => 'No file uploaded'], 400);
        }

        // B) Receive this chunk (or the full file if it’s the last one)
        $save = $receiver->receive();
        Log::debug('Chunk received', [
            'isFinished' => $save->isFinished(),
            'percentage' => $save->handler()->getPercentageDone(),
        ]);

        // C) If not yet the last chunk, return current progress
        if (! $save->isFinished()) {
            $pct = $save->handler()->getPercentageDone();
            Log::info('Returning intermediate chunk progress', ['done' => $pct]);
            return response()->json(['done' => $pct], 200);
        }

        // D) Full file is assembled—grab it
        /** @var \Illuminate\Http\UploadedFile $file */
        $file = $save->getFile();
        Log::info('Assembled file ready', [
            'original_name' => $file->getClientOriginalName(),
            'size'          => $file->getSize(),
            'mime'          => $file->getMimeType(),
        ]);

        // E) Validate your other inputs
        $data = validator($request->all(), [
            'working_group_id' => 'required|exists:working_groups,id',
            'product_id'       => 'required|exists:products,id',
            'width'            => 'required|numeric',
            'height'           => 'required|numeric',
        ])->validate();
        Log::debug('Input data validated', $data);

        // F) Generate a unique 8-char ID
        do {
            $uniqueId = Str::upper(Str::random(2)) . random_int(100000, 999999);
        } while (Design::where('name', $uniqueId)->exists());
        Log::info('Generated uniqueId', ['uniqueId' => $uniqueId]);

        // G) Prep destination paths
        $extension = $file->getClientOriginalExtension();
        $filename  = "{$uniqueId}.{$extension}";
        $publicDir = public_path('images/designs');
        if (! is_dir($publicDir)) {
            mkdir($publicDir, 0755, true);
            Log::debug('Created publicDir', ['path' => $publicDir]);
        }

        // H) Move the assembled file into public/images/designs
        //    (Pion will auto-remove the temp chunk file for you)
        try {
            $movedFile = $file->move($publicDir, $filename);
            Log::info('File moved', [
                'destination' => $movedFile->getPathname(),
                'size'        => $movedFile->getSize(),
            ]);
        } catch (\Throwable $e) {
            Log::error('Failed to move assembled file', ['exception' => $e->getMessage()]);
            return response()->json(['message' => 'Failed to move file'], 500);
        }

        // I) Image manipulation with debug
        // 1) Instantiate GD driver & manager
        $driver  = new GdDriver();
        $manager = new ImageManager($driver);
        Log::debug('ImageManager initialized', ['driver' => get_class($driver)]);

        try {
            $image = Image::read($movedFile->getPathname());
            Log::info('Image loaded', [
                'width'  => $image->width(),
                'height' => $image->height(),
            ]);
        } catch (\Throwable $e) {
            Log::error('Image read() failed', ['exception' => $e->getMessage()]);
            return response()->json(['message' => 'Image processing error', 'error' => $e->getMessage()], 500);
        }
        Log::info('hi');
        // Get original dimensions
        $originalWidth  = $image->width();
        $originalHeight = $image->height();

        // Define maximum dimensions
        $maxWidth  = 2048;
        $maxHeight = 2048;

        // Determine if resizing is needed
        if ($originalWidth > $maxWidth || $originalHeight > $maxHeight) {
            $ratio = $originalWidth / $originalHeight;
            if ($maxWidth / $maxHeight > $ratio) {
                // Height is the limiting factor
                $newWidth = $maxHeight * $ratio;
                $newHeight = $maxHeight;
            } else {
                // Width is the limiting factor
                $newWidth = $maxWidth;
                $newHeight = $maxWidth / $ratio;
            }
            $image->resize((int)$newWidth, (int)$newHeight);
        } else {
            // No resizing needed; keep original dimensions
            // Optionally, you can still call resize() if you wish to enforce integer values
            $image->resize($originalWidth, $originalHeight);
        }
        Log::debug('Image resized to', ['w' => $image->width(), 'h' => $image->height()]);

        // Optional resize
        // $image->resize(1024, 1024, fn($c) => $c->aspectRatio()->upsize());

        // Watermark
        $watermark = public_path('images/watermark.png');
        if (file_exists($watermark)) {
            $image->place($watermark, 'center', 50, 50, 50);
            Log::debug('Watermark applied', ['watermark' => $watermark]);
        } else {
            Log::warning('Watermark file not found', ['path' => $watermark]);
        }

        // Encode to JPEG at 50% quality and save
        Log::debug('Starting image re-encoding process', [
            'filename'  => $filename,
            'publicDir' => $publicDir,
        ]);
        $jpegData  = $image->toJpeg(50);
        $finalPath = "{$publicDir}/{$filename}";
        file_put_contents($finalPath, $jpegData);
        Log::info('Image re-encoded & saved', [
            'path'  => $finalPath,
            'bytes' => filesize($finalPath),
        ]);
        Log::debug('Re-encoded image details', [
            'dimensions' => getimagesize($finalPath),
        ]);

        $imageUrl = "/images/designs/{$filename}";

        // J) Persist to database + activity log
        DB::beginTransaction();
        try {
            $design = Design::create([
                'name'             => $uniqueId,
                'description'      => '',
                'width'            => $data['width'],
                'height'           => $data['height'],
                'product_id'       => $data['product_id'],
                'image_url'        => $imageUrl,
                'access_type'      => 'working_group',
                'working_group_id' => $data['working_group_id'],
                'status'           => 'active',
                'created_by'       => Auth::id(),
                'updated_by'       => Auth::id(),
            ]);
            ActivityLog::create([
                'user_id'     => Auth::id(),
                'action_type' => 'design_upload',
                'description' => "Uploaded design {$design->id} (path: {$imageUrl})",
                'ip_address'  => $request->ip(),
            ]);
            DB::commit();

            Log::info('Design record created', ['design_id' => $design->id]);

            return response()->json([
                'message'   => 'Design uploaded successfully',
                'design_id' => $design->id,
                'image_url' => $imageUrl,
            ], 201);
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('Database error on design create', ['exception' => $e->getMessage()]);
            return response()->json([
                'message' => 'Upload failed, please try again.',
                'error'   => substr($e->getMessage(), 0, 200),
            ], 500);
        }
    }


    public function designs(Request $request)
    {
        // 1️⃣ Log the view
        ActivityLog::create([
            'user_id'     => Auth::id(),
            'action_type' => 'design_view',
            'description' => 'Admin viewed designs list',
            'ip_address'  => $request->ip(),
        ]);

        // 2️⃣ Grab filter & pagination inputs
        $perPage = $request->input('per_page', 10);
        $search  = $request->input('search');
        $status  = $request->input('status');

        // 3️⃣ Base query
        $query = Design::with(['product', 'workingGroup'])
            ->whereNull('deleted_at');

        // 4️⃣ Apply search
        if ($search) {
            $query->where('name', 'like', "%{$search}%");
        }

        // 5️⃣ Apply status filter
        if (in_array($status, ['active', 'inactive'])) {
            $query->where('status', $status);
        }

        // 6️⃣ Paginate with query string so filters persist
        $designs = $query
            ->orderBy('created_at', 'desc')
            ->paginate($perPage)
            ->withQueryString();

        // 7️⃣ Return to Inertia
        return Inertia::render('admin/designs', [
            'userDetails' => Auth::user(),
            'designs'     => $designs,
            'filters'     => [
                'search'   => $search,
                'status'   => $status,
                'per_page' => (int)$perPage,
            ],
            'workingGroups' => WorkingGroup::where('status', 'active')->with('products')->get(),
        ]);
    }

    public function deleteDesign(Design $design)
    {
        try {
            DB::transaction(function () use ($design) {


                // 2️⃣ Remove image file if present
                if ($design->image_url && file_exists(public_path($design->image_url))) {
                    if (unlink(public_path($design->image_url))) {
                        Log::info('Design image deleted', ['path' => public_path($design->image_url)]);
                    } else {
                        Log::error('Failed to delete design image', ['path' => public_path($design->image_url)]);
                        return redirect()
                            ->back()
                            ->with('error', 'Failed to delete design image. Please try again.');
                    }
                }

                // 1️⃣ Delete any restricted‐access entries
                $design->designAccesses()->delete();

                // 3️⃣ Soft‐delete the design record
                $design->delete();

                // 4️⃣ Log the action
                ActivityLog::create([
                    'user_id'     => Auth::id(),
                    'action_type' => 'design_delete',
                    'description' => "Admin deleted design ID {$design->id}",
                    'ip_address'  => request()->ip(),
                ]);
            });
        } catch (\Exception $e) {
            // Something went wrong—log and inform the user
            Log::error("Failed to delete design [{$design->id}]: " . $e->getMessage());
            return redirect()
                ->back()
                ->with('error', 'Failed to delete design. Please try again.');
        }

        return redirect()
            ->back()
            ->with('success', 'Design deleted successfully.');
    }

    public function editDesign(Request $request, Design $design)
    {
        $validated = $request->validate([
            'name'             => 'required|string|max:255',
            'description'      => 'nullable|string',
            'width'            => 'required|numeric|min:0',
            'height'           => 'required|numeric|min:0',
            'status'           => 'required|in:active,inactive',
            'access_type'      => 'required|in:public,working_group,restricted',
            'working_group_id' => 'required|exists:working_groups,id',
            'product_id'       => 'required|exists:products,id',
            'image'            => 'nullable|image|mimes:jpg,jpeg,png|max:5120',
            'access_users'     => 'sometimes|array',
            'access_users.*'   => 'integer|exists:users,id',
        ]);

        try {
            // 2️⃣ Wrap DB + storage operations in a transaction
            DB::transaction(function () use ($validated, $request, $design) {
                // Handle optional image replacement
                if ($request->hasFile('image')) {
                    // delete old file (ignore if missing)
                    if ($design->image_url && Storage::exists($design->image_url)) {
                        Storage::delete($design->image_url);
                    }
                    $validated['image_url'] = $request->file('image')
                        ->store('designs', 'public');
                }

                // Update the design record
                $design->update(array_merge(
                    $validated,
                    ['updated_by' => Auth::id()]
                ));

                // Sync restricted‐access users
                if ($validated['access_type'] === 'restricted') {
                    $design->designAccesses()->delete();
                    foreach ($validated['access_users'] ?? [] as $userId) {
                        $design->designAccesses()->create(['user_id' => $userId]);
                    }
                } else {
                    $design->designAccesses()->delete();
                }

                // Log the update
                ActivityLog::create([
                    'user_id'     => Auth::id(),
                    'action_type' => 'design_update',
                    'description' => "Admin updated design ID {$design->id}",
                    'ip_address'  => $request->ip(),
                ]);
            });
        } catch (\Throwable $e) {
            // 3️⃣ Catch any exception, roll back, log, and redirect with an error flash
            Log::error("Failed to update design [{$design->id}]: {$e->getMessage()}");
            return redirect()
                ->back()
                ->with('error', 'Unexpected error updating design. Please try again.');
        }

        // 4️⃣ Success—redirect with a success flash
        return redirect()
            ->back()
            ->with('success', 'Design updated successfully.');
    }

    public function dailyCustomersView(Request $request)
    {
        ActivityLog::create([
            'user_id'     => Auth::id(),
            'action_type' => 'daily_customer_view',
            'description' => 'Admin viewed daily customers list',
            'ip_address'  => $request->ip(),
        ]);
        $query = DailyCustomer::query();

        if ($request->boolean('trashed')) {
            $query->withTrashed();
        }

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('full_name',   'like', "%{$search}%")
                    ->orWhere('email',       'like', "%{$search}%")
                    ->orWhere('phone_number', 'like', "%{$search}%");
            });
        }

        // 5. Working-group filter
        if ($wg = $request->input('working_group_id')) {
            $query->where('working_group_id', $wg);
        }

        $perPage = $request->input('per_page', 10);


        $customers = $query
            ->with('workingGroup')
            ->orderBy('visit_date', 'desc')
            ->paginate($perPage)
            ->withQueryString();

        return Inertia::render('admin/dailyCustomers', [
            'userDetails' => Auth::user(),
            'customers' => $customers,
            'filters'   => $request->only(['search', 'trashed']),
            'workingGroups' => WorkingGroup::where('status', 'active')->orderBy('name')->get(),
        ]);
    }

    public function addDailyCustomer(Request $request)
    {
        // 2) Pull validated data (includes working_group_id now)
        $data = $request->validate([
            'full_name'        => 'required|string|max:255',
            'email'            => 'nullable|email|max:255',
            'phone_number'     => 'nullable|string|max:20',
            'visit_date'       => 'required|date',
            'working_group_id' => 'nullable|exists:working_groups,id',
            'notes'            => 'nullable|string|max:1000',
            'address'          => 'nullable|string|max:500',
        ]);

        try {
            // 3) Create the record
            $customer = DailyCustomer::create($data);

            // 4) Log the activity
            ActivityLog::create([
                'user_id'     => Auth::id(),
                'action_type' => 'daily_customer_add',
                'description' => 'Admin added walk-in customer ID ' . $customer->id,
                'ip_address'  => $request->ip(),
            ]);

            // 5) Eager-load relationship
            $customer->load('workingGroup');

            // // 6) Return JSON for Inertia/modal, or redirect for classic
            // if ($request->wantsJson() || $request->ajax()) {
            //     return response()->json([
            //         'success'  => true,
            //         'customer' => $customer,
            //         'message'  => 'Customer added successfully.',
            //     ], 201);
            // }

            return redirect()->back()
                ->with('success', 'Walk-in customer added.');
        } catch (\Throwable $e) {
            // 7) Log the error for debugging
            Log::error('Error adding walk-in customer', [
                'error'   => $e->getMessage(),
                'trace'   => $e->getTraceAsString(),
                'payload' => $data,
            ]);

            // 8) Return JSON error or redirect back with error flash
            // if ($request->wantsJson() || $request->ajax()) {
            //     return response()->json([
            //         'success' => false,
            //         'message' => 'Failed to add walk-in customer.',
            //     ], 500);
            // }

            return redirect()->back()
                ->withInput()
                ->with('error', 'Failed to add walk-in customer.');
        }
    }

    public function editDailyCustomer(Request $request, $id)
    {
        $customer = DailyCustomer::findOrFail($id);
        // Validate the incoming request data
        $validated = $request->validate([
            'full_name' => 'required|string|max:255',
            'phone_number' => 'required|string|max:15',
            'email' => 'nullable|email|max:255',
            'address' => 'nullable|string',
            'notes' => 'nullable|string',
            'visit_date' => 'required|date',
            'working_group_id' => 'nullable|exists:working_groups,id',
        ]);

        // Update the customer with the validated data
        try {
            $customer->update($validated);
            ActivityLog::create([
                'user_id'     => Auth::id(),
                'action_type' => 'daily_customer_update',
                'description' => 'Admin updated walk-in Customer. customer ID ' . $customer->id,
                'ip_address'  => $request->ip(),
            ]);

            // Return the updated customer data
            return redirect()->back()
                ->with('success', 'Customer updated successfully.');
            // return response()->json([
            //     'status' => 'success',
            //     'message' => 'Customer details updated successfully!',
            //     'customer' => $customer,
            // ], 200);
        } catch (\Exception $e) {
            // If something goes wrong, return an error response
            Log::error('Error updating customer', [
                'error' => $e->getMessage(),
                'customer_id' => $customer->id,
            ]);
            return redirect()->back()
                ->withInput()
                ->with('error', 'Failed to update customer. Please try again.');
            // return response()->json([
            //     'status' => 'error',
            //     'message' => 'There was an issue updating the customer.',
            //     'error' => $e->getMessage(),
            // ], 500);
        }
    }

    public function deleteDailyCustomer(Request $request, DailyCustomer $customer)
    {

        try {
            $customer->delete();

            ActivityLog::create([
                'user_id'     => Auth::id(),
                'action_type' => 'daily_customer_delete',
                'description' => 'Admin deleted walk-in Customer ID ' . $customer->id,
                'ip_address'  => $request->ip(),
            ]);

            return redirect()->back()
                ->with('success', 'Customer deleted successfully.');
        } catch (\Exception $e) {
            Log::error('Error deleting customer', [
                'error'       => $e->getMessage(),
                'customer_id' => $customer->id,
            ]);

            return redirect()->back()
                ->with('error', 'Failed to delete customer. Please try again.');
        }
    }

    public function estimateView(Request $request)
    {
        // $this->authorize('viewAny', \App\Models\Estimate::class);

        $query = \App\Models\Estimate::with(['customer', 'items.product', 'workingGroup']);
        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }
        if ($wg = $request->input('working_group_id')) {
            $query->where('working_group_id', $wg);
        }
        if ($search = $request->input('search')) {
            $query->where('reference', 'like', "%{$search}%");
        }

        $estimates = $query
            ->orderBy('created_at', 'desc')
            ->paginate($request->input('per_page', 15))
            ->withQueryString();

        ActivityLog::create([
            'user_id'     => Auth::id(),
            'action_type' => 'estimate_view',
            'description' => 'Admin viewed estimates list',
            'ip_address'  => $request->ip(),
        ]);

        return Inertia::render('admin/estimates/view', [
            'userDetails' => Auth::user(),
            'estimates'     => $estimates,
            'filters'       => $request->only(['status', 'working_group_id', 'search', 'per_page']),
            'workingGroups' => WorkingGroup::where('status', 'active')->orderBy('name')->get(),
        ]);
    }

    public function addEstimate()
    {
        ActivityLog::create([
            'user_id'     => Auth::id(),
            'action_type' => 'estimate_add',
            'description' => 'Admin viewed add estimate form',
            'ip_address'  => request()->ip(),
        ]);

        // 2) Fetch all active working groups (with their products, if needed)
        $workingGroups = WorkingGroup::where('status', 'active')
            ->with('products')
            ->get();

        if (Estimate::count() === 0) {
            // If no estimates exist, start suffix from 1600
            $suffix = 1600;
        } else {
            //otherwise, get the last added estimate id and get suffix as it's last four digits
            $lastEstimate = Estimate::latest()->first();
            $suffix = (int) substr($lastEstimate->reference, -4) + 1;
        }
        $newEstimateNumber = date('Ymd') . $suffix;
        

        return Inertia::render('admin/estimates/addE', [
            'userDetails'    => Auth::user(),
            'workingGroups'  => $workingGroups,
            'newEstimateNumber' => $newEstimateNumber,
        ]);

    }
}
