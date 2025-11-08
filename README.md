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

Ironmount is a backup automation tool that helps you save your data across multiple storage backends. Built on top of Restic, it provides an modern web interface to schedule, manage, and monitor encrypted backups of your remote storage.

### Features

- &nbsp; **Automated backups** with encryption, compression and retention policies powered by Restic
- &nbsp; **Flexible scheduling** For automated backup jobs with fine-grained retention policies
- &nbsp; **End-to-end encryption** ensuring your data is always protected
- &nbsp; **Multi-protocol support**: Backup from NFS, SMB, WebDAV, or local directories

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
      - /var/lib/ironmount:/var/lib/ironmount
```

Then, run the following command to start Ironmount:

```bash
docker compose up -d
```

Once the container is running, you can access the web interface at `http://<your-server-ip>:4096`.

## Adding your first volume

Ironmount supports multiple volume backends including NFS, SMB, WebDAV, and local directories. A volume represents the source data you want to back up and monitor.

To add your first volume, navigate to the "Volumes" section in the web interface and click on "Create volume". Fill in the required details such as volume name, type, and connection settings.

If you want to track a local directory on the same server where Ironmount is running, you'll first need to mount that directory into the Ironmount container. You can do this by adding a volume mapping in your `docker-compose.yml` file. For example, to mount `/path/to/your/directory` from the host to `/mydata` in the container, you would add the following line under the `volumes` section:

```diff
services:
  ironmount:
    image: ghcr.io/nicotsx/ironmount:v0.5.0
    container_name: ironmount
    restart: unless-stopped
    cap_add:
      - SYS_ADMIN
    ports:
      - "4096:4096"
    devices:
      - /dev/fuse:/dev/fuse
    volumes:
      - /var/lib/ironmount:/var/lib/ironmount
+     - /path/to/your/directory:/mydata
```

After updating the `docker-compose.yml` file, restart the Ironmount container to apply the changes:

```bash
docker compose down
docker compose up -d
```

Now, when adding a new volume in the Ironmount web interface, you can select "Directory" as the volume type and search for your mounted path (e.g., `/mydata`) as the source path.

![Preview](https://github.com/nicotsx/ironmount/blob/main/screenshots/add-volume.png?raw=true)

## Creating a repository

A repository is where your backups will be securely stored encrypted. Ironmount currently supports S3-compatible storage backends and local directories for storing your backup repositories.

Repositories are optimized for storage efficiency and data integrity, leveraging Restic's deduplication and encryption features.

To create a repository, navigate to the "Repositories" section in the web interface and click on "Create repository". Fill in the required details such as repository name, type, and connection settings. If you choose a local directory as the repository type, your backups will be stored at `/var/lib/ironmount/repositories/<repository-name>`.

## Your first backup job

Once you have added a volume and created a repository, you can create your first backup job. A backup job defines the schedule and parameters for backing up a specific volume to a designated repository.

When creating a backup job, you can specify the following settings:
- **Schedule**: Define how often the backup should run (e.g., daily, weekly)
- **Retention Policy**: Set rules for how long backups should be retained (e.g., keep daily backups for 7 days, weekly backups for 4 weeks)
- **Paths**: Specify which files or directories to include in the backup

After configuring the backup job, save it and Ironmount will automatically execute the backup according to the defined schedule.
You can monitor the progress and status of your backup jobs in the "Backups" section of the web interface.

![Preview](https://github.com/nicotsx/ironmount/blob/main/screenshots/backups-list.png?raw=true)

## Restoring data

Ironmount allows you to easily restore your data from backups. To restore data, navigate to the "Backups" section and select the backup job from which you want to restore data. You can then choose a specific backup snapshot and select the files or directories you wish to restore. The data you select will be restored to their original location.

![Preview](https://github.com/nicotsx/ironmount/blob/main/screenshots/restoring.png?raw=true)

## Propagating mounts to host

Ironmount is capable of propagating mounted volumes from within the container to the host system. This is particularly useful when you want to access the mounted data directly from the host to use it with other applications or services.

In order to enable this feature, you need to run Ironmount with privileged mode and mount /proc from the host. Here is an example of how to set this up in your `docker-compose.yml` file:

```diff
services:
  ironmount:
    image: ghcr.io/nicotsx/ironmount:v0.5.0
    container_name: ironmount
    restart: unless-stopped
-   cap_add:
-     - SYS_ADMIN
+   privileged: true
    ports:
      - "4096:4096"
    devices:
      - /dev/fuse:/dev/fuse
    volumes:
      - /var/lib/ironmount:/var/lib/ironmount
+     - /proc:/host/proc
```


## Docker plugin

Ironmount can also be used as a Docker volume plugin, allowing you to mount your volumes directly into other Docker containers. This enables seamless integration with your containerized applications.

In order to enable this feature, you need to run Ironmount with privileged modek and mount several items from the host. Here is an example of how to set this up in your `docker-compose.yml` file:

```diff
services:
  ironmount:
    image: ghcr.io/nicotsx/ironmount:v0.5.0
    container_name: ironmount
    restart: unless-stopped
-   cap_add:
-     - SYS_ADMIN
+   privileged: true
    ports:
      - "4096:4096"
    devices:
      - /dev/fuse:/dev/fuse
    volumes:
      - /var/lib/ironmount:/var/lib/ironmount
+     - /proc:/host/proc
+     - /run/docker/plugins:/run/docker/plugins
+     - /var/run/docker.sock:/var/run/docker.sock
```

Restart the Ironmount container to apply the changes:

```bash
docker compose down
docker compose up -d
```

Your Ironmount volumes will now be available as Docker volumes that you can mount into other containers using the `--volume` flag:

```bash
docker run -v im-nfs:/path/in/container nginx:latest
```

Or using Docker Compose:

```yaml
services:
  myservice:
    image: nginx:latest
    volumes:
      - im-nfs:/path/in/container
volumes:
  im-nfs:
    external: true
```

The volume name format is `im-<volume-name>` where `<volume-name>` is the name you assigned to the volume in Ironmount. You can verify that the volume is available by running:

```bash
docker volume ls
```

## Third-Party Software

This project includes the following third-party software components:

### Restic

Ironmount includes [Restic](https://github.com/restic/restic) for backup functionality.

- **License**: BSD 2-Clause License
- **Copyright**: Copyright (c) 2014, Alexander Neumann <alexander@bumpern.de>
- **Status**: Included unchanged
- **License Text**: See [LICENSES/BSD-2-Clause-Restic.txt](LICENSES/BSD-2-Clause-Restic.txt)

For a complete list of third-party software licenses and attributions, please refer to the [NOTICES.md](NOTICES.md) file.
