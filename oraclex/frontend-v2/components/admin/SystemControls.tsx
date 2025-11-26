'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Pause, Play, Settings, Shield } from 'lucide-react';
import { toast } from 'sonner';

export function SystemControls() {
  const handlePause = () => {
    toast.success('Contract paused (demo)');
  };

  const handleUnpause = () => {
    toast.success('Contract unpaused (demo)');
  };

  const handleUpdateFees = () => {
    toast.success('Fee parameters updated (demo)');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          System Controls
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Contract Status */}
        <div className="space-y-3">
          <h4 className="font-semibold">Contract Status</h4>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex items-center justify-between rounded-lg border p-3">
              <span className="text-sm">Prediction AMM</span>
              <Badge variant="outline" className="bg-yes/10 text-yes">
                Active
              </Badge>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <span className="text-sm">Market Factory</span>
              <Badge variant="outline" className="bg-yes/10 text-yes">
                Active
              </Badge>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <span className="text-sm">Oracle Adapter</span>
              <Badge variant="outline" className="bg-yes/10 text-yes">
                Active
              </Badge>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <span className="text-sm">Governance</span>
              <Badge variant="outline" className="bg-yes/10 text-yes">
                Active
              </Badge>
            </div>
          </div>
        </div>

        {/* Emergency Controls */}
        <div className="space-y-3">
          <h4 className="font-semibold">Emergency Controls</h4>
          <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
            <div className="mb-3 flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              Use with caution - affects all users
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <Button variant="destructive" size="sm" onClick={handlePause}>
                <Pause className="mr-2 h-4 w-4" />
                Pause All Contracts
              </Button>
              <Button variant="outline" size="sm" onClick={handleUnpause}>
                <Play className="mr-2 h-4 w-4" />
                Unpause All Contracts
              </Button>
            </div>
          </div>
        </div>

        {/* Parameter Updates */}
        <div className="space-y-3">
          <h4 className="font-semibold">Parameter Updates</h4>
          <div className="space-y-2">
            <Button variant="outline" className="w-full justify-start" onClick={handleUpdateFees}>
              <Settings className="mr-2 h-4 w-4" />
              Update Fee Parameters
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Settings className="mr-2 h-4 w-4" />
              Update Market Limits
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Settings className="mr-2 h-4 w-4" />
              Update Oracle Address
            </Button>
          </div>
        </div>

        {/* Role Management */}
        <div className="space-y-3">
          <h4 className="font-semibold">Role Registry</h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between rounded-lg border p-3">
              <span className="text-muted-foreground">Admin Role</span>
              <Badge>2 addresses</Badge>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <span className="text-muted-foreground">Oracle Role</span>
              <Badge>1 address</Badge>
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <span className="text-muted-foreground">Pauser Role</span>
              <Badge>3 addresses</Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
