# Personal Finance Frontend

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 18.2.20.
## Start Compose Watch

Run the following command from the project root to start the container in watch mode

`docker compose watch angular-dev`

To verify that Compose Watch is working correctly:

1. Open the src/app/app.component.html file in your text editor.
2. Locate the following line: `<h1>Docker Angular Sample Application</h1>`
3. Change it to: `<h1>Hello from Docker Compose Watch</h1>`
4. Save to file
5. Open your browser at http://localhost:4200.

## Run the tests
`docker compose run --rm angular-test`
## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via a platform of your choice. To use this command, you need to first add a package that implements end-to-end testing capabilities.

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
