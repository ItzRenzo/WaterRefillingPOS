<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        Role::findOrCreate('admin');
        Role::findOrCreate('cashier');

        $admin = User::query()->updateOrCreate(['username' => 'admin'], [
            'name' => 'Admin',
            'email' => 'admin@rjanewater.local',
            'password' => Hash::make('admin123'),
        ]);
        $admin->syncRoles('admin');

        $cashier = User::query()->updateOrCreate(['username' => 'walton'], [
            'name' => 'Walton',
            'email' => 'walton@rjanewater.local',
            'password' => Hash::make('cashier123'),
        ]);
        $cashier->syncRoles('cashier');

        $this->call(ProductSeeder::class);
        $this->call(PosHistorySeeder::class);
    }
}
