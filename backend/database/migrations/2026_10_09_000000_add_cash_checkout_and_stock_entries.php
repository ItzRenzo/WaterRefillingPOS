<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('sales', function (Blueprint $table): void {
            $table->decimal('cash_received', 12, 2)->nullable();
            $table->decimal('change_due', 12, 2)->nullable();
            $table->string('payment_method')->default('cash');
            $table->string('checkout_key', 100)->nullable()->unique();
        });
        Schema::create('stock_entries', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('product_id')->constrained()->restrictOnDelete();
            $table->foreignId('user_id')->constrained('users')->restrictOnDelete();
            $table->string('product_name');
            $table->string('added_by');
            $table->unsignedInteger('quantity');
            $table->unsignedInteger('stock_after');
            $table->string('note')->nullable();
            $table->timestamps();
        });
    }
    public function down(): void
    {
        Schema::dropIfExists('stock_entries');
        Schema::table('sales', fn (Blueprint $table) => $table->dropColumn(['cash_received', 'change_due', 'payment_method', 'checkout_key']));
    }
};
