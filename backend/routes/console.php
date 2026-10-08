<?php

use App\Models\User;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('pos:initialize-hosted', function () {
    if (User::query()->exists()) {
        $this->info('Existing users found; preserving accounts, sales, and stock.');

        return 0;
    }

    if (! config('pos.initial_admin_password') || ! config('pos.initial_cashier_password')) {
        $this->error('Set POS_INITIAL_ADMIN_PASSWORD and POS_INITIAL_CASHIER_PASSWORD before initializing a new hosted database.');

        return 1;
    }

    return DB::transaction(fn () => $this->call('db:seed', ['--force' => true]));
})->purpose('Initialize a new hosted POS database once, preserving existing data');
