# ironmount

mutagen sync create ~/Developer/ironmount nicolas@192.168.2.220:/home/nicolas/ironmount

docker run --rm -it -v nicolas:/data alpine sh -lc 'echo hello > /data/hi && cat /data/hi'
