run:
	node functions/fm_crawler/run.js

run-lambda:
	cat functions/fm_crawler/event.json | apex invoke fm_crawler

deploy:
	apex deploy

sync:
<<<<<<< HEAD
	aws s3 cp courses.json s3://vinhlh.fm/ --acl public-read
=======
	aws s3 cp courses.json s3://your_bucket/ --acl public-read
>>>>>>> 3600820... Run commands via Makefile
