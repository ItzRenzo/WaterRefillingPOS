<?php
require_once __DIR__ . '/bootstrap.php';

function itemFromRow(array $row): array {
    return [
        'id' => (int) $row['ProductID'],
        'name' => $row['ProductName'],
        'unit' => $row['ProductUnit'] ?: ($row['ContainerType'] ?: 'unit'),
        'quantity' => (int) $row['Stocks'],
        'minStock' => (int) $row['MinStock'],
        'pricePerUnit' => (float) $row['ProductPrice'],
        'lastUpdated' => $row['LastUpdated'],
    ];
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    requireRole(['admin', 'cashier']);
    $result = $conn->query("SELECT p.ProductID, p.ProductName, p.ProductPrice, p.Stocks, p.ProductUnit, p.MinStock, COALESCE(DATE_FORMAT(p.UpdatedAt, '%Y-%m-%d'), DATE_FORMAT(CURDATE(), '%Y-%m-%d')) AS LastUpdated, c.ContainerType FROM Product p LEFT JOIN Container c ON c.ContainerID = p.ContainerID WHERE p.ProductStatus != 'deleted' ORDER BY p.ProductID DESC");
    $items = [];
    while ($row = $result->fetch_assoc()) $items[] = itemFromRow($row);
    respond(['items' => $items]);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') respond(['message' => 'Method not allowed.'], 405);
requireRole(['admin']);
$input = requestBody();
$action = $input['action'] ?? '';

if ($action === 'delete') {
    $id = (int) ($input['id'] ?? 0);
    if ($id < 1) respond(['message' => 'Invalid product.'], 422);
    $stmt = $conn->prepare("UPDATE Product SET ProductStatus = 'deleted' WHERE ProductID = ?");
    $stmt->bind_param('i', $id);
    $stmt->execute();
    respond(['success' => true]);
}

$name = trim((string) ($input['name'] ?? ''));
$unit = trim((string) ($input['unit'] ?? 'unit'));
$quantity = (int) ($input['quantity'] ?? -1);
$minStock = (int) ($input['minStock'] ?? -1);
$price = (float) ($input['pricePerUnit'] ?? -1);
if ($name === '' || $quantity < 0 || $minStock < 0 || $price < 0) respond(['message' => 'Enter valid product details.'], 422);

if ($action === 'create') {
    $status = 'Available';
    $stmt = $conn->prepare('INSERT INTO Product (ProductName, ProductPrice, ProductStatus, Stocks, ProductUnit, MinStock) VALUES (?, ?, ?, ?, ?, ?)');
    $stmt->bind_param('sdsisi', $name, $price, $status, $quantity, $unit, $minStock);
    $stmt->execute();
    $id = $conn->insert_id;
} elseif ($action === 'update') {
    $id = (int) ($input['id'] ?? 0);
    if ($id < 1) respond(['message' => 'Invalid product.'], 422);
    $stmt = $conn->prepare('UPDATE Product SET ProductName = ?, ProductPrice = ?, Stocks = ?, ProductUnit = ?, MinStock = ? WHERE ProductID = ? AND ProductStatus != "deleted"');
    $stmt->bind_param('sdisii', $name, $price, $quantity, $unit, $minStock, $id);
    $stmt->execute();
} else {
    respond(['message' => 'Unknown inventory action.'], 400);
}

$stmt = $conn->prepare("SELECT p.ProductID, p.ProductName, p.ProductPrice, p.Stocks, p.ProductUnit, p.MinStock, DATE_FORMAT(p.UpdatedAt, '%Y-%m-%d') AS LastUpdated, c.ContainerType FROM Product p LEFT JOIN Container c ON c.ContainerID = p.ContainerID WHERE p.ProductID = ?");
$stmt->bind_param('i', $id);
$stmt->execute();
respond(['item' => itemFromRow($stmt->get_result()->fetch_assoc())]);
