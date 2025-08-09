<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Facades\Response;
use App\Models\Product;
use App\Models\Category;

class SitemapController extends Controller
{
    public function index()
    {
        $xml = Cache::remember('sitemap.xml', now()->addMinutes(60), function () {
            $urls = [];

            // === Static public pages ===
            $urls[] = [
                'loc'        => route('home'),
                'lastmod'    => now()->toAtomString(),
                'changefreq' => 'daily',
                'priority'   => '1.0',
            ];
            $urls[] = [
                'loc'        => route('products.all'),
                'changefreq' => 'daily',
                'priority'   => '0.9',
            ];
            $urls[] = [
                'loc'        => route('cart'),
                'changefreq' => 'weekly',
                'priority'   => '0.6',
            ];
            $urls[] = [
                'loc'        => route('checkout'),
                'changefreq' => 'weekly',
                'priority'   => '0.6',
            ];
            $urls[] = [
                'loc'        => url('/login'), // auth routes
                'changefreq' => 'monthly',
                'priority'   => '0.5',
            ];
            $urls[] = [
                'loc'        => url('/register'),
                'changefreq' => 'monthly',
                'priority'   => '0.5',
            ];

            // === Categories ===
            Category::query()
                ->where('active', 1)
                ->select('id', 'name', 'updated_at')
                ->orderBy('id')
                ->chunk(500, function ($chunk) use (&$urls) {
                    foreach ($chunk as $cat) {
                        // Keep query param names identical to frontend
                        $loc = URL::to('/products/all') . '?' . http_build_query([
                            'category_id'   => $cat->id,
                            // Use original name (URL-encoded). If you prefer prettier URLs, use Str::slug($cat->name)
                            'category_name' => $cat->name,
                        ]);

                        $urls[] = [
                            'loc'        => $loc,
                            'lastmod'    => optional($cat->updated_at)->toAtomString(),
                            'changefreq' => 'weekly',
                            'priority'   => '0.8',
                        ];
                    }
                });

            // === Products ===
            Product::query()
                ->where('status', 'published')
                ->orderBy('id')
                ->chunk(500, function ($chunk) use (&$urls) {
                    foreach ($chunk as $p) {
                        $urls[] = [
                            'loc'        => route('productDetail', [
                                'id'   => $p->id,
                                'name' => str()->slug($p->name),
                            ]),
                            'lastmod'    => optional($p->updated_at)->toAtomString(),
                            'changefreq' => 'weekly',
                            'priority'   => '0.7',
                        ];
                    }
                });

            // Build XML
            $xml = '<?xml version="1.0" encoding="UTF-8"?>';
            $xml .= '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';
            foreach ($urls as $u) {
                $xml .= '<url>';
                $xml .= '<loc>' . e($u['loc']) . '</loc>';
                if (!empty($u['lastmod'])) {
                    $xml .= '<lastmod>' . $u['lastmod'] . '</lastmod>';
                }
                if (!empty($u['changefreq'])) {
                    $xml .= '<changefreq>' . $u['changefreq'] . '</changefreq>';
                }
                if (!empty($u['priority'])) {
                    $xml .= '<priority>' . $u['priority'] . '</priority>';
                }
                $xml .= '</url>';
            }
            $xml .= '</urlset>';

            return $xml;
        });

        return Response::make($xml, 200, ['Content-Type' => 'application/xml; charset=UTF-8']);
    }
}
