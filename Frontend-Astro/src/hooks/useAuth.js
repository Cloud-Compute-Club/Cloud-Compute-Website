import { useStore } from '@nanostores/react';
import { $currentUser, $authLoading, login, loginWithGoogle, signup, logout, updateUserProfile, updateUserBanner, sendEmailVerification } from '../stores/authStore';

export const useAuth = () => {
  const currentUser = useStore($currentUser);
  const loading = useStore($authLoading);

  return {
    currentUser,
    loading,
    login,
    loginWithGoogle,
    signup,
    logout,
    updateUserProfile,
    updateUserBanner,
    sendEmailVerification
  };
};
