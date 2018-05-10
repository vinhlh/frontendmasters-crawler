run:
	node functions/fm_crawler/run.js

run-lambda:
	cat functions/fm_crawler/event.json | apex invoke fm_crawler

deploy:
	apex deploy

sync:
	aws s3 cp courses.json s3://your_bucket/ --acl public-read

apply:
	apex infra apply --var-file=live.tfvars
