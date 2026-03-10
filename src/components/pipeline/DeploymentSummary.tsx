import {
  Package,
  Bug,
  Shield,
  Zap,
  Server,
  FileText,
  CheckCircle,
  AlertTriangle,
  BarChart3,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { cn } from '@/lib/utils';
import type {
  DeploymentSummary as DeploymentSummaryType,
  DeploymentChange,
  DeploymentMetrics,
} from '@/types/pipeline';

interface DeploymentSummaryProps {
  summary: DeploymentSummaryType;
  className?: string;
}

export function DeploymentSummary({ summary, className }: DeploymentSummaryProps) {
  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Package className="h-5 w-5" />
          Deployment Summary
          <EnvironmentBadge environment={summary.environment} />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Version Info */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
          <div>
            <div className="text-xs text-muted-foreground">Deployed Version</div>
            <div className="font-mono font-medium">{summary.version}</div>
          </div>
          {summary.previous_version && (
            <div className="text-right">
              <div className="text-xs text-muted-foreground">Previous</div>
              <div className="font-mono text-sm text-muted-foreground">
                {summary.previous_version}
              </div>
            </div>
          )}
        </div>

        {/* Services Deployed */}
        {summary.services_deployed.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
              <Server className="h-4 w-4" />
              Services Deployed
            </h4>
            <div className="flex flex-wrap gap-2">
              {summary.services_deployed.map((service) => (
                <span
                  key={service}
                  className="px-2 py-1 text-xs rounded-md bg-blue-500/20 text-blue-400 border border-blue-500/30"
                >
                  {service}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Changes */}
        {summary.changes.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-3">What's Changed</h4>
            <div className="space-y-2">
              {summary.changes.map((change, index) => (
                <ChangeItem key={index} change={change} />
              ))}
            </div>
          </div>
        )}

        {/* Metrics */}
        {summary.metrics && <MetricsSection metrics={summary.metrics} />}
      </CardContent>
    </Card>
  );
}

// =============================================================================
// Sub-components
// =============================================================================

function EnvironmentBadge({ environment }: { environment: 'dev' | 'staging' | 'prod' }) {
  const colors = {
    dev: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    staging: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    prod: 'bg-green-500/20 text-green-400 border-green-500/30',
  };

  const labels = {
    dev: 'Development',
    staging: 'Staging',
    prod: 'Production',
  };

  return (
    <span
      className={cn(
        'ml-auto px-2 py-0.5 text-xs rounded-full border font-medium',
        colors[environment]
      )}
    >
      {labels[environment]}
    </span>
  );
}

function ChangeItem({ change }: { change: DeploymentChange }) {
  const typeConfig = {
    feature: {
      icon: Zap,
      color: 'text-green-400',
      bg: 'bg-green-500/10',
      label: 'Feature',
    },
    bugfix: {
      icon: Bug,
      color: 'text-red-400',
      bg: 'bg-red-500/10',
      label: 'Bug Fix',
    },
    security: {
      icon: Shield,
      color: 'text-yellow-400',
      bg: 'bg-yellow-500/10',
      label: 'Security',
    },
    performance: {
      icon: BarChart3,
      color: 'text-purple-400',
      bg: 'bg-purple-500/10',
      label: 'Performance',
    },
    infrastructure: {
      icon: Server,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
      label: 'Infrastructure',
    },
    documentation: {
      icon: FileText,
      color: 'text-gray-400',
      bg: 'bg-gray-500/10',
      label: 'Docs',
    },
  };

  const config = typeConfig[change.type] || typeConfig.feature;
  const Icon = config.icon;

  return (
    <div className="flex items-start gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors">
      <div className={cn('p-1.5 rounded-md', config.bg)}>
        <Icon className={cn('h-4 w-4', config.color)} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">{change.title}</span>
          {change.ticket_id && (
            <a
              href={`https://github.com/issues/${change.ticket_id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-muted-foreground hover:text-primary"
            >
              #{change.ticket_id}
            </a>
          )}
        </div>
        {change.description && (
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
            {change.description}
          </p>
        )}
        <div className="text-xs text-muted-foreground mt-1">
          by {change.author}
        </div>
      </div>
    </div>
  );
}

function MetricsSection({ metrics }: { metrics: DeploymentMetrics }) {
  const testsPassed = metrics.tests_passed;
  const testsFailed = metrics.tests_failed;
  const totalTests = testsPassed + testsFailed;
  const testPassRate = totalTests > 0 ? (testsPassed / totalTests) * 100 : 100;

  return (
    <div className="border-t border-white/10 pt-4">
      <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
        <BarChart3 className="h-4 w-4" />
        Quality Metrics
      </h4>
      <div className="grid gap-3 md:grid-cols-3">
        {/* Tests */}
        <MetricItem
          label="Tests"
          value={`${testsPassed}/${totalTests}`}
          subValue={`${testPassRate.toFixed(0)}% passed`}
          status={testsFailed === 0 ? 'success' : 'warning'}
        />

        {/* Coverage */}
        {metrics.coverage_percent !== undefined && (
          <MetricItem
            label="Coverage"
            value={`${metrics.coverage_percent}%`}
            status={metrics.coverage_percent >= 80 ? 'success' : 'warning'}
          />
        )}

        {/* Security */}
        <MetricItem
          label="Security Issues"
          value={`${metrics.security_issues_fixed}/${metrics.security_issues_found}`}
          subValue="fixed"
          status={
            metrics.security_issues_found === metrics.security_issues_fixed
              ? 'success'
              : 'warning'
          }
        />
      </div>
    </div>
  );
}

interface MetricItemProps {
  label: string;
  value: string;
  subValue?: string;
  status: 'success' | 'warning' | 'error';
}

function MetricItem({ label, value, subValue, status }: MetricItemProps) {
  return (
    <div className="p-3 rounded-lg bg-white/5 border border-white/10">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-muted-foreground">{label}</span>
        {status === 'success' ? (
          <CheckCircle className="h-3.5 w-3.5 text-green-500" />
        ) : (
          <AlertTriangle className="h-3.5 w-3.5 text-yellow-500" />
        )}
      </div>
      <div className="font-medium">{value}</div>
      {subValue && (
        <div className="text-xs text-muted-foreground">{subValue}</div>
      )}
    </div>
  );
}

// =============================================================================
// Compact Summary for Cards
// =============================================================================

interface DeploymentSummaryCompactProps {
  summary: DeploymentSummaryType;
}

export function DeploymentSummaryCompact({ summary }: DeploymentSummaryCompactProps) {
  const changeCount = summary.changes.length;
  const changesByType = summary.changes.reduce((acc, change) => {
    acc[change.type] = (acc[change.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="flex items-center gap-2 text-xs">
      <EnvironmentBadge environment={summary.environment} />
      <span className="text-muted-foreground">•</span>
      <span className="font-mono">{summary.version}</span>
      {changeCount > 0 && (
        <>
          <span className="text-muted-foreground">•</span>
          <span className="text-muted-foreground">
            {changeCount} change{changeCount !== 1 ? 's' : ''}
          </span>
        </>
      )}
      {changesByType.feature && (
        <span className="text-green-400">+{changesByType.feature} features</span>
      )}
      {changesByType.bugfix && (
        <span className="text-red-400">{changesByType.bugfix} fixes</span>
      )}
    </div>
  );
}
