<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Services\Admin\WidgetDataService;
use Illuminate\Http\JsonResponse;

class AdminWidgetApiController extends Controller
{
    public function salesWidgetV1(Request $r, WidgetDataService $svc): JsonResponse {
        return response()->json(['ok'=>true,'data'=>$svc->computeSalesSeries_2025_08((int)$r->query('days',7))]);
    }
    public function recentActivityWidgetV1(Request $r, WidgetDataService $svc): JsonResponse {
        return response()->json(['ok'=>true,'data'=>$svc->fetchRecentActivity_2025_08((int)$r->query('limit',20))]);
    }
    public function customersWidgetV1(Request $r, WidgetDataService $svc): JsonResponse {
        return response()->json(['ok'=>true,'data'=>$svc->fetchActiveCustomers_2025_08((int)$r->query('limit',10))]);
    }
    public function topProductsWidgetV1(Request $r, WidgetDataService $svc): JsonResponse {
        return response()->json(['ok'=>true,'data'=>$svc->topProducts_2025_08((int)$r->query('days',30),(int)$r->query('limit',10))]);
    }
    public function categoryBreakdownWidgetV1(Request $r, WidgetDataService $svc): JsonResponse {
        return response()->json(['ok'=>true,'data'=>$svc->categoryBreakdown_2025_08((int)$r->query('days',30))]);
    }
    public function lowStockWidgetV1(Request $r, WidgetDataService $svc): JsonResponse {
        return response()->json(['ok'=>true,'data'=>$svc->lowStock_2025_08((int)$r->query('limit',10))]);
    }
    public function paymentsByMethodWidgetV1(Request $r, WidgetDataService $svc): JsonResponse {
        return response()->json(['ok'=>true,'data'=>$svc->paymentsByMethod_2025_08((int)$r->query('days',30))]);
    }
    public function refundsWidgetV1(Request $r, WidgetDataService $svc): JsonResponse {
        return response()->json(['ok'=>true,'data'=>$svc->refunds_2025_08((int)$r->query('days',30))]);
    }
    public function shipmentsStatusWidgetV1(Request $r, WidgetDataService $svc): JsonResponse {
        return response()->json(['ok'=>true,'data'=>$svc->shipmentsStatus_2025_08((int)$r->query('days',7))]);
    }
    public function tasksWidgetV1(Request $r, WidgetDataService $svc): JsonResponse {
        return response()->json(['ok'=>true,'data'=>$svc->fetchTasks_2025_08($r->user(), (bool)$r->query('mine',true), $r->query('status'), (int)$r->query('limit',10))]);
    }
    public function calendarWidgetV1(Request $r, WidgetDataService $svc): JsonResponse {
        return response()->json(['ok'=>true,'data'=>$svc->fetchCalendarWindow_2025_08($r->query('from'), $r->query('to'))]);
    }
}
