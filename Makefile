APP_NAME := fluttree
ENTRY := index.ts
DIST := dist
BIN_PATH := /usr/local/bin

.PHONY: build install uninstall clean

build:
	@mkdir -p $(DIST)
	bun build $(ENTRY) --compile --outfile $(DIST)/$(APP_NAME)

install: build
	@echo "Installing $(APP_NAME) to $(BIN_PATH)"
	@sudo mv $(DIST)/$(APP_NAME) $(BIN_PATH)/$(APP_NAME)
	@sudo chmod +x $(BIN_PATH)/$(APP_NAME)

uninstall:
	@echo "Removing $(APP_NAME)"
	@sudo rm -f $(BIN_PATH)/$(APP_NAME)

clean:
	rm -rf $(DIST)
