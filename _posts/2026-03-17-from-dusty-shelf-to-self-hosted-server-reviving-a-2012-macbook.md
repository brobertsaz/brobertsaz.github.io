---
layout: post
title: "From Dusty Shelf to Self-Hosted Server: Reviving a 2012 MacBook"
date: 2026-03-17 01:00:00 -0200
categories: [development, tools, self-hosting]
tags: [self-hosting, macos, cloudflare, caddy, claude-code, automation, homelab]
author: Bob Roberts
image: /assets/images/covers/macbook-server.svg
image_alt: From Dusty Shelf to Self-Hosted Server - Reviving a 2012 MacBook
image_position: center center
excerpt: "I had a 2012 MacBook collecting dust. Now it runs automated agent jobs and serves HTML reports at a public URL. Here's the full walkthrough of turning old hardware into a self-hosted server with Cloudflare Tunnel."
linkedin_blurb: |
  I had a 2012 MacBook collecting dust on a shelf.

  Now it runs weekly Claude Code agent jobs and serves the output at public URLs. Zero monthly cost.

  The setup: macOS Ventura via OpenCore Legacy Patcher, Caddy for file serving, Cloudflare Tunnel for public access, and cron jobs running Claude Code for automated research and report generation.

  The biggest lesson? Linux on a 2012 MacBook is a trap. The Broadcom WiFi driver situation is a nightmare. OCLP + macOS is the better answer for old Apple hardware.

  Full walkthrough on the blog, including every command and gotcha we hit along the way.
---

I had a 2012 MacBook collecting dust. I wanted to build my own version of what MiniMax Agent does: automated lead generation, hosted HTML reports, shareable URLs. What followed was one of the most cursed and ultimately satisfying afternoons of my developer life.

## The goal

I'd been using **MiniMax Agent** to run a weekly lead generation pipeline. Business leads, competitive analysis, the works. It would scrape the web, compile leads into a structured report, generate an interactive HTML file, and host it at a shareable URL.

Great tool. But I wanted to own it. And I had a 2012 MacBook sitting on a shelf doing nothing.

The plan: turn the MacBook into a headless server, run scheduled agent jobs on it, and serve the generated HTML reports at a custom subdomain via a Cloudflare Tunnel. Total cost: $0 (hardware I already owned) plus whatever Anthropic API costs for the agent runs.

The architecture looks like this: a cron job triggers Claude Code, which does web research, lead scoring, and HTML generation. Caddy serves the output files, and Cloudflare Tunnel makes them publicly accessible at a subdomain like `share.yourdomain.com`. All running on the 2012 MacBook sitting on a shelf.

## Why not just use Linux?

My first instinct was Ubuntu Server. Clean, lightweight, purpose-built. I flashed a USB drive, ran the installer, got Ubuntu up... and immediately hit the classic 2012 MacBook problem: the **Broadcom BCM4360 WiFi chip**.

The BCM4360 needs a proprietary driver (`bcmwl-kernel-source`) that isn't included in Ubuntu Server. You need internet to install the driver. You need the driver to get internet. Classic chicken-and-egg problem.

I tried installing from the USB offline, tried different partitions, tried everything. The driver just isn't on the Server ISO. The Desktop ISO has it, but Desktop is overkill for a headless server.

The solution? **OpenCore Legacy Patcher (OCLP)**. It's a tool that lets you install modern macOS on hardware Apple abandoned. On a 2012 MacBook with macOS Ventura, Broadcom WiFi just works with Apple's own drivers. And since the internal drive is an SSD, performance is totally fine.

## Step 1: Install macOS Ventura via OCLP

You'll need a USB drive (16GB minimum, I used 128GB) and your main Mac to prepare it. Everything runs from your main machine. You only touch the 2012 MacBook a couple of times.

### Check if your drive is SSD

If you still have Linux accessible, confirm first:

```bash
cat /sys/block/sda/queue/rotational
# 0 = SSD, 1 = spinning disk
```

Running Ventura on a spinning HDD would be painful. SSD is a requirement for this to be practical.

### Prepare the installer on your main Mac

1. Download **OpenCore Legacy Patcher** from [github.com/dortania/OpenCore-Legacy-Patcher](https://github.com/dortania/OpenCore-Legacy-Patcher/releases/latest). Grab the `.pkg` file.
2. Install and open OCLP. It'll show your current Mac model. That's fine, we'll change the target.
3. Go to **Settings** and set the Target Model to your MacBook. For a 2012 13" MacBook Pro: `MacBookPro9,2`. For 15": `MacBookPro9,1`.
4. Click **"Create macOS Installer"**, select macOS Ventura, and download it.
5. When asked to select a drive, choose your USB drive. This will format it correctly and write the installer.

**Important:** If your USB drive was previously used as a Linux boot drive (flashed with Etcher, for example), OCLP will fail with an `Invalid Parameter` error. Open Disk Utility, select the top-level USB device (not the volume), and Erase with **GUID Partition Map + Mac OS Extended (Journaled)** before running OCLP.

### Install OpenCore to the USB

After the Ventura installer is written, go back to OCLP main screen and click **"Build and Install OpenCore"**. Select the USB drive when prompted. This writes the OpenCore bootloader to the hidden EFI partition. It doesn't overwrite the Ventura installer.

You can verify it worked:

```bash
diskutil list
# Look for disk4s1 EFI partition alongside disk4s2 Install macOS Ventura
```

The USB drive should have two partitions: a small EFI partition (~200MB) with the OpenCore bootloader, and the rest as the macOS Ventura installer.

### Boot and install on the 2012 MacBook

1. Plug the USB into the 2012 MacBook, power on while holding **Option** key.
2. Select **"Install macOS Ventura"** from the boot picker.
3. In the installer, go to **Utilities then Disk Utility** and erase the internal drive as APFS with GUID Partition Map.
4. Install macOS to that freshly erased drive.
5. After install, OCLP will prompt for **Post-Install Root Patch**. Run it. This installs the WiFi drivers and other hardware patches.

After running Post-Install Root Patch, your Broadcom WiFi chip will work natively. No driver hunting, no offline installs, no chicken-and-egg nonsense.

## Step 2: First boot setup

Go through the macOS setup wizard. Create a user account, connect to WiFi. Then do these things before you close the lid forever:

### Enable SSH

**System Settings > General > Sharing > Remote Login**. Toggle it on. Note the exact SSH command shown on that screen.

### Prevent sleep permanently

```bash
sudo pmset -a sleep 0 disksleep 0 displaysleep 0 womp 1 standby 0 autopoweroff 0
```

Verify it stuck:

```bash
pmset -g
# sleep, disksleep, displaysleep should all be 0
```

### Note your IP

**System Settings > WiFi > your network name > IP Address**. You'll want to reserve this IP in your router's DHCP settings so it never changes.

### Set up SSH keys (optional but recommended)

```bash
# On your main Mac
ssh-keygen -t ed25519
ssh-copy-id username@192.168.0.x
```

That's it. Close the lid, put it on a shelf, never look at it again.

## Step 3: Install the stack

SSH in from your main Mac and install everything:

```bash
# Install Homebrew
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install the essentials
brew install caddy cloudflared tmux

# Install Claude Code CLI
npm install -g @anthropic-ai/claude-code
```

**Pro tip:** Always start a tmux session before running long commands over SSH. If your connection drops, the process keeps running and you can reattach with `tmux new -s main`.

## Step 4: Configure Caddy

Caddy is a dead-simple web server that handles HTTPS automatically. Create the shares directory and a Caddyfile:

```bash
mkdir -p ~/shares
```

```
# /usr/local/etc/Caddyfile
share.yourdomain.com {
  root * /Users/youruser/shares
  file_server
  encode gzip
}
```

```bash
# Start Caddy as a background service
brew services start caddy
```

### The publish script

Create `~/bin/publish`:

```bash
#!/bin/bash
# Usage: publish report.html
# Returns: https://share.yourdomain.com/x7k2m9.html

FILE=$1
SLUG=$(cat /dev/urandom | LC_ALL=C tr -dc 'a-z0-9' | head -c 8)
DEST=~/shares/${SLUG}.html

cp "$FILE" "$DEST"
echo "https://share.yourdomain.com/${SLUG}.html"
```

```bash
chmod +x ~/bin/publish
```

Drop an HTML file in, get a shareable URL out. Simple.

## Step 5: Configure Cloudflare Tunnel

Cloudflare Tunnel creates a secure outbound connection from your MacBook to Cloudflare. No port forwarding, no static IP, no firewall rules.

```bash
# Authenticate with your Cloudflare account
cloudflared tunnel login

# Create the tunnel
cloudflared tunnel create macbook-server

# Point your subdomain at the tunnel
cloudflared tunnel route dns macbook-server share.yourdomain.com
```

Create the tunnel config at `~/.cloudflared/config.yml`:

```yaml
tunnel: <your-tunnel-id>
credentials-file: /Users/youruser/.cloudflared/<tunnel-id>.json

ingress:
  - hostname: share.yourdomain.com
    service: http://localhost:80
  - service: http_status:404
```

```bash
# Run as a persistent service
cloudflared service install
brew services start cloudflared
```

Add a CNAME record in your DNS provider pointing `share` to your tunnel's `.cfargotunnel.com` address.

The request flow is straightforward: browser hits your subdomain, DNS resolves to Cloudflare, Cloudflare routes through the tunnel to `cloudflared` running on the MacBook, which forwards to Caddy on localhost, which serves the HTML file. All over an outbound-only connection. No port forwarding needed.

## Step 6: The weekly lead gen job

This is where it all comes together. A cron job runs Claude Code on the server, which does the research, generates the report, publishes it, and emails the URL.

```bash
# crontab -e
0 9 * * 1 /Users/youruser/bin/run-lead-gen.sh
```

```bash
#!/bin/bash
# run-lead-gen.sh

export ANTHROPIC_API_KEY="your-key-here"

# Run Claude Code with the lead gen prompt
claude -p "$(cat ~/prompts/lead-gen-prompt.txt)" \
  --output-format text \
  > /tmp/leads-raw.html

# Publish and capture the URL
URL=$(~/bin/publish /tmp/leads-raw.html)

# Email the team
echo "This week's lead report: $URL" | \
  mail -s "Weekly Lead Report - $(date +%B\ %d)" your-email@example.com

echo "Published: $URL"
```

Every Monday at 9am: Claude does the research, scores leads P0/P1/P2, generates an interactive HTML report, publishes it to your subdomain, and emails the URL to the team. Zero manual work.

## What we built

| Component | What it does | Cost |
|-----------|-------------|------|
| 2012 MacBook | The server. Runs everything. On a shelf. | $0 (already owned) |
| macOS Ventura via OCLP | Modern OS on ancient hardware. WiFi just works. | $0 |
| Caddy | Serves HTML files. Auto HTTPS. | $0 |
| Cloudflare Tunnel | Public URLs without port forwarding. | $0 |
| Claude Code | The agent brain. Research + generation. | API usage |
| Your subdomain | Clean shareable URLs. | $0 (already owned) |

The result: drop an HTML file, get a shareable URL. Automated weekly lead reports. A compute server running agent jobs. All on hardware that was collecting dust.

## Lessons learned

**Linux on a 2012 MacBook is a trap.** The Broadcom WiFi situation is a known nightmare and not worth fighting for a server that needs to work reliably. OCLP + macOS is a better answer for Apple hardware specifically.

**Cloudflare Tunnel is magic.** No static IP, no port forwarding, no router config, free tier is plenty. If you're self-hosting anything and exposing it to the internet, this is the move.

**tmux before anything.** Lost a few installs to dropped SSH connections before I remembered this. Start a tmux session the moment you SSH in, every time.

**Format the USB properly before running OCLP.** If the drive was previously an Etcher-flashed Linux boot drive, you'll get a cryptic `\EFI\: Invalid Parameter` error. Erase it with GUID Partition Map first. This one cost us a good 45 minutes of head-scratching.

**Old hardware still has a lot of life in it.** A 2012 MacBook isn't going to win any benchmarks, but for serving static files and running scheduled scripts? It's more than enough. Sometimes the best server is the one you already own.
