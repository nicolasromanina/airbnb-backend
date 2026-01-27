import axios from 'axios';
import { logger } from './logger';

interface SlackMessage {
  text: string;
  blocks?: Array<{
    type: string;
    text?: { type: string; text: string };
    fields?: Array<{ type: string; text: string }>;
  }>;
}

export class AlertService {
  private slackWebhook = process.env.SLACK_WEBHOOK_URL;
  private alertEmail = process.env.ALERT_EMAIL;

  async sendSlackAlert(title: string, details: Record<string, string>, severity: 'critical' | 'warning' | 'info' = 'warning') {
    if (!this.slackWebhook) {
      logger.warn('Slack webhook not configured, skipping alert');
      return;
    }

    try {
      const colorMap = {
        critical: '#FF0000',
        warning: '#FFA500',
        info: '#0099FF'
      };

      const message: SlackMessage = {
        text: `⚠️ ${severity.toUpperCase()}: ${title}`,
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*${severity.toUpperCase()}*: ${title}`
            }
          },
          {
            type: 'section',
            fields: Object.entries(details).map(([key, value]) => ({
              type: 'mrkdwn',
              text: `*${key}*\n${value}`
            }))
          }
        ]
      };

      await axios.post(this.slackWebhook, message);
      logger.info(`Alert sent to Slack: ${title}`);
    } catch (error) {
      logger.error('Failed to send Slack alert:', error);
    }
  }

  async alertOnError(error: Error, context: Record<string, any>) {
    await this.sendSlackAlert('Application Error', {
      'Error': error.message,
      'Stack': error.stack?.split('\n').slice(0, 3).join('\n') || 'N/A',
      'Context': JSON.stringify(context),
      'Timestamp': new Date().toISOString(),
      'Environment': process.env.NODE_ENV || 'development'
    }, 'critical');
  }

  async alertOnDatabaseError(error: Error) {
    await this.sendSlackAlert('Database Connection Error', {
      'Error': error.message,
      'Service': 'MongoDB',
      'Timestamp': new Date().toISOString()
    }, 'critical');
  }

  async alertOnHighResponseTime(route: string, duration: number) {
    if (duration > 5000) { // Alert if > 5s
      await this.sendSlackAlert('High Response Time Detected', {
        'Route': route,
        'Duration': `${duration}ms`,
        'Timestamp': new Date().toISOString()
      }, 'warning');
    }
  }

  async alertOnHighErrorRate(errorRate: number) {
    if (errorRate > 0.05) { // Alert if > 5% errors
      await this.sendSlackAlert('High Error Rate', {
        'Error Rate': `${(errorRate * 100).toFixed(2)}%`,
        'Timestamp': new Date().toISOString()
      }, 'warning');
    }
  }
}

export const alertService = new AlertService();
export default alertService;
