#!/usr/bin/env bash
set -e
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR"

mkdir -p "$DIR/var/log/cowrie" "$DIR/server/var/log/cowrie" "$DIR/var/run" "$DIR/var/lib/cowrie/downloads" "$HOME/var/log/cowrie" "$HOME/var/run" "$HOME/cowrie/var/log/cowrie" 2>/dev/null || true
touch "$DIR/var/log/cowrie/cowrie.json" "$DIR/server/var/log/cowrie/cowrie.json" "$HOME/var/log/cowrie/cowrie.json" 2>/dev/null || true

for pidfile in "$DIR/var/run/cowrie.pid" "$DIR/cowrie.pid" "$HOME/cowrie/var/run/cowrie.pid" /var/run/cowrie.pid; do
    if [ -f "$pidfile" ]; then
        old_pid=$(cat "$pidfile" 2>/dev/null || true)
        if [ -n "$old_pid" ] && ! kill -0 "$old_pid" 2>/dev/null; then
            rm -f "$pidfile"
        fi
    fi
done

COWRIE_EXEC=""
if [ -x "$DIR/server/venv/bin/cowrie" ]; then
    COWRIE_EXEC="$DIR/server/venv/bin/cowrie"
elif [ -x "$DIR/cowrie-env/bin/cowrie" ]; then
    COWRIE_EXEC="$DIR/cowrie-env/bin/cowrie"
elif [ -x "$HOME/cowrie-env/bin/cowrie" ]; then
    COWRIE_EXEC="$HOME/cowrie-env/bin/cowrie"
elif [ -x "$HOME/cowrie/bin/cowrie" ]; then
    COWRIE_EXEC="$HOME/cowrie/bin/cowrie"
elif [ -x "$HOME/cowrie/cowrie-env/bin/cowrie" ]; then
    COWRIE_EXEC="$HOME/cowrie/cowrie-env/bin/cowrie"
elif [ -x "$HOME/.local/bin/cowrie" ]; then
    COWRIE_EXEC="$HOME/.local/bin/cowrie"
elif command -v cowrie &>/dev/null; then
    COWRIE_EXEC="$(command -v cowrie)"
fi

if [ -z "$COWRIE_EXEC" ]; then
    echo "Installing Cowrie in $DIR/cowrie-env..."
    python3 -m venv "$DIR/cowrie-env"
    "$DIR/cowrie-env/bin/pip" install --upgrade pip -q
    "$DIR/cowrie-env/bin/pip" install cowrie -q
    COWRIE_EXEC="$DIR/cowrie-env/bin/cowrie"
fi

cd "$DIR"
if [ -n "$COWRIE_EXEC" ] && [ -x "$COWRIE_EXEC" ]; then
    $COWRIE_EXEC start || true
elif command -v cowrie &>/dev/null; then
    cowrie start || true
fi

sleep 2
if (echo > /dev/tcp/127.0.0.1/2222) 2>/dev/null; then
    echo "✓ Cowrie SSH Honeypot is ARMED and LISTENING on port 2222"
else
    echo "Status:"
    [ -n "$COWRIE_EXEC" ] && $COWRIE_EXEC status || true
fi
