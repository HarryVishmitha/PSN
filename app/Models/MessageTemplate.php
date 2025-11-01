<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class MessageTemplate extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'type',
        'name',
        'slug',
        'subject',
        'body',
        'description',
        'variables',
        'sample_data',
        'trigger_event',
        'category',
        'is_active',
        'is_system',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'variables' => 'array',
        'sample_data' => 'array',
        'is_active' => 'boolean',
        'is_system' => 'boolean',
    ];

    protected static function booted()
    {
        static::creating(function ($template) {
            if (empty($template->slug)) {
                $template->slug = Str::slug($template->name);
            }
        });

        static::updating(function ($template) {
            if ($template->isDirty('name') && empty($template->slug)) {
                $template->slug = Str::slug($template->name);
            }
        });
    }

    /**
     * Relationships
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updater(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    /**
     * Scopes
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeByType($query, string $type)
    {
        return $query->where('type', $type);
    }

    public function scopeByTrigger($query, string $trigger)
    {
        return $query->where('trigger_event', $trigger);
    }

    public function scopeByCategory($query, string $category)
    {
        return $query->where('category', $category);
    }

    public function scopeSystem($query)
    {
        return $query->where('is_system', true);
    }

    public function scopeCustom($query)
    {
        return $query->where('is_system', false);
    }

    /**
     * Helper Methods
     */
    public function isEmail(): bool
    {
        return $this->type === 'email';
    }

    public function isWhatsApp(): bool
    {
        return $this->type === 'whatsapp';
    }

    public function canBeDeleted(): bool
    {
        return !$this->is_system;
    }

    /**
     * Get all available variables from the template body
     */
    public function extractVariables(): array
    {
        preg_match_all('/\{\{([^}]+)\}\}/', $this->body, $matches);
        return array_unique($matches[1] ?? []);
    }

    /**
     * Render the template with provided data
     */
    public function render(array $data = []): string
    {
        $content = $this->body;

        foreach ($data as $key => $value) {
            // Handle nested objects/arrays
            if (is_array($value) || is_object($value)) {
                $value = (array) $value;
                foreach ($value as $nestedKey => $nestedValue) {
                    if (!is_array($nestedValue) && !is_object($nestedValue)) {
                        $content = str_replace(
                            '{{' . $key . '.' . $nestedKey . '}}',
                            $nestedValue,
                            $content
                        );
                    }
                }
            } else {
                $content = str_replace('{{' . $key . '}}', $value, $content);
            }
        }

        // Remove any remaining unrendered variables
        $content = preg_replace('/\{\{[^}]+\}\}/', '', $content);

        return $content;
    }

    /**
     * Render subject line with data (for emails)
     */
    public function renderSubject(array $data = []): string
    {
        if (!$this->subject) {
            return '';
        }

        $subject = $this->subject;

        foreach ($data as $key => $value) {
            if (is_array($value) || is_object($value)) {
                $value = (array) $value;
                foreach ($value as $nestedKey => $nestedValue) {
                    if (!is_array($nestedValue) && !is_object($nestedValue)) {
                        $subject = str_replace(
                            '{{' . $key . '.' . $nestedKey . '}}',
                            $nestedValue,
                            $subject
                        );
                    }
                }
            } else {
                $subject = str_replace('{{' . $key . '}}', $value, $subject);
            }
        }

        $subject = preg_replace('/\{\{[^}]+\}\}/', '', $subject);

        return $subject;
    }

    /**
     * Validate that all required variables are present in data
     */
    public function validateData(array $data): array
    {
        $required = $this->extractVariables();
        $missing = [];

        foreach ($required as $variable) {
            $keys = explode('.', $variable);
            $current = $data;
            $found = true;

            foreach ($keys as $key) {
                if (is_array($current) && array_key_exists($key, $current)) {
                    $current = $current[$key];
                } elseif (is_object($current) && property_exists($current, $key)) {
                    $current = $current->$key;
                } else {
                    $found = false;
                    break;
                }
            }

            if (!$found) {
                $missing[] = $variable;
            }
        }

        return $missing;
    }

    /**
     * Duplicate this template
     */
    public function duplicate(string $newName = null): self
    {
        $newTemplate = $this->replicate();
        $newTemplate->name = $newName ?? $this->name . ' (Copy)';
        $newTemplate->slug = Str::slug($newTemplate->name);
        $newTemplate->is_system = false;
        $newTemplate->created_by = auth()->id();
        $newTemplate->save();

        return $newTemplate;
    }
}
