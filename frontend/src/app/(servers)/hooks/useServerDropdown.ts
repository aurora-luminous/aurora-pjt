import { useState, useRef, useEffect } from "react";
import { useServerListQuery } from "@/app/(server-setup)/hooks/useServerMutation";
import { useServerFlow } from "@/app/(server-setup)/hooks/useServerFlow";

export const useServerDropdown = (currentServerUrl: string | undefined) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data: serverList, isLoading } = useServerListQuery(true);
  const { handleServerConnection } = useServerFlow();

  // 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const toggle = () => setIsOpen((prev) => !prev);
  const close = () => setIsOpen(false);

  const handleSelectServer = async (serverUrl: string, serverName: string) => {
    if (serverUrl === currentServerUrl) {
      close();
      return;
    }
    close();
    await handleServerConnection(serverUrl, serverName);
  };

  return {
    isOpen,
    toggle,
    close,
    dropdownRef,
    serverList: serverList ?? [],
    isLoading,
    handleSelectServer,
  };
};
