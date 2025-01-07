import { useState, useEffect } from "react";
import axios from "axios";

type UserData = {
  profilePictureUrl: string;
  username: string;
};

export function useFetchUserData(userId: string | undefined) {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false); // Indicates retry in progress
  const maxRetries = 10;
  const retryDelay = 2000; // 2 seconds

  useEffect(() => {
    if (!userId) return;

    let retryCount = 0;
    let isMounted = true; // To prevent state updates on an unmounted component

    const fetchUserData = async () => {
      try {
        const response = await axios.get(`/api/user/${userId}`);
        const { username, profilePicture } = response.data;

        if (isMounted) {
          setUserData({ profilePictureUrl: profilePicture, username });
          setError(null); // Clear any previous errors
        }
      } catch (err) {
        if (isMounted) {
          console.error(`Error fetching user data (Attempt ${retryCount + 1}):`, err);

          if (retryCount < maxRetries) {
            retryCount += 1;
            setIsRetrying(true);
            setTimeout(fetchUserData, retryDelay);
          } else {
            setIsRetrying(false);
            setError("Failed to fetch user data after multiple retries.");
          }
        }
      }
    };

    fetchUserData();

    return () => {
      isMounted = false; // Cleanup function to prevent memory leaks
    };
  }, [userId]);

  return { userData, error, isRetrying };
}