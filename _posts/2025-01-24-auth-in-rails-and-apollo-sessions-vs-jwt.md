---
layout: post
title: "Authentication for Rails + Apollo: Secure Sessions vs JWT (and How to Implement Both)"
date: 2025-01-24 09:00:00 -0700
categories: [security, rails]
tags: [authentication, authorization, jwt, sessions, apollo, react, csrf]
author: Bob Roberts
image: /assets/images/covers/auth-sessions-vs-jwt-pro.svg
image_alt: "Authentication in Rails and Apollo: Sessions vs JWT"
image_position: center top
excerpt: "A pragmatic guide to user auth in a Rails API consumed by a React/Apollo/TypeScript app: secure cookies + CSRF vs JWT tokens, trade‑offs, and reference snippets."
---



There’s no one‑size‑fits‑all auth. Here’s how to choose between secure cookie‑based sessions and JWTs for a Rails API with a React/Apollo front‑end—and how to implement each safely.

### My defaults in the wild

- I prefer secure cookie sessions for browser apps on the same domain because revocation and rotation are simpler and you get HttpOnly + SameSite defenses for free.
- In my projects, Apollo is set to `credentials: 'include'` and mutations carry the CSRF token. This is boring—and boring is secure.
- Here’s where this bites you: CSRF tokens missing on first request after deploy (asset pipeline/layout changes). I add a tiny healthcheck that asserts the token is present.
- I reach for JWTs when I truly need cross‑domain or native clients. Budget time for refresh‑token rotation, blacklist storage, clock‑skew, and CORS preflights.

## Option A: Cookie Sessions (Recommended by Default)

Pros: Mature, revocable, leverages browser security features (SameSite/HttpOnly).

### Rails

```ruby
# config/initializers/session_store.rb
Rails.application.config.session_store :cookie_store,
  key: '_app_session',
  same_site: :lax,
  secure: Rails.env.production?,
  httponly: true
```

Protect against CSRF:

```ruby
# app/controllers/application_controller.rb
class ApplicationController < ActionController::Base
  protect_from_forgery with: :exception
end
```

Expose CSRF token for SPA:

```erb
<!-- app/views/layouts/application.html.erb -->
<meta name="csrf-token" content="<%= form_authenticity_token %>">
```

### Apollo Client

```ts
// apollo/link.ts
import { HttpLink } from '@apollo/client';
export const httpLink = new HttpLink({ uri: '/graphql', credentials: 'include' });
```

Include CSRF on mutations via header:

```ts
import { setContext } from '@apollo/client/link/context';

const csrfToken = () => document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';

export const csrfLink = setContext((_, { headers }) => ({
  headers: { ...headers, 'X-CSRF-Token': csrfToken() }
}));
```

Chain links: `from([errorLink, csrfLink, httpLink])`.

## Option B: JWTs (Good for native clients / multiple domains)

Pros: First‑class across domains; works well with mobile; no CSRF. Cons: Revocation/rotation complexity.

### Rails (JWT)

```ruby
# Gemfile
gem 'jwt'
```

```ruby
# app/services/jwt_issuer.rb
class JwtIssuer
  SECRET = Rails.application.credentials.jwt_secret
  def self.issue(user_id)
    exp = 30.minutes.from_now.to_i
    JWT.encode({ sub: user_id, exp: exp }, SECRET, 'HS256')
  end
end
```

```ruby
# app/middlewares/jwt_auth.rb
class JwtAuth
  def initialize(app); @app = app; end
  def call(env)
    token = env['HTTP_AUTHORIZATION']&.split(' ')&.last
    return unauthorized unless token
    payload, = JWT.decode(token, Rails.application.credentials.jwt_secret, true, { algorithm: 'HS256' })
    env['current_user_id'] = payload['sub']
    @app.call(env)
  rescue JWT::DecodeError
    unauthorized
  end
  def unauthorized; [401, { 'Content-Type' => 'application/json' }, [{ error: 'unauthorized' }.to_json]]; end
end
```

Wire the middleware before GraphQL.

### Apollo Client (JWT)

```ts
import { setContext } from '@apollo/client/link/context';

const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem('accessToken');
  return { headers: { ...headers, Authorization: token ? `Bearer ${token}` : '' } };
});
```

## Refresh Tokens (JWT)

- Use short‑lived access tokens (15–30m) + long‑lived refresh tokens (httpOnly cookie)
- Rotate refresh tokens on each use; blacklist previous
- Re‑issue access token via a `refreshToken` mutation

## Session Hardening Checklist

- [x] Enforce HTTPS everywhere
- [x] SameSite=Lax or Strict for cookies
- [x] HttpOnly cookies (no JS access)
- [x] CSRF tokens on state‑changing requests (sessions)
- [x] Rate‑limit login and refresh endpoints (Rack::Attack)
- [x] Brute‑force and credential stuffing protection
- [x] Device‑bound signals where possible (IP, UA hashing)

Pick sessions by default for web apps on the same domain. Reach for JWTs when you truly need cross‑domain or native client support—and budget time for rotation and revocation.
