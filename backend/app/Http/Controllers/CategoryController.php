<?php

namespace App\Http\Controllers;

use App\Http\Requests\CategoryRequest;
use App\Models\Category;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;

/** Manages categories without silently deleting their expenses. */
class CategoryController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(['data' => Category::withCount('expenses')->orderBy('name')->get()]);
    }

    public function store(CategoryRequest $request): JsonResponse
    {
        return response()->json(['data' => Category::create($request->validated())], 201);
    }

    public function show(Category $category): JsonResponse
    {
        return response()->json(['data' => $category->loadCount('expenses')]);
    }

    public function update(CategoryRequest $request, Category $category): JsonResponse
    {
        $category->update($request->validated());

        return response()->json(['data' => $category->refresh()->loadCount('expenses')]);
    }

    public function destroy(Category $category): Response|JsonResponse
    {
        if ($category->expenses()->exists()) {
            return response()->json(['message' => 'Mueve o elimina sus gastos antes de eliminar la categoría.'], 409);
        }
        $category->delete();

        return response()->noContent();
    }
}
