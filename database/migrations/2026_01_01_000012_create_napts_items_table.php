<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('napts_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('course_id')->constrained()->cascadeOnDelete();
            $table->foreignId('uploaded_by')->constrained('users')->cascadeOnDelete();

            // NAPTS type: N=Notes, A=Assignments, P=Presentations, T=Tests, S=Sources
            $table->enum('type', ['N', 'A', 'P', 'T', 'S']);

            $table->string('title');
            $table->text('description')->nullable();
            $table->string('tags')->nullable();     // comma-separated tags

            // File data (either file OR external_url, not both)
            $table->string('file_key')->nullable();         // R2 object key (path in bucket)
            $table->string('file_name')->nullable();        // original filename
            $table->string('file_type')->nullable();        // MIME type
            $table->unsignedBigInteger('file_size')->nullable(); // bytes

            // For Sources type — external URL instead of file
            $table->string('external_url', 2048)->nullable();

            // Metadata
            $table->unsignedInteger('download_count')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('napts_items');
    }
};
