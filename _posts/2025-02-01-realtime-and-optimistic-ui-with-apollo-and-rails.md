---
layout: post
title: "Real‑Time and Optimistic UI with Apollo and Rails (ActionCable & Subscriptions)"
date: 2025-02-01 09:00:00 -0700
categories: [react, realtime]
tags: [apollo, optimistic-ui, subscriptions, actioncable, anycable, rails]
author: Bob Roberts
image: /assets/images/covers/realtime-optimistic-ui-pro.svg
image_alt: Real-time and optimistic UI with Apollo Client and Rails
image_position: center center
excerpt: "Make your app feel instant. Implement optimistic updates, live queries, and GraphQL subscriptions with Apollo Client and Rails (ActionCable or AnyCable)."
---



Fast UIs aren’t just about server speed—they’re about perceived speed. With Apollo’s optimistic updates and Rails subscriptions over ActionCable, you can deliver instant feedback and live data.

### What’s worked best for me

- I prefer optimistic UI for tactile actions (create/toggle/like) and only add subscriptions when users need true live data (chat, dashboards).
- In my projects, AnyCable replaces ActionCable once WS concurrency climbs; it’s a painless swap with graphql-ruby.
- Here’s where this bites you: orphaned optimistic items if a mutation fails. I keep IDs stable and roll back in `onError`.
- I also guard against duplicate feed entries by deduping in cache `merge` functions and keeping cache size in check with periodic GC.

## Optimistic Updates

```ts
// optimistic creation
useMutation(CREATE_POST, {
  optimisticResponse: ({ input }) => ({
    createPost: {
      __typename: 'CreatePostPayload',
      post: { __typename: 'Post', id: 'temp-id', title: input.title, body: input.body }
    }
  }),
  update(cache, { data }) {
    const newPost = data?.createPost?.post;
    cache.modify({
      fields: {
        posts(existing = { edges: [] }) {
          return { ...existing, edges: [{ __typename: 'PostEdge', node: newPost }, ...existing.edges] };
        }
      }
    });
  }
});
```

Tips:

- Prefer optimistic responses for tactile actions (create, toggle, like)
- Roll back on error in the `onError` callback

## GraphQL Subscriptions with Rails

`graphql-ruby` supports ActionCable subscriptions out of the box.

```ruby
# app/graphql/types/subscription_type.rb
class Types::SubscriptionType < Types::BaseObject
  field :post_created, Types::PostType, null: false
end
```

```ruby
# anywhere in app after create
MySchema.subscriptions.trigger(:post_created, {}, @post)
```

Client side with Apollo:

```ts
import { split, HttpLink } from '@apollo/client';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { createClient } from 'graphql-ws';
import { getMainDefinition } from '@apollo/client/utilities';

const httpLink = new HttpLink({ uri: '/graphql', credentials: 'include' });

const wsLink = new GraphQLWsLink(createClient({ url: 'wss://example.com/cable' }));

const splitLink = split(
  ({ query }) => {
    const def = getMainDefinition(query);
    return def.kind === 'OperationDefinition' && def.operation === 'subscription';
  },
  wsLink,
  httpLink
);
```

```ts
// subscription usage
const POST_CREATED = gql`
  subscription { postCreated { id title body } }
`;

useSubscription(POST_CREATED, {
  onData: ({ client, data }) => {
    const post = data.data?.postCreated;
    client.cache.modify({
      fields: {
        posts(existing = { edges: [] }) {
          return { ...existing, edges: [{ __typename: 'PostEdge', node: post }, ...existing.edges] };
        }
      }
    });
  }
});
```

## AnyCable for Scale

For high concurrency, swap ActionCable for AnyCable:

- Offloads WS handling to Go (AnyCable‑Go)
- Keeps your Ruby app focused on business logic
- Drop‑in compatible with `graphql-ruby` subscriptions

## Live Queries (Polling)

When subscriptions are overkill, use lightweight `pollInterval` or manual `refetch`.

```ts
useQuery(POSTS, { pollInterval: 10_000 });
```

## Reliability Checklist

- [x] Reconnect logic for websockets (exponential backoff)
- [x] Server heartbeats and ping/pong timeouts
- [x] Idempotent optimistic updates (stable IDs, dedupe by ID)
- [x] Cache GC to avoid unbounded growth

With the right mix of optimistic UI and realtime, your app feels instantaneous—even when the network isn’t.
