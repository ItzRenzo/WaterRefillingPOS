<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
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
        $product->update($this->validatedData($request, true));

        return response()->json([
            'message' => 'Product updated successfully.',
            'data' => $product->fresh(),
        ]);
    }

    public function destroy(Product $product): JsonResponse
    {
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
}
