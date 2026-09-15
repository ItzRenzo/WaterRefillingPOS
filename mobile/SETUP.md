# Mobile App Setup Guide

## Configuration

### API Connection

The mobile app needs to connect to your Laravel backend. The API URL is configured via environment variables.

#### Setup Steps:

1. Copy `.env.example` to `.env.local`:

   ```bash
   cp .env.example .env.local
   ```

2. Edit `.env.local` and set the correct API URL based on your setup:
   - **Android Emulator**: `http://10.0.2.2:8000/api`
   - **iOS Simulator**: `http://localhost:8000/api`
   - **Physical Device**: `http://YOUR_SERVER_IP:8000/api` (e.g., `http://192.168.1.100:8000/api`)
   - **Production**: `https://your-domain.com/api`

3. Start the app:
   ```bash
   npm start
   # or
   pnpm start
   ```

## Connection Error Troubleshooting

If you see "fetch failed: Could not connect to the server", it means:

### For Android Emulator:

- Use `http://10.0.2.2:8000/api` (10.0.2.2 is the special address for host machine)
- Make sure your Laravel backend is running on port 8000

### For iOS Simulator:

- Use `http://localhost:8000/api`
- Make sure your Laravel backend is running on port 8000

### For Physical Device:

- Get your computer's LAN IP address:
  - **Windows**: Run `ipconfig` and find your IPv4 address (e.g., 192.168.1.100)
  - **Mac/Linux**: Run `ifconfig` or `hostname -I`
- Use that IP in the URL: `http://192.168.1.100:8000/api`
- Ensure your device is on the same network
- Check that your firewall allows port 8000

## Running the Backend

For an emulator or local web browser:

```bash
cd backend
php artisan serve
```

This will start the server on `http://localhost:8000`.

For a physical phone, Laravel must listen on the network interface:

```bash
cd backend
php artisan serve --host=0.0.0.0
```

## Testing the Connection

Once configured, sign in with your credentials:

- Administrator: `admin` / `admin123`
- Cashier: `cashier` / `cashier123`
- The error message will be clearer if there's a connection issue
- Check that the backend server is running
- Verify the IP address is accessible from your device
