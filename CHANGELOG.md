# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-07-11

### Added

- Initial standalone release of Abroad Compass.
- Generic AI provider integration supporting Google AI Studio and OpenRouter.
- Connected to user's independent Supabase project.

### Changed

- Migrated out of Lovable infrastructure.
- Replaced Lovable Gateway AI with direct AI SDK usage.
- Transitioned project package management from Bun to npm.

### Removed

- All dependencies on Lovable platform and `@lovable.dev` packages.
- Lovable error reporting and authentication wrappers.
