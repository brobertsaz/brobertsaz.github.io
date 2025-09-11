---
layout: post
title: "Why I Generate All My TypeScript Types (And You Should Too)"
date: 2025-01-17 09:00:00 -0700
categories: [react, typescript]
tags: [typescript, react, graphql, codegen, ruby-on-rails]
author: Bob Roberts
image: /assets/images/covers/type-safe-react-rails-pro.svg
image_alt: Type-safe React with Rails GraphQL and Codegen
image_position: center center
excerpt: "How GraphQL Code Generator saved me from runtime surprises and made my Rails + React apps much more reliable. Plus the gotchas I wish I'd known earlier."
---

I used to hand-write TypeScript interfaces for all my GraphQL queries. It was tedious, error-prone, and I constantly had mismatches between what my Rails API returned and what my React components expected.

Then I discovered GraphQL Code Generator. It's one of those tools that seems too good to be true until you actually use it.

## The problem I was trying to solve

Picture this: I'd build a feature in Rails, add some fields to a GraphQL type, then spend 20 minutes updating TypeScript interfaces across my React app. Inevitably, I'd miss one. The app would compile fine, but then I'd get `Cannot read property 'title' of undefined` at runtime.

Or worse - I'd refactor a GraphQL field on the server and forget to update the client types. Everything would seem fine until users started hitting errors in production.

## How GraphQL Code Generator changed everything

Instead of manually maintaining TypeScript types, I let the computer generate them directly from my GraphQL schema and queries. Now when I change a field in Rails, my TypeScript types update automatically.

Here's how I set it up:

```bash
npm install -D @graphql-codegen/cli @graphql-codegen/typescript \
  @graphql-codegen/typescript-operations @graphql-codegen/typescript-react-apollo
```

I add these scripts to package.json:

```json
{
  "scripts": {
    "codegen": "graphql-codegen --config codegen.yml",
    "codegen:watch": "graphql-codegen --config codegen.yml --watch"
  }
}
```

The watch mode is crucial - it regenerates types whenever I change a query or the schema changes.

My configuration file looks like this:

```yaml
# codegen.yml
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
        UUID: string
```

This tells codegen to:
1. Fetch the schema from my Rails dev server
2. Find all GraphQL queries/mutations in my React code 
3. Generate TypeScript types and React hooks

**Pro tip:** For CI builds, I generate a schema file from Rails and point to that instead of hitting the dev server:

```bash
# In Rails
bundle exec rake graphql:schema:dump
# Then use schema: schema.graphql in codegen.yml
```

## The magic happens when you write queries

I write my GraphQL queries in separate `.graphql` files:

```graphql
# src/queries/users.graphql
query GetUsers($first: Int) {
  users(first: $first) {
    nodes {
      id
      email
      name
      createdAt
    }
  }
}
```

When I run `npm run codegen`, it generates a TypeScript hook that knows exactly what this query returns:

```typescript
import { useGetUsersQuery } from '../graphql/generated';

export function UserList() {
  const { data, loading, error } = useGetUsersQuery({ 
    variables: { first: 10 } 
  });

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <ul>
      {data?.users.nodes.map(user => (
        <li key={user.id}>
          {user.name} - {user.email}
          {/* TypeScript knows these fields exist! */}
        </li>
      ))}
    </ul>
  );
}
```

The best part? If I typo a field name or try to access something that doesn't exist, TypeScript catches it at compile time.

## The nullability challenge

Here's something that tripped me up early: GraphQL is very explicit about what can be null. If you mark a field as nullable in your Rails schema, TypeScript will reflect that.

This means you end up with code like:

```typescript
// Lots of optional chaining
const userName = data?.user?.profile?.name;
```

I learned to be deliberate about nullability in my Rails GraphQL types. If a field should always exist, I mark it `null: false`:

```ruby
# In Rails GraphQL type
field :email, String, null: false
field :name, String, null: true # This one can be blank
```

For the few cases where I need to filter out nulls on the client side, I use type guards:

```typescript
const validUsers = data?.users.nodes
  .filter((user): user is NonNullable<typeof user> => Boolean(user));
```

## Custom scalars made easy

Rails has some types that don't exist in JavaScript - like UUIDs and ISO8601 dates. I map these to string types in my codegen config:

```yaml
scalars:
  UUID: string
  ISO8601DateTime: string
```

For extra type safety, I sometimes create "branded" types:

```typescript
type UserId = string & { readonly __brand: 'UserId' };
type ISO8601Date = string & { readonly __brand: 'ISO8601Date' };
```

This prevents me from accidentally passing a regular string where I expect a UUID.

## Fragments keep me organized

When the same data appears in multiple queries, I use GraphQL fragments:

```graphql
# fragments/UserCard.graphql
fragment UserCard on User {
  id
  name
  email
  avatarUrl
}
```

```graphql
# queries/dashboard.graphql
query DashboardData {
  currentUser { ...UserCard }
  recentUsers { nodes { ...UserCard } }
}
```

Codegen generates TypeScript types for fragments too, so I can reuse them in components:

```typescript
import { UserCardFragment } from '../graphql/generated';

function UserCard({ user }: { user: UserCardFragment }) {
  return (
    <div>
      <img src={user.avatarUrl} alt={user.name} />
      <h3>{user.name}</h3>
      <p>{user.email}</p>
    </div>
  );
}
```

## What I learned the hard way

**Generated types aren't magic.** They only reflect what your schema says, not what your server actually returns. I still validate important data at runtime and handle network errors gracefully.

**Keep your queries co-located.** I put GraphQL queries in the same directory as the components that use them. It makes refactoring much easier.

**Run codegen in watch mode during development.** I have `npm run codegen:watch` running alongside my dev server. When I change a query, types update instantly.

**Commit the generated files.** I used to gitignore the generated types, but that created problems in CI. Now I commit them and my build process validates they're up to date.

## The payoff

GraphQL Code Generator eliminated an entire class of bugs from my apps. I catch schema mismatches at compile time instead of in production. Refactoring became fearless - if I change a field in Rails, TypeScript tells me exactly which components need updating.

It took about a day to set up the first time, but it's saved me weeks of debugging over the past year. If you're using GraphQL with TypeScript, this is a no-brainer.
