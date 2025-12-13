import { ref } from "vue";

export interface NotificationItem {
  id: string;
  group: "success" | "error";
  title: string;
  text: string;
}

const notifications = ref<NotificationItem[]>([]);
let notificationIdCounter = 0;

export function useNotifications() {
  return {
    notifications,
  };
}

export function notify(
  notification: Omit<NotificationItem, "id">,
  duration: number = 2000
) {
  const id = `notification-${++notificationIdCounter}`;
  const item: NotificationItem = {
    ...notification,
    id,
  };

  notifications.value.push(item);

  setTimeout(() => {
    const index = notifications.value.findIndex((n) => n.id === id);
    if (index > -1) {
      notifications.value.splice(index, 1);
    }
  }, duration);
}
