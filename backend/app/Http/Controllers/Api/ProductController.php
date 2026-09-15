<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Sale;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ProductController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json([
            'data' => Product::query()->latest('id')->get(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $this->ensureAdmin($request);
        $product = Product::query()->create($this->validatedData($request));

        return response()->json([
            'message' => 'Product created successfully.',
            'data' => $product,
        ], 201);
    }

    public function show(Product $product): JsonResponse
    {
        return response()->json(['data' => $product]);
    }

    public function update(Request $request, Product $product): JsonResponse
    {
        $this->ensureAdmin($request);
        $product->update($this->validatedData($request, true));

        return response()->json([
            'message' => 'Product updated successfully.',
            'data' => $product->fresh(),
        ]);
    }

    public function destroy(Request $request, Product $product): JsonResponse
    {
        $this->ensureAdmin($request);

        if (Sale::query()->where('product_id', $product->id)->exists()) {
            return response()->json([
                'message' => 'Products with recorded sales cannot be deleted. Mark the product unavailable instead.',
            ], 409);
        }

        $deletedProduct = $product->only(['id', 'name']);
        $product->delete();

        return response()->json([
            'message' => 'Product deleted successfully.',
            'data' => $deletedProduct,
        ]);
    }

    private function validatedData(Request $request, bool $partial = false): array
    {
        $required = $partial ? 'sometimes' : 'required';

        return $request->validate([
            'name' => [$required, 'string', 'max:100'],
            'description' => ['nullable', 'string'],
            'price' => [$required, 'numeric', 'min:0'],
            'status' => [$required, Rule::in(['available', 'unavailable'])],
            'stock' => [$required, 'integer', 'min:0'],
            'unit' => [$required, 'string', 'max:50'],
            'min_stock' => [$required, 'integer', 'min:0'],
        ]);
    }

    private function ensureAdmin(Request $request): void
    {
        abort_unless($request->user()->hasRole('admin'), 403, 'Only administrators can manage inventory.');
    }
}
