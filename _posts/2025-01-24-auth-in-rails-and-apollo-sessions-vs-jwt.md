---
layout: post
title: "The Authentication Dilemma: Sessions vs JWTs in Rails"
date: 2025-01-24 09:00:00 -0700
categories: [security, rails]
tags: [authentication, authorization, jwt, sessions, apollo, react, csrf]
author: Bob Roberts
image: /assets/images/covers/auth-sessions-vs-jwt-pro.svg
image_alt: "Authentication in Rails and Apollo: Sessions vs JWT"
image_position: center top
excerpt: "Why I usually stick with boring cookie sessions, when I reach for JWTs, and the authentication mistakes that taught me lessons the hard way."
---

I've been building Rails apps for over a decade now, and I've probably implemented user authentication about fifty different ways. Most of those attempts were overly complicated. I've learned that when it comes to auth, boring usually wins.

Last year I was working on a new Rails app with a React frontend. The team immediately started debating: "Should we use JWTs or stick with Rails sessions?" Everyone had strong opinions, most based on blog posts they'd read rather than real experience.

Here's what I've learned from actually shipping both approaches.

## Why I usually stick with sessions

For most Rails apps I build, I reach for good old cookie-based sessions first. They're built into Rails, they work with ActionCable out of the box, and I get security features for free.

Here's my typical setup:

```ruby
# config/initializers/session_store.rb
Rails.application.config.session_store :cookie_store,
  key: '_myapp_session',
  same_site: :lax,
  secure: Rails.env.production?,
  httponly: true
```

The `httponly: true` means JavaScript can't access the session cookie. That's a good thing - XSS attacks can't steal it. The `same_site: :lax` helps prevent CSRF attacks.

But here's the catch with single-page apps: you still need CSRF protection for state-changing requests:

```ruby
# app/controllers/application_controller.rb
class ApplicationController < ActionController::Base
  protect_from_forgery with: :exception
  
  def current_user
    @current_user ||= User.find(session[:user_id]) if session[:user_id]
  end
end
```

I expose the CSRF token to my React app through a meta tag:

```erb
<!-- app/views/layouts/application.html.erb -->
<meta name="csrf-token" content="<%= form_authenticity_token %>">
```

On the Apollo side, I need to include credentials with every request and add the CSRF token:

```javascript
// apollo/client.js
import { HttpLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';

const httpLink = new HttpLink({ 
  uri: '/graphql', 
  credentials: 'include' // This sends cookies with every request
});

const csrfLink = setContext((_, { headers }) => {
  const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
  return {
    headers: {
      ...headers,
      'X-CSRF-Token': token || ''
    }
  };
});

export const client = new ApolloClient({
  link: from([csrfLink, httpLink]),
  cache: new InMemoryCache()
});
```

This approach is boring, but it works. The browser handles everything automatically, and I don't have to worry about token storage or expiration.

## When I reach for JWTs

I only use JWTs when I have a specific need they solve:

1. **Cross-domain requests** - My API is on a different domain than my frontend
2. **Mobile apps** - Cookies don't work as nicely in native apps
3. **Multiple services** - I need to verify users across different backend services

But JWTs come with complexity. Here's a basic implementation I've used:

```ruby
# Gemfile
gem 'jwt'

# app/services/auth_service.rb
class AuthService
  SECRET = Rails.application.credentials.jwt_secret
  
  def self.encode(user_id)
    payload = {
      sub: user_id,
      exp: 2.hours.from_now.to_i
    }
    JWT.encode(payload, SECRET, 'HS256')
  end
  
  def self.decode(token)
    payload, = JWT.decode(token, SECRET, true, { algorithm: 'HS256' })
    payload['sub']
  rescue JWT::DecodeError
    nil
  end
end
```

In my ApplicationController:

```ruby
class ApplicationController < ActionController::Base
  private
  
  def current_user
    @current_user ||= find_user_from_token
  end
  
  def find_user_from_token
    token = request.headers['Authorization']&.split(' ')&.last
    return nil unless token
    
    user_id = AuthService.decode(token)
    User.find(user_id) if user_id
  end
end
```

On the client side, I store the JWT and include it with every request:

```javascript
// apollo/client.js
import { setContext } from '@apollo/client/link/context';

const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem('authToken');
  return {
    headers: {
      ...headers,
      Authorization: token ? `Bearer ${token}` : ''
    }
  };
});

export const client = new ApolloClient({
  link: from([authLink, httpLink]),
  cache: new InMemoryCache()
});
```

But here's where JWTs get tricky...

## The JWT complexity spiral

JWTs seem simple at first, but they get complicated fast. Here are the problems I've run into:

**You can't revoke them easily.** If someone steals a JWT, it's valid until it expires. With sessions, I can just delete the session from my database.

**Token refresh is annoying.** Short-lived tokens mean you need a refresh mechanism. I've built systems with refresh tokens stored as httpOnly cookies, but at that point, why not just use sessions?

**Storage is tricky.** localStorage persists across browser sessions but is vulnerable to XSS. sessionStorage gets cleared when users close tabs. Cookies are back to the same-site restrictions.

**Clock skew causes weird bugs.** If your server and client clocks are off, tokens might be "expired" before they should be.

## What I actually do

For 90% of the Rails apps I build, I use cookie sessions with CSRF protection. It's boring, but it works reliably.

I only reach for JWTs when I have a genuine cross-domain need or I'm building a native mobile app. And when I do use JWTs, I keep them short-lived (30 minutes max) and implement a proper refresh token system.

## One mistake that taught me a lesson

A few years back, I built a system that stored JWTs in localStorage and made them long-lived (24 hours) to avoid the refresh complexity. A penetration test later revealed that a single XSS vulnerability could steal user tokens for an entire day.

I switched back to short-lived tokens with httpOnly refresh cookies. But at that point, I was basically reinventing sessions with extra steps.

---

Authentication doesn't have to be exciting. Sometimes the boring, well-tested approach is exactly what you need.
