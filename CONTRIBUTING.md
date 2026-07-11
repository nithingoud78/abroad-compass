# Contributing to Abroad Compass

Thank you for your interest in contributing! This project is maintained independently.

## Development Workflow

1. **Fork & Clone**: Fork the repository and clone it locally.
2. **Setup**: Follow the setup instructions in `README.md` and `ENVIRONMENT.md`.
3. **Branch**: Create a feature branch (`git checkout -b feature/my-feature`).
4. **Code**: Write your code. Follow standard React and TypeScript conventions.
5. **Verify**: Ensure all linting and type checking passes:
   ```bash
   npm run lint
   npm run typecheck
   ```
6. **Commit & Push**: Commit your changes and push the branch to your fork.
7. **Pull Request**: Open a pull request against the `main` branch.

## Code Style

- We use Prettier for code formatting.
- ESLint is used for linting. Please ensure `npm run lint` yields no errors.
- Prefer functional React components and TanStack hooks for state management.
