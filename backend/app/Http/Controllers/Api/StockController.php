<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class StockController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(['data' => DB::table('stock_entries')->orderByDesc('id')->limit(100)->get(), 'version' => (int) DB::table('stock_entries')->max('id')]);
    }
    public function store(Request $request): JsonResponse
    {
        abort_unless($request->user()->hasRole('admin'), 403, 'Only administrators can add stock.');
        $values = $request->validate(['product_id' => ['required', 'integer', 'exists:products,id'], 'quantity' => ['required', 'integer', 'min:1', 'max:100000'], 'note' => ['nullable', 'string', 'max:255']]);
        $result = DB::transaction(function () use ($values, $request): array {
            $product = Product::query()->lockForUpdate()->findOrFail($values['product_id']);
            abort_unless($product->status === 'available', 422, 'This container is unavailable.');
            $product->increment('stock', $values['quantity']);
            $id = DB::table('stock_entries')->insertGetId(['product_id' => $product->id, 'user_id' => $request->user()->id, 'product_name' => $product->name, 'added_by' => $request->user()->name, 'quantity' => $values['quantity'], 'stock_after' => $product->fresh()->stock, 'note' => $values['note'] ?? null, 'created_at' => now(), 'updated_at' => now()]);
            return ['data' => DB::table('stock_entries')->find($id), 'product' => $product->fresh()];
        });
        return response()->json($result, 201);
    }
}
