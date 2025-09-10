---
layout: post
title: "Rails — complex rake task"
date: 2015-06-23 00:00:00 +0000
categories: [Legacy]
tags: [rails, ruby, rake]
permalink: /2015/rails-complex-rake-task/
original_url: https://brobertsaz.github.io//2015/rails-complex-rake-task/
---

> Archived from the original post (2015-06-23). Lightly converted to Markdown; code examples preserved.

I had to write a pretty complex rake task this evening. I made some seriously big changes to my client app and needed to run some processes to update some big changes in the database.

The first question I had was where to add a method that the rake task could call. While this seemed a pretty easy thing to do, a Google search led me nowhere so I went with trial and error. In the end I found that the method needed to go AFTER the `task do` block and not in it.

Example structure:

```
desc 'this is the description of the task'

task do_something: :environment do
  my_objects.all.each do |object|
    object.do_something_cool
  end
end

def do_something_cool
  something_cool
end
```

The next thing I wanted to do was to use an existing helper that was in my Rails project. This was easily found with Google. You simply need to require the helper file and include it. I added this between the `desc` and the `task do` block:

```
require "#{Rails.root}/app/helpers/my_helper"
include MyHelper
```

Hope this helps :)

