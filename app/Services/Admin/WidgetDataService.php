<?php

namespace App\Services\Admin;

use Carbon\Carbon;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class WidgetDataService
{
    // SALES: daily orders + revenue series for last N days
    public function computeSalesSeries_2025_08(int $days = 7): array
    {
        $today = Carbon::today();
        $start = $today->copy()->subDays($days - 1);

        $ordersSeries = array_fill(0, $days, 0);
        $revenueSeries = array_fill(0, $days, 0.0);

        if (Schema::hasTable('orders')) {
            $orders = DB::table('orders')
                ->when(Schema::hasColumn('orders', 'created_at'), fn($q) => $q->whereBetween('created_at', [$start, $today->copy()->endOfDay()]))
                ->selectRaw('DATE(created_at) as d, COUNT(*) as c')
                ->groupBy('d')
                ->orderBy('d')
                ->pluck('c', 'd')
                ->all();

            foreach ($orders as $date => $count) {
                $idx = Carbon::parse($date)->diffInDays($start);
                if ($idx >= 0 && $idx < $days) $ordersSeries[$idx] = (int) $count;
            }

            // revenue: prefer payments, else orders.total with paid/completed
            if (Schema::hasTable('payments')) {
                $revenue = DB::table('payments')
                    ->when(Schema::hasColumn('payments', 'paid_at'), fn($q) => $q->whereBetween('paid_at', [$start, $today->copy()->endOfDay()]))
                    ->selectRaw('DATE(paid_at) as d, SUM(amount) as s')
                    ->groupBy('d')->orderBy('d')->pluck('s', 'd')->all();

                foreach ($revenue as $date => $sum) {
                    $idx = Carbon::parse($date)->diffInDays($start);
                    if ($idx >= 0 && $idx < $days) $revenueSeries[$idx] = (float) $sum;
                }
            } elseif (Schema::hasColumn('orders', 'total') && Schema::hasColumn('orders', 'status')) {
                $revenue = DB::table('orders')
                    ->whereBetween('created_at', [$start, $today->copy()->endOfDay()])
                    ->whereIn('status', ['paid', 'completed'])
                    ->selectRaw('DATE(created_at) as d, SUM(total) as s')
                    ->groupBy('d')->orderBy('d')->pluck('s', 'd')->all();

                foreach ($revenue as $date => $sum) {
                    $idx = Carbon::parse($date)->diffInDays($start);
                    if ($idx >= 0 && $idx < $days) $revenueSeries[$idx] = (float) $sum;
                }
            }
        }

        // today snapshot
        $todayOrders = 0;
        $todayRevenue = 0.0;
        if (Schema::hasTable('orders')) {
            $todayOrders = DB::table('orders')->whereDate('created_at', $today)->count();
        }
        if (Schema::hasTable('payments') && Schema::hasColumn('payments', 'paid_at')) {
            $todayRevenue = (float) DB::table('payments')->whereDate('paid_at', $today)->sum('amount');
        }

        return [
            'labels'   => collect(range(0, $days - 1))->map(fn($i) => $start->copy()->addDays($i)->toDateString())->all(),
            'orders'   => $ordersSeries,
            'revenue'  => $revenueSeries,
            'today'    => ['orders' => $todayOrders, 'revenue' => $todayRevenue],
        ];
    }

    // RECENT ACTIVITY: last N entries from activity_logs
    public function fetchRecentActivity_2025_08(int $limit = 20): array
    {
        if (!Schema::hasTable('activity_logs')) return ['items' => []];

        $rows = DB::table('activity_logs')
            ->orderByDesc('created_at')
            ->limit($limit)
            ->get(['id', 'user_id', 'action', 'meta', 'created_at']);

        return [
            'items' => $rows->map(function ($r) {
                return [
                    'id'         => $r->id,
                    'user_id'    => $r->user_id,
                    'action'     => $r->action ?? 'activity',
                    'meta'       => $r->meta ? (is_string($r->meta) ? @json_decode($r->meta, true) ?: $r->meta : $r->meta) : null,
                    'created_at' => (string) $r->created_at,
                ];
            })->all()
        ];
    }

    // CUSTOMERS: top recently-active users (by activity_logs or last_login)
    public function fetchActiveCustomers_2025_08(int $limit = 10): array
    {
        // Prefer activity_logs if available
        if (Schema::hasTable('activity_logs') && Schema::hasTable('users')) {
            $rows = DB::table('activity_logs as a')
                ->join('users as u', 'u.id', '=', 'a.user_id')
                ->selectRaw('u.id, u.name, u.email, MAX(a.created_at) as last_seen')
                ->groupBy('u.id', 'u.name', 'u.email')
                ->orderByDesc('last_seen')
                ->limit($limit)->get();

            return [
                'items' => $rows->map(fn($r) => [
                    'id'        => $r->id,
                    'name'      => $r->name,
                    'email'     => $r->email,
                    'last_seen' => (string) $r->last_seen,
                ])->all()
            ];
        }

        // Fallback to users.created_at as “recent”
        if (Schema::hasTable('users')) {
            $rows = DB::table('users')
                ->orderByDesc('created_at')
                ->limit($limit)
                ->get(['id','name','email','created_at']);

            return [
                'items' => $rows->map(fn($r) => [
                    'id'        => $r->id,
                    'name'      => $r->name,
                    'email'     => $r->email,
                    'last_seen' => (string) $r->created_at,
                ])->all()
            ];
        }

        return ['items' => []];
    }

    // TASKS: user’s tasks or all, if table exists
    public function fetchTasks_2025_08(?Authenticatable $user, bool $mine = true, ?string $status = null, int $limit = 10): array
    {
        if (!Schema::hasTable('tasks')) return ['items' => []];

        $q = DB::table('tasks')->orderByDesc('created_at');
        if ($mine && $user && Schema::hasColumn('tasks', 'assigned_to')) {
            $q->where('assigned_to', $user->getAuthIdentifier());
        }
        if ($status && Schema::hasColumn('tasks', 'status')) {
            $q->where('status', $status);
        }
        $rows = $q->limit($limit)->get(['id','title','status','due_date','created_at']);
        return [
            'items' => $rows->map(fn($r) => [
                'id'         => $r->id,
                'title'      => $r->title ?? 'Task',
                'status'     => $r->status ?? 'open',
                'due_date'   => $r->due_date ? (string) $r->due_date : null,
                'created_at' => (string) $r->created_at,
            ])->all()
        ];
    }

    // CALENDAR: events between dates
    public function fetchCalendarWindow_2025_08(?string $from, ?string $to): array
    {
        if (!Schema::hasTable('events')) return ['items' => []];

        $fromDate = $from ? Carbon::parse($from)->startOfDay() : Carbon::today()->startOfMonth();
        $toDate   = $to   ? Carbon::parse($to)->endOfDay()   : Carbon::today()->endOfMonth();

        $rows = DB::table('events')
            ->whereBetween('start_at', [$fromDate, $toDate])
            ->orderBy('start_at')
            ->get(['id','title','start_at','end_at','location']);

        return [
            'items' => $rows->map(fn($r) => [
                'id'       => $r->id,
                'title'    => $r->title ?? 'Event',
                'start_at' => (string) $r->start_at,
                'end_at'   => $r->end_at ? (string) $r->end_at : null,
                'location' => $r->location ?? null,
            ])->all()
        ];
    }

    public function topProducts_2025_08(int $days = 30, int $limit = 10): array
    {
        $since = now()->subDays($days);
        // OrderItem + Product expected
        if (!Schema::hasTable('order_items') || !Schema::hasTable('products')) return ['items'=>[]];

        $rows = DB::table('order_items as oi')
            ->join('products as p','p.id','=','oi.product_id')
            ->join('orders as o','o.id','=','oi.order_id')
            ->where('o.created_at','>=',$since)
            ->selectRaw('p.id, p.name, SUM(oi.quantity) as qty, SUM(oi.total) as revenue')
            ->groupBy('p.id','p.name')
            ->orderByDesc('revenue')
            ->limit($limit)
            ->get();

        return ['items'=>$rows->map(fn($r)=>[
            'product_id'=>$r->id, 'name'=>$r->name, 'qty'=>(int)$r->qty, 'revenue'=>(float)$r->revenue
        ])->all()];
    }

    public function categoryBreakdown_2025_08(int $days = 30): array
    {
        $since = now()->subDays($days);
        if (!Schema::hasTable('order_items') || !Schema::hasTable('products') || !Schema::hasTable('categories')) return ['items'=>[]];

        $rows = DB::table('order_items as oi')
            ->join('products as p','p.id','=','oi.product_id')
            ->join('categories as c','c.id','=','p.category_id')
            ->join('orders as o','o.id','=','oi.order_id')
            ->where('o.created_at','>=',$since)
            ->selectRaw('c.id, c.name, SUM(oi.total) as revenue')
            ->groupBy('c.id','c.name')
            ->orderByDesc('revenue')->get();

        return ['items'=>$rows->map(fn($r)=>['category_id'=>$r->id,'name'=>$r->name,'revenue'=>(float)$r->revenue])->all()];
    }

    public function lowStock_2025_08(int $limit = 10): array
    {
        // Use ProductInventory or products.stock if available
        if (Schema::hasTable('product_inventory')) {
            $rows = DB::table('product_inventory as pi')
                ->join('products as p','p.id','=','pi.product_id')
                ->select('p.id','p.name','pi.stock','pi.reorder_level')
                ->orderBy('pi.stock')->limit($limit)->get();
        } elseif (Schema::hasTable('products') && Schema::hasColumn('products','stock')) {
            $rows = DB::table('products')->select('id','name','stock')->orderBy('stock')->limit($limit)->get();
        } else return ['items'=>[]];

        return ['items'=>$rows->map(function($r){
            return [
                'product_id'=>$r->id,
                'name'=>$r->name,
                'stock'=>(int)($r->stock ?? 0),
                'reorder_level'=>(int)($r->reorder_level ?? 0),
                'is_low'=> ($r->reorder_level ?? 0) > 0 ? ((int)$r->stock <= (int)$r->reorder_level) : ((int)$r->stock <= 5)
            ];
        })->all()];
    }

    public function paymentsByMethod_2025_08(int $days = 30): array
    {
        $since = now()->subDays($days);
        if (!Schema::hasTable('payments')) return ['items'=>[]];

        $rows = DB::table('payments')
            ->when(Schema::hasColumn('payments','paid_at'), fn($q)=>$q->where('paid_at','>=',$since))
            ->selectRaw('COALESCE(method,"unknown") as method, COUNT(*) as cnt, SUM(amount) as sum')
            ->groupBy('method')
            ->orderByDesc('sum')->get();

        return ['items'=>$rows->map(fn($r)=>[
            'method'=>$r->method, 'count'=>(int)$r->cnt, 'amount'=>(float)$r->sum
        ])->all()];
    }

    public function refunds_2025_08(int $days = 30): array
    {
        $since = now()->subDays($days);
        if (!Schema::hasTable('refunds')) return ['items'=>[]];

        $rows = DB::table('refunds')
            ->where('created_at','>=',$since)
            ->selectRaw('DATE(created_at) as d, COUNT(*) as cnt, SUM(amount) as sum')
            ->groupBy('d')->orderBy('d')->get();

        return [
            'labels'=>$rows->pluck('d')->all(),
            'counts'=>$rows->pluck('cnt')->map(fn($v)=>(int)$v)->all(),
            'amounts'=>$rows->pluck('sum')->map(fn($v)=>(float)$v)->all(),
        ];
    }

    public function shipmentsStatus_2025_08(int $days = 7): array
    {
        $since = now()->subDays($days);
        if (!Schema::hasTable('shipments')) return ['items'=>[]];

        $rows = DB::table('shipments')
            ->where('created_at','>=',$since)
            ->selectRaw('status, COUNT(*) as cnt')
            ->groupBy('status')->get();

        return ['items'=>$rows->map(fn($r)=>['status'=>$r->status ?? 'unknown','count'=>(int)$r->cnt])->all()];
    }
}
