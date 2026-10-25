import { Github } from '@/components/ui/GithubIcon';
import { useEffect, useRef, useState } from 'react';
import {
  FileText,
  GitCommitHorizontal,
  GitPullRequest,
  MessageSquare,
  Pause,
  Play,
  ArrowRight,
} from 'lucide-react';
import { useTheme } from '@/theme/ThemeProvider';
const samples = [
  {
    yesterday: 'Merged login validation improvements.',
    today: 'Add password reset tests.',
    source: 'web-app · PR #42',
  },
  {
    yesterday: 'Committed API pagination updates.',
    today: 'Cover pagination edge cases.',
    source: 'api-service · a81c2f',
  },
  {
    yesterday: 'Reviewed the password reset flow.',
    today: 'Follow up on review feedback.',
    source: 'web-app · PR #45',
  },
];
const inputs = [
  {
    Icon: GitCommitHorizontal,
    name: 'Commit',
    text: 'Add login validation',
    meta: 'web-app · 2 hours ago',
    kind: 'commit',
  },
  {
    Icon: GitPullRequest,
    name: 'Pull request',
    text: 'Login improvements merged',
    meta: 'PR #42 · 3 commits',
    kind: 'pr',
  },
  {
    Icon: MessageSquare,
    name: 'Review',
    text: 'Review password reset flow',
    meta: 'PR #45 · Approved',
    kind: 'review',
  },
];
export function ProductAnimation({ login = false }: { login?: boolean }) {
  const host = useRef<HTMLDivElement>(null),
    [index, setIndex] = useState(0),
    [paused, setPaused] = useState(false),
    [active, setActive] = useState(false),
    [paths, setPaths] = useState<string[]>([]),
    [size, setSize] = useState({ width: 1000, height: 350 }),
    { reduced } = useTheme();
  useEffect(() => {
    const element = host.current;
    if (!element) return;
    const observer = new IntersectionObserver(([entry]) =>
      setActive(entry.isIntersecting && !document.hidden),
    );
    observer.observe(element);
    const visibility = () =>
      setActive(
        !document.hidden &&
          element.getBoundingClientRect().bottom > 0 &&
          element.getBoundingClientRect().top < innerHeight,
      );
    document.addEventListener('visibilitychange', visibility);
    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', visibility);
    };
  }, []);
  useEffect(() => {
    if (paused || !active || reduced || matchMedia('(prefers-reduced-motion: reduce)').matches)
      return;
    const timer = setInterval(() => setIndex((value) => value + 1), 2200);
    return () => clearInterval(timer);
  }, [paused, active, reduced]);
  useEffect(() => {
    const element = host.current;
    if (!element) return;
    const draw = () => {
      const rect = element.getBoundingClientRect(),
        output = element.querySelector('.notification-home-host')!.getBoundingClientRect(),
        node = element.querySelector('.machine-node')!.getBoundingClientRect(),
        mobile = innerWidth <= 640;
      const x = node.left - rect.left + node.width / 2,
        y = node.top - rect.top + node.height / 2;
      setSize({ width: rect.width, height: rect.height });
      const lines = Array.from(element.querySelectorAll('.machine-event')).map((source) => {
        const box = source.getBoundingClientRect();
        return mobile
          ? `M ${box.left - rect.left + box.width / 2} ${box.bottom - rect.top} C ${box.left - rect.left + box.width / 2} ${box.bottom - rect.top + 30}, ${output.left - rect.left + output.width / 2} ${output.top - rect.top - 35}, ${output.left - rect.left + output.width / 2} ${output.top - rect.top + 6}`
          : `M ${box.right - rect.left - 3} ${box.top - rect.top + box.height / 2} C ${x - 60} ${box.top - rect.top + box.height / 2}, ${x - 60} ${y}, ${x} ${y}`;
      });
      if (!mobile)
        lines.push(
          `M ${x} ${y} C ${x + 55} ${y}, ${output.left - rect.left - 30} ${output.top - rect.top + output.height / 2}, ${output.left - rect.left + 4} ${output.top - rect.top + output.height / 2}`,
        );
      setPaths(lines);
    };
    const resize = new ResizeObserver(draw);
    resize.observe(element);
    draw();
    return () => resize.disconnect();
  }, []);
  return (
    <div
      ref={host}
      className={`hero-machine react-machine ${login ? 'react-login-machine' : ''} ${paused || !active || reduced ? 'is-paused' : ''}`}
    >
      <svg
        className="homepage-beams"
        viewBox={`0 0 ${size.width} ${size.height}`}
        aria-hidden="true"
      >
        {paths.map((d, i) => (
          <g key={i}>
            <path d={d} className="homepage-beam-track" />
            {['pulse', 'core'].map((kind) => (
              <path
                key={kind}
                d={d}
                pathLength={200}
                className={'homepage-beam-' + kind}
                style={{ animationDelay: `${i * 0.4}s` }}
              />
            ))}
          </g>
        ))}
      </svg>
      <div className="machine-inputs">
        {inputs.map(({ Icon, name, text, meta, kind }) => (
          <article className={'machine-event ' + kind} key={name}>
            <Icon size={18} />
            <div>
              <strong>{name}</strong>
              <span>{text}</span>
              <small>{meta}</small>
            </div>
          </article>
        ))}
      </div>
      <div className="machine-node" aria-label="Generating sample update">
        <FileText size={24} />
      </div>
      <div className="notification-home-host">
        <div className="home-update-deck">
          {[2, 1, 0].map((depth) => {
            const sample = samples[(index - depth + samples.length * 1000) % samples.length];
            return (
              <article
                key={index - depth}
                className={`daily-notification ${depth === 0 ? 'notification-arrive' : ''}`}
                style={{
                  transform: depth
                    ? `translateY(${-depth * 12}px) scale(${1 - depth * 0.035})`
                    : undefined,
                  opacity: 1 - depth * 0.24,
                  zIndex: 3 - depth,
                }}
                aria-hidden={depth > 0}
              >
                <div className="notification-head">
                  <FileText size={19} />
                  <span>Your daily update</span>
                  <time>{depth ? 'earlier' : 'just now'}</time>
                </div>
                <div className="notification-section">Yesterday</div>
                <p className="notification-text">{sample.yesterday}</p>
                <div className="notification-section">Today · Your plan</div>
                <p className="notification-text">{sample.today}</p>
                <div className="notification-section">Blockers</div>
                <p className="notification-text">Ready for your review.</p>
                <span className="notification-source">
                  <Github size={12} />
                  {sample.source}
                </span>
              </article>
            );
          })}
        </div>
      </div>
      <div className="react-animation-controls">
        <span className="sample-label">
          <span className="notification-indicator" /> Sample activity · Review before sharing
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => setIndex((value) => value + 1)}
            aria-label="Show next sample update"
          >
            <ArrowRight size={14} />
          </button>
          <button onClick={() => setPaused((value) => !value)}>
            {paused ? <Play size={12} /> : <Pause size={12} />}{' '}
            {paused ? 'Play animation' : 'Pause animation'}
          </button>
        </div>
      </div>
    </div>
  );
}
