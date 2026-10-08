<?php

namespace Tests\Feature;

use App\Models\Product;
use App\Models\Sale;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class HostedInitializationTest extends TestCase
{
    use RefreshDatabase;

    public function test_new_hosted_database_requires_explicit_passwords(): void
    {
        config(['pos.initial_admin_password' => null, 'pos.initial_cashier_password' => null]);
        $this->artisan('pos:initialize-hosted')->assertExitCode(1);
        $this->assertDatabaseCount('users', 0);
    }

    public function test_hosted_initialization_seeds_once_and_preserves_changes(): void
    {
        config(['pos.initial_admin_password' => 'hosted-admin-test', 'pos.initial_cashier_password' => 'hosted-cashier-test']);
        $this->artisan('pos:initialize-hosted')->assertSuccessful();
        $admin = User::where('username', 'admin')->firstOrFail();
        $this->assertTrue(Hash::check('hosted-admin-test', $admin->password));
        $this->assertTrue(Hash::check('hosted-cashier-test', User::where('username', 'walton')->firstOrFail()->password));
        $this->assertSame(50, Sale::count());
        $gallon = Product::where('unit', 'Standard blue gallon')->firstOrFail();
        $this->assertEquals(50, $gallon->stock);
        $gallon->update(['stock' => 42]);
        config(['pos.initial_admin_password' => 'changed-env-password']);
        $this->artisan('pos:initialize-hosted')->assertSuccessful();
        $this->assertEquals(42, $gallon->fresh()->stock);
        $this->assertSame($admin->password, $admin->fresh()->password);
        $this->assertSame(50, Sale::count());
    }
}
