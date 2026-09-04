<?php

namespace Tests\Feature;

use App\Models\Product;
use App\Models\Sale;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class AuthAndSaleApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Role::findOrCreate('admin');
        Role::findOrCreate('cashier');
    }

    public function test_user_can_login_and_the_backend_returns_the_accounts_role(): void
    {
        $cashier = User::factory()->create([
            'name' => 'Rico Dela Cruz',
            'username' => 'cashier',
            'password' => Hash::make('cashier123'),
        ]);
        $cashier->assignRole('cashier');

        $this->postJson('/api/login', [
            'username' => 'cashier',
            'password' => 'cashier123',
        ])->assertOk()
            ->assertJsonPath('user.name', 'Rico Dela Cruz')
            ->assertJsonPath('user.role', 'cashier')
            ->assertJsonStructure(['token']);
    }

    public function test_login_rejects_an_incorrect_password(): void
    {
        $cashier = User::factory()->create([
            'username' => 'cashier',
            'password' => Hash::make('cashier123'),
        ]);
        $cashier->assignRole('cashier');

        $this->postJson('/api/login', [
            'username' => 'cashier',
            'password' => 'incorrect-password',
        ])->assertUnauthorized();
    }

    public function test_cashier_sale_records_transaction_and_deducts_stock(): void
    {
        $cashier = $this->userWithRole('cashier', ['name' => 'Rico Dela Cruz']);
        $product = Product::query()->create($this->productData(stock: 10));
        Sanctum::actingAs($cashier);

        $this->postJson('/api/sales', [
            'product_id' => $product->id,
            'quantity' => 3,
        ])->assertCreated()
            ->assertJsonPath('data.quantity', 3)
            ->assertJsonPath('data.total', 105)
            ->assertJsonPath('product.stock', 7);

        $this->assertDatabaseHas('products', ['id' => $product->id, 'stock' => 7]);
        $this->assertDatabaseHas('sales', [
            'product_id' => $product->id,
            'cashier_id' => $cashier->id,
            'quantity' => 3,
        ]);
    }

    public function test_sale_rejects_insufficient_stock_without_partial_changes(): void
    {
        $cashier = $this->userWithRole('cashier');
        $product = Product::query()->create($this->productData(stock: 2));
        Sanctum::actingAs($cashier);

        $this->postJson('/api/sales', [
            'product_id' => $product->id,
            'quantity' => 3,
        ])->assertUnprocessable()
            ->assertJsonValidationErrors('quantity');

        $this->assertDatabaseHas('products', ['id' => $product->id, 'stock' => 2]);
        $this->assertSame(0, Sale::query()->count());
    }

    public function test_admin_cannot_process_a_cashier_sale(): void
    {
        Sanctum::actingAs($this->userWithRole('admin'));
        $product = Product::query()->create($this->productData());

        $this->postJson('/api/sales', [
            'product_id' => $product->id,
            'quantity' => 1,
        ])->assertForbidden();
    }

    public function test_authenticated_users_can_list_todays_sales(): void
    {
        $cashier = $this->userWithRole('cashier');
        $product = Product::query()->create($this->productData());
        Sanctum::actingAs($cashier);

        $this->postJson('/api/sales', ['product_id' => $product->id, 'quantity' => 2])
            ->assertCreated();

        $this->getJson('/api/sales')
            ->assertOk()
            ->assertJsonPath('summary.count', 1)
            ->assertJsonPath('summary.revenue', 70)
            ->assertJsonPath('data.0.cashier_name', $cashier->name);
    }

    private function productData(int $stock = 10): array
    {
        return [
            'name' => 'Mineral Water',
            'description' => 'Natural minerals and electrolytes',
            'price' => 35,
            'status' => 'available',
            'stock' => $stock,
            'unit' => '5 Gallon',
            'min_stock' => 5,
        ];
    }

    private function userWithRole(string $role, array $attributes = []): User
    {
        $user = User::factory()->create($attributes);
        $user->assignRole($role);

        return $user;
    }
}
