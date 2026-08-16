"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
  AlertCircle,
  GitCommit,
  Check,
  Copy,
  Cloud,
  ShieldCheck,
  Folder,
  Terminal,
  History,
  User,
  Calendar,
  Search,
  Cpu,
  Server,
  HardDrive,
} from "lucide-react";
import { cmsApi } from "@/features/admin/lib/api";
import type {
  Backup,
  GitStatus,
  GitCommitItem,
  DeploymentRecord,
  SystemJob,
  SystemInfo,
} from "@/features/admin/lib/types";
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
  const [commitLogs, setCommitLogs] = useState<GitCommitItem[]>([]);
  const [deployments, setDeployments] = useState<DeploymentRecord[]>([]);
  const [sysInfo, setSysInfo] = useState<SystemInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [job, setJob] = useState<SystemJob>();
  const [error, setError] = useState("");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "overview" | "history" | "deployments" | "specs"
  >("overview");
  const [commitLimit, setCommitLimit] = useState<number>(30);
  const [commitSearchTerm, setCommitSearchTerm] = useState<string>("");
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [pendingAction, setPendingAction] = useState<"update" | "rollback">(
    "update",
  );
  const { setHeaderContent } = useAdminHeader();
  const gitReady = status?.configured === true;
  const deployReady = gitReady && status?.deployConfigured === true;
  const rollbackReady = gitReady && status?.rollbackConfigured === true;

  const copyToClipboard = (text: string, key: string) => {
    if (!text) return;
    void navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success("已复制到剪贴板");
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const load = useCallback(
    async (limit = commitLimit) => {
      setLoading(true);
      setError("");
      try {
        const [resStatus, resLogs, resDeploys, resInfo] =
          await Promise.allSettled([
            cmsApi.gitStatus(),
            cmsApi.gitLogs(limit),
            cmsApi.gitDeployments(),
            cmsApi.systemInfo(),
          ]);

        if (resStatus.status === "fulfilled") setStatus(resStatus.value);
        if (resLogs.status === "fulfilled") setCommitLogs(resLogs.value);
        if (resDeploys.status === "fulfilled") setDeployments(resDeploys.value);
        if (resInfo.status === "fulfilled") setSysInfo(resInfo.value);
        const failure = [resStatus, resLogs, resDeploys, resInfo].find(
          (result) => result.status === "rejected",
        );
        if (failure?.status === "rejected") {
          setError(
            failure.reason instanceof Error
              ? failure.reason.message
              : "部分 Git 状态读取失败",
          );
        }
      } catch {
        setError("无法读取 Git 状态，请确认后端 API 服务已启动。");
      } finally {
        setLoading(false);
      }
    },
    [commitLimit],
  );

  useEffect(() => {
    let ignore = false;
    async function fetchData() {
      try {
        const [resStatus, resLogs, resDeploys, resInfo] =
          await Promise.allSettled([
            cmsApi.gitStatus(),
            cmsApi.gitLogs(commitLimit),
            cmsApi.gitDeployments(),
            cmsApi.systemInfo(),
          ]);

        if (ignore) return;
        if (resStatus.status === "fulfilled") setStatus(resStatus.value);
        if (resLogs.status === "fulfilled") setCommitLogs(resLogs.value);
        if (resDeploys.status === "fulfilled") setDeployments(resDeploys.value);
        if (resInfo.status === "fulfilled") setSysInfo(resInfo.value);
        const failure = [resStatus, resLogs, resDeploys, resInfo].find(
          (result) => result.status === "rejected",
        );
        if (failure?.status === "rejected") {
          setError(
            failure.reason instanceof Error
              ? failure.reason.message
              : "部分 Git 状态读取失败",
          );
        }
      } catch {
        if (!ignore) setError("无法读取 Git 状态，请确认后端 API 服务已启动。");
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    void fetchData();
    return () => {
      ignore = true;
    };
  }, [commitLimit]);

  const filteredCommitLogs = useMemo(() => {
    if (!commitSearchTerm.trim()) return commitLogs;
    const term = commitSearchTerm.toLowerCase();
    return commitLogs.filter(
      (item) =>
        item.hash.toLowerCase().includes(term) ||
        item.subject.toLowerCase().includes(term) ||
        item.author.toLowerCase().includes(term),
    );
  }, [commitLogs, commitSearchTerm]);

  useEffect(() => {
    if (!job || ["succeeded", "failed"].includes(job.status)) return;
    const timer = window.setInterval(() => {
      void cmsApi
        .job(job.id)
        .then((next) => {
          setJob(next);
          if (["succeeded", "failed"].includes(next.status)) {
            window.clearInterval(timer);
            if (next.status === "succeeded") toast.success("代码任务已完成");
            else toast.error(next.logs || next.message || "代码任务执行失败");
            void load();
          }
        })
        .catch(() => {
          // API 更新重启期间可能短暂不可用，保留轮询等待进程恢复。
        });
    }, 1200);
    return () => window.clearInterval(timer);
  }, [job, load]);

  const action = useCallback(
    async (kind: "check" | "update" | "rollback") => {
      if (!gitReady) {
        toast.error("尚未配置文件系统目录，请检查服务器配置");
        return;
      }
      if (kind === "update" && !deployReady) {
        toast.error("自动部署脚本不可用，请检查 CMS_DEPLOY_SCRIPT");
        return;
      }
      if (kind === "rollback" && !rollbackReady) {
        toast.error("自动回滚脚本不可用，请检查 CMS_ROLLBACK_SCRIPT");
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
              : "已开始版本回滚任务",
        );
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "任务启动失败，请确认服务器部署脚本配置",
        );
      } finally {
        setActionLoading(false);
        onClose();
      }
    },
    [deployReady, gitReady, onClose, rollbackReady],
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
            title="刷新 Git 状态"
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
            <RefreshCw className="w-3.5 h-3.5 mr-1 text-blue-500 shrink-0" />
            <span>检查更新</span>
          </Button>
          <Button
            variant="primary"
            size="xs"
            onClick={() => promptConfirm("update")}
            isDisabled={
              actionLoading ||
              !deployReady
            }
            className="h-8 font-semibold shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 mr-1 shrink-0" />
            <span>拉取并部署</span>
          </Button>
          <Button
            variant="outline"
            size="xs"
            onClick={() => promptConfirm("rollback")}
            isDisabled={actionLoading || !rollbackReady}
            className="h-8 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-rose-950/30 shadow-2xs"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1 shrink-0" />
            <span>回滚稳定版</span>
          </Button>
        </div>
      ),
    });
    return () => setHeaderContent({});
  }, [
    action,
    actionLoading,
    gitReady,
    deployReady,
    rollbackReady,
    status,
    loading,
    load,
    promptConfirm,
    setHeaderContent,
  ]);

  const shortCommit = status?.commit ? status.commit.substring(0, 7) : "—";
  const formattedTime = status?.commitTime
    ? status.commitTime.replace("T", " ").replace(/\+\d{2}:\d{2}$/, "")
    : "—";

  return (
    <div className="flex flex-col gap-4 text-xs">
      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60 text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 顶部 4 核心 KPI 汇总看板 */}
      {status && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Card className="p-3.5 border border-zinc-200/60 dark:border-zinc-800/60 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                当前分支
              </span>
              <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
                <GitIcon className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-base font-extrabold font-mono text-zinc-900 dark:text-zinc-100">
                {status.branch || "main"}
              </span>
              <Chip size="sm" color="primary" className="text-[10px]">
                Active
              </Chip>
            </div>
          </Card>

          <Card className="p-3.5 border border-zinc-200/60 dark:border-zinc-800/60 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                当前线上 Commit
              </span>
              <div className="p-1.5 rounded-lg bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400">
                <GitCommit className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-base font-extrabold font-mono text-zinc-900 dark:text-zinc-100">
                {shortCommit}
              </span>
              {status.commit && (
                <button
                  type="button"
                  onClick={() => copyToClipboard(status.commit, "commit")}
                  className="p-1 rounded text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                  title="复制完整 Hash"
                >
                  {copiedKey === "commit" ? (
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              )}
            </div>
          </Card>

          <Card className="p-3.5 border border-zinc-200/60 dark:border-zinc-800/60 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                远程仓库状态
              </span>
              <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
                <Cloud className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <Chip
                size="sm"
                color={
                  !status.commit ? "danger" : (status.remoteAhead || 0) > 0 ? "warning" : "success"
                }
              >
                {!status.commit
                  ? "缺少当前版本基线"
                  : (status.remoteAhead || 0) > 0
                    ? "远程有新版本"
                    : "已与远程同步"}
              </Chip>
            </div>
          </Card>

          <Card className="p-3.5 border border-zinc-200/60 dark:border-zinc-800/60 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                更新检测方式
              </span>
              <div className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <Chip
                size="sm"
                  color="success"
                >
                远程 Commit 比较
              </Chip>
            </div>
          </Card>
        </div>
      )}

      {/* 多功能选项卡 Tabs */}
      <div className="flex items-center justify-between border-b border-zinc-200/80 dark:border-zinc-800/80 pb-2">
        <div className="flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-800/60 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveTab("overview")}
            className={`px-3 py-1.5 rounded-lg font-medium text-xs transition-all ${
              activeTab === "overview"
                ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-2xs font-bold"
                : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-blue-500" />
              实时控制台与环境
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("history")}
            className={`px-3 py-1.5 rounded-lg font-medium text-xs transition-all ${
              activeTab === "history"
                ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-2xs font-bold"
                : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
            }`}
          >
            <span className="flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-purple-500" />
              Git 提交历史 ({commitLogs.length})
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("deployments")}
            className={`px-3 py-1.5 rounded-lg font-medium text-xs transition-all ${
              activeTab === "deployments"
                ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-2xs font-bold"
                : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
            }`}
          >
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              部署与回滚审计 ({deployments.length})
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("specs")}
            className={`px-3 py-1.5 rounded-lg font-medium text-xs transition-all ${
              activeTab === "specs"
                ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-2xs font-bold"
                : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-amber-500" />
              服务器与系统指标
            </span>
          </button>
        </div>

        <span className="text-[11px] font-mono text-zinc-400 hidden sm:inline">
          Git Engine v2.4
        </span>
      </div>

      {/* Tab 1: 部署概览与控制台 */}
      {activeTab === "overview" && !loading && status && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          <Card className="lg:col-span-7 border border-zinc-200/60 dark:border-zinc-800/60 bg-white dark:bg-zinc-900 rounded-xl overflow-hidden shadow-2xs">
            <CardHeader className="font-bold text-xs border-b border-zinc-100 dark:border-zinc-800/60 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Folder className="w-4 h-4 text-blue-500" />
                <span>代码库参数与环境变量</span>
              </div>
              <span className="text-[11px] font-mono text-zinc-400 font-normal">
                Git Core Engine
              </span>
            </CardHeader>
            <CardBody className="p-4 flex flex-col gap-3.5 text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-3 border-b border-zinc-100 dark:border-zinc-800/60">
                <span className="text-zinc-500 shrink-0 font-medium">
                   远程仓库地址
                </span>
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-mono text-zinc-800 dark:text-zinc-200 bg-zinc-100 dark:bg-zinc-800/60 px-2 py-0.5 rounded text-[11px] truncate max-w-sm">
                    {status.repositoryUrl || "未配置远程仓库"}
                  </span>
                  {status.repositoryUrl && (
                    <button
                      type="button"
                      onClick={() => copyToClipboard(status.repositoryUrl, "remote")}
                      className="p-1 rounded text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors shrink-0"
                      title="复制远程仓库地址"
                    >
                      {copiedKey === "remote" ? (
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800/60">
                <span className="text-zinc-500 font-medium">对应代码分支</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                    {status.branch || "main"}
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-3 border-b border-zinc-100 dark:border-zinc-800/60">
                <span className="text-zinc-500 shrink-0 font-medium">
                  完整 Commit Hash
                </span>
                <span className="font-mono text-[11px] text-zinc-700 dark:text-zinc-300 truncate max-w-xs">
                  {status.commit || "—"}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-3 border-b border-zinc-100 dark:border-zinc-800/60">
                <span className="text-zinc-500 shrink-0 font-medium">
                  远程分支 Commit
                </span>
                <span className="font-mono text-[11px] text-zinc-700 dark:text-zinc-300 truncate max-w-xs">
                  {status.remoteCommit || "—"}
                </span>
              </div>

              <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800/60">
                <span className="text-zinc-500 font-medium">最后提交时间</span>
                <span className="font-mono text-zinc-700 dark:text-zinc-300">
                  {formattedTime}
                </span>
              </div>

              <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800/60">
                <span className="text-zinc-500 font-medium">
                  远程版本差异
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-zinc-700 dark:text-zinc-300 font-bold">
                    {(status.remoteAhead || 0) > 0 ? "有新 Commit" : "无差异"}
                  </span>
                  <Chip
                    size="sm"
                    color={
                      (status.remoteAhead || 0) > 0 ? "warning" : "success"
                    }
                  >
                    {(status.remoteAhead || 0) > 0
                      ? "存在可拉取代码"
                      : "已最新"}
                  </Chip>
                </div>
              </div>

              <div className="flex items-center justify-between pt-0.5">
                <span className="text-zinc-500 font-medium">
                  更新检测方式
                </span>
                <Chip size="sm" color="success">远程 Commit 比较</Chip>
              </div>

              <div className="mt-2 pt-3.5 border-t border-zinc-100 dark:border-zinc-800/60 flex items-center justify-between text-[11px] text-zinc-400 font-mono">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  已启用防冲突保护与备份快照
                </span>
                <span className="text-zinc-400">统一在页首工具栏发起同步</span>
              </div>
            </CardBody>
          </Card>

          <Card className="lg:col-span-5 border border-zinc-200/60 dark:border-zinc-800/60 bg-white dark:bg-zinc-900 rounded-xl overflow-hidden shadow-2xs flex flex-col min-h-[360px]">
            <CardHeader className="font-bold text-xs border-b border-zinc-100 dark:border-zinc-800/60 px-4 py-3 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-500" />
                <span>部署与构建控制台</span>
              </div>
              {job && (
                <Chip size="sm" color={jobColors[job.status]}>
                  {jobLabels[job.status]}
                </Chip>
              )}
            </CardHeader>
            <CardBody className="p-4 flex flex-col justify-between flex-1 text-xs gap-3">
              {job ? (
                <div className="flex flex-col gap-3 flex-1">
                  <JobStatus job={job} />
                  <div className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/60 dark:border-zinc-800/60 text-zinc-800 dark:text-zinc-200 font-semibold text-xs leading-relaxed flex items-center gap-2">
                    <Activity className="w-3.5 h-3.5 text-blue-500 animate-pulse shrink-0" />
                    <span>{job.message}</span>
                  </div>
                  {job.logs ? (
                    <div className="flex-1 flex flex-col min-h-0">
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                        执行日志输出
                      </span>
                      <pre className="p-3 rounded-xl bg-zinc-950 text-zinc-200 font-mono text-[11px] overflow-x-auto whitespace-pre-wrap max-h-56 flex-1 scrollbar-thin scrollbar-thumb-zinc-700">
                        {job.logs}
                      </pre>
                    </div>
                  ) : (
                    <div className="flex-1 grid place-items-center p-6 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-400 text-xs">
                      等待终端日志输出…
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center py-10 text-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 grid place-items-center text-zinc-400">
                    <Cloud className="w-6 h-6" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="font-bold text-xs text-zinc-700 dark:text-zinc-300">
                      系统处于稳定运行状态
                    </span>
                    <span className="text-[11px] text-zinc-400 max-w-xs">
                      尚未发起新的部署更新或回滚任务，点击顶部或左侧按钮即可触发远程同步。
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="xs"
                    onClick={() => action("check")}
                    isDisabled={actionLoading || !gitReady}
                    className="mt-2 h-7.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5 mr-1 text-blue-500" />
                    <span>立即检查远程更新</span>
                  </Button>
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      )}

      {/* Tab 2: Git 提交历史时间轴 */}
      {activeTab === "history" && (
        <Card className="border border-zinc-200/60 dark:border-zinc-800/60 bg-white dark:bg-zinc-900 rounded-xl p-4 shadow-2xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4 pb-3 border-b border-zinc-100 dark:border-zinc-800/60">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-purple-500" />
              <span className="font-bold text-xs text-zinc-900 dark:text-zinc-100">
                最近 Git 提交历史 Timeline
              </span>
              <Chip size="sm" color="secondary" className="text-[10px]">
                {filteredCommitLogs.length} 条记录
              </Chip>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* 实时关键字搜索 */}
              <div className="relative min-w-[200px]">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-zinc-400" />
                <input
                  type="text"
                  placeholder="搜索 Commit / 信息 / 作者"
                  value={commitSearchTerm}
                  onChange={(e) => setCommitSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-2 py-1 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* 快捷范围切换 */}
              <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800/60 p-0.5 rounded-lg text-[11px]">
                {[30, 50, 100].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => {
                      setCommitLimit(num);
                      void load(num);
                    }}
                    className={`px-2 py-0.5 rounded-md transition-colors ${
                      commitLimit === num
                        ? "bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 font-bold shadow-2xs"
                        : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                    }`}
                  >
                    近 {num} 条
                  </button>
                ))}
              </div>

              <Button
                variant="ghost"
                size="xs"
                onClick={() => void load(commitLimit)}
                className="h-7"
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                刷新
              </Button>
            </div>
          </div>

          {filteredCommitLogs.length > 0 ? (
            <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-zinc-200 dark:before:bg-zinc-800">
              {filteredCommitLogs.map((item, index) => {
                const isHead = item.isCurrent;
                const lowerSub = item.subject.toLowerCase();
                let commitTypeChip: React.ReactNode = null;

                if (lowerSub.startsWith("feat")) {
                  commitTypeChip = (
                    <Chip size="sm" color="success">
                      feat 新功能
                    </Chip>
                  );
                } else if (lowerSub.startsWith("fix")) {
                  commitTypeChip = (
                    <Chip size="sm" color="danger">
                      fix 缺陷修复
                    </Chip>
                  );
                } else if (lowerSub.startsWith("refactor")) {
                  commitTypeChip = (
                    <Chip size="sm" color="secondary">
                      refactor 架构重构
                    </Chip>
                  );
                } else if (lowerSub.startsWith("perf")) {
                  commitTypeChip = (
                    <Chip size="sm" color="warning">
                      perf 性能优化
                    </Chip>
                  );
                } else if (lowerSub.startsWith("docs")) {
                  commitTypeChip = (
                    <Chip size="sm" color="primary">
                      docs 文档
                    </Chip>
                  );
                } else if (
                  lowerSub.startsWith("chore") ||
                  lowerSub.startsWith("build") ||
                  lowerSub.startsWith("ci")
                ) {
                  commitTypeChip = (
                    <Chip size="sm" color="default">
                      chore 工程构建
                    </Chip>
                  );
                }

                return (
                  <div key={item.hash || index} className="relative group">
                    {/* Timeline 节点圆圈 */}
                    <div
                      className={`absolute -left-6 top-1.5 w-3.5 h-3.5 rounded-full border-2 transition-transform duration-200 ${
                        isHead
                          ? "bg-blue-600 border-blue-200 dark:border-blue-900 ring-4 ring-blue-500/20 scale-110"
                          : "bg-zinc-300 dark:bg-zinc-700 border-white dark:border-zinc-900 group-hover:scale-125"
                      }`}
                    />

                    <div
                      className={`p-3.5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        isHead
                          ? "border-blue-500/50 bg-blue-50/20 dark:bg-blue-950/20 shadow-xs"
                          : "border-zinc-200/60 dark:border-zinc-800/60 bg-zinc-50/50 dark:bg-zinc-800/30 group-hover:border-blue-500/40"
                      }`}
                    >
                      <div className="flex flex-col gap-1.5 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            type="button"
                            onClick={() =>
                              copyToClipboard(item.hash, item.hash)
                            }
                            className="font-mono font-bold text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-colors flex items-center gap-1 shrink-0 border border-blue-500/20"
                            title={`完整 Commit Hash: ${item.hash} (点击复制)`}
                          >
                            <GitCommit className="w-3 h-3" />
                            <span>{item.shortHash}</span>
                            {copiedKey === item.hash ? (
                              <Check className="w-3 h-3 text-emerald-500" />
                            ) : (
                              <Copy className="w-3 h-3 opacity-60" />
                            )}
                          </button>

                          {isHead && (
                            <Chip size="sm" color="primary">
                              HEAD (当前运行版本)
                            </Chip>
                          )}
                          {commitTypeChip}
                        </div>

                        <span className="font-semibold text-xs text-zinc-900 dark:text-zinc-100 leading-snug font-mono">
                          {item.subject}
                        </span>

                        <div className="flex items-center gap-4 text-[11px] text-zinc-400">
                          <span className="flex items-center gap-1 font-medium text-zinc-600 dark:text-zinc-400">
                            <User className="w-3 h-3 text-zinc-400" />
                            {item.author}
                          </span>
                          <span className="flex items-center gap-1 font-mono text-zinc-500 dark:text-zinc-400">
                            <Calendar className="w-3 h-3 text-zinc-400" />
                            {item.time
                              .replace("T", " ")
                              .replace(/\+\d{2}:\d{2}$/, "")}
                          </span>
                        </div>
                      </div>

                      {!isHead && (
                        <Button
                          variant="outline"
                          size="xs"
                          onClick={() => promptConfirm("rollback")}
                          className="shrink-0 h-8 text-zinc-600 dark:text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 border-zinc-200 dark:border-zinc-700"
                        >
                          <RotateCcw className="w-3 h-3 mr-1" />
                          退回此版本
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-12 text-center text-zinc-400 text-xs">
              {commitSearchTerm
                ? "没有找到符合搜索条件的 Git 提交记录。"
                : "暂未读取到 Git 提交历史日志。"}
            </div>
          )}
        </Card>
      )}

      {/* Tab 3: 部署与回滚审计日志 */}
      {activeTab === "deployments" && (
        <Card className="border border-zinc-200/60 dark:border-zinc-800/60 bg-white dark:bg-zinc-900 rounded-xl p-4 shadow-2xs">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-100 dark:border-zinc-800/60">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span className="font-bold text-xs text-zinc-900 dark:text-zinc-100">
                历史代码更新与回滚日志 (SQLite Audit)
              </span>
            </div>
            <Button variant="ghost" size="xs" onClick={load} className="h-7">
              <RefreshCw className="w-3 h-3 mr-1" />
              刷新部署日志
            </Button>
          </div>

          {deployments.length > 0 ? (
            <div className="flex flex-col gap-2.5">
              {deployments.map((record) => (
                <div
                  key={record.id}
                  className="p-3 rounded-xl border border-zinc-200/60 dark:border-zinc-800/60 bg-zinc-50/40 dark:bg-zinc-800/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="flex flex-col gap-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Chip
                        size="sm"
                        color={
                          record.status === "succeeded"
                            ? "success"
                            : record.status === "rolled_back"
                              ? "warning"
                              : "danger"
                        }
                      >
                        {record.status === "succeeded"
                          ? "更新成功"
                          : record.status === "rolled_back"
                            ? "安全回滚"
                            : "执行失败"}
                      </Chip>
                      <span className="font-mono text-zinc-500 font-medium">
                        [{record.branch || "main"}]
                      </span>
                      <span className="font-mono text-zinc-700 dark:text-zinc-300">
                        {record.previousCommit?.substring(0, 7) || "HEAD"} →{" "}
                        <span className="font-bold text-blue-600 dark:text-blue-400">
                          {record.targetCommit?.substring(0, 7) || "—"}
                        </span>
                      </span>
                    </div>
                    <span className="text-[11px] text-zinc-400 font-mono">
                      {record.createdAt
                        .replace("T", " ")
                        .replace(/\+\d{2}:\d{2}$/, "")}
                      {record.details ? ` · ${record.details}` : ""}
                    </span>
                  </div>

                  <span className="text-[11px] font-mono text-zinc-400 shrink-0">
                    ID: {record.id.substring(0, 8)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-zinc-400 text-xs">
              尚未产生历史代码部署或回滚审计记录。
            </div>
          )}
        </Card>
      )}

      {/* Tab 4: 服务器与系统硬件指标 */}
      {activeTab === "specs" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card className="border border-zinc-200/60 dark:border-zinc-800/60 bg-white dark:bg-zinc-900 rounded-xl p-4 shadow-2xs">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-zinc-100 dark:border-zinc-800/60">
              <Server className="w-4 h-4 text-blue-500" />
              <span className="font-bold text-xs text-zinc-900 dark:text-zinc-100">
                操作系统与环境
              </span>
            </div>
            <div className="flex flex-col gap-2.5 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-100/60 dark:border-zinc-800/40">
                <span className="text-zinc-500 font-medium">
                  主机节点 (Hostname)
                </span>
                <span className="font-mono font-bold text-zinc-800 dark:text-zinc-200">
                  {sysInfo?.hostname || "localhost"}
                </span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-zinc-100/60 dark:border-zinc-800/40">
                <span className="text-zinc-500 font-medium">
                  操作系统 (OS / Arch)
                </span>
                <span className="font-mono text-zinc-800 dark:text-zinc-200">
                  {sysInfo ? `${sysInfo.os} / ${sysInfo.arch}` : "—"}
                </span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-zinc-100/60 dark:border-zinc-800/40">
                <span className="text-zinc-500 font-medium">Go 运行时版本</span>
                <span className="font-mono text-blue-600 dark:text-blue-400 font-semibold">
                  {sysInfo?.goVersion || "—"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-500 font-medium">进程 PID</span>
                <span className="font-mono text-zinc-700 dark:text-zinc-300">
                  {sysInfo?.pid || "—"}
                </span>
              </div>
            </div>
          </Card>

          <Card className="border border-zinc-200/60 dark:border-zinc-800/60 bg-white dark:bg-zinc-900 rounded-xl p-4 shadow-2xs">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-zinc-100 dark:border-zinc-800/60">
              <Cpu className="w-4 h-4 text-amber-500" />
              <span className="font-bold text-xs text-zinc-900 dark:text-zinc-100">
                CPU 与并发协程
              </span>
            </div>
            <div className="flex flex-col gap-2.5 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-100/60 dark:border-zinc-800/40">
                <span className="text-zinc-500 font-medium">
                  逻辑 CPU 核心数
                </span>
                <span className="font-mono font-bold text-zinc-800 dark:text-zinc-200">
                  {sysInfo?.numCPU ? `${sysInfo.numCPU} 核 CPU` : "—"}
                </span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-zinc-100/60 dark:border-zinc-800/40">
                <span className="text-zinc-500 font-medium">
                  活跃 Goroutines 线程
                </span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                  {sysInfo?.goroutines ? `${sysInfo.goroutines} 个协程` : "—"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-500 font-medium">
                  服务运行时间 (Uptime)
                </span>
                <span className="font-mono text-zinc-700 dark:text-zinc-300">
                  {sysInfo?.uptimeSeconds
                    ? `${Math.floor(sysInfo.uptimeSeconds / 60)} 分 ${sysInfo.uptimeSeconds % 60} 秒`
                    : "—"}
                </span>
              </div>
            </div>
          </Card>

          <Card className="border border-zinc-200/60 dark:border-zinc-800/60 bg-white dark:bg-zinc-900 rounded-xl p-4 shadow-2xs">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-zinc-100 dark:border-zinc-800/60">
              <HardDrive className="w-4 h-4 text-emerald-500" />
              <span className="font-bold text-xs text-zinc-900 dark:text-zinc-100">
                内存与 SQLite 数据库
              </span>
            </div>
            <div className="flex flex-col gap-2.5 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-100/60 dark:border-zinc-800/40">
                <span className="text-zinc-500 font-medium">
                  堆内存分配 (Alloc)
                </span>
                <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                  {sysInfo?.allocMemMB
                    ? `${sysInfo.allocMemMB.toFixed(2)} MB`
                    : "—"}
                </span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-zinc-100/60 dark:border-zinc-800/40">
                <span className="text-zinc-500 font-medium">
                  系统总申请内存 (Sys)
                </span>
                <span className="font-mono text-zinc-700 dark:text-zinc-300">
                  {sysInfo?.sysMemMB
                    ? `${sysInfo.sysMemMB.toFixed(2)} MB`
                    : "—"}
                </span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-zinc-100/60 dark:border-zinc-800/40">
                <span className="text-zinc-500 font-medium">
                  SQLite 文件体积
                </span>
                <span className="font-mono text-purple-600 dark:text-purple-400 font-bold">
                  {sysInfo?.databaseSizeMB
                    ? `${sysInfo.databaseSizeMB.toFixed(2)} MB`
                    : "—"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-500 font-medium">
                  GC 垃圾回收触发次数
                </span>
                <span className="font-mono text-zinc-500">
                  {sysInfo?.numGC ?? "—"} 次
                </span>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* 确认对话框 */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalHeader className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
          {pendingAction === "update"
            ? "确认拉取并更新部署"
            : "确认版本安全回滚"}
        </ModalHeader>
        <ModalBody>
          <div className="flex flex-col gap-2 py-1">
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              {pendingAction === "update"
                ? "即将获取远程固定分支并执行快进更新。后台编辑的文章、分类和标签会先被安全暂存，在新版本构建前恢复；发生冲突或构建失败时会恢复原代码与内容。"
                : "即将重置代码库至上一个已验证的稳定版 Commit（git reset --hard），并自动触发环境恢复与构建脚本。"}
            </p>
            {status?.dirty && pendingAction === "update" && (
              <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 text-xs border border-amber-200 dark:border-amber-900/60">
                ⚠️
                注意：检测到工作区存在未提交的本地改动，请确保更改不会与合并操作发生冲突。
              </div>
            )}
          </div>
        </ModalBody>
        <ModalFooter className="flex items-center justify-end gap-2">
          <Button size="sm" variant="ghost" onClick={onClose}>
            取消
          </Button>
          <Button
            size="sm"
            variant={pendingAction === "update" ? "primary" : "danger"}
            onClick={() => action(pendingAction)}
          >
            确认执行{pendingAction === "update" ? "更新部署" : "版本回滚"}
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
    let ignore = false;
    cmsApi
      .backups()
      .then((data) => {
        if (!ignore) setItems(data);
      })
      .catch(() => {
        if (!ignore) toast.error("备份列表加载失败");
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, []);

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
    let ignore = false;
    const fetchJobs = () => {
      cmsApi
        .jobs()
        .then((res) => {
          if (!ignore) setData(res);
        })
        .catch(() => {
          if (!ignore) toast.error("后台任务加载失败");
        })
        .finally(() => {
          if (!ignore) setLoading(false);
        });
    };

    fetchJobs();
    const timer = window.setInterval(fetchJobs, 3000);
    return () => {
      ignore = true;
      window.clearInterval(timer);
    };
  }, []);

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
                      <td className="py-3 px-3 text-zinc-700 dark:text-zinc-300 max-w-sm leading-relaxed">
                        <div>{job.message}</div>
                        {job.logs && (
                          <details className="mt-2 text-[11px]">
                            <summary className="cursor-pointer text-blue-600 dark:text-blue-400">
                              查看执行日志
                            </summary>
                            <pre className="mt-1 max-h-40 overflow-auto whitespace-pre-wrap rounded-lg bg-zinc-950 p-2 font-mono text-zinc-200">
                              {job.logs}
                            </pre>
                          </details>
                        )}
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
