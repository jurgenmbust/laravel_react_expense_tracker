<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** Defines the expense JSON contract independently from database columns. */
class ExpenseResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id, 'title' => $this->title, 'amount' => $this->amount,
            'spent_on' => $this->spent_on->format('Y-m-d'), 'notes' => $this->notes,
            'category' => ['id' => $this->category->id, 'name' => $this->category->name, 'color' => $this->category->color],
            'created_at' => $this->created_at->toISOString(),
        ];
    }
}
