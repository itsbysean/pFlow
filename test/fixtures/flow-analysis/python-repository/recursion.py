def count_down(depth):
    if depth <= 0:
        return 0
    return 1 + count_down(depth - 1)
