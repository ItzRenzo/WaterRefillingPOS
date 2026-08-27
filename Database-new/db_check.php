<?php
// Check if the user is logged in - only redirect if NOT logged in
if (!isset($_SESSION['user_id'])) {
    // Only redirect if this isn't already the login page
    $currentScript = basename($_SERVER['PHP_SELF']);
    if ($currentScript !== 'login.php') {
        header("Location: ../html/index.html");
        exit();
    }
}
?>