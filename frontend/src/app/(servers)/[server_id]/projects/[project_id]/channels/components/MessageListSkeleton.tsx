import React from "react";
import { MessageSkeleton } from "./MessageSkeleton";

export const MessageListSkeleton: React.FC = () => {
  return (
    <div className="space-y-4">
      {Array.from({ length: 5 }).map((_, index) => (
        <MessageSkeleton key={index} />
      ))}
    </div>
  );
};
