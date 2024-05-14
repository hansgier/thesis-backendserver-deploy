const cron = require('node-cron');
const { messages: Message } = require('../models');
const { Op } = require('sequelize');

// Run the task every day at midnight
cron.schedule('0 0 * * *', async () => {
    try {
        const expirationDate = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000); // 60 days ago

        // Delete messages older than 60 days
        const deletedCount = await Message.destroy({
            where: {
                createdAt: {
                    [Op.lt]: expirationDate, // Less than 60 days ago
                },
            },
        });

        console.log(`Deleted ${ deletedCount } expired messages.`);
    } catch (error) {
        console.error('Error deleting expired messages:', error);
    }
});