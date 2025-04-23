<?php

namespace App\Providers;

use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Storage;
use Illuminate\Filesystem\FilesystemAdapter;
use League\Flysystem\Filesystem;
use Masbug\Flysystem\GoogleDriveAdapter;

use Google\Client as GoogleClient;
use Google\Service\Drive as GoogleServiceDrive;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Vite::prefetch(concurrency: 3);
        Storage::extend('google', function ($app, $config) {
            // 1. build Google client
            $client = new GoogleClient();
            $client->setClientId($config['clientId']);
            $client->setClientSecret($config['clientSecret']);
            $client->refreshToken($config['refreshToken']);

            // 2. build the Drive service & adapter
            $service = new GoogleServiceDrive($client);
            $adapter = new GoogleDriveAdapter($service, $config['folder'] ?? '/');

            // 3. create a Flysystem filesystem
            $flysystem = new Filesystem($adapter);

            // 4. wrap it in Laravel’s FilesystemAdapter
            return new FilesystemAdapter($flysystem, $adapter, $config);
        });
    }
}
