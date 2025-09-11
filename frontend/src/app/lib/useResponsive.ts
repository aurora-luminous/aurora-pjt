import { useState, useEffect } from "react";

/**
 * 화면 크기에 따른 반응형 상태를 제공하는 커스텀 훅
 *
 *
 * @returns {Object} 디바이스 타입 및 화면 크기 정보
 * - isMobile: 모바일 화면 여부 (768px 미만)
 * - isTablet: 태블릿 화면 여부 (768px 이상 1024px 미만)
 * - isDesktop: 데스크탑 화면 여부 (1024px 이상)
 * - width: 현재 창의 너비
 * - height: 현재 창의 높이
 */
export const useResponsive = (): object => {
  // 창 크기 상태 관리
  const [windowSize, setWindowSize] = useState({
    // SSR 환경을 고려하여 window 객체 존재 여부 확인
    width: typeof window !== "undefined" ? window.innerWidth : 0,
    height: typeof window !== "undefined" ? window.innerHeight : 0,
  });

  useEffect(() => {
    // 창 크기 변경 시 실행될 핸들러 함수
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    // 창 크기 변경 이벤트 리스너 등록
    window.addEventListener("resize", handleResize);

    // 컴포넌트 언마운트 시 이벤트 리스너 제거 (메모리 누수 방지)
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return {
    // 디바이스 타입 판별 (화면 너비 기준)
    isMobile: windowSize.width < 768, // 모바일: 768px 미만
    isTablet: windowSize.width >= 768 && windowSize.width < 1024, // 태블릿: 768px 이상 1024px 미만
    isDesktop: windowSize.width >= 1024, // 데스크탑: 1024px 이상
    // 현재 창 크기 제공
    width: windowSize.width,
    height: windowSize.height,
  };
};