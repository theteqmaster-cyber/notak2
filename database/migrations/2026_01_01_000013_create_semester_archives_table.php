<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('semester_archives', function (Blueprint $table) {
            $table->id();
            $table->foreignId('semester_id')->constrained()->cascadeOnDelete();
            $table->foreignId('generated_by')->constrained('users')->cascadeOnDelete();
            $table->string('zip_key')->nullable();       // R2 object key for the zip file
            $table->string('zip_name')->nullable();      // filename for download
            $table->unsignedBigInteger('zip_size')->nullable();
            $table->json('manifest')->nullable();        // full metadata manifest
            $table->enum('status', ['pending', 'generating', 'ready', 'failed'])->default('pending');
            $table->timestamp('generated_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('semester_archives');
    }
};
