#!/bin/bash

##
# Cleanup Idle MCP Dev Servers
# Kills stale MCP processes, keeping only the most recent active session
# Usage: bash scripts/cleanup-mcp-servers.sh [--dry-run]
##

set -e

DRY_RUN=${1:-}
COLOR_RED='\033[0;31m'
COLOR_GREEN='\033[0;32m'
COLOR_YELLOW='\033[1;33m'
COLOR_BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get all MCP-related process info (PID, process name, start time)
get_mcp_process_info() {
  ps aux | awk '
    /next-devtools-mcp|mcp-server-playwright|mcp-server-memory|context7-mcp|serena.*start-mcp/ && !/awk/ {
      cmd = $NF
      if (cmd ~ /next-devtools/) proc = "next-devtools-mcp"
      else if (cmd ~ /playwright/) proc = "mcp-server-playwright"
      else if (cmd ~ /memory/) proc = "mcp-server-memory"
      else if (cmd ~ /context7/) proc = "context7-mcp"
      else if (cmd ~ /serena/) proc = "serena"
      else proc = cmd
      pid = $2
      start_time = $9 " " $10
      printf "%s %s %s\n", pid, proc, start_time
    }
  '
}

# Extract hour from start time (HH)
get_start_hour() {
  echo "$1" | grep -oE '[0-9]{2}:[0-9]{2}' | cut -d: -f1
}

# Main cleanup logic
main() {
  echo -e "${COLOR_BLUE}🔍 Scanning for idle MCP servers...${NC}\n"

  process_info=$(get_mcp_process_info)

  if [ -z "$process_info" ]; then
    echo -e "${COLOR_GREEN}✓ No MCP servers running${NC}"
    exit 0
  fi

  # Count by process type
  next_devtools=$(echo "$process_info" | grep -c "next-devtools-mcp" || true)
  playwright=$(echo "$process_info" | grep -c "mcp-server-playwright" || true)
  memory=$(echo "$process_info" | grep -c "mcp-server-memory" || true)
  context7=$(echo "$process_info" | grep -c "context7-mcp" || true)
  serena=$(echo "$process_info" | grep -c "serena" || true)

  total=$((next_devtools + playwright + memory + context7 + serena))

  echo -e "${COLOR_YELLOW}Current MCP processes: $total${NC}"
  [ "$next_devtools" -gt 0 ] && echo "  • next-devtools-mcp: $next_devtools"
  [ "$playwright" -gt 0 ] && echo "  • mcp-server-playwright: $playwright"
  [ "$memory" -gt 0 ] && echo "  • mcp-server-memory: $memory"
  [ "$context7" -gt 0 ] && echo "  • context7-mcp: $context7"
  [ "$serena" -gt 0 ] && echo "  • serena: $serena"
  echo ""

  # If 6 or fewer processes (one complete session), no cleanup needed
  if [ "$total" -le 6 ]; then
    echo -e "${COLOR_GREEN}✓ All MCP servers are from the current session - no cleanup needed${NC}"
    exit 0
  fi

  # Get unique start hours and find most recent
  most_recent_hour=$(echo "$process_info" | awk '{print $3}' | grep -oE '[0-9]{2}:[0-9]{2}' | cut -d: -f1 | sort -n | tail -1)

  # Collect PIDs from old sessions (those with different start hours than most recent)
  pids_to_kill=""
  while IFS= read -r line; do
    pid=$(echo "$line" | awk '{print $1}')
    start_time=$(echo "$line" | cut -d' ' -f3-)
    start_hour=$(get_start_hour "$start_time")

    if [ "$start_hour" != "$most_recent_hour" ]; then
      pids_to_kill="$pids_to_kill $pid"
    fi
  done <<< "$process_info"

  if [ -z "$pids_to_kill" ]; then
    echo -e "${COLOR_GREEN}✓ All MCP servers are from the current session - no cleanup needed${NC}"
    exit 0
  fi

  # Display processes to be killed
  echo -e "${COLOR_YELLOW}Stale MCP processes (from older sessions):${NC}"
  for pid in $pids_to_kill; do
    ps -p "$pid" -o pid,comm,etime 2>/dev/null || echo "  PID $pid (already terminated)"
  done
  echo ""

  # Handle dry-run mode
  if [ "$DRY_RUN" = "--dry-run" ]; then
    kill_count=$(echo "$pids_to_kill" | wc -w)
    echo -e "${COLOR_BLUE}[DRY RUN] Would kill $kill_count process(es)${NC}"
    exit 0
  fi

  # Ask for confirmation
  kill_count=$(echo "$pids_to_kill" | wc -w)
  printf "Kill %d stale process(es)? (y/N) " "$kill_count"
  read -r response

  if [ "$response" != "y" ] && [ "$response" != "Y" ]; then
    echo "Cancelled"
    exit 0
  fi

  # Kill processes
  killed=0
  failed=0
  for pid in $pids_to_kill; do
    if kill -9 "$pid" 2>/dev/null; then
      echo -e "${COLOR_GREEN}✓ Killed PID $pid${NC}"
      killed=$((killed + 1))
    else
      echo -e "${COLOR_RED}✗ Failed to kill PID $pid (may already be terminated)${NC}"
      failed=$((failed + 1))
    fi
  done

  echo ""
  echo -e "${COLOR_GREEN}✓ Cleanup complete: Killed $killed process(es)${NC}"

  remaining=$(get_mcp_process_info | wc -l)
  echo "  Active MCP servers: $remaining process(es)"
}

main "$@"
