handlers = {}

def bind(token, callback):
    handlers[token] = callback

def deliver(token, payload):
    callback = handlers[token]
    return callback(payload)
