FROM alpine:3.18

# Minimal sandbox for testing (lightweight, does NOT run Wine)
# It simulates installer execution by creating files under /sandbox and sleeping briefly.

RUN apk add --no-cache bash

# Create sandbox user and working dir
RUN adduser -D -h /home/sandboxuser sandboxuser
RUN mkdir -p /sandbox /installed && chown -R sandboxuser:sandboxuser /sandbox /installed

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

USER sandboxuser
WORKDIR /sandbox
ENTRYPOINT ["/entrypoint.sh"]
