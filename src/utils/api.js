import axios from "axios";

const API_KEY = "YZF96PdR50O2nfYgn9BqFIe4ZIVP8bu34kINRae4";
const BASE_URL = "https://api.nal.usda.gov/fdc/v1";

export const searchFoods = async (query) => {
  if (!query.trim()) {
    return [];
  }

  try {
    const response = await axios.get(`${BASE_URL}/foods/search`, {
      params: {
        api_key: API_KEY,
        query: query.trim(),
        pageSize: 10,
        dataType: "Survey (FNDDS)",
      },
    });

    if (!response.data?.foods?.length) {
      return [];
    }

    return response.data.foods.map((food) => {
      const nutrients = food.foodNutrients || [];
      const energyNutrient = nutrients.find(
        (n) =>
          n.nutrientId === 1008 || // FNDDS energy
          n.nutrientNumber === "208" || // Energy
          n.nutrientName?.toLowerCase().includes("energy")
      );
      const proteinNutrient = nutrients.find(
        (n) =>
          n.nutrientId === 1003 || // Protein
          n.nutrientNumber === "203" ||
          n.nutrientName?.toLowerCase().includes("protein")
      );

      return {
        fdcId: food.fdcId || 0,
        description: food.description || "",
        calories: Number(energyNutrient?.value || 0),
        protein: Number(proteinNutrient?.value || 0),
        servingSize: Number(food.servingSize) || 100,
        servingUnit: food.servingSizeUnit || "g",
      };
    });
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error(
        "Error searching foods:",
        error.response?.data?.error || error.message
      );
    } else {
      console.error("Unknown error occurred while searching foods");
    }
    return [];
  }
};
