<?php
declare(strict_types=1);

session_start();
header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/../Database/db_config.php';
$conn->set_charset('utf8mb4');

function respond(array $data, int $status = 200): void {
    http_response_code($status);
    echo json_encode($data);
    exit;
}

function requestBody(): array {
    $body = json_decode(file_get_contents('php://input'), true);
    if (!is_array($body)) {
        respond(['message' => 'A JSON request body is required.'], 400);
    }
    return $body;
}

function currentUser(): array {
    if (!isset($_SESSION['user_id'], $_SESSION['position'], $_SESSION['username'])) {
        respond(['message' => 'Please sign in.'], 401);
    }
    return [
        'id' => (int) $_SESSION['user_id'],
        'name' => (string) $_SESSION['username'],
        'role' => strtolower((string) $_SESSION['position']),
    ];
}

function requireRole(array $roles): array {
    $user = currentUser();
    if (!in_array($user['role'], $roles, true)) {
        respond(['message' => 'You do not have permission for this action.'], 403);
    }
    return $user;
}
