import { useCallback } from 'react';
import { useAuth } from './useAuth';

/**
 * Security monitoring hook for logging suspicious activities
 */

export interface SecurityEvent {
  type: 'auth_failure' | 'validation_error' | 'rate_limit_exceeded' | 'suspicious_input';
  severity: 'low' | 'medium' | 'high';
  message: string;
  metadata?: Record<string, any>;
  timestamp: Date;
  userId?: string;
}

// In-memory security event storage (in production, send to monitoring service)
const securityEvents: SecurityEvent[] = [];

export const useSecurityMonitor = () => {
  const { user } = useAuth();

  const logSecurityEvent = useCallback((
    type: SecurityEvent['type'],
    severity: SecurityEvent['severity'],
    message: string,
    metadata?: Record<string, any>
  ) => {
    const event: SecurityEvent = {
      type,
      severity,
      message,
      metadata,
      timestamp: new Date(),
      userId: user?.id,
    };

    securityEvents.push(event);

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.warn('[Security Monitor]', event);
    }

    // In production, you would send this to your monitoring service
    // Example: sendToMonitoringService(event);
    
    // Keep only the last 100 events in memory
    if (securityEvents.length > 100) {
      securityEvents.splice(0, securityEvents.length - 100);
    }
  }, [user?.id]);

  const logAuthFailure = useCallback((reason: string, metadata?: Record<string, any>) => {
    logSecurityEvent('auth_failure', 'high', `Authentication failure: ${reason}`, metadata);
  }, [logSecurityEvent]);

  const logValidationError = useCallback((field: string, error: string, value?: string) => {
    logSecurityEvent('validation_error', 'medium', `Validation error in ${field}: ${error}`, {
      field,
      error,
      hasValue: !!value,
      valueLength: value?.length,
    });
  }, [logSecurityEvent]);

  const logRateLimitExceeded = useCallback((resource: string, attempts: number) => {
    logSecurityEvent('rate_limit_exceeded', 'high', `Rate limit exceeded for ${resource}`, {
      resource,
      attempts,
    });
  }, [logSecurityEvent]);

  const logSuspiciousInput = useCallback((field: string, reason: string, input?: string) => {
    logSecurityEvent('suspicious_input', 'medium', `Suspicious input detected in ${field}: ${reason}`, {
      field,
      reason,
      inputLength: input?.length,
      containsScript: input?.toLowerCase().includes('script'),
      containsJavascript: input?.toLowerCase().includes('javascript:'),
    });
  }, [logSecurityEvent]);

  const getSecurityEvents = useCallback((limit?: number) => {
    return limit ? securityEvents.slice(-limit) : [...securityEvents];
  }, []);

  const getSecurityEventsByType = useCallback((type: SecurityEvent['type'], limit?: number) => {
    const filtered = securityEvents.filter(event => event.type === type);
    return limit ? filtered.slice(-limit) : filtered;
  }, []);

  return {
    logSecurityEvent,
    logAuthFailure,
    logValidationError,
    logRateLimitExceeded,
    logSuspiciousInput,
    getSecurityEvents,
    getSecurityEventsByType,
  };
};
