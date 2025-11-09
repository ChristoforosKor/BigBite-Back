// dbstreams/mediator.js
const EventEmitter = require('events');
const winston = require('winston');

/**
 * Mediator = central async event bus
 *
 * Responsibilities:
 *  - Let Change Streams emit domain events (e.g. "address.changed")
 *  - Let handlers subscribe with async-safe listeners
 *  - Automatically handle Promise rejections
 *  - Provide typed logging context
 */

class Mediator extends EventEmitter {
  /**
   * Register an async handler for a given event.
   * Errors are caught and logged.
   */
  onAsync(event, handler) {
    if (typeof handler !== 'function') {
      winston.warn(`Tried to register non-function handler for event "${event}"`);
      return;
    }

    winston.info(`Listening for "${event}"`);
    this.on(event, async (data) => {
      try {
        await handler(data);
      } catch (err) {
        winston.error(`[Mediator:${event}] Handler error:`, err);
      }
    });
  }

  /**
   * Emit event safely, with optional debug logging.
   */
  emit(event, payload) {
    winston.debug(`🚀 Emitting event "${event}"`);
    return super.emit(event, payload);
  }
}

const mediator = new Mediator();

module.exports = mediator;
