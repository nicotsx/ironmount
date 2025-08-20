# ironmount

mutagen sync create ~/Developer/dir/ironmount nicolas@192.168.2.42:/home/nicolas/ironmount

docker run --rm -it -v nicolas:/data alpine sh -lc 'echo hello > /data/hi && cat /data/hi'
