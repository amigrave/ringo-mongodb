.PHONY : tests docs

DOCS_ENTRY_PAGE = "docs/index.html"
LIVEDOCS_URL = "http://127.0.0.1:3000/"

tests:
	@for i in test/*.js; do ringo $$i; done

docs:
	#@rm -rf ./docs; ringo-doc --file-urls -s lib/ -d ./docs -p package.json -n "ringo-mongodb API"
	@yuidoc -C -o docs lib
	@xdg-open $(DOCS_ENTRY_PAGE) || open $(DOCS_ENTRY_PAGE)

livedocs:
	@yuidoc -C --server lib & #-T yuidoc-bootstrap-theme 
	@xdg-open $(LIVEDOCS_URL) || open $(LIVEDOCS_URL)

www:
	@rsync -av --delete ./docs/* $(HOSTING):~/www/p/ringo-mongodb
