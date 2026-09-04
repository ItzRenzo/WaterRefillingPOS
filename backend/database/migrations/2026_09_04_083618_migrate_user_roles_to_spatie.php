<?php

use App\Models\User;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('users', 'role')) {
            return;
        }

        $now = now();
        foreach (['admin', 'cashier'] as $role) {
            DB::table('roles')->insertOrIgnore([
                'name' => $role,
                'guard_name' => 'web',
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }

        DB::table('users')
            ->whereNotNull('role')
            ->whereIn('role', ['admin', 'cashier'])
            ->orderBy('id')
            ->each(function (object $user): void {
                $roleId = DB::table('roles')
                    ->where('name', $user->role)
                    ->where('guard_name', 'web')
                    ->value('id');

                DB::table('model_has_roles')->insertOrIgnore([
                    'role_id' => $roleId,
                    'model_type' => User::class,
                    'model_id' => $user->id,
                ]);
            });

        Schema::table('users', function (Blueprint $table): void {
            $table->dropColumn('role');
        });
    }

    public function down(): void
    {
        if (Schema::hasColumn('users', 'role')) {
            return;
        }

        Schema::table('users', function (Blueprint $table): void {
            $table->string('role', 20)->nullable();
        });

        DB::table('model_has_roles')
            ->join('roles', 'roles.id', '=', 'model_has_roles.role_id')
            ->where('model_has_roles.model_type', User::class)
            ->select('model_has_roles.model_id', 'roles.name')
            ->orderBy('model_has_roles.model_id')
            ->each(function (object $assignment): void {
                DB::table('users')
                    ->where('id', $assignment->model_id)
                    ->update(['role' => $assignment->name]);
            });
    }
};
