import { useApi } from "@/lib/api";
import { Service } from "@/types";
import { useQuery } from "@tanstack/react-query";

const useServices = () => {
  const api = useApi();

  return useQuery({
    queryKey: ["services"],
    queryFn: async () => {
      const { data } = await api.get<Service[]>("/services");
      return data; // Backend now returns array directly → perfect!
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    retry: 2,
  });
};

export default useServices;