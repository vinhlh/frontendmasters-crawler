provider "aws" {}

variable "apex_function_fm_crawler" {
  type = "string"
}

variable "apex_function_names" {
  type = "map"
}

resource "aws_cloudwatch_event_rule" "fm_crawler" {
  name                = "fm-crawler-event-rule"
  schedule_expression = "rate(10 minutes)"
}

resource "aws_cloudwatch_event_target" "fm_crawler" {
  rule      = "${aws_cloudwatch_event_rule.fm_crawler.name}"
  target_id = "${var.apex_function_names["fm_crawler"]}"
  arn       = "${var.apex_function_fm_crawler}"

  input = "${file("../functions/fm_crawler/event.json")}"
}

resource "aws_lambda_permission" "fm_crawler" {
  statement_id  = "AllowExecutionFromCloudWatch"
  action        = "lambda:InvokeFunction"
  function_name = "${var.apex_function_names["fm_crawler"]}"
  principal     = "events.amazonaws.com"
  source_arn    = "${aws_cloudwatch_event_rule.fm_crawler.arn}"
}

resource "aws_s3_bucket" "storage" {
  bucket = "my-own-bucket"
  acl    = "public-read"

  tags {
    Owner = "vinhlh"
  }
}

resource "aws_iam_role_policy" "fm_storage" {
  name = "fm_storage"
  role = "frontendmasters-crawler_lambda_function"

  policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": [
        "s3:PutObject",
        "s3:PutObjectAcl"
      ],
      "Effect": "Allow",
      "Resource": "${aws_s3_bucket.storage.arn}/*"
    }
  ]
}
EOF
}
