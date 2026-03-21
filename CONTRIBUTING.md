# Contributing to Surfaice

Thanks for your interest in contributing! Surfaice is an open standard and we welcome all contributions.

## Getting Started

```bash
# Clone the repo
git clone https://github.com/surfaiceai/surfaice.git
cd surfaice

# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests
pnpm test
```

## Project Structure

```
packages/
  format/     # .ui.md parser and serializer
  crawler/    # Playwright-based UI snapshot engine
  differ/     # Structural diff engine
  cli/        # CLI tool (init, check, diff)
  react/      # React annotation components
  next/       # Next.js dev overlay + build export
  action/     # GitHub Action
spec/         # Format specification
examples/     # Example .ui.md files
docs/         # Documentation
```

## Development Workflow

1. Fork the repo
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes
4. Run tests: `pnpm test`
5. Commit with a clear message
6. Open a PR against `main`

## Code of Conduct

Be kind, be constructive, be collaborative.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
