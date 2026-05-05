migrate:
	dotnet ef migrations add $(name) \
		--project ExpenseTracker.Infrastructure \
		--startup-project ExpenseTracker.API \
		--output-dir Persistence/Migrations

update:
	dotnet ef database update \
		--project ExpenseTracker.Infrastructure \
		--startup-project ExpenseTracker.API

drop:
	dotnet ef database drop \
		--project ExpenseTracker.Infrastructure \
		--startup-project ExpenseTracker.API

reset: drop
	find . -path "*/Persistence/Migrations/*.cs" -delete
	$(MAKE) migrate name=InitialCreate
	$(MAKE) update

# GITHUB
BRANCH = develop

push:
	git add .
	git commit -m "$(msg)"
	git push origin $(BRANCH)