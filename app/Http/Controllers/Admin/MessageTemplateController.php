<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\MessageTemplate;
use App\Services\TemplateRenderer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class MessageTemplateController extends Controller
{
    protected $renderer;

    public function __construct(TemplateRenderer $renderer)
    {
        $this->renderer = $renderer;
    }

    /**
     * Display listing of templates
     */
    public function index(Request $request)
    {
        $query = MessageTemplate::query()
            ->with(['creator:id,name', 'updater:id,name'])
            ->orderBy('created_at', 'desc');

        // Filters
        if ($request->filled('type')) {
            $query->byType($request->type);
        }

        if ($request->filled('category')) {
            $query->byCategory($request->category);
        }

        if ($request->filled('trigger_event')) {
            $query->byTrigger($request->trigger_event);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%")
                  ->orWhere('subject', 'like', "%{$search}%");
            });
        }

        if ($request->has('is_active')) {
            $query->where('is_active', (bool) $request->is_active);
        }

        $templates = $query->paginate(20);

        return Inertia::render('admin/templates/index', [
            'templates' => $templates,
            'filters' => $request->only(['type', 'category', 'trigger_event', 'search', 'is_active']),
            'availableVariables' => $this->renderer->getAvailableVariables('all'),
            'userDetails' => Auth::user(),
        ]);
    }

    /**
     * Get template details
     */
    public function show(MessageTemplate $template)
    {
        $template->load(['creator:id,name', 'updater:id,name']);

        return response()->json([
            'template' => $template,
            'variables' => $template->extractVariables(),
            'available_variables' => $this->renderer->getAvailableVariables('all'),
        ]);
    }

    /**
     * Store a new template
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'type' => 'required|in:email,whatsapp',
            'name' => 'required|string|max:255|unique:message_templates,name',
            'subject' => 'nullable|string|max:500',
            'body' => 'required|string',
            'description' => 'nullable|string',
            'trigger_event' => 'nullable|string|max:100',
            'category' => 'required|string|max:50',
            'variables' => 'nullable|array',
            'sample_data' => 'nullable|array',
            'is_active' => 'boolean',
        ]);

        DB::beginTransaction();
        try {
            $template = MessageTemplate::create([
                ...$validated,
                'created_by' => Auth::id(),
                'updated_by' => Auth::id(),
            ]);

            DB::commit();

            return response()->json([
                'message' => 'Template created successfully',
                'template' => $template->load(['creator:id,name']),
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to create template',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Update a template
     */
    public function update(Request $request, MessageTemplate $template)
    {
        if ($template->is_system) {
            return response()->json([
                'message' => 'System templates cannot be modified',
            ], 403);
        }

        $validated = $request->validate([
            'type' => 'sometimes|in:email,whatsapp',
            'name' => 'sometimes|string|max:255|unique:message_templates,name,' . $template->id,
            'subject' => 'nullable|string|max:500',
            'body' => 'sometimes|string',
            'description' => 'nullable|string',
            'trigger_event' => 'nullable|string|max:100',
            'category' => 'sometimes|string|max:50',
            'variables' => 'nullable|array',
            'sample_data' => 'nullable|array',
            'is_active' => 'boolean',
        ]);

        DB::beginTransaction();
        try {
            $template->update([
                ...$validated,
                'updated_by' => Auth::id(),
            ]);

            DB::commit();

            return response()->json([
                'message' => 'Template updated successfully',
                'template' => $template->fresh()->load(['creator:id,name', 'updater:id,name']),
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Failed to update template',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Delete a template
     */
    public function destroy(MessageTemplate $template)
    {
        if ($template->is_system) {
            return response()->json([
                'message' => 'System templates cannot be deleted',
            ], 403);
        }

        try {
            $template->delete();

            return response()->json([
                'message' => 'Template deleted successfully',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to delete template',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Duplicate a template
     */
    public function duplicate(MessageTemplate $template, Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:message_templates,name',
        ]);

        try {
            $newTemplate = $template->duplicate($validated['name']);

            return response()->json([
                'message' => 'Template duplicated successfully',
                'template' => $newTemplate->load(['creator:id,name']),
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to duplicate template',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Preview a template with sample data
     */
    public function preview(MessageTemplate $template, Request $request)
    {
        $customData = $request->input('data', []);
        
        if (empty($customData)) {
            $preview = $this->renderer->preview($template);
        } else {
            $preview = $this->renderer->render($template, $customData);
            $preview['variables'] = $template->extractVariables();
        }

        return response()->json($preview);
    }

    /**
     * Toggle template active status
     */
    public function toggleActive(MessageTemplate $template)
    {
        $template->update([
            'is_active' => !$template->is_active,
            'updated_by' => Auth::id(),
        ]);

        return response()->json([
            'message' => 'Template status updated',
            'is_active' => $template->is_active,
        ]);
    }

    /**
     * Get available variables for templates
     */
    public function variables()
    {
        return response()->json([
            'variables' => $this->renderer->getAvailableVariables('all'),
            'grouped' => [
                'order' => $this->renderer->getAvailableVariables('order'),
                'customer' => $this->renderer->getAvailableVariables('customer'),
                'payment_request' => $this->renderer->getAvailableVariables('payment_request'),
                'company' => $this->renderer->getAvailableVariables('company'),
            ],
        ]);
    }
}

