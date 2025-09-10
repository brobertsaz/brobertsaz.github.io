---
layout: post
title: "Building a Production‑Ready Rails GraphQL API with Apollo Client and TypeScript"
date: 2025-01-10 09:00:00 -0700
categories: [rails, graphql]
tags: [ruby-on-rails, graphql, apollo, typescript, fullstack, performance]
author: Bob Roberts
image: /assets/images/covers/rails-graphql-apollo-pro.svg
image_alt: Production-ready Rails GraphQL API with Apollo Client and TypeScript
image_position: center center
excerpt: "A practical, end‑to‑end guide to shipping a production‑ready GraphQL stack: Rails (graphql‑ruby) + Apollo Client + TypeScript with caching, pagination, error handling, and deployment tips."
---



Rails + GraphQL + Apollo + TypeScript is a powerful stack for modern product teams. This guide walks through production‑grade setup, from schema design in Rails to a robust Apollo Client configuration in a React/TypeScript app.

### From my projects (opinionated)

- I prefer the built‑in GraphQL::Dataloader over graphql-batch because it’s integrated, easier to reason about, and reduces gem surface area.
- In my projects, I default to Relay‑style cursor pagination for anything user‑visible; offset pagination only for admin/reporting where exactness beats UX.
- Here’s where this bites you: nested N+1s hide in fields you don’t suspect (think counts, owner lookups). Add dataloader early and write a regression for any N+1 you fix.
- I prefer explicit type policies in Apollo (keyArgs, merge) because silent cache misses lead to “ghost” UI bugs later.
- In my Rails apps (Rails 7 + Ruby 3.x), I keep GraphQL controller fast: authenticate early, memoize current_user, and short‑circuit before hitting resolvers when possible.

## Why GraphQL with Rails?

- Strong conventions and velocity from Rails
- GraphQL’s client‑driven queries reduce over/under‑fetching
- First‑class TypeScript types for safer React
- Natural fit for mobile and micro‑frontend consumers

## Rails Setup (graphql‑ruby)

Add gems and initialize GraphQL:

```ruby
# Gemfile
gem 'graphql'
# Optional but recommended
gem 'graphiql-rails', group: :development
```

```bash
bundle install
rails generate graphql:install
```

This creates:

- `app/graphql/types/*` type system
- `app/graphql/mutations/*`
- `app/graphql/queries/*`
- `app/controllers/graphql_controller.rb`

### Example Type and Query

```ruby
# app/graphql/types/user_type.rb
module Types
  class UserType < Types::BaseObject
    field :id, ID, null: false
    field :email, String, null: false
    field :name, String, null: true
    field :created_at, GraphQL::Types::ISO8601DateTime, null: false
  end
end
```

```ruby
# app/graphql/queries/users_query.rb
module Queries
  class UsersQuery < Queries::BaseQuery
    type [Types::UserType], null: false
    def resolve
      User.order(created_at: :desc).limit(50)
    end
  end
end
```

```ruby
# app/graphql/types/query_type.rb
module Types
  class QueryType < Types::BaseObject
    field :users, [Types::UserType], null: false, resolver: Queries::UsersQuery
  end
end
```

## Authorization & N+1 Avoidance

- Use `pundit`/`cancancan` in resolvers or at model layer; raise GraphQL::ExecutionError for forbidden access
- Use `graphql-batch` or `GraphQL::Dataloader` to batch queries and avoid N+1

```ruby
# app/graphql/queries/base_query.rb
module Queries
  class BaseQuery < GraphQL::Schema::Resolver
    def pundit_authorize!(record, query)
      Pundit.authorize!(context[:current_user], record, query)
    end
  end
end
```

```ruby
# app/graphql/types/user_type.rb (with dataloader)
field :posts_count, Integer, null: false

def posts_count
  dataloader.with(Sources::Association, :posts).load(object).size
end
```

## Error Handling Strategy

Return safe, actionable messages and log details server‑side:

```ruby
rescue_from ActiveRecord::RecordNotFound do |err|
  raise GraphQL::ExecutionError, "Not found"
end

rescue_from Pundit::NotAuthorizedError do
  raise GraphQL::ExecutionError, "You are not authorized to perform this action"
end
```

## Pagination (Relay‑style)

Install connections for cursor pagination:

```ruby
# app/graphql/types/query_type.rb
field :users, Types::UserType.connection_type, null: false
```

```graphql
# Example client query
query Users($first: Int, $after: String) {
  users(first: $first, after: $after) {
    edges { node { id email name } }
    pageInfo { hasNextPage endCursor }
  }
}
```

## React + Apollo + TypeScript

Install client deps:

```bash
npm i @apollo/client graphql
```

Initialize Apollo Client with sane defaults:

```ts
// apollo/client.ts
import { ApolloClient, InMemoryCache, HttpLink, from } from '@apollo/client';
import { onError } from '@apollo/client/link/error';

const httpLink = new HttpLink({ uri: '/graphql', credentials: 'include' });

const errorLink = onError(({ graphQLErrors, networkError }) => {
  if (graphQLErrors) graphQLErrors.forEach(e => console.warn('[GraphQL]', e.message));
  if (networkError) console.error('[Network]', networkError);
});

export const client = new ApolloClient({
  link: from([errorLink, httpLink]),
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          users: {
            keyArgs: false,
            merge(existing = { edges: [] }, incoming) {
              return { ...incoming, edges: [...(existing.edges || []), ...incoming.edges] };
            }
          }
        }
      }
    }
  })
});
```

Use in app:

```tsx
// main.tsx
import { ApolloProvider } from '@apollo/client';
import { client } from './apollo/client';

export function App() {
  return (
    <ApolloProvider client={client}>
      {/* routes */}
    </ApolloProvider>
  );
}
```

## Type Safety with Codegen (Preview)

Use GraphQL Code Generator to emit TS types and hooks (see dedicated post):

```bash
npm i -D @graphql-codegen/cli @graphql-codegen/typescript @graphql-codegen/typescript-operations @graphql-codegen/typescript-react-apollo
```

## Caching Tips

- Normalize by `id` fields; avoid arrays of primitives where possible
- Use field policies to merge paginated results
- Invalidate cache via `cache.modify` after mutations

## Deployment Notes

- Serve `POST /graphql` behind Rack::Attack and rate limits
- Enable response compression (Rack::Deflater)
- Use ETags on persisted queries or CDN caching if applicable
- Add request timeouts and circuit breakers for external calls

## Final Thoughts

Rails + GraphQL + Apollo + TypeScript is a strong default for product teams who value velocity and safety. Start simple, add complexity (subscriptions, persisted queries) only when metrics justify it.
