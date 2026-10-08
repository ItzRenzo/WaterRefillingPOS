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
            ->latest()
            ->limit(100)
            ->get();

        return response()->json([
            'data' => $sales,
            'summary' => [
                'count' => Sale::query()->whereDate('created_at', today())->count(),
                'revenue' => (float) Sale::query()->whereDate('created_at', today())->sum('total'),
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        abort_unless($request->user()->hasRole('cashier'), 403, 'Only cashiers can process sales.');

        $validated = $request->validate([
            'product_id' => ['required', 'integer', 'exists:products,id'],
            'quantity' => ['required', 'integer', 'min:1'],
            'cash_received' => ['required', 'numeric', 'min:0', 'max:1000000', 'decimal:0,2'],
            'payment_method' => ['required', 'in:cash'],
            'checkout_key' => ['required', 'uuid'],
        ]);

        $sale = DB::transaction(function () use ($validated, $request): Sale {
            $existing = Sale::query()->where('checkout_key', $validated['checkout_key'])->first();
            if ($existing) {
                abort_unless($existing->cashier_id === $request->user()->id && $existing->product_id === (int) $validated['product_id'] && $existing->quantity === (int) $validated['quantity'] && round($existing->cash_received * 100) === round($validated['cash_received'] * 100), 409, 'This checkout reference is already in use.');
                return $existing;
            }
            $product = Product::query()->lockForUpdate()->findOrFail($validated['product_id']);
            $quantity = (int) $validated['quantity'];
            $totalCents = (int) round($product->price * 100) * $quantity;
            $cashCents = (int) round($validated['cash_received'] * 100);
            if ($cashCents < $totalCents) {
                throw ValidationException::withMessages(['cash_received' => 'Cash received must cover the total amount.']);
            }

            if ($product->status !== 'available' || $product->stock < $quantity) {
                throw ValidationException::withMessages([
                    'quantity' => 'Not enough stock is available for this sale.',
                ]);
            }

            $updated = Product::query()->whereKey($product->id)->where('stock', '>=', $quantity)->decrement('stock', $quantity);
            if (! $updated) {
                throw ValidationException::withMessages(['quantity' => 'Stock changed. Refresh and try again.']);
            }

            return Sale::query()->create([
                'product_id' => $product->id,
                'cashier_id' => $request->user()->id,
                'product_name' => $product->name,
                'cashier_name' => $request->user()->name,
                'quantity' => $quantity,
                'unit_price' => $product->price,
                'total' => $totalCents / 100,
                'cash_received' => $cashCents / 100,
                'change_due' => ($cashCents - $totalCents) / 100,
                'payment_method' => 'cash',
                'checkout_key' => $validated['checkout_key'],
            ]);
        });

        return response()->json([
            'message' => 'Sale completed successfully.',
            'data' => $sale,
            'product' => Product::query()->findOrFail($sale->product_id),
        ], 201);
    }
}
