# Examora Engineering Handbook

This file defines the working agreement for coding agents and human contributors in this repository.
Treat every rule as active unless a newer user instruction explicitly overrides it.
Keep changes production-oriented, narrowly scoped, testable, and understandable by the next maintainer.

<!-- BEGIN:nextjs-agent-rules -->
## This is not the Next.js you know

This repository uses a Next.js version with breaking changes.
Read the relevant guide in node_modules/next/dist/docs before writing Next.js code.
Follow current local documentation over remembered framework behavior.
Heed every deprecation notice found in the installed documentation.
<!-- END:nextjs-agent-rules -->

## Mission

Build Examora as a secure, reliable exam platform with predictable billing and clear ownership boundaries.

- Optimize for correct user outcomes before implementation speed.
- Protect user exams, attempts, identity, and billing state.
- Keep the Free plan usable without creating uncontrolled infrastructure cost.
- Keep Pro entitlements consistent with Stripe subscription state.
- Prefer boring and observable production behavior.
- Make errors actionable without leaking sensitive internals.
- Preserve data unless deletion is explicitly required and verified.
- Keep the application deployable on Vercel and PostgreSQL on Neon.
- Keep local development possible with documented environment variables.
- Avoid hidden coupling between UI components and backend billing logic.
- Centralize policy decisions such as plan limits and entitlement checks.
- Use framework-supported patterns instead of custom platform emulation.

## Instruction Priority

Resolve instructions consistently before changing files.

- Follow system and developer instructions before repository guidance.
- Follow the latest user request when user requests conflict.
- Follow the nearest applicable AGENTS.md for a file.
- Treat explicit user constraints as authoritative.
- Do not reinterpret a request to expand its business scope.
- Ask only when a missing answer creates material risk.
- Prefer discovering answers from the repository over asking.
- Do not weaken security controls to make a test pass.
- Do not silently change subscription prices or quotas.
- Do not silently modify real environment values.
- Do not expose credentials in messages, logs, diffs, or screenshots.
- Document unavoidable assumptions in the final response.

## Working Method

Use a read, plan, edit, verify loop for every nontrivial task.

- Inspect git status before editing.
- Assume unrelated worktree changes belong to the user.
- Read the target file and its direct callers.
- Search for all references before changing a shared contract.
- Read installed Next.js documentation before Next.js changes.
- Form a small implementation plan for multi-file work.
- State the intended edits before making them.
- Use apply_patch for manual source changes.
- Keep edits inside the requested ownership boundary.
- Run the smallest relevant checks after each logical stage.
- Run broad checks when shared contracts change.
- Review the final diff for secrets and unrelated churn.

## Repository Safety

Preserve user work and avoid destructive repository operations.

- Never run git reset --hard.
- Never discard uncommitted user changes.
- Never use git checkout to overwrite a modified file without approval.
- Never delete an unknown directory recursively.
- Verify absolute paths before filesystem deletion.
- Remove only artifacts created by the current task.
- Do not rewrite applied migrations after they are committed.
- Do not edit package lockfiles by hand.
- Do not run audit fix --force without a reviewed upgrade plan.
- Do not commit generated .next output.
- Do not commit real environment files.
- Do not commit local Vercel project metadata.

## Repository Map

Use these ownership boundaries when locating changes.

- app contains Next.js routes, layouts, pages, and metadata assets.
- app/(app) contains authenticated application pages.
- app/(auth) contains authentication entry pages.
- app/api contains server route handlers.
- components contains reusable UI and interactive client components.
- components/exam contains the exam-taking experience.
- lib contains server services, shared domain logic, and validation helpers.
- lib/ai owns provider selection, prompts, rate limits, and AI calls.
- lib/billing owns plans, usage accounting, and subscription synchronization.
- prisma/schema.prisma is the declarative database model.
- prisma/migrations is the versioned database history.
- public contains static assets that must be served unchanged.

## Standard Commands

Run commands through npm.cmd or npx.cmd on Windows.

- Use npm.cmd install to install dependencies.
- Use npm.cmd run dev to start local development.
- Use npm.cmd run build for a production compilation.
- Use npm.cmd run lint for repository linting.
- Use npm.cmd run typecheck for TypeScript validation.
- Use npm.cmd run postinstall to regenerate Prisma Client.
- Use npx.cmd prisma validate to validate the schema.
- Use npx.cmd prisma migrate status to inspect migration state.
- Use npx.cmd prisma migrate deploy for production migrations.
- Use git diff --check to detect whitespace errors.
- Use rg for text searches.
- Use rg --files for file discovery.

## Definition of Done

A change is complete only when behavior, safety, and verification agree.

- The requested behavior is implemented.
- Authentication is enforced where required.
- Authorization is enforced at the data boundary.
- Untrusted input is validated.
- Billing effects are idempotent.
- Errors use appropriate HTTP status codes.
- Secrets remain server-only.
- The schema and migrations agree.
- TypeScript passes.
- ESLint passes.
- The production build passes for deployable changes.
- The final response reports remaining risks.

## Next.js App Router

Follow the installed Next.js 16 documentation for routing and rendering.

- Treat pages and layouts as Server Components by default.
- Add use client only at the narrowest interactive boundary.
- Do not import server-only modules into Client Components.
- Keep secret-bearing logic in Server Components or route handlers.
- Use route.ts for HTTP handlers under app/api.
- Use native Request and Response APIs unless Next extensions are needed.
- Remember that route handler POST requests are not cached.
- Use dynamic rendering when reading sessions or databases.
- Await params and searchParams according to local Next.js types.
- Use special metadata files for icons and social images.
- Avoid custom document-head manipulation for supported metadata.
- Verify route output in the production build route table.

## Server Components

Keep server rendering close to databases and secrets.

- Read authentication with auth on the server.
- Query only the fields required for rendering.
- Do not serialize Stripe objects into client props.
- Do not serialize Prisma objects with unnecessary private fields.
- Format Date values deliberately before client transfer.
- Return null only when the parent layout guarantees a redirect.
- Use notFound for inaccessible user-owned resources.
- Avoid browser APIs in Server Components.
- Avoid unnecessary client hydration.
- Keep database reads out of module initialization.
- Mark request-dependent pages dynamic when needed.
- Keep rendering failures free of secret values.

## Client Components

Use Client Components only for state, effects, and browser interactions.

- Place use client before imports.
- Keep fetch calls pointed at authenticated server routes.
- Disable buttons during in-flight mutations.
- Render actionable errors returned by the server.
- Do not trust client plan state for authorization.
- Do not calculate final quotas only in the browser.
- Use window.location.assign for Stripe-hosted redirects.
- Keep local state reset behavior explicit.
- Clean up timers and effects.
- Avoid storing sensitive responses in localStorage.
- Use semantic buttons for actions.
- Use links for navigation.

## Route Handlers

Treat every route handler as a public security boundary.

- Authenticate before expensive parsing or side effects.
- Authorize every user-owned record lookup.
- Validate JSON with Zod schemas.
- Validate multipart file presence and size.
- Reject unsupported content types.
- Apply same-origin checks to cookie-authenticated mutations.
- Rate limit costly or mutating operations.
- Return JSON errors with stable shapes.
- Log internal errors without returning secrets.
- Use 401 for missing authentication.
- Use 403 for forbidden origins or access.
- Use 404 to avoid revealing inaccessible resources.

## HTTP Semantics

Use status codes consistently across APIs.

- Use 200 for successful reads and ordinary actions.
- Use 201 for newly created resources.
- Use 400 for malformed requests.
- Use 401 when a session is missing.
- Use 403 when an authenticated request is forbidden.
- Use 404 for missing or inaccessible resources.
- Use 409 for conflicting subscription state.
- Use 413 for files beyond the plan limit.
- Use 422 for valid payloads that cannot be processed.
- Use 429 for rate or quota exhaustion.
- Use 500 for unexpected internal failures.
- Use 502 for upstream provider failures.

## TypeScript

Keep strict TypeScript useful rather than bypassed.

- Prefer explicit domain types over any.
- Use unknown for untrusted caught values.
- Narrow errors before reading properties.
- Reuse generated Prisma enums.
- Reuse Zod-inferred request types.
- Avoid type assertions that bypass runtime validation.
- Keep nullable database fields explicit.
- Do not use ts-ignore.
- Use ts-expect-error only with a precise reason.
- Keep public helper return types understandable.
- Avoid exporting incidental implementation types.
- Run typecheck after schema generation.

## React

Keep React behavior predictable and accessible.

- Use stable keys from domain identifiers.
- Do not use array indexes when item identity can change.
- Keep derived values out of state.
- Use controlled inputs for submitted forms.
- Prevent duplicate submissions.
- Preserve focus during async updates.
- Avoid effects for values derivable during render.
- Clean up intervals and listeners.
- Handle empty, loading, error, and success states.
- Keep component responsibilities narrow.
- Extract shared behavior only when reused.
- Do not place server secrets in client code.

## UI System

Match the existing quiet application design.

- Use components from components/ui before inventing new primitives.
- Use Lucide icons for familiar actions.
- Keep card radii at eight pixels or less when editing styles.
- Do not nest decorative cards.
- Use cards only for distinct repeated or framed content.
- Keep operational pages dense and scannable.
- Use restrained colors with semantic status accents.
- Keep text within controls at mobile widths.
- Use stable control dimensions.
- Use tooltips or labels for unfamiliar icons.
- Avoid decorative gradients and floating orbs.
- Preserve light and dark theme contrast.

## Landing Page

Keep the public page honest and connected to real product behavior.

- Keep Examora visible in the first viewport.
- Keep plan prices synchronized with Stripe configuration.
- Do not claim unlimited AI usage.
- Do not claim OCR support unless production behavior supports it.
- Keep anchor targets unique.
- Keep smooth scrolling compatible with reduced motion.
- Account for the sticky header with scroll padding.
- Use links to application routes for real workflows.
- Use anchor links only for same-page sections.
- Keep FAQ answers aligned with current plans.
- Do not expose infrastructure setup instructions to end users.
- Verify public copy after quota or pricing changes.

## Responsive Design

Verify every user-facing change at practical viewport sizes.

- Check a narrow mobile viewport.
- Check a tablet-width viewport.
- Check a standard desktop viewport.
- Check a wide desktop viewport.
- Ensure sticky navigation does not cover anchored headings.
- Ensure buttons wrap without clipping.
- Ensure long email addresses truncate safely.
- Ensure pricing amounts remain readable.
- Ensure question options do not overflow.
- Ensure sidebars collapse predictably.
- Ensure touch targets remain usable.
- Ensure no horizontal page scroll is introduced.

## Accessibility

Accessibility is part of correctness.

- Use semantic headings in logical order.
- Associate labels with form controls.
- Provide accessible names for icon-only buttons.
- Preserve visible keyboard focus.
- Do not rely on color alone for status.
- Meet contrast requirements in both themes.
- Respect prefers-reduced-motion.
- Use buttons for actions and links for navigation.
- Announce meaningful async errors in readable text.
- Keep loading indicators labeled.
- Use alt text for informative images.
- Use empty alt text only for decorative images.

## Authentication

Auth.js with Google OAuth and JWT sessions is the current contract.

- Keep the Prisma adapter for User and Account persistence.
- Keep session strategy set to jwt.
- Do not add database Session usage without restoring its model and migration.
- Do not add email magic links without restoring VerificationToken.
- Keep Google client credentials server-only.
- Keep NEXTAUTH_SECRET server-only.
- Use secure cookies in production.
- Use sameSite lax unless a reviewed flow requires otherwise.
- Keep session token cookies HTTP-only.
- Store only essential fields in the JWT.
- Expose the internal user id through the session callback.
- Redirect unauthenticated application pages to login.

## Authorization

Authentication alone never grants access to arbitrary records.

- Filter exam lists by ownerId.
- Filter exam reads by id and ownerId.
- Filter exam deletion by id and ownerId.
- Attach ownerId when creating exams.
- Attach userId when creating attempts.
- Filter attempt lists by userId.
- Return 404 for another user's resource.
- Never accept ownerId from the client.
- Derive user ids from the authenticated session.
- Keep admin behavior separate from ordinary user paths.
- Review every new relation for its ownership rule.
- Test cross-user access whenever resource routes change.

## Prisma Client

Use one shared server-side Prisma client.

- Import prisma from lib/prisma.
- Do not instantiate PrismaClient in feature modules.
- Keep Prisma imports out of Client Components.
- Use the PostgreSQL adapter already configured.
- Use a small production connection pool.
- Keep connection timeouts bounded.
- Keep idle timeouts bounded.
- Use transactions for coupled writes.
- Use generated compound unique selectors.
- Select only needed fields.
- Regenerate the client after schema changes.
- Do not log full query payloads in production.

## Database Schema

Keep schema.prisma as the readable domain model.

- Use explicit relations and deletion behavior.
- Index foreign keys used for filtering.
- Use unique constraints for external identifiers.
- Use enums for closed application states.
- Avoid tables without an active application responsibility.
- Avoid optional ownership for newly user-owned records.
- Do not store Stripe secrets in the database.
- Do not store payment method details locally.
- Keep Stripe customer ids unique.
- Keep Stripe subscription ids unique.
- Keep one subscription record per user.
- Keep usage uniqueness scoped by user, metric, and period.

## Prisma Migrations

Migration history must reproduce the database from zero.

- Commit prisma/schema.prisma.
- Commit the entire prisma/migrations directory.
- Commit migration_lock.toml.
- Keep 0_init able to create the final baseline schema.
- Create a new timestamped migration for future changes.
- Never edit an applied committed migration.
- Review generated SQL before applying it.
- Back up data before destructive production migrations.
- Verify affected table row counts before drops.
- Use migrate deploy in production.
- Use migrate status after deployment.
- Keep database credentials outside migration files.

## Neon PostgreSQL

Treat Neon as production data infrastructure.

- Use the configured production branch deliberately.
- Prefer pooled connection strings for serverless deployments.
- Do not print the connection string.
- Do not commit the connection string.
- Check migration status against the intended branch.
- Use branch backups before destructive work.
- Avoid long transactions in request handlers.
- Avoid unbounded full-table queries.
- Index user-scoped lookup fields.
- Monitor connection exhaustion.
- Monitor slow queries.
- Confirm schema and migration history remain synchronized.

## Data Retention

Retain only data with a product or operational purpose.

- Keep user records while accounts are active.
- Cascade OAuth accounts when users are deleted.
- Cascade subscription and usage records with users.
- Cascade questions when exams are deleted.
- Cascade answers when attempts are deleted.
- Do not delete user content during routine migrations.
- Define retention before adding raw event payload storage.
- Do not store full Stripe webhook payloads without a need.
- Keep Stripe event ids for idempotency.
- Plan event-ledger cleanup before it grows materially.
- Keep audit data only when the application writes and uses it.
- Document any new retention policy.

## Stripe Architecture

Stripe is the billing source of truth; the database is the access cache.

- Use the official Stripe SDK.
- Create Stripe clients only on the server.
- Use configured Price ids rather than client amounts.
- Allow only known Examora Price ids.
- Keep Free as an internal plan without a Stripe subscription.
- Create Stripe customers only when billing is needed.
- Store one Stripe customer id per user.
- Attach the Examora user id as Stripe metadata.
- Attach the app name as Stripe metadata.
- Use Checkout in subscription mode.
- Use the Customer Portal for self-service billing.
- Use webhooks to grant and revoke Pro access.

## Stripe Environments

Never mix sandbox and live Stripe resources.

- Use sk_test keys only with test Prices.
- Use sk_live keys only with live Prices.
- Verify Price livemode before launch.
- Use separate webhook signing secrets per endpoint.
- Use separate webhook endpoints per environment.
- Do not reuse a local Stripe CLI secret in Vercel.
- Do not reuse a webhook secret from another project.
- Keep product and Price ids aligned to one Stripe account.
- Verify monthly and yearly Prices share the intended Product.
- Rotate any secret exposed in a screenshot.
- Update deployment secrets after rotation.
- Test sandbox flows before enabling live mode.

## Stripe Checkout

Checkout creation must be authenticated, constrained, and repeat-safe.

- Require an authenticated user.
- Require a same-origin mutation.
- Validate interval as monthly or yearly.
- Resolve Price ids on the server.
- Reject users with an existing active subscription.
- Reuse an existing Stripe customer.
- Use an idempotency key when creating a customer.
- Use an idempotency window for Checkout sessions.
- Set client_reference_id to the internal user id.
- Set subscription metadata to the internal user id.
- Use configured application URLs for redirects.
- Return only the Checkout URL to the browser.

## Stripe Customer Portal

Portal access must remain bound to the authenticated Stripe customer.

- Require an authenticated user.
- Require a same-origin mutation.
- Load stripeCustomerId from the database.
- Never accept a customer id from the browser.
- Return 404 when no billing account exists.
- Create portal sessions on demand.
- Use a configured return URL.
- Do not persist portal session URLs.
- Treat portal URLs as short-lived.
- Configure cancellation behavior in Stripe.
- Configure invoice history in Stripe.
- Test plan changes from the portal.

## Stripe Webhooks

Webhook processing must verify authenticity and tolerate retries.

- Read the raw request body.
- Require the Stripe-Signature header.
- Require STRIPE_WEBHOOK_SECRET.
- Verify signatures before database reads.
- Return 400 for invalid signatures.
- Record the Stripe event id.
- Treat processed event ids as duplicates.
- Avoid concurrent duplicate processing.
- Allow abandoned event locks to retry.
- Delete an event claim when processing fails.
- Return 500 to request a Stripe retry.
- Return quickly after successful processing.

## Stripe Event Coverage

Listen only to events the integration handles.

- Handle checkout.session.completed.
- Handle customer.subscription.created.
- Handle customer.subscription.updated.
- Handle customer.subscription.deleted.
- Accept invoice.paid.
- Accept invoice.payment_failed.
- Use subscription lifecycle events for entitlement state.
- Retrieve the subscription after Checkout completion.
- Resolve the user from metadata first.
- Fall back to the stored Stripe customer id.
- Reject subscriptions that cannot map to a user.
- Log event ids when processing fails.

## Subscription Synchronization

Map Stripe state explicitly into local state.

- Map every supported Stripe status to a Prisma status.
- Read the active Price from the first subscription item.
- Read period dates from the subscription item for the current API version.
- Grant Pro only for configured Pro Prices.
- Grant Pro for active subscriptions.
- Grant Pro for trialing subscriptions.
- Allow bounded past_due access only through the period end.
- Keep canceled-at-period-end users active until expiry.
- Revoke Pro for canceled subscriptions.
- Revoke Pro for unpaid subscriptions.
- Update User and Subscription atomically.
- Preserve the Stripe customer id during synchronization.

## Plans and Pricing

Plan policy belongs in lib/billing/plans.ts.

- Keep Free limits explicit.
- Keep Pro limits explicit.
- Keep file-size limits explicit.
- Keep monthly and yearly display prices aligned with Stripe.
- Do not derive authorization from displayed dollar amounts.
- Use Price ids for billing decisions.
- Keep interval labels user-readable.
- Avoid unlimited quota labels.
- Review provider cost before increasing limits.
- Review storage cost before increasing file limits.
- Update public pricing copy with policy changes.
- Update billing-page copy with policy changes.

## Usage Accounting

Quota accounting must remain atomic under concurrency.

- Use a UTC month boundary.
- Key usage by user, metric, and period.
- Reserve usage before expensive operations.
- Use a serializable transaction.
- Retry transaction conflicts a bounded number of times.
- Increment only while below the limit.
- Return 429 when the limit is exhausted.
- Release reservations after failed operations.
- Do not release successful usage.
- Never trust a client-provided usage count.
- Read the current plan inside the reservation transaction.
- Display database counts rather than client estimates.

## Free Plan

Every user begins on Free without contacting Stripe.

- Keep the User plan default set to FREE.
- Do not create a Stripe customer during signup.
- Enforce Free quotas on the server.
- Show Free status in the application shell.
- Show Free usage on the billing page.
- Offer both configured upgrade intervals.
- Do not block ordinary login when Stripe is unavailable.
- Do not require card details for Free.
- Do not represent Free as a canceled subscription.
- Keep Free behavior functional in Stripe sandbox outages.
- Test Free quota boundaries.
- Test Free-to-Pro transitions.

## Pro Plan

Pro access follows verified subscription state.

- Grant Pro only after webhook synchronization.
- Do not grant Pro from the success redirect alone.
- Show renewal or access-end dates.
- Show the Customer Portal action.
- Raise usage limits immediately after synchronization.
- Preserve current-period usage during upgrades.
- Do not reset usage to exploit plan changes.
- Test monthly subscriptions.
- Test yearly subscriptions.
- Test cancellation at period end.
- Test failed renewal behavior.
- Test re-subscription after cancellation.

## AI Providers

AI services must remain swappable and cost-aware.

- Prefer configured providers in the documented order.
- Keep provider keys server-only.
- Use explicit model environment variables.
- Set bounded upstream timeouts when supported.
- Handle provider rate limits.
- Handle provider unavailability.
- Do not return provider credentials in errors.
- Do not log full sensitive prompts unnecessarily.
- Keep mock behavior clearly marked.
- Keep parser fallback behavior deterministic.
- Count billable AI actions against usage.
- Release usage when provider calls fail.

## AI Generation

Exam generation must produce valid user-owned exams.

- Authenticate before generation.
- Validate topic, difficulty, and question count.
- Rate limit generation.
- Reserve AI_GENERATE usage.
- Generate before writing the exam.
- Attach ownerId during persistence.
- Preserve question order.
- Validate generated option arrays.
- Validate correct answer indexes.
- Return 201 after persistence.
- Release usage on provider or database failure.
- Never expose another user's generated exam.

## AI Explain and Solve

Tutoring actions are user-triggered metered operations.

- Authenticate before explaining.
- Authenticate before solving.
- Validate prompts and options.
- Rate limit each action.
- Reserve the corresponding usage metric.
- Return 429 for exhausted quota.
- Release usage on upstream failure.
- Keep answer indexes within option bounds.
- Keep confidence values within expected ranges.
- Render provider errors as user-safe messages.
- Do not treat client-supplied correct answers as authorization.
- Test both successful and failed provider calls.

## PDF Uploads

Uploads combine security, storage, extraction, parsing, and billing.

- Authenticate before reading multipart bodies.
- Rate limit upload attempts.
- Require a File object.
- Load the user's plan from the database.
- Enforce the plan-specific file-size limit.
- Reserve UPLOAD usage before side effects.
- Store PDFs only through the configured storage service.
- Avoid exposing storage credentials.
- Extract text with the server PDF service.
- Reject files without meaningful extractable text.
- Parse deterministic MCQ formats first.
- Use AI structuring only as a fallback.

## Text Imports

Pasted exam text follows the same ownership and quota rules.

- Authenticate before parsing text imports.
- Validate request JSON.
- Require meaningful content length.
- Parse numbered questions and options.
- Reject content without detectable questions.
- Reserve UPLOAD usage before persistence.
- Attach the authenticated owner.
- Preserve option order.
- Store explanations only when present.
- Return the created exam.
- Release usage on persistence failure.
- Test malformed and valid samples.

## PDF Storage

Supabase stores source PDFs; the database stores application records.

- Keep the Supabase URL configured by environment.
- Keep the anon key out of server logs.
- Use the intended storage bucket.
- Set the correct PDF content type.
- Use collision-resistant object names.
- Do not trust original filenames as paths.
- Handle storage configuration failures.
- Handle upload failures without creating exams.
- Plan orphan cleanup for files stored before later failure.
- Do not store full file bytes in PostgreSQL.
- Do not expose private objects unintentionally.
- Test storage permissions in production.

## Exam Domain

Exams are ordered collections of multiple-choice questions.

- Keep exam titles nonempty.
- Keep descriptions user-readable.
- Keep source values within the ExamSource enum.
- Attach every new exam to a user.
- Order questions by the order field.
- Require at least one question.
- Require multiple options per question.
- Keep correctIndex within the options array.
- Use cascade deletion for questions.
- Use indexed owner lookups.
- Do not expose correct answers before intended.
- Test empty and large exams.

## Attempts and Answers

Attempt data must remain consistent with the exam snapshot being graded.

- Load the user-owned exam before grading.
- Validate submitted answer maps.
- Treat omitted answers as unanswered.
- Calculate correct, wrong, and unanswered consistently.
- Calculate percentage safely for zero questions.
- Record elapsed seconds as nonnegative.
- Attach attempts to the authenticated user.
- Attach attempts to the exam.
- Create answer rows in the same write.
- Cascade answers with attempts.
- Do not accept a score calculated by the browser.
- Test skipped, correct, and incorrect answers.

## Repository Layer

Repository methods own persistence shape and ownership filters.

- Pass userId explicitly into user-scoped repository methods.
- Keep list methods user-scoped.
- Keep get methods user-scoped.
- Keep remove methods user-scoped.
- Map Prisma enums to domain values consistently.
- Map Date values to ISO strings at the boundary.
- Keep question order deterministic.
- Do not return unrelated owner data.
- Keep grading pure and separately testable.
- Avoid mixing Stripe persistence into exam repositories.
- Avoid mixing AI calls into repository methods.
- Review all callers when signatures change.

## Validation

Validate at every trust boundary.

- Use Zod for JSON request bodies.
- Use explicit enum schemas for closed values.
- Trim user-entered titles and topics.
- Reject invalid JSON with 400.
- Reject oversized arrays.
- Reject negative durations.
- Reject correct indexes outside option bounds.
- Reject unsupported file extensions when policy requires.
- Do not rely on TypeScript for runtime validation.
- Keep validation errors concise.
- Avoid echoing entire invalid payloads.
- Test boundary values.

## Error Handling

Errors should guide users and support operators.

- Return stable JSON error fields.
- Use generic public messages for internal failures.
- Log enough context to identify the operation.
- Include safe event or resource ids in logs.
- Do not log API keys.
- Do not log OAuth tokens.
- Do not log database URLs.
- Do not log full webhook secrets.
- Differentiate validation from upstream failures.
- Differentiate quota exhaustion from rate limiting.
- Preserve Stripe retry behavior with 500 responses.
- Avoid swallowing unexpected exceptions silently.

## Rate Limiting

Rate limits protect infrastructure; quotas protect product economics.

- Keep IP guards separate from monthly usage.
- Apply rate limits before expensive work.
- Use route-specific rate-limit keys.
- Use stricter limits for generation than explanations.
- Return 429 consistently.
- Do not increment monthly quota for requests rejected before reservation.
- Do not consider in-memory limits globally reliable on Vercel.
- Move to shared storage before relying on global enforcement.
- Configure Upstash only when implementation exists.
- Test burst behavior.
- Monitor false positives.
- Document production rate-limit changes.

## Environment Variables

Environment configuration is a deployment contract.

- Keep .env.example committed with empty secrets.
- Keep .env ignored.
- Keep .env.local ignored.
- Set production values in Vercel.
- Use NEXT_PUBLIC only for values safe in browsers.
- Keep STRIPE_SECRET_KEY private.
- Keep STRIPE_WEBHOOK_SECRET private.
- Keep NEXTAUTH_SECRET private.
- Keep Google client secret private.
- Keep database credentials private.
- Document every newly required variable.
- Remove template variables when the feature no longer exists.

## Secret Handling

Treat credentials as production assets.

- Never paste complete secrets into chat.
- Never place secrets in screenshots.
- Rotate secrets exposed in any medium.
- Never commit a real .env file.
- Never embed secrets in source.
- Never return secrets from APIs.
- Never send secret keys to the browser.
- Use restricted Stripe keys when practical.
- Use separate keys per environment.
- Review git diffs for credential-shaped strings.
- Keep key and service-account files ignored.
- Record rotation procedures outside source secrets.

## Gitignore Policy

Ignore local and sensitive artifacts while tracking reproducible source.

- Ignore node_modules.
- Ignore .next.
- Ignore out and build output.
- Ignore coverage output.
- Ignore real environment files.
- Track .env.example.
- Ignore .vercel.
- Ignore private key formats.
- Ignore service-account credentials.
- Ignore local logs.
- Track prisma migrations.
- Track public assets required at runtime.

## Security Headers

Preserve and review Next.js security headers.

- Keep a restrictive content security policy.
- Allow only required script sources.
- Allow only required connection targets.
- Account for Stripe redirects without weakening unrelated directives.
- Account for Google OAuth without wildcarding origins.
- Keep frame protections.
- Keep MIME sniffing protections.
- Keep referrer policy deliberate.
- Keep permissions policy deliberate.
- Test headers in production.
- Review header changes with external assets.
- Do not disable CSP to fix a local symptom.

## CSRF and Origins

Cookie-authenticated mutations require origin defense.

- Use requireSameOrigin for custom mutation routes.
- Compare parsed origins rather than raw prefixes.
- Use the configured application URL.
- Return 403 for a mismatched origin.
- Allow absent Origin only for intended non-browser clients.
- Keep Auth.js built-in protections enabled.
- Do not accept state-changing GET requests.
- Use POST for Checkout creation.
- Use POST for Portal creation.
- Use POST for resource creation and deletion actions as designed.
- Test cross-origin browser requests.
- Review proxy headers in production.

## Dependencies

Dependencies increase security and maintenance cost.

- Prefer existing packages before adding new ones.
- Use official SDKs for Stripe and established services.
- Use Lucide for UI icons.
- Pin framework versions deliberately.
- Keep Prisma packages on matching versions.
- Review package-lock changes.
- Run npm audit without blindly forcing upgrades.
- Review transitive advisories for runtime relevance.
- Read migration guides for major upgrades.
- Run the production build after framework upgrades.
- Remove dependencies no longer imported.
- Do not add packages for trivial standard-library behavior.

## Performance

Optimize measured bottlenecks without weakening correctness.

- Query only user-scoped records.
- Select only needed columns.
- Use indexes for owner and foreign-key filters.
- Avoid N plus one database queries.
- Keep Stripe calls out of ordinary Free login.
- Parse deterministic text before calling AI.
- Bound uploaded file sizes.
- Avoid shipping server libraries to the browser.
- Keep Client Components narrow.
- Use static rendering for truly static public content.
- Monitor PDF extraction latency.
- Monitor AI provider latency.

## Observability

Production behavior should be diagnosable without leaking data.

- Log operation names.
- Log safe resource ids.
- Log Stripe event ids.
- Log provider names without keys.
- Log unexpected database errors.
- Do not log full user documents.
- Do not log full AI prompts by default.
- Track webhook failure rates.
- Track payment failure events.
- Track quota rejection rates.
- Track upload processing failures.
- Add structured monitoring before relying on alerts.

## Testing Strategy

Scale tests with risk and shared behavior.

- Test pure grading logic with unit tests.
- Test parser behavior with representative fixtures.
- Test quota reservation at boundaries.
- Test quota rollback on failure.
- Test Stripe status mapping.
- Test known and unknown Price ids.
- Test webhook duplicate handling.
- Test ownership isolation.
- Test unauthenticated API access.
- Test malformed payloads.
- Test production builds.
- Keep tests deterministic.

## Manual Verification

Use manual checks for user flows not covered by automation.

- Sign in with a sandbox account.
- Confirm new users display Free.
- Upload within the Free limit.
- Confirm the fourth Free upload is rejected.
- Generate within the Free limit.
- Open monthly Stripe Checkout.
- Open yearly Stripe Checkout.
- Complete a sandbox payment.
- Confirm webhook delivery succeeds.
- Confirm the plan changes to Pro.
- Open the Customer Portal.
- Cancel at period end and verify displayed access.

## Stripe Testing

Use Stripe sandbox tools for lifecycle coverage.

- Use test cards only in sandbox.
- Test successful initial payment.
- Test declined initial payment.
- Test required authentication.
- Test successful renewal.
- Test failed renewal.
- Test subscription cancellation.
- Test immediate deletion events.
- Test duplicate webhook delivery.
- Test out-of-order subscription updates.
- Test portal plan changes.
- Inspect Stripe event delivery logs.

## Database Testing

Verify migrations and queries against realistic PostgreSQL behavior.

- Run prisma validate.
- Run Prisma Client generation.
- Check migrate status.
- Review migration SQL.
- Test a clean database migration when possible.
- Verify unique constraints.
- Verify cascade behavior.
- Verify user ownership filters.
- Verify serializable usage transactions.
- Verify period-start uniqueness.
- Verify Stripe event id uniqueness.
- Never test destructive migrations first on production.

## Build Verification

A successful dev server is not enough for deployment.

- Run npm.cmd run typecheck.
- Run npm.cmd run lint.
- Run npm.cmd run build.
- Inspect the route table.
- Confirm Stripe routes are dynamic.
- Confirm authenticated pages are dynamic.
- Confirm metadata routes are present.
- Confirm no server-only import reaches a client bundle.
- Treat font network failures separately from code failures.
- Rerun network-dependent builds with approved access.
- Stop verification servers after use.
- Report checks that could not run.

## Deployment

Deploy application code, migrations, and environment configuration together.

- Commit schema and migrations with code.
- Apply migrations before traffic depends on new columns.
- Set all required Vercel environment variables.
- Use live Stripe resources only for production.
- Configure the production webhook endpoint.
- Configure the Stripe Customer Portal in live mode.
- Verify NEXTAUTH_URL matches the production domain.
- Verify Google OAuth redirect URLs.
- Verify Supabase storage permissions.
- Run a production smoke test.
- Monitor the first webhook deliveries.
- Keep a rollback plan for application code.

## Vercel

Account for serverless runtime behavior.

- Keep database pools small.
- Do not rely on process memory for global state.
- Do not rely on local disk persistence.
- Keep route execution times bounded.
- Use Node runtime for Stripe webhook verification.
- Keep environment variables in Vercel settings.
- Do not commit .vercel metadata.
- Inspect deployment build logs.
- Verify production domains.
- Verify function regions when latency matters.
- Verify static assets after deployment.
- Test cold-start billing routes.

## Pull Requests

Make changes easy to review and safe to release.

- Keep one coherent purpose per pull request.
- Describe behavior changes.
- Describe schema changes.
- Describe migration risk.
- Describe environment variable changes.
- Include verification commands.
- Include screenshots for meaningful UI changes.
- Do not include secrets in screenshots.
- Call out destructive operations.
- Call out unresolved audit findings.
- Keep generated churn minimal.
- Request review from the relevant owner.

## Commit Messages

Use concise conventional commit messages.

- Use feat for user-visible capability.
- Use fix for corrected behavior.
- Use refactor for internal restructuring without behavior change.
- Use docs for documentation-only changes.
- Use test for test-only changes.
- Use chore for maintenance.
- Use build for dependency or build-system changes.
- Use ci for pipeline changes.
- Write subjects in the imperative mood.
- Keep subjects specific.
- Add a body for migrations or security-sensitive changes.
- Do not mention secrets in commit messages.

## Code Review

Review for behavior and risk before style.

- Check authentication.
- Check authorization.
- Check validation.
- Check transaction boundaries.
- Check idempotency.
- Check error statuses.
- Check secret exposure.
- Check migration safety.
- Check quota bypasses.
- Check cross-user access.
- Check mobile layout.
- Check missing tests.

## Incident Response

Respond to production issues with containment before optimization.

- Identify the affected environment.
- Preserve relevant logs.
- Revoke exposed credentials.
- Rotate compromised secrets.
- Disable a failing webhook destination only with a recovery plan.
- Do not delete Stripe events needed for replay.
- Do not reset the production database.
- Use a Neon branch or backup for forensic queries.
- Communicate user impact.
- Apply the smallest safe mitigation.
- Verify recovery with a smoke test.
- Document the root cause and prevention.

## Documentation

Keep documentation synchronized with real behavior.

- Document setup commands that actually work.
- Document required environment variables.
- Document Stripe sandbox setup.
- Document migration deployment.
- Remove obsolete provider references.
- Remove claims for unimplemented features.
- Keep pricing documentation current.
- Keep quota documentation current.
- Use examples without real credentials.
- Use ASCII unless existing content requires Unicode.
- Link to official provider documentation.
- Avoid duplicating volatile details across many files.

## Maintenance

Prefer small continuous cleanup over speculative infrastructure.

- Remove dead code after proving it is unused.
- Check production row counts before dropping tables.
- Remove unused environment template entries.
- Remove unused dependencies.
- Keep schema comments current.
- Keep plan constants centralized.
- Keep route errors consistent.
- Review event-ledger growth.
- Review database indexes with query patterns.
- Review provider model names periodically.
- Review framework deprecations before upgrades.
- Keep this handbook aligned with actual workflows.

## Change-Specific Verification

Match verification effort to the behavior and risk changed.

- For authentication changes, test signed-out, first-login, and returning-user flows.
- For authorization changes, test access with two different user accounts.
- For billing changes, test monthly and yearly sandbox prices.
- For billing changes, replay the same webhook event.
- For quota changes, test the last allowed action and first rejected action.
- For database changes, validate the schema and inspect generated SQL.
- For migration changes, test application from an empty database when practical.
- For route changes, test malformed, unauthenticated, forbidden, and successful requests.
- For upload changes, test supported, unsupported, empty, and oversized files.
- For parsing changes, test both text-based and scanned PDF behavior.
- For AI changes, test malformed provider output and provider failure.
- For exam changes, test empty exams and exams with multiple question types.
- For attempt changes, verify scores and selected answers persist correctly.
- For deletion changes, verify ownership and relation cleanup.
- For UI changes, inspect mobile and desktop layouts.
- For interactive changes, verify keyboard and pointer operation.
- For motion changes, verify reduced-motion behavior.
- For theme changes, inspect light and dark contrast.
- For metadata changes, verify the favicon and page metadata in a production build.
- For dependency changes, review the lockfile and affected runtime behavior.
- For environment changes, update documentation without adding real secrets.
- For deployment changes, verify Vercel runtime and environment assumptions.
- For performance changes, compare the relevant request or rendering path.
- For security changes, record the threat or failure mode being addressed.

## Repository Ownership Checks

Use these checks before crossing a module boundary.

- Keep authentication configuration in lib/auth.ts and authentication helpers.
- Keep reusable database access in lib/repository.ts or a focused server module.
- Keep the Prisma singleton and adapter construction in lib/prisma.ts.
- Keep Stripe client construction and trusted price mapping in lib/stripe.ts.
- Keep plan definitions and limits in lib/billing/plans.ts.
- Keep quota transactions in lib/billing/usage.ts.
- Keep subscription reconciliation in lib/billing/subscriptions.ts.
- Keep AI provider calls behind lib/ai/service.ts.
- Keep AI prompt construction in lib/ai/prompts.ts.
- Keep AI rate controls in lib/ai/rate-limit.ts.
- Keep parsing behavior in lib/parser.ts and PDF-specific work in lib/pdf.ts.
- Keep storage client construction in lib/supabase.ts.
- Keep request validation at route boundaries.
- Keep user-facing interaction state in focused Client Components.
- Keep authenticated page protection in the app layout and server boundaries.
- Keep shared visual primitives in components/ui.
- Keep exam-taking interaction in components/exam.
- Keep schema truth in prisma/schema.prisma.
- Keep database history in prisma/migrations.
- Keep public static assets free of credentials and private user data.

## Final Agent Checklist

- Confirm the newest user request is satisfied.
- Confirm no unrelated user changes were reverted.
- Confirm all edited files were reviewed in their final state.
- Confirm no real secret appears in the diff.
- Confirm migrations are included when the schema changed.
- Confirm Prisma Client was regenerated when required.
- Confirm lint passed.
- Confirm typecheck passed.
- Confirm the production build passed when deployable behavior changed.
- Confirm external checks used sandbox resources.
- Confirm temporary scripts and servers were removed.
- Confirm the final response states changes and verification.
