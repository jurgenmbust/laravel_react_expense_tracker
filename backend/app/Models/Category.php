<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/** Groups expenses and provides their display color. */
class Category extends Model
{
    protected $fillable = ['name', 'color'];

    public function expenses(): HasMany
    {
        return $this->hasMany(Expense::class);
    }
}
