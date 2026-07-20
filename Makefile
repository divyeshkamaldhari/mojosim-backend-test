dev:
	docker-compose -f ./docker-compose.override.yml build && docker-compose -f ./docker-compose.override.yml up

Production:
	docker compose -f ./docker-compose.yml -f ./docker-compose.prod.yml config > Production.yml

Staging:
	docker compose -f ./docker-compose.yml -f ./docker-compose.stag.yml config > Staging.yml
