<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/** Stores one expense. Decimal casts preserve money precision in JSON. */
class Expense extends Model
{
    protected $fillable = ['title', 'amount', 'spent_on', 'category_id', 'notes'];

    protected function casts(): array
    {
        return ['amount' => 'decimal:2', 'spent_on' => 'date:Y-m-d'];
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }
}
