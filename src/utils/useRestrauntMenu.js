import { useEffect, useState } from "react";
import { MENU_API } from "../utils/constants";
import mockMenu from "../components/mocks/mockResMenu.json";

const useRestaurantMenu = (resId) => {
  const [resInfo, setResInfo] = useState(null);

  useEffect(() => {
    fetchData();
  }, [resId]);

  const fetchData = async () => {
    try {
      const data = await fetch(MENU_API + resId);
      let json;

      if (typeof data.text === "function") {
        const responseText = await data.text();

        if (data.ok === false || !responseText.trim()) {
          throw new Error(`Menu API request failed with status ${data.status}`);
        }

        json = JSON.parse(responseText);
      } else {
        json = await data.json();
      }

      setResInfo(json.data ?? { cards: [] });
    } catch (error) {
      console.error("Unable to load restaurant menu", error);
      setResInfo(mockMenu.data);
    }
  };

  return resInfo;
};

export default useRestaurantMenu;
