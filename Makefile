tests:
	@for i in test/*.js; do ringo $$i; done
.PHONY : docs
docs:
	@rm -rf docs/api/; ringo-doc --file-urls -s lib/ -d docs/api/ -p package.json -n "ringo-mongodb API"
	@xdg-open docs/index.html || open docs/index.html
