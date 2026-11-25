<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Expense;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/** Exercises real PostgreSQL, validation, pagination and API contracts. */
class ExpenseApiTest extends TestCase
{
    use RefreshDatabase;

    protected function beforeRefreshingDatabase(): void
    {
        if (config('database.default') !== 'pgsql' || ! str_ends_with(config('database.connections.pgsql.database'), '_test')) {
            throw new \RuntimeException('Tests require a separate PostgreSQL database ending in _test.');
        }
    }

    private function category(): Category
    {
        return Category::create(['name' => 'Alimentación', 'color' => '#6375cf']);
    }

    private function input(int $categoryId): array
    {
        return ['title' => 'Compra semanal', 'amount' => '1250.25', 'spent_on' => '2026-11-25', 'category_id' => $categoryId, 'notes' => 'Verduras'];
    }

    public function test_complete_expense_crud(): void
    {
        $category = $this->category();
        $response = $this->postJson('/api/expenses', $this->input($category->id))->assertCreated()->assertJsonPath('data.amount', '1250.25');
        $id = $response->json('data.id');
        $this->getJson("/api/expenses/$id")->assertOk()->assertJsonPath('data.category.name', 'Alimentación');
        $updated = [...$this->input($category->id), 'title' => 'Compra actualizada', 'amount' => '1500.00'];
        $this->putJson("/api/expenses/$id", $updated)->assertOk()->assertJsonPath('data.title', 'Compra actualizada');
        $this->assertDatabaseHas('expenses', ['id' => $id, 'amount' => '1500.00']);
        $this->deleteJson("/api/expenses/$id")->assertNoContent();
        $this->getJson("/api/expenses/$id")->assertNotFound();
    }

    public function test_invalid_input_returns_field_errors(): void
    {
        $this->postJson('/api/expenses', ['title' => ' ', 'amount' => '-1.001', 'spent_on' => 'invalid', 'category_id' => 999])
            ->assertUnprocessable()->assertJsonValidationErrors(['title', 'amount', 'spent_on', 'category_id']);
        $this->assertDatabaseCount('expenses', 0);
    }

    public function test_filters_pagination_sort_and_literal_search(): void
    {
        $category = $this->category();
        Expense::create($this->input($category->id));
        Expense::create([...$this->input($category->id), 'title' => 'Otra compra', 'amount' => '10.00']);
        Expense::create([...$this->input($category->id), 'spent_on' => '2026-10-05']);
        $this->getJson('/api/expenses?month=2026-11&per_page=1&sort=amount&direction=asc&category_id='.$category->id)
            ->assertOk()->assertJsonPath('meta.total', 2)->assertJsonPath('meta.last_page', 2)->assertJsonPath('data.0.amount', '10.00');
        $this->getJson('/api/expenses?month=2026-11&search=semanal')->assertJsonPath('meta.total', 1);
        $this->getJson('/api/expenses?search=%25')->assertJsonPath('meta.total', 0);
        $this->getJson('/api/expenses?sort=invalid')->assertUnprocessable();
        $this->getJson('/api/expenses?per_page=999')->assertUnprocessable();
    }

    public function test_summary_uses_exact_decimal_totals_and_filters(): void
    {
        $category = $this->category();
        Expense::create([...$this->input($category->id), 'amount' => '0.10']);
        Expense::create([...$this->input($category->id), 'amount' => '0.20']);
        Expense::create([...$this->input($category->id), 'amount' => '50.00', 'spent_on' => '2026-10-05']);
        $this->getJson('/api/summary?month=2026-11')->assertOk()->assertJsonPath('data.total', '0.30')
            ->assertJsonPath('data.count', 2)->assertJsonPath('data.by_category.0.total', '0.30')->assertJsonPath('data.currency', 'CRC');
    }

    public function test_empty_summary_and_list_are_real_zeros(): void
    {
        $this->getJson('/api/summary')->assertOk()->assertJsonPath('data.count', 0)->assertJsonCount(0, 'data.by_category');
        $this->getJson('/api/expenses')->assertOk()->assertJsonCount(0, 'data');
    }

    public function test_category_crud(): void
    {
        $id = $this->postJson('/api/categories', ['name' => 'Hogar', 'color' => '#5da88c'])->assertCreated()->json('data.id');
        $this->getJson('/api/categories')->assertOk()->assertJsonPath('data.0.expenses_count', 0);
        $this->getJson("/api/categories/$id")->assertOk();
        $this->putJson("/api/categories/$id", ['name' => 'Casa', 'color' => '#64748b'])->assertOk()->assertJsonPath('data.name', 'Casa');
        $this->deleteJson("/api/categories/$id")->assertNoContent();
    }

    public function test_category_names_are_unique_ignoring_case(): void
    {
        Category::create(['name' => 'Hogar', 'color' => '#64748b']);
        $this->postJson('/api/categories', ['name' => 'hogar', 'color' => '#64748b'])->assertConflict();
    }

    public function test_used_category_cannot_be_deleted(): void
    {
        $category = $this->category();
        Expense::create($this->input($category->id));
        $this->deleteJson('/api/categories/'.$category->id)->assertConflict()->assertJsonPath('message', 'Mueve o elimina sus gastos antes de eliminar la categoría.');
        $this->assertDatabaseCount('categories', 1);
    }

    public function test_database_rejects_zero_amount(): void
    {
        $category = $this->category();
        $this->expectException(QueryException::class);
        Expense::create([...$this->input($category->id), 'amount' => '0.00']);
    }

    public function test_missing_records_and_invalid_category_color(): void
    {
        $this->getJson('/api/expenses/99999')->assertNotFound()->assertJsonPath('message', 'Registro o ruta no encontrados.');
        $this->postJson('/api/categories', ['name' => 'Hogar', 'color' => 'not-a-color'])->assertUnprocessable()->assertJsonValidationErrors('color');
    }
}
