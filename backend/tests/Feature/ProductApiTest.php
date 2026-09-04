<?php

namespace Tests\Feature;

use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class ProductApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Role::findOrCreate('admin');
        Role::findOrCreate('cashier');
        $admin = User::factory()->create();
        $admin->assignRole('admin');
        Sanctum::actingAs($admin);
    }

    public function test_it_lists_products_as_json(): void
    {
        $product = Product::query()->create($this->productData());

        $this->getJson('/api/products')
            ->assertOk()
            ->assertJsonPath('data.0.id', $product->id)
            ->assertJsonPath('data.0.name', 'Mineral Water');
    }

    public function test_it_retrieves_one_product_as_json(): void
    {
        $product = Product::query()->create($this->productData());

        $this->getJson("/api/products/{$product->id}")
            ->assertOk()
            ->assertJsonPath('data.id', $product->id)
            ->assertJsonPath('data.name', 'Mineral Water');
    }

    public function test_it_creates_a_product(): void
    {
        $this->postJson('/api/products', $this->productData())
            ->assertCreated()
            ->assertJsonPath('message', 'Product created successfully.')
            ->assertJsonPath('data.name', 'Mineral Water');

        $this->assertDatabaseHas('products', ['name' => 'Mineral Water']);
    }

    public function test_it_updates_a_product(): void
    {
        $product = Product::query()->create($this->productData());

        $this->putJson("/api/products/{$product->id}", [
            'name' => 'Premium Mineral Water',
            'price' => 40,
        ])->assertOk()
            ->assertJsonPath('message', 'Product updated successfully.')
            ->assertJsonPath('data.name', 'Premium Mineral Water')
            ->assertJsonPath('data.price', 40);

        $this->assertDatabaseHas('products', [
            'id' => $product->id,
            'name' => 'Premium Mineral Water',
        ]);
    }

    public function test_it_deletes_a_product_and_returns_json(): void
    {
        $product = Product::query()->create($this->productData());

        $this->deleteJson("/api/products/{$product->id}")
            ->assertOk()
            ->assertJsonPath('message', 'Product deleted successfully.')
            ->assertJsonPath('data.id', $product->id);

        $this->assertDatabaseMissing('products', ['id' => $product->id]);
    }

    public function test_it_returns_json_404_for_a_missing_product(): void
    {
        $this->getJson('/api/products/999999')
            ->assertNotFound()
            ->assertJsonPath('message', 'Product not found.');
    }

    public function test_it_rejects_invalid_product_data(): void
    {
        $this->postJson('/api/products', ['name' => ''])
            ->assertUnprocessable()
            ->assertJsonValidationErrors([
                'name',
                'price',
                'status',
                'stock',
                'unit',
                'min_stock',
            ]);
    }

    public function test_cashier_cannot_change_inventory(): void
    {
        $cashier = User::factory()->create();
        $cashier->assignRole('cashier');
        Sanctum::actingAs($cashier);

        $this->postJson('/api/products', $this->productData())
            ->assertForbidden()
            ->assertJsonPath('message', 'Only administrators can manage inventory.');
    }

    private function productData(): array
    {
        return [
            'name' => 'Mineral Water',
            'description' => 'Natural minerals and electrolytes',
            'price' => 35,
            'status' => 'available',
            'stock' => 7,
            'unit' => '5 Gallon',
            'min_stock' => 10,
        ];
    }
}
