<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

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
        RateLimiter::for('chat', function (Request $request): array {
            $response = fn (Request $request, array $headers) => response()->json([
                'message' => 'The assistant is receiving too many requests. Please wait a minute and try again.',
            ], 429, $headers);

            return [
                Limit::perMinute(5)->by('chat-user:'.$request->user()->id)->response($response),
                Limit::perMinute(max(1, (int) config('services.gemini.requests_per_minute')))
                    ->by('chat-project')->response($response),
            ];
        });
    }
}
