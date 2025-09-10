---
layout: post
title: "Type‑Safe React with Rails GraphQL: Codegen for Zero‑Runtime Surprises"
date: 2025-01-17 09:00:00 -0700
categories: [react, typescript]
tags: [typescript, react, graphql, codegen, ruby-on-rails]
author: Bob Roberts
image: /assets/images/covers/type-safe-react-rails-pro.svg
image_alt: Type-safe React with Rails GraphQL and Codegen
image_position: center center
excerpt: "How to wire GraphQL Code Generator with a Rails (graphql‑ruby) schema to get end‑to‑end type safety, generated hooks, and faster developer feedback."
---



Type safety is only as strong as your weakest boundary. With GraphQL Code Generator, we can turn our Rails schema into first‑class TypeScript types and ergonomic React hooks.

### Why I lean hard on codegen

- I prefer fragments‑first documents because they make co‑location natural and keep generated types composable.
- In my projects, I run `codegen:watch` in dev and commit the generated output. CI blocks merges when schema drift isn’t reflected in types.
- Here’s where this bites you: GraphQL nullability. If the server makes a field nullable, your optional‑chaining spiderweb grows. I lock nullability in the schema where possible, and narrow aggressively in React.
- I prefer mapping custom scalars (UUID, ISO8601DateTime) to branded string types to catch mixups at compile time without overhead at runtime.

## Install Codegen

```bash
npm i -D @graphql-codegen/cli @graphql-codegen/typescript \
  @graphql-codegen/typescript-operations @graphql-codegen/typescript-react-apollo
```

Add scripts:

```json
{
  "scripts": {
    "codegen": "graphql-codegen --config codegen.yml",
    "codegen:watch": "graphql-codegen --config codegen.yml --watch"
  }
}
```

## Create codegen.yml

```yaml
schema: http://localhost:3000/graphql
documents: "src/**/*.{ts,tsx,graphql}"
generates:
  src/graphql/generated.tsx:
    plugins:
      - typescript
      - typescript-operations
      - typescript-react-apollo
    config:
      withHooks: true
      scalars:
        ISO8601DateTime: string
        JSON: Record<string, unknown>
        UUID: string
```

Tip: In CI, point `schema:` to a dumped SDL file committed by Rails:

```bash
# Rails
bundle exec rake graphql:schema:dump
# use schema: schema.graphql in codegen.yml
```

## Author Operations

```graphql
# src/graphql/queries/users.graphql
query Users($first: Int, $after: String) {
  users(first: $first, after: $after) {
    edges { node { id email name } }
    pageInfo { hasNextPage endCursor }
  }
}
```

Run:

```bash
npm run codegen
```

This emits fully typed hooks:

```ts
import { useUsersQuery } from './graphql/generated';

export function UsersList() {
  const { data, loading, fetchMore } = useUsersQuery({ variables: { first: 20 } });
  if (loading) return <p>Loading...</p>;
  return (
    <ul>
      {data?.users.edges?.map(e => (
        <li key={e?.node?.id}>{e?.node?.email}</li>
      ))}
    </ul>
  );
}
```

## Handling Nullability

GraphQL nullability propagates to your types. Prefer `null: false` on Rails fields when appropriate, and in React, narrow:

```ts
const edges = data?.users.edges?.filter((e): e is NonNullable<typeof e> => Boolean(e));
```

## Custom Scalars

Map Rails scalars to TS types in `config.scalars`. For complex shapes, create brand types:

```ts
type ISO8601 = string & { readonly __brand: 'ISO8601' };
```

## Fragments for Reuse

Encapsulate shared shapes:

```graphql
fragment UserCard on User { id name email }
```

```graphql
query Users { users(first: 20) { edges { node { ...UserCard } } } }
```

## Runtime Safety Still Matters

Types don’t replace runtime guards. Validate user input server‑side, handle network errors, and design your cache policies to avoid stale data.

## Developer Experience Checklist

- [x] `codegen:watch` running in dev
- [x] ESLint + `@graphql-eslint/eslint-plugin` for documents
- [x] CI job verifies schema changes regenerate types

With codegen in place, your React codebase gets the confidence boost of compile‑time breakage instead of Friday‑night runtime surprises.
