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
            // build the Google client
            $client = new GoogleClient();
            $client->setClientId($config['clientId']);
            $client->setClientSecret($config['clientSecret']);
            $client->setAccessType('offline');
            $client->setPrompt('consent');
            $client->setScopes([GoogleServiceDrive::DRIVE_FILE]);

            // **use** your refresh token to fetch a fresh access token
            if (empty($config['refreshToken'])) {
                throw new \InvalidArgumentException('GOOGLE_DRIVE_REFRESH_TOKEN is not set in your .env');
            }
            $accessToken = $client->fetchAccessTokenWithRefreshToken($config['refreshToken']);
            $client->setAccessToken($accessToken);

            // build the Drive service & adapter
            $service = new GoogleServiceDrive($client);
            // Pass folderId *and* “true” to treat it as an ID
            $adapter  = new GoogleDriveAdapter($service, $config['folderId'], true);
            $flysys   = new Filesystem($adapter);
            return new FilesystemAdapter($flysys, $adapter, $config);
        });

        // register the Drive service so we can inject it
        $this->app->singleton(GoogleServiceDrive::class, function ($app) {
            $config = config('filesystems.disks.google');

            $client = new GoogleClient();
            $client->setClientId($config['clientId']);
            $client->setClientSecret($config['clientSecret']);
            $client->setAccessType('offline');
            $client->setPrompt('consent');
            $client->setScopes([GoogleServiceDrive::DRIVE_FILE]);
            $client->fetchAccessTokenWithRefreshToken($config['refreshToken']);
            $client->fetchAccessTokenWithRefreshToken($config['refreshToken']);

            return new GoogleServiceDrive($client);
        });
    }
}
