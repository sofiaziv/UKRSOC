import {deliverNotifications} from './mail-queue.mjs';
async function tick(){try{await deliverNotifications()}catch{console.error('Notification queue processing failed')}setTimeout(tick,15000)}
tick();
