<?php
require_once __DIR__ . '/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') respond(['message' => 'Method not allowed.'], 405);
requireRole(['cashier']);
$input = requestBody();
$id = (int) ($input['id'] ?? 0);
$quantity = (int) ($input['quantity'] ?? 0);
if ($id < 1 || $quantity < 1) respond(['message' => 'Enter a valid quantity.'], 422);

$conn->begin_transaction();
try {
    $stmt = $conn->prepare("SELECT ProductName, ProductPrice, Stocks FROM Product WHERE ProductID = ? AND ProductStatus != 'deleted' FOR UPDATE");
    $stmt->bind_param('i', $id);
    $stmt->execute();
    $product = $stmt->get_result()->fetch_assoc();
    if (!$product || (int) $product['Stocks'] < $quantity) throw new RuntimeException('Not enough stock is available.');

    $stmt = $conn->prepare('UPDATE Product SET Stocks = Stocks - ? WHERE ProductID = ?');
    $stmt->bind_param('ii', $quantity, $id);
    $stmt->execute();
    $payment = 'Cash';
    $delivery = 'Walk-in';
    $stmt = $conn->prepare('INSERT INTO `Transaction` (ProductID, Price, Quantity, PaymentMethod, DeliveryMethod, DeliveryStatus) VALUES (?, ?, ?, ?, ?, ? )');
    $status = 'Completed';
    $stmt->bind_param('idisss', $id, $product['ProductPrice'], $quantity, $payment, $delivery, $status);
    $stmt->execute();
    $conn->commit();
    respond(['success' => true, 'total' => (float) $product['ProductPrice'] * $quantity]);
} catch (Throwable $error) {
    $conn->rollback();
    respond(['message' => $error->getMessage()], 422);
}
