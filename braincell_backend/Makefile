PYTHON=python
PIP=$(PYTHON) -m pip
UVICORN=uvicorn
APP_PATH=app.main:app

.PHONY: install dev lint test fmt

install:
	$(PIP) install -r requirements.txt

# Development server
dev:
	$(UVICORN) $(APP_PATH) --reload

fmt:
	$(PYTHON) -m black app

lint:
	$(PYTHON) -m ruff check app

export PYTHONPATH := $(PWD)

test:
	$(PYTHON) -m pytest
