<?php

namespace App\Http\Controllers;

use App\Http\Requests\ExpenseFilterRequest;
use App\Services\ExpenseQuery;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

/** Calculates exact totals in PostgreSQL instead of adding money in JavaScript. */
class SummaryController extends Controller
{
    public function __invoke(ExpenseFilterRequest $request, ExpenseQuery $queries): JsonResponse
    {
        return DB::transaction(function () use ($request, $queries) {
            // Nested transactions inherit their caller's isolation (including test transactions).
            if (DB::transactionLevel() === 1) {
                DB::statement('SET TRANSACTION ISOLATION LEVEL REPEATABLE READ');
            }
            $query = $queries->build($request->validated());
            $totals = (clone $query)->selectRaw('COUNT(*) AS count, COALESCE(SUM(amount), 0) AS total, COALESCE(AVG(amount), 0) AS average')->first();
            $breakdown = (clone $query)->join('categories', 'categories.id', '=', 'expenses.category_id')
                ->selectRaw('categories.id, categories.name, categories.color, SUM(expenses.amount) AS total, COUNT(*) AS count')
                ->groupBy('categories.id', 'categories.name', 'categories.color')->orderByDesc('total')->get();

            return response()->json(['data' => [
                'currency' => config('expenses.currency'), 'count' => (int) $totals->count,
                'total' => (string) $totals->total, 'average' => (string) $totals->average,
                'category_count' => $breakdown->count(), 'by_category' => $breakdown,
            ]]);
        });
    }
}
