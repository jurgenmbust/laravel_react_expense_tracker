<?php

namespace App\Http\Controllers;

use App\Http\Requests\ExpenseFilterRequest;
use App\Http\Requests\ExpenseRequest;
use App\Http\Resources\ExpenseResource;
use App\Models\Expense;
use App\Services\ExpenseQuery;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

/** Handles CRUD using validated input and explicit response resources. */
class ExpenseController extends Controller
{
    public function index(ExpenseFilterRequest $request, ExpenseQuery $queries): AnonymousResourceCollection
    {
        $filters = $request->validated();
        $expenses = $queries->build($filters)->with('category')
            ->orderBy($filters['sort'] ?? 'spent_on', $filters['direction'] ?? 'desc')->orderByDesc('id')
            ->paginate($filters['per_page'] ?? 10)->withQueryString();

        return ExpenseResource::collection($expenses);
    }

    public function store(ExpenseRequest $request): JsonResponse
    {
        $expense = Expense::create($request->validated())->load('category');

        return (new ExpenseResource($expense))->response()->setStatusCode(201);
    }

    public function show(Expense $expense): ExpenseResource
    {
        return new ExpenseResource($expense->load('category'));
    }

    public function update(ExpenseRequest $request, Expense $expense): ExpenseResource
    {
        $expense->update($request->validated());

        return new ExpenseResource($expense->refresh()->load('category'));
    }

    public function destroy(Expense $expense): Response
    {
        $expense->delete();

        return response()->noContent();
    }
}
