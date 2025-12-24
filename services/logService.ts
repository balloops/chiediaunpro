
import { EventLog } from '../types';

const LOGS_KEY = 'chiediunpro_logs';

export const logService = {
  log(action: string, userId?: string, metadata?: any) {
    const logs: EventLog[] = JSON.parse(localStorage.getItem(LOGS_KEY) || '[]');
    const newLog: EventLog = {
      id: `log-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      userId,
      action,
      metadata,
      ip: '127.0.0.1' // Simulated for privacy demonstration
    };
    
    // Add to start of list
    logs.unshift(newLog);
    // Keep last 500 logs only
    localStorage.setItem(LOGS_KEY, JSON.stringify(logs.slice(0, 500)));
    
    console.debug(`[EVENT LOG] ${action}`, metadata);
  },

  getLogs(): EventLog[] {
    return JSON.parse(localStorage.getItem(LOGS_KEY) || '[]');
  }
};
