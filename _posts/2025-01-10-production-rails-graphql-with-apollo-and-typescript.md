---
layout: post
title: "My Journey Building a GraphQL API with Rails and Apollo"
date: 2025-01-10 09:00:00 -0700
categories: [rails, graphql]
tags: [ruby-on-rails, graphql, apollo, typescript, fullstack, performance]
author: Bob Roberts
image: /assets/images/covers/rails-graphql-apollo-pro.svg
image_alt: Production-ready Rails GraphQL API with Apollo Client and TypeScript
image_position: center center
excerpt: "What I learned building a GraphQL API that actually works in production. The mistakes I made, the tools that saved me, and why I'd choose this stack again."
---

Last year I convinced my team to try GraphQL for our new Rails API. "It'll be great," I said. "The frontend can request exactly the data it needs."

Six months later, we had a working GraphQL API serving a React/TypeScript app in production. But getting there taught me more about GraphQL than any tutorial ever did.

## Why we chose GraphQL (and why we almost regretted it)

Our Rails API was growing messy. We had endpoints like `/api/users`, `/api/users/:id/posts`, `/api/users/:id/posts/:id/comments`. Each one returned slightly different data depending on what the frontend needed.

GraphQL promised to fix this. One endpoint, flexible queries, better developer experience. It delivered on those promises, but not without some pain.

**The good:** Our React components could request exactly what they needed. No more over-fetching user avatars for list views or under-fetching when we needed detailed profiles.

**The challenging:** GraphQL has more moving parts than REST. Schema design matters. Caching is different. N+1 queries are easy to introduce and hard to spot.

## Getting started with graphql-ruby

The Rails setup was straightforward. I added the gem and ran the generator:

```ruby
# Gemfile
gem 'graphql'
gem 'graphiql-rails', group: :development # GraphQL IDE
```

```bash
bundle install
rails generate graphql:install
```

This created the basic structure I needed. My first GraphQL type looked like this:

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

Simple enough. Then I created a query to fetch users:

```ruby
# app/graphql/types/query_type.rb
module Types
  class QueryType < Types::BaseObject
    field :users, [Types::UserType], null: false
    
    def users
      User.all
    end
  end
end
```

That `User.all` would come back to haunt me, but it worked for the demo.

## The N+1 problem hit us hard

Our first production GraphQL queries were slow. Really slow. A simple query to fetch users and their post counts was taking 2+ seconds.

The problem was classic N+1 queries. For every user, Rails was making a separate query to count their posts:

```sql
SELECT * FROM users;
SELECT COUNT(*) FROM posts WHERE user_id = 1;
SELECT COUNT(*) FROM posts WHERE user_id = 2;
-- ... and so on
```

I learned about GraphQL::Dataloader the hard way. It batches database queries automatically:

```ruby
# app/graphql/types/user_type.rb
class UserType < Types::BaseObject
  field :posts_count, Integer, null: false
  
  def posts_count
    # This batches queries across all users in the request
    dataloader.with(Sources::AssociationCount, :posts).load(object)
  end
end
```

```ruby
# app/graphql/sources/association_count.rb
class Sources::AssociationCount < GraphQL::Dataloader::Source
  def initialize(association_name)
    @association_name = association_name
  end
  
  def fetch(objects)
    # Batch count queries for all objects at once
    counts = @association_name.to_s.classify.constantize
             .where("#{@association_name.to_s.singularize}_id": objects.map(&:id))
             .group("#{@association_name.to_s.singularize}_id")
             .count
    
    objects.map { |obj| counts[obj.id] || 0 }
  end
end
```

That 2-second query dropped to 200ms.

## Error handling that doesn't leak secrets

Early on, our GraphQL errors exposed too much. A failed database query would return the raw SQL error to the client.

I learned to be careful about what errors reach users:

```ruby
# app/graphql/my_schema.rb
class MySchema < GraphQL::Schema
  rescue_from ActiveRecord::RecordNotFound do |err, obj, args, ctx, field|
    raise GraphQL::ExecutionError, "Not found"
  end
  
  rescue_from ActiveRecord::RecordInvalid do |err, obj, args, ctx, field|
    # Log the real error for debugging
    Rails.logger.error "GraphQL validation error: #{err.message}"
    raise GraphQL::ExecutionError, "Invalid input"
  end
end
```

For authorization, I integrated Pundit:

```ruby
def users
  # Only return users the current user can see
  Pundit.policy_scope(context[:current_user], User)
end
```

## Pagination without the headaches

Our user list grew to thousands of records. Loading them all at once killed the browser.

GraphQL's cursor-based pagination (Relay-style) was confusing at first, but it's much better than offset pagination for real-time data:

```ruby
# app/graphql/types/query_type.rb
field :users, Types::UserType.connection_type, null: false

def users
  User.order(:created_at)
end
```

On the client side, Apollo handles most of the complexity:

```graphql
query GetUsers($first: Int, $after: String) {
  users(first: $first, after: $after) {
    edges {
      node {
        id
        name
        email
      }
    }
    pageInfo {
      hasNextPage
      endCursor
    }
  }
}
```

The `edges` and `nodes` structure felt weird at first, but it's consistent and works well with Apollo's caching.

## The Apollo Client setup that actually works

On the frontend, I needed Apollo Client to talk to my Rails GraphQL endpoint. The basic setup was straightforward:

```bash
npm install @apollo/client graphql
```

But the configuration took some trial and error:

```typescript
// apollo/client.ts
import { ApolloClient, InMemoryCache, HttpLink, from } from '@apollo/client';
import { onError } from '@apollo/client/link/error';

const httpLink = new HttpLink({ 
  uri: '/graphql', 
  credentials: 'include' // Important for Rails sessions
});

const errorLink = onError(({ graphQLErrors, networkError }) => {
  if (graphQLErrors) {
    graphQLErrors.forEach(error => {
      console.error('GraphQL error:', error.message);
    });
  }
  if (networkError) {
    console.error('Network error:', networkError);
  }
});

export const client = new ApolloClient({
  link: from([errorLink, httpLink]),
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          users: {
            // This merges paginated results
            merge(existing = { edges: [] }, incoming) {
              return {
                ...incoming,
                edges: [...existing.edges, ...incoming.edges]
              };
            }
          }
        }
      }
    }
  })
});
```

The `typePolicies` configuration was crucial for pagination to work correctly. Without it, Apollo would replace the entire list instead of appending new items.

## TypeScript integration that saves your sanity

I wrote about GraphQL Code Generator in detail [in another post]({% post_url 2025-01-17-type-safe-react-with-rails-graphql-and-codegen %}), but it's worth mentioning here because it transformed how I work with GraphQL.

Instead of manually writing TypeScript interfaces that drift out of sync with my schema, I generate them automatically from my GraphQL queries. It caught so many bugs before they reached production.

## What I learned about caching

Apollo's cache is powerful but requires understanding. The key insight: it normalizes data by `id` fields automatically. So this query:

```graphql
query {
  user(id: "1") { id name email }
  users { nodes { id name email } }
}
```

Only stores each user once in the cache. Update the user in one place, and it updates everywhere.

But mutations need help. After creating a user, I had to tell Apollo to update the cache:

```typescript
const [createUser] = useMutation(CREATE_USER, {
  update(cache, { data }) {
    cache.modify({
      fields: {
        users(existing = { edges: [] }) {
          const newEdge = {
            __typename: 'UserEdge',
            node: data?.createUser?.user
          };
          return {
            ...existing,
            edges: [newEdge, ...existing.edges]
          };
        }
      }
    });
  }
});
```

## Production lessons

**Rate limiting is essential.** GraphQL queries can be expensive. I use Rack::Attack to limit query complexity and request rates.

**Monitor query performance.** I log slow GraphQL queries just like slow SQL queries. Some client queries are accidentally expensive.

**Start simple.** I didn't need subscriptions or persisted queries on day one. I added them when the use case was clear.

---

GraphQL with Rails and Apollo has been worth the learning curve. The developer experience is genuinely better than REST for complex UIs. But it's not magic - you still need to think about performance, caching, and security.

Would I choose this stack again? Absolutely. But next time I'd spend more time up front on monitoring and performance tooling.
