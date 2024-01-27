import React from "react";
import { NotificationData } from "./LockScreen";

export const NotificationContext = React.createContext<NotificationData | null>(
  null,
);
export function useNotification(): NotificationData {
  const notification = React.useContext(NotificationContext);
  if (!notification) {
    throw new Error(
      "useNotification not called from component inside a Provider",
    );
  }
  return notification;
}
