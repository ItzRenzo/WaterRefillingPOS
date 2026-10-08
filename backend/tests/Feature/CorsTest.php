<?php

namespace Tests\Feature;

use Tests\TestCase;

class CorsTest extends TestCase
{
    public function test_hosted_frontend_can_preflight_a_bearer_token_request(): void
    {
        config(['cors.allowed_origins' => ['https://water-pos.vercel.app']]);

        $this->withHeaders([
            'Origin' => 'https://water-pos.vercel.app',
            'Access-Control-Request-Method' => 'POST',
            'Access-Control-Request-Headers' => 'authorization,content-type',
        ])->options('/api/sales')
            ->assertNoContent()
            ->assertHeader('Access-Control-Allow-Origin', 'https://water-pos.vercel.app')
            ->assertHeaderMissing('Access-Control-Allow-Credentials');
    }

    public function test_api_response_allows_the_configured_frontend(): void
    {
        config(['cors.allowed_origins' => ['https://water-pos.vercel.app']]);

        $this->withHeaders(['Origin' => 'https://water-pos.vercel.app'])
            ->getJson('/api/health')
            ->assertOk()
            ->assertHeader('Access-Control-Allow-Origin', 'https://water-pos.vercel.app');
    }

    public function test_unconfigured_origin_is_not_allowed(): void
    {
        config(['cors.allowed_origins' => [
            'https://water-pos.vercel.app',
            'https://pos.example.com',
        ]]);

        $this->withHeaders(['Origin' => 'https://other.vercel.app'])
            ->getJson('/api/health')
            ->assertOk()
            ->assertHeaderMissing('Access-Control-Allow-Origin');
    }

    public function test_single_allowed_origin_is_not_replaced_by_an_unconfigured_origin(): void
    {
        config(['cors.allowed_origins' => ['https://water-pos.vercel.app']]);

        $this->withHeaders(['Origin' => 'https://other.vercel.app'])
            ->getJson('/api/health')
            ->assertOk()
            ->assertHeader('Access-Control-Allow-Origin', 'https://water-pos.vercel.app');
    }
}
