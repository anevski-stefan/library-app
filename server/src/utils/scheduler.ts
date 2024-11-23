import cron from 'node-cron';
import { checkOverdueBooks, checkUpcomingDueBooks } from '../controllers/notificationController';

export const startScheduledTasks = () => {
  // Check overdue books every day at midnight
  cron.schedule('0 0 * * *', async () => {
    console.log('Running overdue books check...');
    await checkOverdueBooks();
  });

  // Check upcoming due books every day at 9 AM
  cron.schedule('0 9 * * *', async () => {
    console.log('Running upcoming due books check...');
    await checkUpcomingDueBooks();
  });
}; 