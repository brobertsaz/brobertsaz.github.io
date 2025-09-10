---
layout: post
title: "Mongodump cron job for nightly backup"
date: 2015-04-29 00:00:00 +0000
categories: [Legacy]
tags: [mongodb, backup, cron, ops]
permalink: /2015/mongodump-cron-job-for-nightly-backup/
original_url: https://brobertsaz.github.io//2015/mongodump-cron-job-for-nightly-backup/
---

> Archived from the original post (2015-04-29). Lightly converted to Markdown; command lines preserved.

I recently looked for a way to automatically backup a MongoDB database nightly. There are some nice bash scripts out there but I wanted to just do it in a cron job. After some struggling with taring the huge db directory I came up with this:

Cron entry (midnight daily):

```
0 0 * * * /bin/bash -l -c 'cd /my_project_path && \
  mongodump --host 0.0.0.0 -d mydb --username myusername --password mypassword \
  --out /var/dbbackups/backup_$(date +%Y%m%d) && \
  cd /var/dbbackups && tar -zcf backup_$(date +%Y%m%d).tar.gz backup_$(date +%Y%m%d)/mydb'
```

Notes:
- `mongodump` will create a directory like `backup_20150429/mydb/` with all of the `.bson` files in it.
- We add the date to both the dump dir and the tarball name.
- The `-l -c` makes sure bash loads your login profile and runs the chained commands correctly.

