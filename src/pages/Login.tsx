import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { LogIn, Shield, GitBranch } from 'lucide-react';

export function Login() {
  const { login } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 rounded-2xl bg-primary flex items-center justify-center">
            <GitBranch className="h-8 w-8 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl">Pipeline Portal</CardTitle>
          <CardDescription>
            Track CI/CD pipeline status and get actionable insights
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={login} className="w-full gap-2" size="lg">
            <LogIn className="h-4 w-4" />
            Sign in with Keycloak
          </Button>
          
          <div className="flex items-center gap-2 text-xs text-muted-foreground justify-center">
            <Shield className="h-3 w-3" />
            <span>Secured by OIL Identity Provider</span>
          </div>

          <div className="pt-4 border-t">
            <h4 className="font-medium text-sm mb-2">What you can do:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• View pipeline run status across all repositories</li>
              <li>• Track commits and link to pull requests</li>
              <li>• Get corrective action suggestions for failures</li>
              <li>• Monitor build and deployment health</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
