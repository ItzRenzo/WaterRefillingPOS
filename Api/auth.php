<?php
require_once __DIR__ . '/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    respond(['user' => currentUser()]);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(['message' => 'Method not allowed.'], 405);
}

$input = requestBody();
$action = $input['action'] ?? 'login';

if ($action === 'logout') {
    $_SESSION = [];
    session_destroy();
    respond(['success' => true]);
}

$username = trim((string) ($input['username'] ?? ''));
$password = (string) ($input['password'] ?? '');
$requestedRole = strtolower((string) ($input['role'] ?? ''));
if ($username === '' || $password === '' || !in_array($requestedRole, ['admin', 'cashier'], true)) {
    respond(['message' => 'Enter your username, password, and role.'], 422);
}

$stmt = $conn->prepare('SELECT EmployeeID, CONCAT(FirstName, " ", LastName) AS FullName, EmployeePosition, Password FROM Employee WHERE LOWER(Username) = LOWER(?) AND EmployeeStatus = "Active" LIMIT 1');
$stmt->bind_param('s', $username);
$stmt->execute();
$employee = $stmt->get_result()->fetch_assoc();

if (!$employee || !password_verify($password, $employee['Password']) || strtolower($employee['EmployeePosition']) !== $requestedRole) {
    respond(['message' => 'Incorrect username, password, or selected role.'], 401);
}

session_regenerate_id(true);
$_SESSION['user_id'] = (int) $employee['EmployeeID'];
$_SESSION['username'] = $employee['FullName'];
$_SESSION['position'] = $requestedRole;
respond(['user' => currentUser()]);
