---
layout: post
title: "Making Apps Feel Instant: My Experience with Realtime Rails and Apollo"
date: 2025-02-01 09:00:00 -0700
categories: [react, realtime]
tags: [apollo, optimistic-ui, subscriptions, actioncable, anycable, rails]
author: Bob Roberts
image: /assets/images/covers/realtime-optimistic-ui-pro.svg
image_alt: Real-time and optimistic UI with Apollo Client and Rails
image_position: center center
excerpt: "Lessons learned from building realtime features with Apollo and Rails. When optimistic UI works great, when it doesn't, and why I switched to AnyCable."
---

I've been working on a dashboard app lately that needed to feel snappy. You know the feeling when you click "Save" and nothing happens for a second? That pause where users wonder if they actually clicked the button? I wanted to eliminate that.

Turns out, making UIs feel instant isn't just about making the server faster. It's about making smart choices about what to show users while they wait.

## The optimistic UI revelation

A few months ago I was building a simple task management feature. Users could create tasks, toggle them complete, delete them. Standard stuff. But every action felt sluggish because users had to wait for the server response before seeing any change.

Then I discovered Apollo's optimistic responses. Game changer.

Here's what made the difference. Instead of waiting for the server, I started showing users what they expected to see immediately:

```javascript
// When someone creates a new task, show it right away
const [createTask] = useMutation(CREATE_TASK, {
  optimisticResponse: ({ input }) => ({
    createTask: {
      id: `temp-${Date.now()}`, // temporary ID
      title: input.title,
      completed: false,
      __typename: 'Task'
    }
  }),
  onError: (error) => {
    // Oops, something went wrong - the UI automatically rolls back
    console.error('Failed to create task:', error.message);
  }
});
```

The difference was night and day. Click "Add Task" and boom - it's there. No waiting. If something goes wrong on the server, Apollo handles rolling back the optimistic change.

But I learned the hard way that optimistic UI isn't magic. It works great for simple actions like creating, toggling, or deleting. But I tried to get too clever with complex forms and nested relationships. That's where things got messy.

## When optimistic UI isn't enough

Optimistic updates work great when you're the only one changing data. But what about when multiple users are working on the same thing? That's where I needed real-time subscriptions.

I was building a collaborative feature where team members could see each other's changes live. ActionCable made this surprisingly straightforward with Rails:

```ruby
# In my Rails GraphQL schema
class Types::SubscriptionType < Types::BaseObject
  field :task_updated, Types::TaskType, null: false
end

# After updating a task anywhere in the app
MySchema.subscriptions.trigger(:task_updated, {}, updated_task)
```

On the client side, I had to set up Apollo to handle both regular HTTP requests and WebSocket subscriptions:

```javascript
// This took me a while to get right
const wsLink = new GraphQLWsLink(
  createClient({ url: 'ws://localhost:3000/cable' })
);

const splitLink = split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    return (
      definition.kind === 'OperationDefinition' &&
      definition.operation === 'subscription'
    );
  },
  wsLink,
  httpLink
);
```

The magic happened when I subscribed to updates:

```javascript
useSubscription(TASK_UPDATED, {
  onData: ({ data }) => {
    // Someone else updated a task - show it immediately
    const updatedTask = data.data?.taskUpdated;
    // Apollo automatically updates the cache
  }
});
```

## The ActionCable bottleneck

Everything worked great in development and with a few users. But when I load-tested with a couple hundred concurrent WebSocket connections, ActionCable started to struggle. Ruby isn't great at handling tons of concurrent connections.

That's when I discovered AnyCable. It's a drop-in replacement that offloads WebSocket handling to a Go process while keeping all my Rails business logic intact. The switch was painless - just changed my cable config and started the AnyCable-Go server.

The performance difference was dramatic. What used to choke at 200 connections now handled thousands without breaking a sweat.

## Sometimes simple polling is better

Not everything needs WebSockets. For data that updates occasionally - like user counts or notification badges - I just use Apollo's polling feature:

```javascript
const { data } = useQuery(GET_NOTIFICATION_COUNT, {
  pollInterval: 30000 // Check every 30 seconds
});
```

It's simpler, more reliable, and puts less strain on the server.

## Lessons learned the hard way

Building realtime features taught me a few things:

**Optimistic UI is great, but have a rollback plan.** I spent hours debugging "ghost" items that appeared when mutations failed silently.

**WebSockets are stateful and fragile.** Always handle reconnections gracefully. Users close laptops, switch networks, go through tunnels.

**Not everything needs to be realtime.** I got carried away and made every little thing live. Some data is fine being a few seconds stale.

**Test with real network conditions.** Everything works great on localhost. Try it on a flaky mobile connection.

---

The combination of optimistic UI and selective realtime updates has made my apps feel much more responsive. Users notice the difference immediately. The key is being thoughtful about when to use each technique.
