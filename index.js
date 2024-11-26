// index.js
'use strict'

const RestockService = require('./dist/services/restock').default
const RestockSubscriber = require('./dist/subscribers/restock').default

module.exports = (container, options) => {
  try {
    // Register our restock service
    container.registerAdd('restockService', asClass(RestockService))

    // Return any subscriptions
    return {
      subscribers: [RestockSubscriber],
      services: [RestockService]
    }
  } catch (error) {
    console.error("Error loading restock notification plugin:", error)
    throw error
  }
}