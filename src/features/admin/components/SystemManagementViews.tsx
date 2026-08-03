"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Chip,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  ConfirmModal,
} from "@/components/ui/heroui-helpers";
import {
  RefreshCw,
  Download,
  RotateCcw,
  GitBranch as GitIcon,
  Save,
  Activity,
  Database,
} from "lucide-react";
import { cmsApi } from "@/features/admin/lib/api";
import type { Backup, GitStatus, SystemJob } from "@/features/admin/lib/types";
import { toast } from "@/shared/hooks/use-toast";

const jobColors: Record<
  SystemJob["status"],
  "primary" | "success" | "danger" | "warning"
> = {
  queued: "primary",
  running: "warning",
  succeeded: "success",
  failed: "danger",
};

const jobLabels: Record<SystemJob["status"], string> = {
  queued: "排队中",
  running: "执行中",
  succeeded: "已完成",
  failed: "失败",
};

function JobStatus({ job }: { job: SystemJob }) {
  return (
    <div className="flex flex-col gap-1.5 w-36 sm:w-40">
      <div className="flex items-center justify-between">
        <Chip size="sm" color={jobColors[job.status]}>
          {jobLabels[job.status]}
        </Chip>
        <span className="text-xs font-mono text-zinc-400">{job.progress}%</span>
      </div>
      <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-1.5 overflow-hidden">
        <div
          className="bg-primary h-full transition-all duration-300"
          style={{ width: `${job.progress}%` }}
        />
      </div>
    </div>
  );
}

export function GitManagementView() {
  const [status, setStatus] = useState<GitStatus>();
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [job, setJob] = useState<SystemJob>();
  const [error, setError] = useState("");
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [pendingAction, setPendingAction] = useState<"update" | "rollback">(
    "update",
  );
  const { setHeaderContent } = useAdminHeader();
  const gitReady = status?.configured === true;

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setStatus(await cmsApi.gitStatus());
    } catch {
      setError("无法读取 Git 状态，请检查服务器的 CMS_REPOSITORY_DIR 配置。");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!job || ["succeeded", "failed"].includes(job.status)) return;
    const timer = window.setInterval(() => {
      void cmsApi
        .job(job.id)
        .then((next) => {
          setJob(next);
          if (["succeeded", "failed"].includes(next.status)) {
            window.clearInterval(timer);
            void load();
          }
        })
        .catch(() => window.clearInterval(timer));
    }, 1200);
    return () => window.clearInterval(timer);
  }, [job, load]);

  const action = useCallback(
    async (kind: "check" | "update" | "rollback") => {
      if (!gitReady) {
        toast.error("尚未配置 CMS_REPOSITORY_DIR，请先完成服务器配置");
        return;
      }
      setActionLoading(true);
      try {
        const next =
          kind === "check"
            ? await cmsApi.checkGitUpdates()
            : kind === "update"
              ? await cmsApi.updateGit()
              : await cmsApi.rollbackGit();
        setJob(next);
        toast.success(
          kind === "check"
            ? "已启动远程拉取检查"
            : kind === "update"
              ? "已开始执行部署更新任务"
              : "已开始回滚任务",
        );
      } catch {
        toast.error("任务启动失败，请确认服务器部署脚本路径");
      } finally {
        setActionLoading(false);
        onClose();
      }
    },
    [gitReady, onClose],
  );

  const promptConfirm = useCallback(
    (kind: "update" | "rollback") => {
      setPendingAction(kind);
      onOpen();
    },
    [onOpen],
  );

  useEffect(() => {
    setHeaderContent({
      actions: (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="xs"
            onClick={load}
            className="h-8 shadow-2xs"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`}
            />
          </Button>
          <Button
            variant="outline"
            size="xs"
            onClick={() => action("check")}
            isDisabled={actionLoading || !gitReady}
            className="h-8 shadow-2xs"
          >
            <span>检查更新</span>
          </Button>
          <Button
            variant="primary"
            size="xs"
            onClick={() => promptConfirm("update")}
            isDisabled={actionLoading || !gitReady}
            className="h-8 font-semibold shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 mr-1 shrink-0" />
            <span>拉取并部署</span>
          </Button>
          <Button
            variant="outline"
            size="xs"
            onClick={() => promptConfirm("rollback")}
            isDisabled={actionLoading || !gitReady}
            className="h-8 shadow-2xs"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1 shrink-0" />
            <span>回滚</span>
          </Button>
        </div>
      ),
    });
    return () => setHeaderContent({});
  }, [
    action,
    actionLoading,
    gitReady,
    loading,
    load,
    promptConfirm,
    setHeaderContent,
  ]);

  return (
    <div className="flex flex-col gap-3 text-xs">
      {error && (
        <div className="p-3 rounded-lg bg-rose-50 text-rose-600 border border-rose-200 text-xs leading-relaxed">
          {error}
        </div>
      )}

      {!loading && status && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          {!status.configured && (
            <div className="lg:col-span-12 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/20 dark:text-amber-200">
              Git 自动更新尚未启用：请在后端环境变量中配置
              <code className="mx-1 rounded bg-amber-100 px-1 py-0.5 font-mono dark:bg-amber-900/50">
                CMS_REPOSITORY_DIR
              </code>
              、固定分支和部署脚本路径。
            </div>
          )}
          <Card className="lg:col-span-7 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-lg">
            <CardHeader className="font-bold text-sm border-b border-zinc-100 dark:border-zinc-800/60 pb-2.5 flex items-center gap-2">
              <GitIcon className="w-4 h-4 text-primary" />
              <span>当前代码分支与 Commit</span>
            </CardHeader>
            <CardBody className="p-4 flex flex-col gap-3.5 text-xs">
              <div className="flex items-center justify-between pb-2.5 border-b border-zinc-100 dark:border-zinc-800/60">
                <span className="text-zinc-500">仓库路径</span>
                <span className="font-mono text-zinc-900 dark:text-zinc-100 truncate max-w-xs">
                  {status.repository || "未配置"}
                </span>
              </div>
              <div className="flex items-center justify-between pb-2.5 border-b border-zinc-100 dark:border-zinc-800/60">
                <span className="text-zinc-500">当前分支</span>
                <span className="font-mono font-bold text-primary">
                  {status.branch}
                </span>
              </div>
              <div className="flex items-center justify-between pb-2.5 border-b border-zinc-100 dark:border-zinc-800/60">
                <span className="text-zinc-500">当前 Commit</span>
                <span className="font-mono text-zinc-900 dark:text-zinc-100">
                  {status.commit || "—"}
                </span>
              </div>
              <div className="flex items-center justify-between pb-2.5 border-b border-zinc-100 dark:border-zinc-800/60">
                <span className="text-zinc-500">提交时间</span>
                <span className="text-zinc-900 dark:text-zinc-100">
                  {status.commitTime || "—"}
                </span>
              </div>
              <div className="flex items-center justify-between pb-2.5 border-b border-zinc-100 dark:border-zinc-800/60">
                <span className="text-zinc-500">远程待拉取更新</span>
                <Chip
                  size="sm"
                  color={(status.remoteAhead || 0) > 0 ? "warning" : "success"}
                >
                  {(status.remoteAhead || 0) > 0
                    ? `${status.remoteAhead} 个待更新 Commit`
                    : "已是最新版本"}
                </Chip>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-500">工作区状态</span>
                <Chip size="sm" color={status.dirty ? "danger" : "success"}>
                  {status.dirty ? "存在未提交改动" : "干净无冲突"}
                </Chip>
              </div>
            </CardBody>
          </Card>

          <Card className="lg:col-span-5 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-lg">
            <CardHeader className="font-bold text-sm border-b border-zinc-100 dark:border-zinc-800/60 pb-2.5 flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-500" />
              <span>最新部署任务进展</span>
            </CardHeader>
            <CardBody className="p-4 flex flex-col gap-3 text-xs">
              {job ? (
                <>
                  <JobStatus job={job} />
                  <p className="text-zinc-700 dark:text-zinc-300 font-semibold leading-relaxed">
                    {job.message}
                  </p>
                  {job.logs && (
                    <pre className="p-3 rounded-xl bg-zinc-950 text-zinc-300 font-mono text-[11px] overflow-x-auto whitespace-pre-wrap max-h-48 scrollbar-none">
                      {job.logs}
                    </pre>
                  )}
                </>
              ) : (
                <span className="text-zinc-400 py-4 text-center">
                  尚未发起代码更新或回滚任务。
                </span>
              )}
            </CardBody>
          </Card>
        </div>
      )}

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalHeader>
          {pendingAction === "update" ? "确认拉取并部署" : "确认版本回滚"}
        </ModalHeader>
        <ModalBody>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
            {pendingAction === "update"
              ? "即将执行 git fetch 与 pull --ff-only，并调用服务器预设的具体构建与热部署脚本。"
              : "即将回退代码库至上一个稳定版本 Commit 并重新执行构建更新。"}
          </p>
        </ModalBody>
        <ModalFooter>
          <Button size="sm" variant="ghost" onClick={onClose}>
            取消
          </Button>
          <Button
            size="sm"
            variant="primary"
            onClick={() => action(pendingAction)}
          >
            确认执行操作
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}

import { useAdminHeader } from "./AdminShell";

// ...

export function BackupManagementView() {
  const [items, setItems] = useState<Backup[]>([]);
  const [loading, setLoading] = useState(true);
  const [job, setJob] = useState<SystemJob>();
  const [restoreTarget, setRestoreTarget] = useState<Backup | null>(null);
  const { setHeaderContent } = useAdminHeader();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await cmsApi.backups());
    } catch {
      toast.error("备份列表加载失败");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!job || ["succeeded", "failed"].includes(job.status)) return;
    const timer = window.setInterval(
      () =>
        cmsApi
          .job(job.id)
          .then((next) => {
            setJob(next);
            if (next.status === "succeeded") void load();
          })
          .catch(() => window.clearInterval(timer)),
      1200,
    );
    return () => window.clearInterval(timer);
  }, [job, load]);

  const create = async () => {
    try {
      setJob(await cmsApi.createBackup());
      toast.success("SQLite 快照备份任务已启动");
    } catch {
      toast.error("无法启动备份任务");
    }
  };

  const restore = async () => {
    if (!restoreTarget) return;
    try {
      setJob(await cmsApi.restoreBackup(restoreTarget.id));
      toast.success("数据库恢复任务已启动");
    } catch {
      toast.error("无法启动恢复任务，请检查备份文件");
    } finally {
      setRestoreTarget(null);
    }
  };

  useEffect(() => {
    setHeaderContent({
      actions: (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="xs"
            onClick={load}
            className="h-8 shadow-2xs"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`}
            />
          </Button>
          <Button
            variant="primary"
            size="xs"
            onClick={create}
            className="h-8 font-semibold shadow-2xs whitespace-nowrap"
          >
            <Save className="w-3.5 h-3.5 mr-1" />
            <span>创建快照备份</span>
          </Button>
        </div>
      ),
    });
    return () => setHeaderContent({});
  }, [loading, load, setHeaderContent]);

  return (
    <div className="flex flex-col gap-3 text-xs">
      {job && (
        <div
          className={`p-3 rounded-xl border text-xs shadow-2xs ${job.status === "failed" ? "bg-rose-50 text-rose-600 border-rose-200" : "bg-blue-50/60 text-blue-600 border-blue-200/60"}`}
        >
          <span className="font-semibold">{job.message}</span>
        </div>
      )}

      <Card className="border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 rounded-xl shadow-2xs">
        <CardBody className="p-3">
          <div className="overflow-x-auto scrollbar-none">
            <table className="w-full text-left text-xs min-w-[550px]">
              <thead>
                <tr className="border-b border-zinc-100 dark:border-zinc-800/60 text-zinc-500 pb-2">
                  <th className="pb-2.5 px-3 font-semibold">备份文件名</th>
                  <th className="pb-2.5 px-3 font-semibold">文件体积</th>
                  <th className="pb-2.5 px-3 font-semibold">SHA256 校验和</th>
                  <th className="pb-2.5 px-3 font-semibold">创建时间</th>
                  <th className="pb-2.5 px-3 font-semibold text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                {loading ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="py-12 text-center text-xs text-zinc-400"
                    >
                      加载中...
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="py-12 text-center text-xs text-zinc-400"
                    >
                      暂无快照备份记录
                    </td>
                  </tr>
                ) : (
                  items.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40 transition-colors"
                    >
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2.5">
                          <Database className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span className="font-mono font-semibold text-xs text-zinc-900 dark:text-zinc-100">
                            {item.fileName}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-3 font-mono text-zinc-600 dark:text-zinc-300">
                        {(item.fileSize / 1024).toFixed(1)} KB
                      </td>
                      <td className="py-3 px-3 font-mono text-[11px] text-zinc-400 max-w-xs truncate">
                        {item.checksum}
                      </td>
                      <td className="py-3 px-3 font-mono text-zinc-400">
                        {new Date(item.createdAt).toLocaleString("zh-CN")}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setRestoreTarget(item)}
                          aria-label={`恢复备份 ${item.fileName}`}
                        >
                          <RotateCcw className="w-3.5 h-3.5 mr-1" />
                          恢复
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>
      <ConfirmModal
        isOpen={!!restoreTarget}
        onClose={() => setRestoreTarget(null)}
        onConfirm={restore}
        title="确认恢复数据库？"
        description={`恢复前会自动创建当前数据库快照，随后恢复备份 “${restoreTarget?.fileName || ""}”。恢复过程会替换内容数据并保留任务与审计历史。`}
      />
    </div>
  );
}

export function JobsView() {
  const [data, setData] = useState<{ items: SystemJob[]; total: number }>({
    items: [],
    total: 0,
  });
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState<string>();
  const { setHeaderContent } = useAdminHeader();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await cmsApi.jobs());
    } catch {
      toast.error("后台任务加载失败");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => void load(), 3000);
    return () => window.clearInterval(timer);
  }, [load]);

  const retry = async (job: SystemJob) => {
    try {
      setRetrying(job.id);
      await cmsApi.retryJob(job.id);
      toast.success("任务已成功重新加入队列");
      void load();
    } catch {
      toast.error("任务重试失败，请检查服务器配置");
    } finally {
      setRetrying(undefined);
    }
  };

  useEffect(() => {
    setHeaderContent({
      actions: (
        <Button
          variant="ghost"
          size="xs"
          onClick={load}
          className="h-8 shadow-2xs"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 mr-1 ${loading ? "animate-spin" : ""}`}
          />
          <span>刷新日志</span>
        </Button>
      ),
    });
    return () => setHeaderContent({});
  }, [loading, load, setHeaderContent]);

  return (
    <div className="flex flex-col gap-3 text-xs">
      <Card className="border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 rounded-xl shadow-2xs">
        <CardBody className="p-3">
          <div className="overflow-x-auto scrollbar-none">
            <table className="w-full text-left text-xs min-w-[620px]">
              <thead>
                <tr className="border-b border-zinc-100 dark:border-zinc-800/60 text-zinc-500 pb-2">
                  <th className="pb-2.5 px-3 font-semibold">任务类型</th>
                  <th className="pb-2.5 px-3 font-semibold">状态与进度</th>
                  <th className="pb-2.5 px-3 font-semibold">描述信息</th>
                  <th className="pb-2.5 px-3 font-semibold">创建时间</th>
                  <th className="pb-2.5 px-3 font-semibold text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                {loading ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="py-12 text-center text-xs text-zinc-400"
                    >
                      加载中...
                    </td>
                  </tr>
                ) : data.items.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="py-12 text-center text-xs text-zinc-400"
                    >
                      暂无安全日志与异步任务
                    </td>
                  </tr>
                ) : (
                  data.items.map((job) => (
                    <tr
                      key={job.id}
                      className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40 transition-colors"
                    >
                      <td className="py-3 px-3 font-mono font-semibold text-blue-600 dark:text-blue-400">
                        {job.type}
                      </td>
                      <td className="py-3 px-3">
                        <JobStatus job={job} />
                      </td>
                      <td className="py-3 px-3 text-zinc-700 dark:text-zinc-300 max-w-xs leading-relaxed">
                        {job.message}
                      </td>
                      <td className="py-3 px-3 font-mono text-zinc-400">
                        {new Date(job.createdAt).toLocaleString("zh-CN")}
                      </td>
                      <td className="py-3 px-3 text-right">
                        {job.status === "failed" ? (
                          <Button
                            variant="ghost"
                            size="xs"
                            onClick={() => retry(job)}
                            isDisabled={retrying === job.id}
                            className="text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            <RotateCcw
                              className={`w-3 h-3 mr-1 ${retrying === job.id ? "animate-spin" : ""}`}
                            />
                            <span>重试</span>
                          </Button>
                        ) : (
                          <span className="text-zinc-400 font-mono text-[11px]">
                            —
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
