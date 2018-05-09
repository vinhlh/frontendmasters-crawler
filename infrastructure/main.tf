provider "aws" {}

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
