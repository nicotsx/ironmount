docker run --rm -it -v nicolas:/data alpine sh -lc 'echo hello > /data/hi && cat /data/hi'

mount -t davfs http://192.168.2.42 /mnt/webdav

