<?php
// app/Services/Admin/AdminDashboardMetricsService.php

namespace App\Services\Admin;

use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class AdminDashboardMetricsService
{
    /**
     * Updated to respect:
     * - users.role_id -> roles.{name|slug}
     * - users.working_group_id
     * - users.status (e.g., 'active')
     * - users.email_verified_at
     */
    public function computeTopMetrics_2025_08(int $days = 7, array $includes = ['users','groups','activity','orders','revenue'], ?string $tz = null): array
    {
        $days = max(1, min(90, $days));
        $tz   = $tz ?: config('app.timezone', 'UTC');
        $nowTz = Carbon::now($tz);
        $since = $nowTz->copy()->subDays($days - 1)->startOfDay();

        $out = [
            'totalUsers'     => 0,
            'adminUsers'     => 0,
            'userUsers'      => 0,     // designers + managers + staff (non-admin backend)
            'workingGroups'  => 0,
            'dailyCustomers' => 0,
            'ordersToday'    => null,
            'revenueToday'   => null,
            'trends'         => ['users'=>[], 'orders'=>[], 'revenue'=>[]],

            // Optional extras (front-end can ignore if not used)
            'activeUsers'    => 0,
            'verifiedUsers'  => 0,
            'designers'      => 0,
            'managers'       => 0,
            'staff'          => 0,
        ];

        // ===== USERS & ROLES =====
        if (in_array('users', $includes, true) && Schema::hasTable('users')) {
            $out['totalUsers'] = DB::table('users')->count();

            // Active & verified (if columns exist)
            if (Schema::hasColumn('users', 'status')) {
                $out['activeUsers'] = DB::table('users')->where('status', 'active')->count();
            }
            if (Schema::hasColumn('users', 'email_verified_at')) {
                $out['verifiedUsers'] = DB::table('users')->whereNotNull('email_verified_at')->count();
            }

            // Role detection via users.role_id -> roles.{name|slug}
            $hasRoleId   = Schema::hasColumn('users', 'role_id');
            $hasRolesTbl = Schema::hasTable('roles');
            $roleCol     = null;
            if ($hasRolesTbl) {
                // Prefer 'slug', else 'name'
                $roleCol = Schema::hasColumn('roles', 'slug') ? 'slug' : (Schema::hasColumn('roles', 'name') ? 'name' : null);
            }

            if ($hasRoleId && $hasRolesTbl && $roleCol) {
                // Pull role_id for common role labels (admin/designer/manager/staff)
                $roleMap = DB::table('roles')->select('id', $roleCol.' as label')->get()
                    ->pluck('id', 'label')->mapWithKeys(function ($id, $label) {
                        return [mb_strtolower($label) => $id];
                    });

                $adminId    = $roleMap['admin']    ?? null;
                $designerId = $roleMap['designer'] ?? null;
                $managerId  = $roleMap['manager']  ?? null;
                $staffId    = $roleMap['staff']    ?? null;

                if ($adminId !== null) {
                    $out['adminUsers'] = DB::table('users')->where('role_id', $adminId)->count();
                }

                if ($designerId !== null) {
                    $out['designers'] = DB::table('users')->where('role_id', $designerId)->count();
                }
                if ($managerId !== null) {
                    $out['managers'] = DB::table('users')->where('role_id', $managerId)->count();
                }
                if ($staffId !== null) {
                    $out['staff'] = DB::table('users')->where('role_id', $staffId)->count();
                }

                // userUsers = non-admin backend (designer + manager + staff) if IDs are known
                if ($designerId !== null || $managerId !== null || $staffId !== null) {
                    $ids = array_values(array_filter([$designerId, $managerId, $staffId], fn($v) => $v !== null));
                    $out['userUsers'] = count($ids)
                        ? DB::table('users')->whereIn('role_id', $ids)->count()
                        : 0;
                } else {
                    // Fallback: everyone minus admins (if we at least know admin)
                    if ($adminId !== null) {
                        $out['userUsers'] = max(0, $out['totalUsers'] - $out['adminUsers']);
                    } else {
                        $out['userUsers'] = $out['totalUsers'];
                    }
                }
            } else {
                // Fallbacks if you keep older columns
                if (Schema::hasColumn('users', 'role')) {
                    $out['adminUsers'] = DB::table('users')->where('role', 'admin')->count();
                    $out['userUsers']  = DB::table('users')->whereIn('role', ['designer','manager','staff'])->count();
                } elseif (Schema::hasColumn('users', 'is_admin')) {
                    $out['adminUsers'] = DB::table('users')->where('is_admin', 1)->count();
                    $out['userUsers']  = $out['totalUsers'] - $out['adminUsers'];
                } else {
                    $out['userUsers'] = $out['totalUsers'];
                }
            }

            // Registration trend (last N days) — timezone aware if possible
            if (Schema::hasColumn('users', 'created_at')) {
                // MySQL CONVERT_TZ for TZ correction when supported
                $supportsConvertTz = true; // set false if your DB doesn't support time zones
                if ($supportsConvertTz) {
                    $trend = DB::table('users')
                        ->selectRaw('DATE(CONVERT_TZ(created_at, @@session.time_zone, ?)) as d, COUNT(*) as c', [$tz])
                        ->where('created_at', '>=', $since->copy()->timezone('UTC'))
                        ->groupBy('d')->orderBy('d')->pluck('c')->toArray();
                } else {
                    $trend = DB::table('users')
                        ->selectRaw('DATE(created_at) as d, COUNT(*) as c')
                        ->where('created_at', '>=', $since->copy()->timezone(config('app.timezone')))
                        ->groupBy('d')->orderBy('d')->pluck('c')->toArray();
                }
                $out['trends']['users'] = $this->normalizeSeriesLength($trend, $days);
            }
        }

        // ===== WORKING GROUPS =====
        if (in_array('groups', $includes, true) && Schema::hasTable('working_groups')) {
            $out['workingGroups'] = DB::table('working_groups')->count();
        }

        // ===== DAILY ACTIVE via activity_logs =====
        if (in_array('activity', $includes, true) && Schema::hasTable('activity_logs')) {
            $out['dailyCustomers'] = DB::table('activity_logs')
                ->when(Schema::hasColumn('activity_logs', 'created_at'), fn($q) => $q->whereDate('created_at', $nowTz->toDateString()))
                ->distinct('user_id')->count('user_id');
        }

        // ===== ORDERS / REVENUE (optional) =====
        if (in_array('orders', $includes, true) && Schema::hasTable('orders')) {
            $out['ordersToday'] = DB::table('orders')
                ->when(Schema::hasColumn('orders', 'created_at'), fn($q) => $q->whereDate('created_at', $nowTz->toDateString()))
                ->count();

            // order trend last N days
            $orderTrend = DB::table('orders')
                ->selectRaw('DATE(created_at) as d, COUNT(*) as c')
                ->where('created_at', '>=', $since->copy()->timezone(config('app.timezone')))
                ->groupBy('d')->orderBy('d')->pluck('c')->toArray();
            $out['trends']['orders'] = $this->normalizeSeriesLength($orderTrend, $days);

            if (in_array('revenue', $includes, true)) {
                if (Schema::hasTable('payments')) {
                    $out['revenueToday'] = (float) DB::table('payments')
                        ->when(Schema::hasColumn('payments', 'paid_at'), fn($q) => $q->whereDate('paid_at', $nowTz->toDateString()))
                        ->sum('amount');

                    if (Schema::hasColumn('payments', 'paid_at')) {
                        $revTrend = DB::table('payments')
                            ->selectRaw('DATE(paid_at) as d, SUM(amount) as s')
                            ->where('paid_at', '>=', $since->copy()->timezone(config('app.timezone')))
                            ->groupBy('d')->orderBy('d')->pluck('s')->toArray();
                        $out['trends']['revenue'] = $this->normalizeSeriesLength($revTrend, $days);
                    }
                } elseif (Schema::hasColumn('orders', 'total') && Schema::hasColumn('orders', 'status')) {
                    $out['revenueToday'] = (float) DB::table('orders')
                        ->whereDate('created_at', $nowTz->toDateString())
                        ->whereIn('status', ['paid','completed'])
                        ->sum('total');
                }
            }
        }

        return $out;
    }

    private function normalizeSeriesLength(array $values, int $days): array
    {
        if (count($values) === $days) return $values;
        if (count($values) >  $days) return array_slice($values, -$days);
        return array_merge(array_fill(0, $days - count($values), 0), $values);
    }
}
