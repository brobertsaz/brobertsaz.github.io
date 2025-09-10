---
layout: default
title: Archive
permalink: /archive/
description: Legacy posts from the old blog, preserved with original dates and permalinks.
---

<section class="page-section">
  <h1>Archive</h1>
  <p class="muted">Posts from the old blog. Dates and permalinks are preserved. These also appear in search and related posts.</p>

  {% assign legacy_posts = site.posts | where_exp: "post", "post.categories contains 'Legacy'" %}

  {% if legacy_posts.size == 0 %}
    <p>No archived posts yet. They’ll appear here after import.</p>
  {% else %}
    {% assign sorted_posts = legacy_posts | sort: 'date' | reverse %}
    {% assign current_year = '' %}
    <div class="archive-list">
      {% for post in sorted_posts %}
        {% assign year = post.date | date: '%Y' %}
        {% if year != current_year %}
          {% unless forloop.first %}</ul>{% endunless %}
          <h2 class="archive-year">{{ year }}</h2>
          <ul class="archive-posts">
          {% assign current_year = year %}
        {% endif %}
        <li class="archive-item">
          <a class="archive-link" href="{{ post.url | relative_url }}">{{ post.title }}</a>
          <span class="archive-meta">{{ post.date | date: site.minima.date_format | default: "%b %-d, %Y" }}</span>
          {% if post.tags and post.tags.size > 0 %}
            <span class="archive-tags">
              {% for tag in post.tags %}<span class="tag">{{ tag }}</span>{% endfor %}
            </span>
          {% endif %}
        </li>
        {% if forloop.last %}</ul>{% endif %}
      {% endfor %}
    </div>
  {% endif %}
</section>

