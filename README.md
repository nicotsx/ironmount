<div align="center">
  <h1>Ironmount</h1>
  <h3>Powerful backup automation for your remote storage<br />Encrypt, compress, and protect your data with ease</h3>
  <a href="https://github.com/nicotsx/ironmount/blob/main/LICENSE">
    <img src="https://img.shields.io/github/license/nicotsx/ironmount" />
  </a>
  <br />
  <figure>
    <img src="https://github.com/nicotsx/ironmount/blob/main/screenshots/volume-details.png?raw=true" alt="Demo" />
    <figcaption>
      <p align="center">
        Backup management with scheduling and monitoring
      </p>
    </figcaption>
  </figure>
</div>

> [!WARNING]
> Ironmount is still in version 0.x.x and is subject to major changes from version to version. I am developing the core features and collecting feedbacks. Expect bugs! Please open issues or feature requests

## Intro

Ironmount is a backup automation platform that helps you protect your data across multiple storage backends. Built on top of Restic, it provides an intuitive web interface to schedule, manage, and monitor encrypted backups of your remote storage. With support for Docker integration, Ironmount makes it easy to backup your container volumes automatically.

### Features

- 💾&nbsp; **Automated backups** with encryption, compression and retention policies powered by Restic
- 📅&nbsp; **Flexible scheduling** using cron expressions for automated backup jobs
- 🔐&nbsp; **End-to-end encryption** ensuring your data is always protected
- 📦&nbsp; **Snapshot management** with retention policies to optimize storage usage
- 📊&nbsp; **Monitoring and statistics** to track backup health and storage usage
- ✅&nbsp; **Multi-protocol support**: Backup from NFS, SMB, WebDAV, or local directories
- 🔍&nbsp; **Health checks** and automatic recovery to ensure backup reliability

## Installation

In order to run Ironmount, you need to have Docker and Docker Compose installed on your server. Then, you can use the provided `docker-compose.yml` file to start the application.

```yaml
services:
  ironmount:
    image: ghcr.io/nicotsx/ironmount:v0.5.0
    container_name: ironmount
    restart: unless-stopped
    privileged: true
    ports:
      - "4096:4096"
    devices:
      - /dev/fuse:/dev/fuse
    volumes:
      - /var/lib/ironmount/:/var/lib/ironmount/
```

Then, run the following command to start Ironmount:

```bash
docker compose up -d
```

Once the container is running, you can access the web interface at `http://<your-server-ip>:4096`.

## Backups

![Preview](https://github.com/nicotsx/ironmount/blob/main/screenshots/backups.png?raw=true)

## Third-Party Software

This project includes the following third-party software components:

### Restic

Ironmount includes [Restic](https://github.com/restic/restic) for backup functionality.

- **License**: BSD 2-Clause License
- **Copyright**: Copyright (c) 2014, Alexander Neumann <alexander@bumpern.de>
- **Status**: Included unchanged
- **License Text**: See [LICENSES/BSD-2-Clause-Restic.txt](LICENSES/BSD-2-Clause-Restic.txt)

For a complete list of third-party software licenses and attributions, please refer to the [NOTICES.md](NOTICES.md) file.
