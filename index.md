---
layout: home
title: Home
---

## Hi, I'm Bob Roberts

I'm a Senior Software Engineer in Madison, Wisconsin. For 15+ years I've built web applications with Ruby on Rails for startups and established brands, remote and in-house. I like small, accountable teams, clear outcomes, and shipping iteratively.

## What you'll find here

- Practical Rails patterns you can copy and extend
- Notes on product decisions, trade-offs, and the business side of features
- Mentoring, leadership, and teamwork lessons from the field

## Latest Posts

{% for post in site.posts limit:3 %}
<article class="post-preview">
  <h3><a href="{{ post.url | relative_url }}">{{ post.title }}</a></h3>
  <p class="post-meta">{{ post.date | date: "%B %d, %Y" }}</p>
  <p>{{ post.excerpt | strip_html | truncatewords: 30 }}</p>
  <a href="{{ post.url | relative_url }}" class="read-more">Read more →</a>
</article>
{% endfor %}

<div class="all-posts">
  <a href="/posts/" class="btn btn-primary">View All Posts</a>
</div>
