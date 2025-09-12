---
layout: post
title: "What finally fixed our deployment and Sidekiq mess"
date: 2025-09-15 09:00:00 -0700
categories: [rails, production]
tags: [sidekiq, deployment, passenger, mysql, redis, activerecord, database-pool]
author: Bob Roberts
image: /assets/images/covers/deployment-sidekiq-fix.svg
image_alt: What finally fixed our deployment and Sidekiq mess
image_position: center center
excerpt: "A week of production chaos taught me that Sidekiq failures aren't always about Sidekiq. Sometimes it's your database connection pool that's starving everything else."
linkedin_blurb: |
  Three things I wish I'd known before my Rails deployment went sideways this week:

  1. Size your DB pool FIRST (cheapest fix, highest impact)
  2. Don't mix Sidekiq and Delayed Job on the same workflows
  3. Keep Sidekiq boring - low concurrency, predictable behavior

  The "simple" connection timeout that caused a week of 2am debugging sessions. What looked like Sidekiq being flaky was actually database connection starvation.

  Passenger processes + Sidekiq threads + buffer = your minimum pool size. I was running 15 total connections with a pool of 5. No wonder everything was timing out.

  Anyone else learned expensive production lessons the hard way? What's your "I wish I'd known that sooner" moment?
---

Over the last week I hit a cluster of production problems that looked unrelated at first: intermittent deploys that "completed" but left the app unresponsive, email blasts that "finished" with zero sends, and a Sidekiq dashboard screaming 60–70% failure rates. This post is my straight‑from-the-console write‑up of what actually broke, how I tracked it down, and the simple changes that stabilized everything.

If you're running Rails on Nginx + Passenger with MySQL, Redis, and Sidekiq (and some Delayed Job still hanging around), this will probably feel familiar.

## The symptoms

- Deploy "succeeds," site feels sluggish or unresponsive afterward.
- Sidekiq shows high failure rates, idle workers, and no throughput.
- Email blasts target thousands of customers but report zero sent.
- Logs full of noise in test and prod, making the real issues easy to miss.

## The real root cause

It wasn't a single bug. It was a perfect storm:

- A Ruby upgrade changed memory/boot characteristics.
- I had both Sidekiq and Delayed Job running (historical reasons).
- Passenger was running multiple app processes.
- And the big one: the database pool was way too small.

Sidekiq wasn't "broken." It was starved. Jobs were dying with:

```
could not obtain a database connection within 5.000 seconds
```

Once I stopped staring at Sidekiq's failure counter and looked at actual error classes in Retry/Dead sets, the picture was obvious: ActiveRecord connection timeouts across the board.

## The simple calculation that matters

This is the mental model I now use and documented in a deployment guide for future reference.

You need at least:

- Passenger processes (each wants a DB connection)
- plus Sidekiq threads across all processes
- plus a little buffer (console, rake tasks, admin scripts, spikes)

Example from my production box:

- Passenger: 5 processes
- Sidekiq: 1 process × 3 threads (I dialed this down)
- Buffer: 5–10 (call it 7 for "stuff you forgot")

So minimum pool = 5 (Passenger) + 3 (Sidekiq) + 7 (buffer) = 15.
I set it to 25 because the server has plenty of RAM (32 GB) and I'd rather have headroom than timeouts.

Production `database.yml` ended up like this:

```yaml
production:
  adapter: mysql2
  pool: 25
  host: localhost
  # …rest omitted
```

After bumping the pool, the connection timeouts disappeared immediately.

## The Sidekiq side of the house

I also simplified my worker setup. I don't need hero numbers here—predictability beats bragging rights. I now run:

- Concurrency (threads): 3
- Processes: start one Sidekiq process (or two if I'm pushing a big blast)

My `sidekiq.yml` reflects that:

```yaml
:concurrency: 3
:queues:
  - [critical, 10]
  - [email_blast, 6]
  - [default, 5]
```

If I want more fault tolerance or better CPU spread, I start a second Sidekiq process with the same concurrency. Two procs × 3 threads = 6 total DB connections, still fine under a 25‑connection pool.

## The email blast gotcha (Sidekiq vs Delayed Job)

My email blasts were "completing" with zero sends. The reason: the controller path had been switched to run synchronously during an earlier incident, while mailers still used `deliver_later` (which goes through ActiveJob → Delayed Job in this app). That left me in a half‑migrated state: some work in Sidekiq, some in DJ, both competing for the same small pool.

I re‑enabled async sending for blasts and let Sidekiq handle it. The worker is straight‑forward and logs failures cleanly:

```ruby
class SendEspecialsWorker
  include Sidekiq::Worker
  sidekiq_options queue: :email_blast, retry: 3

  def perform(account_id, coupons, email_blast_id = nil)
    account = Account.find(account_id)
    email_blast = email_blast_id && EmailBlast.find(email_blast_id)
    account.send_especial(coupons, true, email_blast)
  end
end
```

Key point: pick one background system per workflow. Mixing Sidekiq and Delayed Job on the same hot paths is a great way to create invisible contention.

## What I run before deploy now

I pulled these steps into the deployment guide so I don't "cowboy fix" at 2am again. The gist:

- Clean up any straggler processes (nginx, passenger, delayed_job, ruby)
- Drop caches and restart in a clean order
- Start Sidekiq to the target concurrency

```bash
sudo systemctl stop nginx
sudo pkill -f delayed_job; sudo pkill -f passenger; sudo pkill -f ruby
sudo sync && echo 3 | sudo tee /proc/sys/vm/drop_caches
sudo systemctl start nginx
# start sidekiq with -c 3 and proper logs/PIDs
```

Then I watch the first few minutes like a hawk:

- `passenger-status` for process health and queue length
- Sidekiq stats for processed/failed trends and queue sizes
- Memory and swap to catch early pressure

## Quick checks that saved me time

- Confirm Sidekiq's "Failed" vs Retry/Dead sets. Dashboard counters are cumulative. The real signal is "do new jobs fail?"
- Use `Sidekiq::Stats.new` and print before/after numbers around a test job. If processed goes up without failed, you're good.
- Don't trust logger levels alone in tests if you're using `puts`. `puts` goes to STDOUT regardless; either switch to `Rails.logger` or redirect STDOUT in test.

## What I'd do differently next time

- Size the DB pool first. It's the cheapest lever with the highest upside.
- Avoid half‑migrations. If a workflow starts on Sidekiq, finish the job and remove the Delayed Job path (or vice versa).
- Keep Sidekiq boring: low concurrency, more processes only when needed, queue weights tuned to business priorities.
- Document the decision math in the deployment guide, so future me doesn't have to reconstruct it under pressure.

## TL;DR

- The chronic failures weren't Sidekiq being flaky—they were ActiveRecord connection timeouts.
- Passenger procs + Sidekiq threads + a buffer must fit under your DB `pool`.
- On a 32 GB host, a `pool: 25` is a rounding error in memory and buys you stability.
- Run email blasts async in Sidekiq; don't split them across Sidekiq and Delayed Job.
- Keep Sidekiq to 3 threads per process unless you've proven you need more.

If you want the full step‑by‑step let me know. I put everything into a document including cleanup commands, monitoring, and the connection math. It's the checklist I wish I'd had before the week started.
