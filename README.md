# FrontendMasters Crawler

A demo of a serverless crawler built on AWS Lambda.

## Usage
- Make your own event by copying `event.example.json` to `event.json` in `functions/fm_crawler/` and updating its content to yours.

- Install dependencies by running `yarn` in `functions/fm_crawler/`.

- Deploy by `apex deploy`.

- Invoke the function by `make run-lambda`.

## Local
In order to execute the crawler in local environment, running `make run`.
