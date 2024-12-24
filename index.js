// index.js
'use strict'

const RestockService = require('./dist/services/restock').default
const RestockSubscriber = require('./dist/subscribers/restock').default

const RestockSubscription = require('./dist/models/restock-subscription').RestockSubscription

module.exports = (container, options) => {
  try {
    // Register our restock service
    container.registerAdd('restockService', asClass(RestockService))

    // Return any subscriptions
    return {
      migrations: [
        require('./dist/migrations/1732167791364-restock-notification').RestockNotification1732167791364
      ],
      subscribers: [RestockSubscriber],
      services: [RestockService],
      models: [RestockSubscription],
    }
  } catch (error) {
    console.error("Error loading restock notification plugin:", error)
    throw error
  }
}