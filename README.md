# Pharma

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 17.1.2.

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The application will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via a platform of your choice. To use this command, you need to first add a package that implements end-to-end testing capabilities.

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI Overview and Command Reference](https://angular.io/cli) page.

## Backend via ngrok

Default backend is `http://127.0.0.1:8081`.

1. Start backend locally on port `8081`.
2. Start ngrok tunnel:

```powershell
ngrok http 8081
```

3. Copy HTTPS forwarding URL (example: `https://abc123.ngrok-free.app`).
4. Run frontend with backend URL from env var:

```powershell
$env:BACKEND_URL='https://abc123.ngrok-free.app'; npm start
```

For normal local backend (without ngrok), just run:

```powershell
npm start
```
