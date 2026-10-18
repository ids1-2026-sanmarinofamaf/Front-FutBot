.DEFAULT_GOAL := help
.PHONY: help install env dev test reinstall clean

help:
	@echo "make install          Instala dependencias, aplica audit fix y crea .env"
	@echo "make run              Levanta el frontend (Vite)"
	@echo "make test             Corre todos los tests"
	@echo "make test FILE=x      Corre un test puntual (ej: FILE=Login.test.jsx)"
	@echo "make reinstall        Limpia e instala de nuevo"
	@echo "make clean            Borra node_modules"

install: env
	npm install
	npm audit fix --force

env:
	@if [ ! -f .env ]; then \
		printf "VITE_API_URL=http://127.0.0.1:8000\nVITE_WS_SESSION_URL=ws://127.0.0.1:8000\n" > .env; \
		echo ".env creado"; \
	else \
		echo ".env ya existe, no se modifica (Verifica que contiene VITE_API_URL y VITE_WS_SESSION_URL)"; \
	fi

run:
	npm run dev

test:
ifdef FILE
	npm test -- $(FILE)
else
	npm test
endif

# Alternativamente usar npm ci 
reinstall: clean install 

clean:
	rm -rf node_modules