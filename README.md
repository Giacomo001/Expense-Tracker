# Expense Tracker

A full-stack personal finance management application built with **.NET 10** and **Angular 21**, following **Clean Architecture** principles and **CQRS** pattern.

[![.NET](https://img.shields.io/badge/.NET-10.0-512BD4?style=flat&logo=dotnet)](https://dotnet.microsoft.com/)
[![Angular](https://img.shields.io/badge/Angular-21-DD0031?style=flat&logo=angular)](https://angular.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat&logo=docker&logoColor=white)](https://www.docker.com/)
[![License](https://img.shields.io/badge/License-Proprietary-red.svg)]()
[![Last Commit](https://img.shields.io/github/last-commit/Giacomo001/expense-tracker)]()

> ⚠️ This project is currently under active development. Backend and frontend implementation are complete — currently in testing phase.

---

## Architecture Overview

The backend follows **Clean Architecture**, with dependencies flowing in a single direction toward the core:

```mermaid
flowchart TD
    API["ExpenseTracker.API<br/>Controllers, Middleware, DI"]
    APP["ExpenseTracker.Application<br/>CQRS (MediatR), Validators, DTOs"]
    DOM["ExpenseTracker.Domain<br/>Entities"]
    INFRA["ExpenseTracker.Infrastructure<br/>EF Core, Identity, JWT"]

    API --> APP --> DOM
    INFRA --> APP
```

`ExpenseTracker.API` exposes REST controllers and depends only on `Application`, which holds the use cases — implemented as CQRS commands and queries via MediatR — and defines the repository interfaces without knowing how they're implemented. `ExpenseTracker.Infrastructure` implements those interfaces (EF Core, PostgreSQL, ASP.NET Core Identity, JWT/refresh token handling) and depends on `Application`, never the other way around. `ExpenseTracker.Domain` sits at the core with zero external dependencies — just entities and business rules.

---

## Tech Stack

### Backend
| Technology | Purpose |
|---|---|
| .NET 10 | Runtime |
| ASP.NET Core Web API | REST API |
| Entity Framework Core 9 | ORM |
| PostgreSQL 16 | Database |
| ASP.NET Core Identity | User management |
| MediatR | CQRS pattern |
| FluentValidation | Input validation |
| ErrorOr | Result pattern |
| JWT + Refresh Token | Authentication |

### Frontend
| Technology | Purpose |
|---|---|
| Angular 21 | SPA Framework |
| Angular Material | UI Components |
| TailwindCSS | Styling |
| Chart.js + ng2-charts | Charts and reports visualization |
| ngx-skeleton-loader | Loading skeletons |
| ngx-toastr | Toast notifications (success/error/loading) |

### Infrastructure
| Technology | Purpose |
|---|---|
| Docker + Docker Compose | Containerization |
| VS Code Dev Containers | Development environment |
| Adminer | Database GUI |

### Testing
| Technology | Purpose |
|---|---|
| xUnit v3 | Test framework |
| NSubstitute | Mocking |
| FluentAssertions | Assertions |

---

## Features

### Authentication
- Register and login with JWT access token
- Refresh token delivered via httpOnly, Secure cookie — never exposed to client-side JavaScript
- Refresh token rotation with SHA-256 hashing and reuse detection
- CSRF protection via double-submit cookie pattern (antiforgery token)
- Token revocation (logout)
- NIST-compliant password policy
- Account lockout after failed attempts

### Categories
- Create, read, update, delete personal expense categories
- Categories are scoped per user
- Deletion blocked if associated expenses exist

### Expenses
- Full CRUD for personal expenses
- Each expense linked to a category
- Dates stored as `DateOnly` for precision

### Reports
- Expense summary by category and by month
- Grand total calculation over a date range

---

## Getting Started

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [VS Code](https://code.visualstudio.com/) with the [Dev Containers](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers) extension

### Setup

1. Clone the repository:
```bash
git clone git@github.com:Giacomo001/expense-tracker.git
cd expense-tracker
```

2. Create the environment files:

**.env**
```env
POSTGRES_USER=your_postgres_user
POSTGRES_PASSWORD=your_postgres_password
POSTGRES_DB=your_postgres_db
```

**.env.container**
```env
ConnectionStrings__DefaultConnection=Host=db;Port=5432;Database=YOUR_DB;Username=YOUR_USERNAME;Password=YOUR_PASSWORD
Jwt__Key=YOUR_SECRET_KEY_MIN_32_CHARS
Jwt__Issuer=ExpenseTrackerAPI
Jwt__Audience=ExpenseTrackerClient
Jwt__ExpiresInMinutes=60
Jwt__RefreshTokenExpirationDays=7
```

3. Open the project in VS Code and select **Reopen in Container** when prompted.

4. Run the database migrations:
```bash
make migrate name=InitialCreate
make update
```

5. Start the API:
```bash
dotnet run --project ExpenseTracker.API
```

6. Start the frontend (in a separate terminal, inside the container):
```bash
cd client && ng serve --host 0.0.0.0
```

The API will be available at `http://localhost:8080`, the frontend at `http://localhost:4200`, and Adminer (DB GUI) at `http://localhost:8081`.

---

## Running Tests

```bash
dotnet test
```

Current coverage: **27 unit tests** across Commands, Queries, and Report aggregations.

---

## Project Structure

The solution is split by Clean Architecture layer:
- `ExpenseTracker.API` holds Controllers, Middleware and dependency injection setup — it's the only project that talks HTTP.
- `ExpenseTracker.Application` groups CQRS Features (Commands and Queries), DTOs, Validators, Mappers and the repository Interfaces the layer depends on.
- `ExpenseTracker.Domain` contains just the core Entities.
- `ExpenseTracker.Infrastructure` implements everything Application declares: Persistence (EF Core), Identity and external Services.
- `client` holds the Angular frontend, still in progress.
- `Tests` mirrors this split with Features, Validators and Mappers test suites.
- `.devcontainer` at the root configures the VS Code development environment.

---

## Security Highlights

- Passwords require minimum 12 characters with uppercase, lowercase, digit, and special character.
- Account lockout after 5 failed attempts for 15 minutes.
- Refresh token stored in an HttpOnly, Secure cookie scoped to /api/auth — never accessible to client-side JavaScript, and stored server-side as a SHA-256 hash.
- Refresh token reuse detection: replaying an already-used token revokes all active tokens for that user.
- CSRF protection on refresh/revoke endpoints via double-submit cookie (XSRF-TOKEN / X-XSRF-TOKEN).
- JWT ClockSkew set to zero for strict expiration enforcement.
- User data fully isolated — repository queries always filter by UserId.

---

## Roadmap

- [x] Backend — Clean Architecture + CQRS
- [x] Authentication with JWT + Refresh Token
- [x] Unit Tests
- [x] Frontend — Angular
- [ ] Integration Tests

---

## License

Proprietary software. All rights reserved. Copying, distribution, or modification without explicit authorization from the repository owner is prohibited.
