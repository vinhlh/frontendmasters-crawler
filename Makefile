run:
	DEV=true node functions/fm_crawler/run.js

run-lambda:
	cat functions/fm_crawler/event.json | apex invoke fm_crawler

deploy:
	apex deploy

upload:
	aws s3 cp courses.json s3://my_bucket/ --acl public-read

download:
	aws s3 cp s3://my_bucket/courses.json courses.json

apply:
	apex infra apply --var-file=live.tfvars
