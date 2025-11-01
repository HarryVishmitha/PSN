<?php

namespace App\Console\Commands;

use App\Models\Order;
use App\Models\OrderEvent;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class MigrateOrderStatuses extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'orders:migrate-statuses {--dry-run : Run without making changes} {--force : Skip confirmation}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Migrate old order statuses to new status system';

    /**
     * Status mapping from old to new
     */
    protected array $statusMap = [
        'pending' => 'draft',
        'confirmed' => 'customer_approved',
        'cancelled' => 'cancelled',
        'returned' => 'cancelled', // Map returned to cancelled
        'estimating' => 'estimate_sent',
        'quoted' => 'estimate_sent',
        'awaiting_approval' => 'customer_approved',
        'production' => 'in_production',
        'ready_for_dispatch' => 'ready_for_delivery',
        'shipped' => 'completed',
        'completed' => 'completed',
        'on_hold' => 'on_hold',
    ];

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $dryRun = $this->option('dry-run');
        $force = $this->option('force');

        $this->info('Order Status Migration Tool');
        $this->newLine();

        // Get all unique statuses from orders
        $currentStatuses = DB::table('orders')
            ->select('status', DB::raw('COUNT(*) as count'))
            ->groupBy('status')
            ->get();

        if ($currentStatuses->isEmpty()) {
            $this->info('No orders found in database.');
            return 0;
        }

        // Display current status distribution
        $this->info('Current Status Distribution:');
        $this->table(['Status', 'Count', 'Will Migrate To'], $currentStatuses->map(function ($row) {
            return [
                $row->status,
                $row->count,
                $this->statusMap[$row->status] ?? '(No change)',
            ];
        })->toArray());

        $this->newLine();

        // Calculate what will be migrated
        $toMigrate = $currentStatuses->filter(function ($row) {
            return isset($this->statusMap[$row->status]) && $this->statusMap[$row->status] !== $row->status;
        });

        if ($toMigrate->isEmpty()) {
            $this->info('✅ All orders are already using the new status system!');
            return 0;
        }

        $totalToMigrate = $toMigrate->sum('count');
        $this->warn("📦 {$totalToMigrate} orders will be migrated.");

        if (!$force && !$this->confirm('Do you want to proceed?', true)) {
            $this->info('Migration cancelled.');
            return 0;
        }

        if ($dryRun) {
            $this->info('🔍 DRY RUN MODE - No changes will be made');
            $this->newLine();
        }

        $progressBar = $this->output->createProgressBar($totalToMigrate);
        $progressBar->start();

        $migrated = 0;
        $errors = 0;

        foreach ($this->statusMap as $oldStatus => $newStatus) {
            if ($oldStatus === $newStatus) {
                continue; // Skip if same
            }

            $orders = Order::where('status', $oldStatus)->get();

            foreach ($orders as $order) {
                try {
                    if (!$dryRun) {
                        DB::transaction(function () use ($order, $oldStatus, $newStatus) {
                            // Update order status
                            $order->update(['status' => $newStatus]);

                            // Log the migration in order_events
                            $order->addEvent('status_migrated', [
                                'message' => "Status migrated from '{$oldStatus}' to '{$newStatus}' by system migration.",
                                'old_status' => $oldStatus,
                                'new_status' => $newStatus,
                                'data' => [
                                    'migration_date' => now()->toIso8601String(),
                                    'migrated_by' => 'system',
                                ],
                                'visibility' => OrderEvent::VISIBILITY_ADMIN,
                            ]);
                        });
                    }

                    $migrated++;
                    $progressBar->advance();
                } catch (\Exception $e) {
                    $errors++;
                    $this->newLine();
                    $this->error("Failed to migrate order #{$order->id}: {$e->getMessage()}");
                }
            }
        }

        $progressBar->finish();
        $this->newLine(2);

        // Summary
        if ($dryRun) {
            $this->info("✅ DRY RUN COMPLETE");
            $this->info("Would have migrated {$totalToMigrate} orders.");
        } else {
            $this->info("✅ MIGRATION COMPLETE");
            $this->info("Successfully migrated: {$migrated} orders");
            
            if ($errors > 0) {
                $this->error("Errors encountered: {$errors}");
            }
        }

        $this->newLine();
        $this->info('New Status Distribution:');
        
        $newStatuses = DB::table('orders')
            ->select('status', DB::raw('COUNT(*) as count'))
            ->groupBy('status')
            ->get();

        $this->table(['Status', 'Count'], $newStatuses->map(function ($row) {
            return [$row->status, $row->count];
        })->toArray());

        return 0;
    }
}
