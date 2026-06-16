"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  Braces,
  ChevronRight,
  Code2,
  Crosshair,
  Database,
  GitBranch,
  ShieldCheck,
  Terminal,
} from "lucide-react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import MarketingHeader from "@/components/layout/MarketingHeader";
import MarketingFooter from "@/components/layout/MarketingFooter";

const principles = [
  {
    id: "01",
    title: "逻辑优先",
    label: "Logic First",
    icon: Braces,
    body: "所有判断必须落在可验证的输入、处理和输出上。概念可以辅助表达，但不能替代推理。",
  },
  {
    id: "02",
    title: "边界清晰",
    label: "Clear Boundary",
    icon: ShieldCheck,
    body: "系统安全不是补丁集合，而是对权限、数据、网络和执行上下文的持续约束。",
  },
  {
    id: "03",
    title: "代码留痕",
    label: "Traceable Code",
    icon: GitBranch,
    body: "经验只有转化成代码、配置、复盘和测试，才会从个人直觉沉淀为可复用资产。",
  },
  {
    id: "04",
    title: "回到底层",
    label: "Back To Metal",
    icon: Database,
    body: "框架会变化，抽象会叠加。底层机制、协议约束和数据结构才是长期稳定的支点。",
  },
];

const sections = [
  {
    number: "I",
    eyebrow: "Status Quo",
    title: "抽象正在变厚",
    body: [
      "现代工程并不缺少框架、工具和模板。真正稀缺的是对系统运行方式的耐心：请求如何穿过网关，状态如何跨进程同步，内存何时被分配，边界为什么被绕过。",
      "当开发只剩下复制粘贴和参数调优，代码就会变成无法解释的仪式。序栈反对这种惯性。我们关心的是一段逻辑为什么成立，以及它在压力、攻击和故障下如何失败。",
    ],
  },
  {
    number: "II",
    eyebrow: "Origin",
    title: "代码是逻辑的执行形态",
    body: [
      "代码不是装饰，也不是口号。它是数理逻辑在机器上的精确执行，是对输入空间、状态迁移和失败路径的声明。",
      "这里记录的内容，不追逐热词本身。我们更关心热词背后的结构：调度、缓存、一致性、索引、鉴权、加密、观测和恢复。",
    ],
  },
  {
    number: "III",
    eyebrow: "Defense",
    title: "边界决定系统安全",
    body: [
      "安全问题通常不是凭空出现的。它来自一次越界：未经验证的输入、过度信任的身份、泄漏的密钥、错误的缓存、缺失的隔离。",
      "研究漏洞不是为了制造复杂感，而是为了理解系统最脆弱的连接处。边界越清晰，代码越确定。",
    ],
  },
  {
    number: "IV",
    eyebrow: "Practice",
    title: "实践必须能被复现",
    body: [
      "一篇技术记录如果不能帮助后来者复现路径，它就只是一段情绪。序栈的文章要尽量保留背景、取舍、失败原因和可验证结论。",
      "我们接受复杂，但拒绝玄学。把问题拆开，把证据留下，把结论写清楚。仅此而已。",
    ],
  },
];

export default function ManifestoContent() {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (prefersReducedMotion) {
        gsap.set(".manifesto-reveal", { opacity: 1, y: 0 });
        return;
      }

      gsap.fromTo(
        ".manifesto-reveal",
        { opacity: 0, y: 18 },
        {
          opacity: 1,
          y: 0,
          duration: 0.75,
          stagger: 0.08,
          ease: "power2.out",
        }
      );
    },
    { scope: containerRef }
  );

  return (
    <div ref={containerRef} className="min-h-screen bg-background text-foreground">
      <MarketingHeader activePath="/manifesto" />

      <main className="relative overflow-hidden pt-16">
        <section className="relative border-b border-divider/50">
          <div className="absolute inset-0 bg-grid bg-grid-mask opacity-60" aria-hidden="true" />
          <div className="relative z-10 mx-auto grid min-h-[calc(100svh-4rem)] w-full max-w-6xl grid-cols-1 content-end gap-10 px-5 pb-10 pt-20 sm:px-8 md:grid-cols-[minmax(0,1fr)_320px] md:items-end md:pb-14 md:pt-28 lg:px-10">
            <div className="manifesto-reveal max-w-3xl">
              <Link
                href="/"
                className="mb-8 inline-flex min-h-[44px] items-center gap-2 rounded-sm border border-divider/60 bg-background/70 px-3 text-[11px] font-semibold uppercase text-foreground/60 transition-colors duration-200 hover:border-foreground/25 hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
              >
                <ArrowLeft size={14} />
                Return To Console
              </Link>

              <div className="mb-7 flex items-center gap-3">
                <Image
                  src="/logo.png"
                  alt="序栈"
                  width={48}
                  height={48}
                  className="h-12 w-12 rounded-sm object-contain"
                  priority
                  unoptimized
                />
                <div className="font-mono text-[11px] uppercase text-foreground/55">
                  <div className="font-bold text-accent">Sequence.Stack</div>
                  <div>Manifesto / Version 1.0</div>
                </div>
              </div>

              <p className="mb-5 font-mono text-[11px] font-bold uppercase text-accent">
                代码即逻辑，边界即安全。
              </p>
              <h1 className="max-w-3xl text-4xl font-black leading-[1.08] tracking-normal text-foreground sm:text-5xl md:text-6xl">
                把技术重新放回可验证的系统里。
              </h1>
              <p className="mt-7 max-w-2xl text-[15px] leading-8 text-foreground/68 sm:text-base">
                序栈是一处面向底层原理、系统安全与工程架构的知识库。它不是速成手册，也不是概念展板；它试图记录一件更朴素的事：代码如何运行，边界如何失效，工程如何被复现。
              </p>
            </div>

            <aside className="manifesto-reveal border border-divider/60 bg-background/86 p-5 shadow-sm backdrop-blur-sm">
              <div className="mb-5 flex items-center justify-between border-b border-divider/40 pb-3 font-mono text-[10px] uppercase text-foreground/45">
                <span>System Brief</span>
                <Terminal size={14} className="text-accent" />
              </div>
              <dl className="grid gap-4 text-sm">
                <div>
                  <dt className="font-mono text-[10px] uppercase text-foreground/42">Scope</dt>
                  <dd className="mt-1 font-semibold text-foreground">底层机制 / 安全边界 / 架构实践</dd>
                </div>
                <div>
                  <dt className="font-mono text-[10px] uppercase text-foreground/42">Method</dt>
                  <dd className="mt-1 font-semibold text-foreground">推理、复现、验证、沉淀</dd>
                </div>
                <div>
                  <dt className="font-mono text-[10px] uppercase text-foreground/42">Refusal</dt>
                  <dd className="mt-1 font-semibold text-foreground">拒绝黑盒迷信与空泛术语</dd>
                </div>
              </dl>
            </aside>
          </div>
        </section>

        <section className="border-b border-divider/50 bg-background">
          <div className="mx-auto grid max-w-6xl grid-cols-1 gap-3 px-5 py-8 sm:px-8 md:grid-cols-4 lg:px-10">
            {principles.map((item) => {
              const Icon = item.icon;
              return (
                <article
                  key={item.id}
                  className="manifesto-reveal border border-divider/50 bg-foreground/[0.01] p-4 transition-colors duration-200 hover:border-foreground/20"
                >
                  <div className="mb-5 flex items-center justify-between">
                    <span className="font-mono text-[10px] font-bold text-accent">{item.id}</span>
                    <Icon size={18} className="text-foreground/45" />
                  </div>
                  <h2 className="text-base font-bold text-foreground">{item.title}</h2>
                  <p className="mt-1 font-mono text-[10px] uppercase text-foreground/40">{item.label}</p>
                  <p className="mt-4 text-sm leading-6 text-foreground/62">{item.body}</p>
                </article>
              );
            })}
          </div>
        </section>

        <section className="bg-background">
          <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-5 py-14 sm:px-8 md:grid-cols-[220px_minmax(0,1fr)] md:py-20 lg:px-10">
            <div className="manifesto-reveal md:sticky md:top-24 md:h-fit">
              <div className="mb-4 flex h-11 w-11 items-center justify-center border border-divider/60 bg-foreground/[0.02] text-accent">
                <BookOpen size={19} />
              </div>
              <p className="font-mono text-[11px] font-bold uppercase text-foreground/48">
                Four Notes
              </p>
              <p className="mt-3 text-sm leading-7 text-foreground/58">
                四段短文构成这份发刊词的核心：现状、本源、防御与实践。
              </p>
            </div>

            <div className="grid gap-12">
              {sections.map((section) => (
                <article key={section.number} className="manifesto-reveal grid gap-5 border-b border-divider/45 pb-12 last:border-b-0 last:pb-0 md:grid-cols-[80px_minmax(0,1fr)]">
                  <div className="font-mono text-3xl font-black text-foreground/18">{section.number}</div>
                  <div>
                    <p className="mb-3 font-mono text-[11px] font-bold uppercase text-accent">{section.eyebrow}</p>
                    <h2 className="text-2xl font-extrabold tracking-normal text-foreground sm:text-3xl">{section.title}</h2>
                    <div className="mt-6 grid gap-5 text-[15px] leading-8 text-foreground/70">
                      {section.body.map((paragraph) => (
                        <p key={paragraph}>{paragraph}</p>
                      ))}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="border-y border-divider/50 bg-foreground/[0.025]">
          <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-5 py-12 sm:px-8 md:grid-cols-[minmax(0,1fr)_auto] md:items-center lg:px-10">
            <div className="manifesto-reveal">
              <p className="mb-3 font-mono text-[11px] font-bold uppercase text-accent">Next Entry</p>
              <h2 className="text-2xl font-extrabold text-foreground sm:text-3xl">
                从宣言进入文档。
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-foreground/62">
                如果这份发刊词是序言，知识库就是后续的证据。每一篇文章都应该回到一个可验证的问题。
              </p>
            </div>
            <Link
              href="/kb"
              className="manifesto-reveal inline-flex min-h-[48px] items-center justify-center gap-3 rounded-sm bg-foreground px-6 text-xs font-bold uppercase text-background transition-transform duration-200 hover:translate-x-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
            >
              <Code2 size={16} />
              Enter Knowledge Base
              <ChevronRight size={16} />
            </Link>
          </div>
        </section>

        <section className="bg-background">
          <div className="mx-auto grid max-w-6xl grid-cols-1 gap-4 px-5 py-10 sm:px-8 md:grid-cols-3 lg:px-10">
            <div className="manifesto-reveal flex items-start gap-3 text-sm text-foreground/60">
              <Crosshair size={17} className="mt-1 text-accent" />
              <span>目标不是覆盖所有知识，而是保留关键问题的求解路径。</span>
            </div>
            <div className="manifesto-reveal flex items-start gap-3 text-sm text-foreground/60">
              <ShieldCheck size={17} className="mt-1 text-accent" />
              <span>安全不是单独章节，而是每个工程边界都要面对的约束。</span>
            </div>
            <div className="manifesto-reveal flex items-start gap-3 text-sm text-foreground/60">
              <Terminal size={17} className="mt-1 text-accent" />
              <span>实践不是展示经验，而是把经验转化成后来者能复现的步骤。</span>
            </div>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </div>
  );
}
