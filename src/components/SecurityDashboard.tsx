import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSecurityMonitor, SecurityEvent } from '@/hooks/useSecurityMonitor';
import { Shield, AlertTriangle, Info, Clock, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

/**
 * Security Dashboard Component for monitoring security events
 * This would typically only be visible to admin users in production
 */

const SecurityDashboard: React.FC = () => {
  const { getSecurityEvents, getSecurityEventsByType } = useSecurityMonitor();
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [selectedType, setSelectedType] = useState<string>('all');

  useEffect(() => {
    const updateEvents = () => {
      if (selectedType === 'all') {
        setEvents(getSecurityEvents(50));
      } else {
        setEvents(getSecurityEventsByType(selectedType as SecurityEvent['type'], 50));
      }
    };

    updateEvents();
    const interval = setInterval(updateEvents, 5000); // Refresh every 5 seconds
    
    return () => clearInterval(interval);
  }, [selectedType, getSecurityEvents, getSecurityEventsByType]);

  const getSeverityIcon = (severity: SecurityEvent['severity']) => {
    switch (severity) {
      case 'high':
        return <AlertTriangle className="w-4 h-4 text-destructive" />;
      case 'medium':
        return <AlertTriangle className="w-4 h-4 text-warning" />;
      case 'low':
        return <Info className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getSeverityVariant = (severity: SecurityEvent['severity']) => {
    switch (severity) {
      case 'high':
        return 'destructive' as const;
      case 'medium':
        return 'secondary' as const;
      case 'low':
        return 'outline' as const;
    }
  };

  const eventCounts = {
    all: getSecurityEvents().length,
    auth_failure: getSecurityEventsByType('auth_failure').length,
    validation_error: getSecurityEventsByType('validation_error').length,
    rate_limit_exceeded: getSecurityEventsByType('rate_limit_exceeded').length,
    suspicious_input: getSecurityEventsByType('suspicious_input').length,
  };

  return (
    <Card className="card-glass">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Security Monitor
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <Tabs value={selectedType} onValueChange={setSelectedType}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="all" className="text-xs">
              All ({eventCounts.all})
            </TabsTrigger>
            <TabsTrigger value="auth_failure" className="text-xs">
              Auth ({eventCounts.auth_failure})
            </TabsTrigger>
            <TabsTrigger value="validation_error" className="text-xs">
              Validation ({eventCounts.validation_error})
            </TabsTrigger>
            <TabsTrigger value="rate_limit_exceeded" className="text-xs">
              Rate Limit ({eventCounts.rate_limit_exceeded})
            </TabsTrigger>
            <TabsTrigger value="suspicious_input" className="text-xs">
              Suspicious ({eventCounts.suspicious_input})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value={selectedType} className="mt-4">
            <ScrollArea className="h-[400px]">
              {events.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Shield className="w-8 h-8 mx-auto mb-2" />
                  <p>No security events recorded</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {events.map((event, index) => (
                    <Card key={index} className="border-l-4 border-l-accent/50">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3 flex-1">
                            {getSeverityIcon(event.severity)}
                            <div className="flex-1 space-y-1">
                              <div className="flex items-center gap-2">
                                <Badge variant={getSeverityVariant(event.severity)}>
                                  {event.type.replace('_', ' ')}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {event.severity}
                                </Badge>
                              </div>
                              <p className="text-sm font-medium">{event.message}</p>
                              {event.metadata && Object.keys(event.metadata).length > 0 && (
                                <div className="text-xs text-muted-foreground">
                                  <details className="cursor-pointer">
                                    <summary className="hover:text-foreground">
                                      View metadata
                                    </summary>
                                    <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-x-auto">
                                      {JSON.stringify(event.metadata, null, 2)}
                                    </pre>
                                  </details>
                                </div>
                              )}
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {formatDistanceToNow(event.timestamp, { addSuffix: true })}
                                </span>
                                {event.userId && (
                                  <span className="flex items-center gap-1">
                                    <User className="w-3 h-3" />
                                    {event.userId.slice(0, 8)}...
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default SecurityDashboard;