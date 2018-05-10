# FrontendMasters Crawler

A serverless crawler built on AWS Lambda (scheduled tasks) and store results in S3.

## Usage
- Setup your infrastructure on AWS by `make apply`.

- Make your own event by copying `event.example.json` to `event.json` in `functions/fm_crawler/` and updating its content to yours.

- Install dependencies by running `yarn` in `functions/fm_crawler/`.

- Sync course list into S3 by `make upload`. This file works as a dead simple storage for storing course list, download state.

- Deploy by `apex deploy`.

- Invoke lambda function by `make run-lambda`.

## Development
In order to execute the crawler in dev environment, running `make run`.

## Note
This project is just a demo for using serverless service. We encourage you guys to buy Frontend Masters's subscription instead.
