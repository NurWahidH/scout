<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void {
        Schema::create('users', function (Blueprint $table) {
            $table->bigIncrements('id');
            
            // Identitas
            $table->string('name')->nullable();
            $table->string('username', 50)->unique()->nullable();
            $table->string('email', 255)->unique();
            $table->string('password_hash', 255); // Catatan: Laravel standar biasanya menggunakan 'password'
            $table->string('office_phone', 30)->nullable();
            $table->boolean('is_active')->default(true);
            
            $table->string('role', 20)->default('sales'); 
            
            // Timestamps & Soft Deletes
            $table->timestampTz('created_at')->useCurrent();
            $table->timestampTz('updated_at')->useCurrent()->useCurrentOnUpdate();
            
            // Menambahkan kolom deleted_at untuk Soft Deletes
            $table->softDeletes(); 
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void {
        Schema::dropIfExists('users');
    }
};