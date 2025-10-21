<div align="center">
  <h1>Ironmount</h1>
  <h3>Keep your volumes in check!<br />One interface to manage all your storage</h3>
  <a href="https://github.com/nicotsx/ironmount/blob/main/LICENSE">
    <img src="https://img.shields.io/github/license/nicotsx/ironmount" />
  </a>
  <br />
  <figure>
    <img src="https://github.com/nicotsx/ironmount/blob/main/screenshots/volume-details.png?raw=true" alt="Demo" />
    <figcaption>
      <p align="center">
        Volume details view with usage statistics and health check status
      </p>
    </figcaption>
  </figure>
</div>

> [!WARNING]  
> Ironmount is still in version 0.x.x and is subject to major changes from version to version. I am developing the core features and collecting feedbacks. Expect bugs! Please open issues or feature requests

## Intro

Ironmount is an easy to use web interface to manage your remote storage and mount them as local volumes on your server. Docker as a first class citizen, Ironmount allows you to easily mount your remote storage directly into your containers with few lines of code.

### Features

- ✅&nbsp; Support for multiple protocols: NFS, SMB, WebDAV, Directory
- 📡&nbsp; Mount your remote storage as local folders
- 🐳&nbsp; Docker integration: mount your remote storage directly into your containers via a docker volume syntax
- 🔍&nbsp; Keep an eye on your mounts with health checks and automatic remounting on error
- 📊&nbsp; Monitor your mounts usage with detailed statistics and graphs

### Coming soon

- Automated backups with encryption and retention policies
- Integration with cloud storage providers (e.g. AWS S3, Google Drive, Dropbox)

## Installation

In order to run Ironmount, you need to have Docker and Docker Compose installed on your server. Then, you can use the provided `docker-compose.yml` file to start the application.

```yaml
services:
  ironmount:
    image: ghcr.io/nicotsx/ironmount:v0.3.0
    container_name: ironmount
    restart: unless-stopped
    cap_add:
      - SYS_ADMIN
    ports:
      - "4096:4096"
    devices:
      - /dev/fuse:/dev/fuse
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - /run/docker/plugins:/run/docker/plugins
      - /var/lib/ironmount/volumes/:/var/lib/ironmount/volumes:rshared
      - ironmount_data:/data

volumes:
  ironmount_data:
    driver: local
```

Then, run the following command to start Ironmount:

```bash
docker compose up -d
```

Once the container is running, you can access the web interface at `http://<your-server-ip>:4096`.

## Docker volume usage

![Preview](https://github.com/nicotsx/ironmount/blob/main/screenshots/docker-instructions.png?raw=true)

## Third-Party Software

This project includes the following third-party software components:

### Restic

Ironmount includes [Restic](https://github.com/restic/restic) for backup functionality.

- **License**: BSD 2-Clause License
- **Copyright**: Copyright (c) 2014, Alexander Neumann <alexander@bumpern.de>
- **Status**: Included unchanged
- **License Text**: See [LICENSES/BSD-2-Clause-Restic.txt](LICENSES/BSD-2-Clause-Restic.txt)

For a complete list of third-party software licenses and attributions, please refer to the [NOTICES.md](NOTICES.md) file.
