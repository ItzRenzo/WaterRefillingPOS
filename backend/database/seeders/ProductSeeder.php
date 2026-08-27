<?php

namespace Database\Seeders;

use App\Models\Product;
use Illuminate\Database\Seeder;

class ProductSeeder extends Seeder
{
    public function run(): void
    {
        $products = [
            ['name' => 'Mineral Water', 'description' => 'Natural minerals and electrolytes', 'price' => 35, 'stock' => 7, 'unit' => '5 Gallon'],
            ['name' => 'Purified Water', 'description' => 'Clean and pure drinking water', 'price' => 25, 'stock' => 9, 'unit' => '5 Gallon'],
            ['name' => 'Alkaline Water', 'description' => 'Higher pH for balanced health', 'price' => 45, 'stock' => 20, 'unit' => '5 Gallon'],
            ['name' => 'Distilled Water', 'description' => 'Pure H2O with no minerals', 'price' => 30, 'stock' => 19, 'unit' => '5 Gallon'],
            ['name' => 'Mineral Water Bottle', 'description' => 'Natural minerals and electrolytes', 'price' => 15, 'stock' => 48, 'unit' => '500 mL bottle'],
            ['name' => 'Purified Water Bottle', 'description' => 'Clean and pure drinking water', 'price' => 12, 'stock' => 50, 'unit' => '500 mL bottle'],
            ['name' => 'Alkaline Water Bottle', 'description' => 'Higher pH for balanced health', 'price' => 18, 'stock' => 49, 'unit' => '500 mL bottle'],
            ['name' => 'Distilled Water Bottle', 'description' => 'Pure H2O with no minerals', 'price' => 14, 'stock' => 50, 'unit' => '500 mL bottle'],
        ];

        foreach ($products as $product) {
            Product::query()->updateOrCreate(
                ['name' => $product['name']],
                $product + ['status' => 'available', 'min_stock' => 10],
            );
        }
    }
}
