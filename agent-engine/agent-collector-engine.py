import psutil
import time
from dataclasses import dataclass, asdict

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
            banned_files=self._scan_banned_dirs()
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
        # Wait for app to open
        proc = self.wait_for_open()

        # BEFORE snapshot
        before = self.collector.take_snapshot()
        self.before_snapshots.append(asdict(before))

        # Wait for app to close
        self.wait_for_close(proc)

        # AFTER snapshot
        after = self.collector.take_snapshot()
        self.after_snapshots.append(asdict(after))

        # Print results
        print("\n=== BEFORE SNAPSHOT ===")
        print(self.before_snapshots[-1])

        print("\n=== AFTER SNAPSHOT ===")
        print(self.after_snapshots[-1])


# -----------------------------
# Run Example
# -----------------------------
if __name__ == "__main__":
    monitor = AppMonitor(
        target_app="notepad.exe",
        banned_dirs=["C:\\Temp\\forbidden", "C:\\Users\\Public\\Secret"]
    )
    monitor.run()
