provider "aws" {}

variable "bucket_name" {
  type = "string"
}

variable "apex_function_fm_crawler" {
  type = "string"
}

variable "apex_function_names" {
  type = "map"
}

variable "whitelist_ips" {
  type = "list"
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
  bucket = "${var.bucket_name}"
  acl    = "private"

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET"]
    allowed_origins = ["*"]
    expose_headers  = ["ETag"]
    max_age_seconds = 300
  }

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
        "s3:*"
      ],
      "Effect": "Allow",
      "Resource": [
        "${aws_s3_bucket.storage.arn}",
        "${aws_s3_bucket.storage.arn}/*"
      ]
    }
  ]
}
EOF
}

resource "aws_s3_bucket_policy" "public_access" {
  bucket = "${aws_s3_bucket.storage.id}"

  policy = <<POLICY
{
  "Version": "2012-10-17",
  "Id": "vinhlh.fm.webm",
  "Statement": [
    {
      "Principal": "*",
      "Action": "s3:GetObject",
      "Effect": "Allow",
      "Resource": "${aws_s3_bucket.storage.arn}/*.webm",
      "Condition": {
        "IpAddress": {
          "aws:SourceIp": ${jsonencode(var.whitelist_ips)}
        }
      }
     }
  ]
}
POLICY
}
