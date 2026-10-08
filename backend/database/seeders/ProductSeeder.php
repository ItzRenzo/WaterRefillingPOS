<?php

namespace Database\Seeders;

use App\Models\Product;
use Illuminate\Database\Seeder;

class ProductSeeder extends Seeder
{
    public function run(): void
    {
        $names = ['Purified Water - Blue Gallon', 'Purified Water - 500 mL Bottle'];
        // Preserve historical references while retiring the old sample catalog.
        Product::query()->whereNotIn('name', $names)->update(['status' => 'unavailable']);
        foreach ([['name' => $names[0], 'unit' => 'Standard blue gallon', 'price' => 30, 'stock' => 50], ['name' => $names[1], 'unit' => '500 mL plastic bottle', 'price' => 15, 'stock' => 120]] as $values) {
            Product::query()->firstOrCreate(['name' => $values['name']], $values + ['description' => 'Purified drinking water', 'status' => 'available', 'min_stock' => 20]);
        }
    }
}
