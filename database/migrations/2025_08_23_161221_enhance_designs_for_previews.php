<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('designs', function (Blueprint $table) {
            // Preview-only storage (keep existing image_url for BC, add explicit preview fields)
            if (!Schema::hasColumn('designs', 'preview_url')) {
                $table->string('preview_url', 512)->nullable()->after('image_url');
            }
            if (!Schema::hasColumn('designs', 'preview_width')) {
                $table->unsignedInteger('preview_width')->nullable()->after('preview_url');
            }
            if (!Schema::hasColumn('designs', 'preview_height')) {
                $table->unsignedInteger('preview_height')->nullable()->after('preview_width');
            }
            if (!Schema::hasColumn('designs', 'preview_bytes')) {
                $table->unsignedBigInteger('preview_bytes')->nullable()->after('preview_height');
            }

            // Access type normalization (enum is efficient on MySQL/Hostinger; keep default)
            if (!Schema::hasColumn('designs', 'access_type')) {
                $table->enum('access_type', ['public', 'working_group', 'restricted'])
                      ->default('working_group')
                      ->after('preview_bytes');
            } else {
                // If it's already a string, you can keep it; we won’t force-convert here to avoid downtime.
                // (Optional) If you know it’s safe, run a dedicated ALTER to enum later.
            }

            // Optional: ensure status exists & indexed (many UIs filter lists)
            if (!Schema::hasColumn('designs', 'status')) {
                $table->enum('status', ['active', 'archived'])->default('active')->after('access_type');
            }

            // Helpful indexes for speed (idempotent additions)
            $table->index(['product_id', 'status'], 'designs_product_status_idx');
            $table->index(['working_group_id', 'status'], 'designs_group_status_idx');
            $table->index(['access_type', 'status'], 'designs_access_status_idx');
        });
    }

    public function down(): void
    {
        Schema::table('designs', function (Blueprint $table) {
            // Drop indexes first (ignore if missing)
            $table->dropIndex('designs_product_status_idx');
            $table->dropIndex('designs_group_status_idx');
            $table->dropIndex('designs_access_status_idx');

            // Drop the preview fields
            if (Schema::hasColumn('designs', 'preview_bytes')) {
                $table->dropColumn('preview_bytes');
            }
            if (Schema::hasColumn('designs', 'preview_height')) {
                $table->dropColumn('preview_height');
            }
            if (Schema::hasColumn('designs', 'preview_width')) {
                $table->dropColumn('preview_width');
            }
            if (Schema::hasColumn('designs', 'preview_url')) {
                $table->dropColumn('preview_url');
            }

            // Roll back status only if we created it here
            if (Schema::hasColumn('designs', 'status')) {
                $table->dropColumn('status');
            }

            // Do not drop access_type; it likely existed and is referenced by app logic.
        });
    }
};
