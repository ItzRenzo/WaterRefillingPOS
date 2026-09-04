<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Sale;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class SaleController extends Controller
{
    public function index(): JsonResponse
    {
        $sales = Sale::query()
            ->whereDate('created_at', today())
            ->latest()
            ->get();

        return response()->json([
            'data' => $sales,
            'summary' => [
                'count' => $sales->count(),
                'revenue' => (float) $sales->sum('total'),
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        abort_unless($request->user()->hasRole('cashier'), 403, 'Only cashiers can process sales.');

        $validated = $request->validate([
            'product_id' => ['required', 'integer', 'exists:products,id'],
            'quantity' => ['required', 'integer', 'min:1'],
        ]);

        $sale = DB::transaction(function () use ($validated, $request): Sale {
            $product = Product::query()->lockForUpdate()->findOrFail($validated['product_id']);
            $quantity = (int) $validated['quantity'];

            if ($product->status !== 'available' || $product->stock < $quantity) {
                throw ValidationException::withMessages([
                    'quantity' => 'Not enough stock is available for this sale.',
                ]);
            }

            $product->decrement('stock', $quantity);

            return Sale::query()->create([
                'product_id' => $product->id,
                'cashier_id' => $request->user()->id,
                'product_name' => $product->name,
                'cashier_name' => $request->user()->name,
                'quantity' => $quantity,
                'unit_price' => $product->price,
                'total' => $product->price * $quantity,
            ]);
        });

        return response()->json([
            'message' => 'Sale completed successfully.',
            'data' => $sale,
            'product' => Product::query()->findOrFail($sale->product_id),
        ], 201);
    }
}
