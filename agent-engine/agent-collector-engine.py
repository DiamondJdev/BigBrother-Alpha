# agent-collector-engine.py
import psutil
import time
from dataclasses import dataclass, asdict
from typing import List


# -----------------------------
# Snapshot Data Structure
# -----------------------------
@dataclass
class Snapshot:
    cpu_percent: float
    memory_used: int
    memory_percent: float
    bytes_sent: int
    bytes_recv: int
    outbound_connections: list
    banned_files: list
    active_processes: List[str]


# -----------------------------
# Metrics Collector
# -----------------------------
class MetricsCollector:
    def __init__(self, banned_dirs=None):
        self.banned_dirs = banned_dirs or []

    def _get_outbound_connections(self):
        conns = psutil.net_connections(kind="inet")
        outbound = []
        for c in conns:
            if c.raddr and c.status == psutil.CONN_ESTABLISHED:
                outbound.append({
                    "local": f"{c.laddr.ip}:{c.laddr.port}",
                    "remote": f"{c.raddr.ip}:{c.raddr.port}",
                    "pid": c.pid
                })
        return outbound

    def _scan_banned_dirs(self):
        import os
        touched = []
        for d in self.banned_dirs:
            if not os.path.exists(d):
                continue
            for root, dirs, files in os.walk(d):
                for f in files:
                    touched.append(os.path.join(root, f))
        return touched

    def _get_active_processes(self):
        names = []
        for p in psutil.process_iter(["name"]):
            try:
                if p.info["name"]:
                    names.append(p.info["name"])
            except psutil.NoSuchProcess:
                pass
        return sorted(set(names))

    def take_snapshot(self):
        cpu = psutil.cpu_percent(interval=0.3)
        vm = psutil.virtual_memory()
        net = psutil.net_io_counters()

        return Snapshot(
            cpu_percent=cpu,
            memory_used=vm.used,
            memory_percent=vm.percent,
            bytes_sent=net.bytes_sent,
            bytes_recv=net.bytes_recv,
            outbound_connections=self._get_outbound_connections(),
            banned_files=self._scan_banned_dirs(),
            active_processes=self._get_active_processes()
        )


# -----------------------------
# App Monitor (open → close)
# -----------------------------
class AppMonitor:
    def __init__(self, target_app, banned_dirs=None):
        self.target_app = target_app.lower()
        self.collector = MetricsCollector(banned_dirs=banned_dirs)
        self.before_snapshots = []
        self.after_snapshots = []

    def _find_process(self):
        for p in psutil.process_iter(["name"]):
            try:
                if p.info["name"] and p.info["name"].lower() == self.target_app:
                    return p
            except psutil.NoSuchProcess:
                pass
        return None

    def wait_for_open(self):
        print(f"Waiting for {self.target_app} to open...")
        while True:
            proc = self._find_process()
            if proc:
                print(f"{self.target_app} opened (PID {proc.pid})")
                return proc
            time.sleep(0.5)

    def wait_for_close(self, proc):
        print(f"Waiting for {self.target_app} to close...")
        while proc.is_running():
            time.sleep(0.5)
        print(f"{self.target_app} closed")

    def run(self):
        proc = self.wait_for_open()

        before = self.collector.take_snapshot()
        self.before_snapshots.append(asdict(before))

        self.wait_for_close(proc)

        after = self.collector.take_snapshot()
        self.after_snapshots.append(asdict(after))

        return before, after


# -----------------------------
# Public Callable Function
# -----------------------------
def run_monitor(app_name, banned_dirs=None):
    monitor = AppMonitor(app_name, banned_dirs=banned_dirs)
    before, after = monitor.run()

    print("\n==============================")
    print("      SYSTEM METRICS REPORT")
    print("==============================\n")

    def pretty(label, snap):
        print(f"--- {label} ---")
        print(f"CPU Usage: {snap.cpu_percent}%")
        print(f"Memory Used: {snap.memory_used / (1024**2):.2f} MB ({snap.memory_percent}%)")
        print(f"Network Sent: {snap.bytes_sent / 1024:.2f} KB")
        print(f"Network Received: {snap.bytes_recv / 1024:.2f} KB")
        print(f"Active Processes: {len(snap.active_processes)} processes")
        print(f"Outbound Connections: {len(snap.outbound_connections)} connections")
        print(f"Banned Files Touched: {len(snap.banned_files)} files\n")

    pretty("BEFORE", before)
    pretty("AFTER", after)


# -----------------------------
# Only runs when executed directly
# -----------------------------
if __name__ == "__main__":
    run_monitor("notepad.exe")
