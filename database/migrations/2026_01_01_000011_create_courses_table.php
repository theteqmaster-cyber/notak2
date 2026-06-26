<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('courses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('semester_id')->constrained()->cascadeOnDelete();
            $table->string('name');           // e.g. "Database Systems"
            $table->string('code')->nullable(); // e.g. "CS301"
            $table->string('lecturer')->nullable();
            $table->text('description')->nullable();
            $table->string('color', 7)->default('#4F6EF7'); // hex color for UI card accent
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('courses');
    }
};
