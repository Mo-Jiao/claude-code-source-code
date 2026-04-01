#!/bin/bash
set -e
cd /Users/dailingyun/project/claude-code-source-code
DIR="docs/research/tutorial-review"
COMMON=$(cat "$DIR/prompt-common.md")

for i in 1 2 3 4 5 6; do
  TASK=$(cat "$DIR/prompt-$i.md")
  PROMPT="$COMMON

$TASK"
  SID=$(uuidgen | tr '[:upper:]' '[:lower:]')
  echo "Starting agent $i with session $SID"
  claude -p "$PROMPT" \
    --session-id "$SID" \
    --model sonnet \
    --disallowedTools "WebSearch,Agent,AskUserQuestion,Skill" \
    --output-format json \
    > "$DIR/r${i}_stdout.json" \
    2> "$DIR/r${i}_stderr.log" &
done

echo "All 6 agents dispatched, waiting..."
wait
echo "All agents completed."
