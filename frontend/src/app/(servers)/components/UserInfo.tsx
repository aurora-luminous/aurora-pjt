import { useGetUserInfoQuery } from "@/app/(auth)/hooks/useAuthMutations";
import { useModal } from "@/app/(server-setup)/hooks/useModal";

export const UserInfo = () => {
  const { data: userInfo, isLoading, error } = useGetUserInfoQuery();
  const { openSettingModal } = useModal();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div className="bg-gray-800 border-t border-gray-600 p-4">
      <div className="flex items-center">
        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mr-4 relative">
          <span className="text-gray-800 text-lg font-bold">
            {userInfo?.userName?.charAt(0)}
          </span>
          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-gray-800"></div>
        </div>
        <div className="flex-1">
          <div className="text-white text-base font-semibold">
            {userInfo?.userName}
          </div>
          <div className="text-gray-300 text-sm">온라인</div>
        </div>
        <div className="flex space-x-2">
          <button className="w-8 h-8 flex items-center justify-center text-gray-300 hover:text-white hover:bg-gray-700 rounded transition-colors">
            🎤
          </button>
          <button className="w-8 h-8 flex items-center justify-center text-gray-300 hover:text-white hover:bg-gray-700 rounded transition-colors">
            🎧
          </button>
          <button
            onClick={openSettingModal}
            className="w-8 h-8 flex items-center justify-center text-gray-300 hover:text-white hover:bg-gray-700 rounded transition-colors"
          >
            ⚙️
          </button>
        </div>
      </div>
    </div>
  );
};
