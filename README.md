# FrontendMasters Crawler

A serverless crawler built on AWS Lambda (scheduled tasks) and store results in S3.

<img src="https://user-images.githubusercontent.com/261283/40443798-f9d5e4ae-5ef9-11e8-9272-d4334c49dceb.png" width="50%">
<img src="https://user-images.githubusercontent.com/261283/40443756-dfe2f24e-5ef9-11e8-988c-c7eb235997ea.png" width="80%">
<img src="https://user-images.githubusercontent.com/261283/40444117-02fea754-5efb-11e8-9009-4959d2e7d55a.png" width="30%">

## Usage
- Setup your infrastructure on AWS by `make apply`.

- Make your own event by copying `event.example.json` to `event.json` in `functions/fm_crawler/` and updating its content to yours.

- Install dependencies by running `yarn` in `functions/fm_crawler/`.

- Sync course list into S3 by `make upload`. This file works as a dead simple storage for storing course list, download state.

- Deploy by `apex deploy`.

- Invoke lambda function by `make run-lambda`.

## Development
In order to execute the crawler in dev environment, running `make run`.

## Player
You can use [fm-player](https://github.com/vinhlh/fm-player) to play the content stored in S3.

## Note
This project is just a demo for using serverless service. We encourage you guys to buy Frontend Masters's subscription instead.
