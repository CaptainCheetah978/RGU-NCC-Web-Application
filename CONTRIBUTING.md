# Contributing to the NCC RGU Cadet Management System

First off, thank you for considering contributing to the NCC RGU Cadet Management System! It's people like you that make this tool better for everyone in the NCC community.

Following these guidelines helps to communicate that you respect the time of the developers managing and developing this open-source project. In return, they should reciprocate that respect in addressing your issue, assessing changes, and helping you finalize your pull requests.

## Code of Conduct

By participating in this project, you are expected to uphold our Code of Conduct. Please read the [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) file before participating in the community to understand our community and behavioral expectations.

## How Can I Contribute?

### Reporting Bugs

This section guides you through submitting a bug report. Following these guidelines helps maintainers and the community understand your report, reproduce the behavior, and find related reports.

1. **Check existing issues:** Before creating bug reports, please check the GitHub issues to see if the problem has already been reported.
2. **Use the Bug Report Template:** When you create a new issue, please follow the designated Bug Report template.
3. **Be specific:** Explain the problem clearly. Include exactly what you did, what you expected to happen, and what actually happened.
4. **Include context:** Mention whether you were acting as an ANO or a Cadet, if you were using the web version or the PWA, and what device/browser you were using.

### Suggesting Enhancements

This section guides you through submitting an enhancement suggestion, including completely new features and minor improvements to existing functionality.

1. **Check existing issues:** Your feature might already be on our roadmap or previously discussed.
2. **Use the Feature Request Template:** When you create a new issue, select the Feature Request option and fill out the provided template.
3. **Describe the problem:** A great feature request usually stems from a real-world problem. Focus on the *why* before the *how*.

### Pull Requests

The process described here has several goals:
- Maintain quality by reviewing all code before it merges.
- Ensure automated builds and tests pass.
- Maintain a clean and readable commit history.

**Steps to Submit a Pull Request:**

1. **Fork the repo** and create your branch from `main`. (e.g., `git checkout -b feat/new-dashboard-widget`)
2. **Review the Architecture:** Please read [ARCHITECTURE.md](ARCHITECTURE.md) to understand how the Next.js App Router, Supabase Backend, and Context APIs interact.
3. **Ensure Code Quality:**
   - Make sure your code lints properly (`npm run lint`).
   - If you've changed APIs, update the documentation.
   - Ensure the Next.js build passes (`npm run build`).
4. **Commit Conventions:** We follow conventional commits. Prefix your commit messages with `feat:`, `fix:`, `docs:`, `chore:`, `refactor:`, etc.
5. **Issue a Pull Request:** Fill out the PR template describing your changes in detail. If your PR resolves an open issue, link it using `Closes #123`.

## Environment Setup

To set up the project locally for development, please refer to the "Quick Start (Local Development)" section in our [README.md](README.md).

If you run into issues during setup (such as Supabase RLS policies or local PWA caching bugs), please check our [FAQ.md](FAQ.md) for troubleshooting steps.

## Writing style guidelines

When contributing content, please follow these key principles from our style guide:

- **Clarity and simplicity:** The goal of our writing style is clarity and simplicity.
- **Meaning over grammar:** Grammatical correctness is important, but not as important as clarity and meaning.
- **Second person:** The docs use second-person ("you") to communicate directly with readers.
- **Inclusive language:** Use inclusive language by not assuming gender or ability level, and by avoiding slang and idioms.
- **Accessible technical language:** Jargon is sometimes necessary, but don't assume every reader has your technical expertise.
- **Active voice:** Use active voice wherever possible. Active voice means avoiding "be" verbs like "is" or "are" when you can, but also choosing more dynamic verbs to get your point across. "Press (a key)" is less dynamic than "tap (a key)," for example.
- **Clear terminology:** Avoid technical abbreviations like "repo" and "PR," and Latin abbreviations like "i.e." and "e.g."

## Community and Behavioral Expectations

- **Empathy and Kindness:** Treat everyone with respect. The NCC community is built on discipline, unity, and mutual respect. Assume positive intent in all code reviews and issue discussions.
- **Graceful Feedback:** Be open to constructive criticism on your code, and provide feedback to others in a helpful, non-derogatory manner.
- **Responsibility:** If your code introduces a bug, take responsibility, apologize if it caused significant disruption, and work with the team to fix it rapidly.

---
*Thank you for helping us build a better digital infrastructure for the NCC!*
