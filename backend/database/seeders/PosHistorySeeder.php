<?php

namespace Database\Seeders;

use App\Models\Product;
use App\Models\Sale;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class PosHistorySeeder extends Seeder
{
    public function run(): void
    {
        $cashier = User::query()->where('username', 'walton')->firstOrFail();
        $admin = User::query()->where('username', 'admin')->firstOrFail();
        $products = Product::query()->where('status', 'available')->orderBy('id')->get();
        foreach ($products as $product) {
            if (! DB::table('stock_entries')->where('product_id', $product->id)->exists()) {
                DB::table('stock_entries')->insert(['product_id' => $product->id, 'user_id' => $admin->id, 'product_name' => $product->name, 'added_by' => $admin->name, 'quantity' => $product->stock, 'stock_after' => $product->stock, 'note' => 'Sample opening inventory', 'created_at' => now()->subDays(31), 'updated_at' => now()->subDays(31)]);
            }
        }
        // Fifty historical examples; opening inventory is today's remaining stock.
        for ($i = 1; $i <= 50; $i++) {
            $product = $products[($i - 1) % $products->count()];
            $quantity = $i % 4 + 1;
            $total = $product->price * $quantity;
            $sale = Sale::query()->firstOrCreate(['checkout_key' => 'sample-history-'.$i], ['product_id' => $product->id, 'cashier_id' => $cashier->id, 'product_name' => $product->name, 'cashier_name' => $cashier->name, 'quantity' => $quantity, 'unit_price' => $product->price, 'total' => $total, 'cash_received' => ceil($total / 50) * 50, 'change_due' => ceil($total / 50) * 50 - $total, 'payment_method' => 'cash']);
            $timestamp = now()->subDays(1 + intdiv($i - 1, 2))->setTime(9 + $i % 8, $i % 60);
            $sale->forceFill(['created_at' => $timestamp, 'updated_at' => $timestamp])->save();
        }
        foreach ($products as $product) {
            $sold = Sale::query()->where('product_id', $product->id)->sum('quantity');
            $restocked = DB::table('stock_entries')->where('product_id', $product->id)->where(fn ($query) => $query->whereNull('note')->orWhere('note', '!=', 'Sample opening inventory'))->sum('quantity');
            $opening = $product->stock + $sold - $restocked;
            DB::table('stock_entries')->where('product_id', $product->id)->where('note', 'Sample opening inventory')->update(['quantity' => $opening, 'stock_after' => $opening]);
        }
    }
}
