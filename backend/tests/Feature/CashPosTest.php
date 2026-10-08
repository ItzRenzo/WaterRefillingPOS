<?php

namespace Tests\Feature;

use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class CashPosTest extends TestCase
{
    use RefreshDatabase;

    private function signIn(string $role): User
    {
        Role::findOrCreate($role);
        $user = User::factory()->create();
        $user->assignRole($role);
        Sanctum::actingAs($user);
        return $user;
    }
    private function product(): Product
    {
        return Product::query()->create(['name' => 'Purified Water - Blue Gallon', 'unit' => 'Standard blue gallon', 'price' => 25.25, 'stock' => 10, 'min_stock' => 2, 'status' => 'available']);
    }
    private function payment(Product $product): array
    {
        return ['product_id' => $product->id, 'quantity' => 2, 'cash_received' => 100, 'payment_method' => 'cash', 'checkout_key' => (string) Str::uuid()];
    }
    public function test_cash_checkout_calculates_change_and_retry_does_not_deduct_twice(): void
    {
        $this->signIn('cashier');
        $product = $this->product();
        $payment = $this->payment($product);
        $id = $this->postJson('/api/sales', $payment)->assertCreated()->assertJsonPath('data.total', 50.5)->assertJsonPath('data.cash_received', 100)->assertJsonPath('data.change_due', 49.5)->assertJsonPath('product.stock', 8)->json('data.id');
        $this->postJson('/api/sales', $payment)->assertCreated()->assertJsonPath('data.id', $id)->assertJsonPath('product.stock', 8);
        $this->assertDatabaseCount('sales', 1);
    }
    public function test_underpayment_and_non_cash_payment_leave_inventory_unchanged(): void
    {
        $this->signIn('cashier');
        $product = $this->product();
        $this->postJson('/api/sales', array_replace($this->payment($product), ['cash_received' => 50]))->assertUnprocessable()->assertJsonValidationErrors('cash_received');
        $this->postJson('/api/sales', array_replace($this->payment($product), ['payment_method' => 'card']))->assertUnprocessable()->assertJsonValidationErrors('payment_method');
        $this->assertSame(10, $product->fresh()->stock);
        $this->assertDatabaseCount('sales', 0);
    }
    public function test_admin_restock_is_additive_and_cashier_can_observe_its_version(): void
    {
        $admin = $this->signIn('admin');
        $product = $this->product();
        $id = $this->postJson('/api/stocks', ['product_id' => $product->id, 'quantity' => 7, 'note' => 'Morning batch'])->assertCreated()->assertJsonPath('product.stock', 17)->assertJsonPath('data.stock_after', 17)->assertJsonPath('data.added_by', $admin->name)->json('data.id');
        $this->postJson('/api/stocks', ['product_id' => $product->id, 'quantity' => 3])->assertCreated()->assertJsonPath('product.stock', 20);
        $this->signIn('cashier');
        $this->getJson('/api/stocks')->assertOk()->assertJsonPath('version', $id + 1)->assertJsonCount(2, 'data');
        $this->postJson('/api/stocks', ['product_id' => $product->id, 'quantity' => 1])->assertForbidden();
        $this->assertSame(20, $product->fresh()->stock);
    }
    public function test_invalid_restock_does_not_modify_stock(): void
    {
        $this->signIn('admin');
        $product = $this->product();
        foreach ([0, -1, 1.5] as $quantity) {
            $this->postJson('/api/stocks', ['product_id' => $product->id, 'quantity' => $quantity])->assertUnprocessable();
        }
        $this->assertSame(10, $product->fresh()->stock);
        $this->assertDatabaseCount('stock_entries', 0);
    }
    public function test_seed_catalog_has_only_two_active_containers_and_fifty_cash_sales(): void
    {
        $this->seed();
        $this->assertSame(2, Product::query()->where('status', 'available')->count());
        $this->assertDatabaseCount('sales', 50);
        $this->assertSame(0, \App\Models\Sale::query()->whereDate('created_at', today())->count());
        $this->seed();
        $this->assertDatabaseCount('sales', 50);
        $this->assertDatabaseCount('stock_entries', 2);
        $this->postJson('/api/login', ['username' => 'admin', 'password' => 'admin123'])->assertOk()->assertJsonPath('user.role', 'admin');
        $this->postJson('/api/login', ['username' => 'walton', 'password' => 'cashier123'])->assertOk()->assertJsonPath('user.name', 'Walton')->assertJsonPath('user.role', 'cashier');
    }
}
