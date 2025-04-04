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


use function Illuminate\Log\log;

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

    public function products()
    {

        // Log the activity for viewing the products list.
        ActivityLog::create([
            'user_id'     => Auth::id(),
            'action_type' => 'products_view',
            'description' => 'Admin viewed products list.',
            'ip_address'  => request()->ip(),
        ]);

        // Render the Inertia view for products.
        return Inertia::render('admin/productsView', [
            'userDetails' => Auth::user(),
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

        // Render the Inertia view for adding a new product.
        return Inertia::render('admin/addProduct', [
            'userDetails' => Auth::user(),
        ]);
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
}
