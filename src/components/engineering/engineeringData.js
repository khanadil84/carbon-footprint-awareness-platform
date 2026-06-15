import {
  CheckCircle, BarChart3, Shield, GitBranch,
  Zap, Package, Accessibility, Hammer,
  Gauge, Cpu, FileText, Activity,
  Cloud
} from 'lucide-react';

export const QUALITY_GATES = [
  {
    id: 'tests',
    title: 'Tests',
    value: '499 / 499',
    status: 'PASS',
    icon: CheckCircle,
    subtitle: 'All 24 test suites passing'
  },
  {
    id: 'coverage',
    title: 'Coverage',
    value: '93.29%',
    status: 'PASS',
    icon: BarChart3,
    subtitle: 'Line coverage threshold: 60%'
  },
  {
    id: 'security',
    title: 'Security',
    value: '0 threats',
    status: 'PASS',
    icon: Shield,
    subtitle: 'No unsafe patterns detected'
  },
  {
    id: 'codeql',
    title: 'CodeQL',
    value: 'PASS',
    status: 'PASS',
    icon: GitBranch,
    subtitle: 'Static analysis passed'
  },
  {
    id: 'performance',
    title: 'Performance',
    value: 'ALL PASS',
    status: 'PASS',
    icon: Zap,
    subtitle: '3 benchmark suites OK'
  },
  {
    id: 'bundle',
    title: 'Bundle Budget',
    value: '106.93 KB',
    status: 'PASS',
    icon: Package,
    subtitle: 'Gzip: 94.92 KB'
  },
  {
    id: 'accessibility',
    title: 'Accessibility',
    value: 'PASS',
    status: 'PASS',
    icon: Accessibility,
    subtitle: 'ARIA attributes verified'
  },
  {
    id: 'build',
    title: 'Build',
    value: 'PASS',
    status: 'PASS',
    icon: Hammer,
    subtitle: 'Vite production build'
  },
];

export const PERFORMANCE_METRICS = [
  {
    id: 'aggregation',
    title: 'Aggregation',
    value: '2.95 ms',
    icon: Gauge,
    subtitle: 'Average compute time'
  },
  {
    id: 'recommendation',
    title: 'Recommendation',
    value: '0.13 ms',
    icon: Cpu,
    subtitle: 'Average inference time'
  },
  {
    id: 'bundle',
    title: 'Bundle Size',
    value: '106.93 KB',
    icon: FileText,
    subtitle: 'Gzip compressed'
  },
  {
    id: 'recovery',
    title: 'Recovery Events',
    value: '0',
    icon: Activity,
    subtitle: 'Last 30 days'
  },
];

export const SYSTEM_HEALTH = {
  score: 100,
  maxScore: 100,
  items: [
    { label: 'Cache', status: 'Healthy' },
    { label: 'Storage', status: 'Healthy' },
    { label: 'Invariant Engine', status: 'Healthy' },
    { label: 'Telemetry', status: 'Running' },
    { label: 'Recovery', status: 'Healthy' },
    { label: 'Diagnostics', status: 'Healthy' },
  ],
};

export const BUILD_INFO = [
  { label: 'Version', value: 'v1.0.0' },
  { label: 'Environment', value: 'Production' },
  { label: 'CI', value: 'GitHub Actions' },
  { label: 'Deployment', value: 'Vercel' },
  { label: 'Status', value: 'Healthy' },
];

export const RECENT_EVENTS = [
  { time: '2m ago', event: 'GitHub Actions completed', icon: CheckCircle, variant: 'success' },
  { time: '3m ago', event: 'CodeQL passed', icon: CheckCircle, variant: 'success' },
  { time: '4m ago', event: 'Coverage passed', icon: CheckCircle, variant: 'success' },
  { time: '5m ago', event: 'Bundle Budget passed', icon: CheckCircle, variant: 'success' },
  { time: '6m ago', event: 'Security Verification passed', icon: CheckCircle, variant: 'success' },
  { time: '7m ago', event: 'Benchmarks passed', icon: CheckCircle, variant: 'success' },
  { time: '10m ago', event: 'Vercel Deployment completed', icon: Cloud, variant: 'default' },
];
