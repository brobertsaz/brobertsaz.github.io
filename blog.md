---
layout: page
title: Blog
permalink: /blog/
---

<div class="posts-grid">
  {% for post in site.posts %}
    <article class="post-preview">
      {% if post.image %}
        <div class="post-thumb">
          <img src="{{ post.image | relative_url }}" alt="{{ post.image_alt | default: post.title | escape }}" style="object-position: {{ post.image_position | default: 'center center' }};">
        </div>
      {% endif %}
      <h3>
        <a href="{{ post.url | relative_url }}">
          {{ post.title | escape }}
        </a>
      </h3>

      <div class="post-meta">
        <time datetime="{{ post.date | date_to_xmlschema }}">
          {{ post.date | date: "%B %d, %Y" }}
        </time>
        {% if post.author %}
          <span class="author">by {{ post.author }}</span>
        {% endif %}
      </div>

      <div class="post-excerpt">
        {{ post.excerpt | strip_html | truncatewords: 30 }}
      </div>

      {% if post.tags.size > 0 %}
        <div class="post-tags">
          {% for tag in post.tags %}
            <span class="tag">{{ tag }}</span>
          {% endfor %}
        </div>
      {% endif %}

      <a href="{{ post.url | relative_url }}" class="read-more">
        Read more →
      </a>
    </article>
  {% endfor %}
</div>

{% if site.posts.size == 0 %}
  <div class="no-posts">
    <h3>No posts yet</h3>
    <p>Check back soon for new content!</p>
  </div>
{% endif %}
