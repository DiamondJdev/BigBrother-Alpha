# run_agent.py
import sys
from agent_collector_engine import run_monitor

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python run_agent.py <app_name.exe>")
        sys.exit(1)

    app_name = sys.argv[1]
    run_monitor(app_name)
