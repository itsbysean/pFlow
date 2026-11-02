import sys
from loop import bind, deliver
from worker import rotate

def main():
    bind("signal/7", rotate)
    for line in sys.stdin:
        deliver(line.strip(), {})
