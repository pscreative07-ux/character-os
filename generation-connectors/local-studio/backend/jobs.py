"""In-memory job queue with a single worker thread.

A local GPU can only run one generation job at a time anyway, so jobs are
processed strictly sequentially. Job state lives in memory only -
restarting the server clears the queue (outputs on disk are untouched).
"""

import queue
import threading
import time
import traceback
import uuid
from dataclasses import dataclass, field
from typing import Callable


@dataclass
class Job:
    id: str
    kind: str
    status: str = "queued"  # queued | running | done | failed
    result_path: str | None = None
    error: str | None = None
    created_at: float = field(default_factory=time.time)


class JobManager:
    def __init__(self):
        self._jobs: dict[str, Job] = {}
        self._queue: "queue.Queue[tuple[Job, Callable[[], str]]]" = queue.Queue()
        self._lock = threading.Lock()
        self._worker = threading.Thread(target=self._run, daemon=True)
        self._worker.start()

    def submit(self, kind: str, work: Callable[[], str]) -> Job:
        job = Job(id=uuid.uuid4().hex[:12], kind=kind)
        with self._lock:
            self._jobs[job.id] = job
        self._queue.put((job, work))
        return job

    def get(self, job_id: str) -> Job | None:
        with self._lock:
            return self._jobs.get(job_id)

    def _run(self):
        while True:
            job, work = self._queue.get()
            job.status = "running"
            try:
                job.result_path = work()
                job.status = "done"
            except Exception as exc:  # noqa: BLE001
                job.error = f"{exc}\n{traceback.format_exc()}"
                job.status = "failed"
            finally:
                self._queue.task_done()


manager = JobManager()
