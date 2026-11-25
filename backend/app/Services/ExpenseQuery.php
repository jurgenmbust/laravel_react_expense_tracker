<?php

namespace App\Services;

use App\Models\Expense;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Builder;

/** Shares filters between the list, totals and category breakdown. */
class ExpenseQuery
{
    public function build(array $filters): Builder
    {
        $query = Expense::query();
        if (! empty($filters['month'])) {
            $start = CarbonImmutable::createFromFormat('!Y-m', $filters['month']);
            $query->whereBetween('spent_on', [$start->startOfMonth()->toDateString(), $start->endOfMonth()->toDateString()]);
        }
        if (! empty($filters['category_id'])) {
            $query->where('category_id', $filters['category_id']);
        }
        if (! empty($filters['search'])) {
            // Escape SQL wildcards so a search is treated as plain text.
            $search = str_replace(['!', '%', '_'], ['!!', '!%', '!_'], mb_strtolower($filters['search']));
            $query->whereRaw("LOWER(title) LIKE ? ESCAPE '!'", ['%'.$search.'%']);
        }

        return $query;
    }
}
