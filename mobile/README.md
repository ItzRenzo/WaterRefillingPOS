# RJane Water Mobile POS

This Expo SDK 57 client uses the Laravel API in `../backend` for authentication,
inventory, and sales. Start Laravel on the local network with
`php artisan serve --host=0.0.0.0`, then run `npm start` in this folder.
During development the app automatically uses the Expo host's address for the API.
Set `EXPO_PUBLIC_API_BASE` in `.env.local` only when you need to override it.
See [SETUP.md](SETUP.md) for emulator and phone addresses.

Development accounts are `admin` / `admin123` and `walton` / `cashier123`.
Android and iOS tokens are stored with Expo SecureStore.

## Mobile POS

The interface matches the web POS's colors, container illustrations, and checkout
flow. Cashiers choose a blue gallon or 500 mL bottle, select quantity, collect cash,
and print the receipt. Their terminal has no transaction tables. Receipts resize
to the available screen, and payment controls compact when the phone keyboard opens.

Admins have two inventory cards, Add stock, recent transactions with receipt
reprinting, and stock-addition history. History uses compact table rows and ten-row
pagination. Stock updates share the same API and SQLite database as the website.
Cashiers are prompted to Refresh when an administrator adds stock.

Printing uses the Android/iOS system print dialog; the browser preview prints a
receipt-only document. A compatible printer is selected through the system dialog.

Run `npx expo start --lan --port 8081`. Open `http://localhost:8081` for a browser
preview, or open the Expo server in Expo Go on a phone on the same Wi-Fi network.
Use `npm run lint`, `npx tsc --noEmit`, and `npx expo export --platform web` to validate.
Static production builds require `EXPO_PUBLIC_API_BASE` to be configured at build time.

## Expo development

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

### Other setup steps

- To set up ESLint for linting, run `npx expo lint`, or follow our guide on ["Using ESLint and Prettier"](https://docs.expo.dev/guides/using-eslint/)
- If you'd like to set up unit testing, follow our guide on ["Unit Testing with Jest"](https://docs.expo.dev/develop/unit-testing/)
- Learn more about the TypeScript setup in this template in our guide on ["Using TypeScript"](https://docs.expo.dev/guides/typescript/)

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
