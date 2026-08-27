<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
        'price',
        'status',
        'stock',
        'unit',
        'min_stock',
    ];

    protected function casts(): array
    {
        return [
            'price' => 'float',
            'stock' => 'integer',
            'min_stock' => 'integer',
        ];
    }
}
