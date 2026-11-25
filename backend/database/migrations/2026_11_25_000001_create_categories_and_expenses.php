<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

// Decimal money stays exact in PostgreSQL and uses strings in JSON.
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('categories', function (Blueprint $table) {
            $table->id();
            $table->string('name', 80);
            $table->string('color', 7)->default('#64748b');
            $table->timestamps();
        });
        DB::statement('CREATE UNIQUE INDEX categories_name_unique ON categories (LOWER(name))');
        Schema::create('expenses', function (Blueprint $table) {
            $table->id();
            $table->string('title', 150);
            $table->decimal('amount', 12, 2);
            $table->date('spent_on');
            $table->foreignId('category_id')->constrained()->restrictOnDelete();
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->index('spent_on');
            $table->index('category_id');
        });
        DB::statement('ALTER TABLE expenses ADD CONSTRAINT expenses_amount_positive CHECK (amount > 0)');
    }

    public function down(): void
    {
        Schema::dropIfExists('expenses');
        Schema::dropIfExists('categories');
    }
};
