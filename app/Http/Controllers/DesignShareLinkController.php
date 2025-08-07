<?php

namespace App\Http\Controllers;

use App\Models\DesignShareLink;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Carbon;
use Throwable;


class DesignShareLinkController extends Controller
{
    /**
     * Create a secure share link
     */
    public function store(Request $request, Product $product)
    {
        Log::info('Creating share link', [
            'user_id'    => Auth::id(),
            'product_id' => $product->id,
            'expires_at' => $request->expires_at,
            'view_limit' => $request->view_limit,
        ]);

        $request->validate([
            'password'   => 'nullable|string|min:4|max:255',
            'expires_at' => 'nullable|date|after:now',
            'view_limit' => 'nullable|integer|min:1',
        ]);

        DB::beginTransaction();

        try {
            $token = Str::random(40);

            $shareLink = DesignShareLink::create([
                'product_id'    => $product->id,
                'token'         => $token,
                'password_hash' => $request->filled('password') ? Hash::make($request->password) : null,
                'expires_at'    => $request->filled('expires_at') ? Carbon::parse($request->expires_at) : null,
                'view_limit'    => $request->view_limit ?? null,
                'created_by'    => Auth::id(),
            ]);

            DB::commit();

            return response()->json([
                'message' => 'Secure link created successfully.',
                'link'    => url("/share/{$token}")
            ]);
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('Error creating share link', ['error' => $e]);

            return response()->json([
                'message' => 'Failed to create share link.',
                'error'   => $e->getMessage()
            ], 500);
        }
    }

    public function publicLinkInfo($token)
    {
        $shareLink = DesignShareLink::with('product.design', 'creator')
            ->where('token', $token)
            ->first();

        if (!$shareLink) {
            return response()->json(['message' => 'Invalid or expired link.'], 404);
        }

        // Expiration check
        if ($shareLink->expires_at && now()->greaterThan($shareLink->expires_at)) {
            return response()->json(['message' => 'This link has expired.'], 410);
        }

        // View limit check
        if ($shareLink->view_limit && $shareLink->view_count >= $shareLink->view_limit) {
            return response()->json(['message' => 'This link has reached its view limit.'], 410);
        }

        // Password required?
        if ($shareLink->password_hash) {
            return response()->json([
                'requires_password' => true,
                'token' => $token
            ]);
        }

        // No password? Return full data
        return $this->jsonDesignData($shareLink);
    }


    protected function jsonDesignData(DesignShareLink $shareLink)
    {
        try {
            DB::transaction(function () use ($shareLink) {
                $shareLink->increment('view_count');
            });
        } catch (\Throwable $e) {
            Log::error("Failed to increment view count", ['error' => $e->getMessage()]);
        }

        $product = $shareLink->product;

        $creator = $shareLink->creator;
        $creatorGroupId = $creator->working_group_id;

        // Fallback: if no group, treat as 'public' working group (null group)
        $designs = $product->design()
            ->where('access_type', 'working_group')
            ->where('status', 'active')
            ->where(function ($query) use ($creatorGroupId) {
                if ($creatorGroupId === null) {
                    $query->whereNull('working_group_id');
                } else {
                    $query->where('working_group_id', $creatorGroupId);
                }
            })
            ->get();

        return response()->json([
            'product' => [
                'id'          => $product->id,
                'name'        => $product->name,
                'description' => $product->meta_description,
            ],
            'designs' => $designs,
            'shared_by' => [
                'name' => $creator->name
            ],
            'views' => $shareLink->view_count,
            'expires_at' => $shareLink->expires_at,
            'requires_password' => false,
        ]);
    }



    /**
     * Show shared design page (password prompt if needed)
     */
    public function show($token)
    {
        $shareLink = DesignShareLink::where('token', $token)->first();

        if (!$shareLink) {
            return abort(404, 'Link not found');
        }

        // Expiration check
        if ($shareLink->expires_at && now()->greaterThan($shareLink->expires_at)) {
            return view('shared.expired', ['reason' => 'expired']);
        }

        // View limit check
        if ($shareLink->view_limit && $shareLink->view_count >= $shareLink->view_limit) {
            return view('shared.expired', ['reason' => 'limit']);
        }

        // Password protection
        if ($shareLink->password_hash) {
            return view('shared.password', ['token' => $token]);
        }

        // View directly
        return $this->renderDesigns($shareLink);
    }


    /**
     * Handle password submission
     */
    public function access(Request $request, $token)
    {
        $request->validate([
            'password' => 'required|string',
        ]);

        $shareLink = DesignShareLink::where('token', $token)->first();

        if (!$shareLink) {
            return abort(404);
        }

        if (!Hash::check($request->password, $shareLink->password_hash)) {
            return back()->withErrors(['password' => 'Incorrect password']);
        }

        return $this->renderDesigns($shareLink);
    }

    /**
     * Render shared designs and increment view count
     */
    protected function renderDesigns(DesignShareLink $shareLink)
    {
        try {
            DB::transaction(function () use ($shareLink) {
                $shareLink->increment('view_count');
            });
        } catch (Throwable $e) {
            Log::error("View count failed", ['error' => $e->getMessage()]);
        }

        $product = $shareLink->product()->with('designs')->first();

        return view('shared.view', [
            'product'   => $product,
            'designs'   => $product->designs,
            'shareLink' => $shareLink,
        ]);
    }

    public function verifyPassword(Request $request, $token)
    {
        $request->validate([
            'password' => 'required|string',
        ]);

        $shareLink = DesignShareLink::with('product.design', 'creator')
            ->where('token', $token)
            ->first();

        if (!$shareLink) {
            return response()->json(['message' => 'Invalid or expired link.'], 404);
        }

        if (!Hash::check($request->password, $shareLink->password_hash)) {
            return response()->json(['message' => 'Incorrect password.'], 403);
        }

        // Password correct – return full data
        return $this->jsonDesignData($shareLink);
    }
}
