.PHONY : tests docs
tests:
	@for i in test/*.js; do ringo $$i; done
docs:
	@rm -rf ./docs; ringo-doc --file-urls -s lib/ -d .docs -p package.json -n "ringo-mongodb API"
	@xdg-open docs/index.html || open docs/index.html
